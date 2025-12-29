<script setup lang="ts">
import { useKeydown } from '@/actions/keydown';
import { computed, inject, provide, ref, watch } from 'vue';
import { useUILocale } from '@/actions/locale';
import { ERROR_NO_SUBLIST, iconNormalize, isOverBoxSize, scroll2Middle } from '@/utils';
import Empty from '../../empty';
import SelectorUI from '../../select';

const {$vbt} = useUILocale();
const {keyIndex, handler} = useKeydown();
const isParentSmall = inject('isSmall', ref(false));
const props = withDefaults(defineProps<{
	mode?: 'detach' | 'combo';
	required?: boolean | boolean[] | string;
	disabled?: boolean;
	list: TVO.CascadeItem[];
	lazy?: boolean;
	lazyLoad?: (detail?: any) => Promise<TVO.CascadeItem[]>;
	cache?: boolean;
	valueLess?: boolean;
	holderIcon?: string;
	placeholder?: string;
	loadingText?: string;
	isSmall?: boolean;
}>(), {mode: 'detach', cache: false});
const emit = defineEmits(['error']);
const modelValue = defineModel<any[]>({default: []});

const isLoading = ref(false);
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const lastSelectLevel = ref(0);
const cascadeList = ref<{ list: TVO.CascadeItem[]; required?: boolean; value: any; }[]>([]);
const cacheStore = ref<{ [propName: string]: TVO.CascadeItem[] }>({});
const isReallySmall = computed(() => isParentSmall.value || props.isSmall);
watch(() => props.list, (newList) => {
	cascadeList.value = [
		{
			list    : newList && newList.length ? newList : [],
			required: getCascadeRequire(),
			value   : ''
		}
	];
	updatePresetValue();
}, {immediate: true});
watch(modelValue, () => updatePresetValue());
// 获取级联选项的值
const cascadeValue = computed(() => {
	return cascadeList.value.map((item: any) => item.value);
});
const lastSelectValue = computed(() => {
	return cascadeValue.value[cascadeValue.value.length - 1];
});
const comboShowValue = computed(() => {
	return getSelectedValue(modelValue.value || []);
});

const captureEvent = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.cascade-dropdown.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = entity.value?.querySelector('.dropdown-menu');
		requestAnimationFrame(() => {
			isUp.value = isOverBoxSize(target, 0)('bottom');
		});
		document.addEventListener('click', captureEvent, {capture: true});
	}
	else {
		isUp.value = false;
		keyIndex.value = -1;
		// frontFocus();
		document.removeEventListener('click', captureEvent, {capture: true});
	}
});

watch(keyIndex, (index) => {
	if (index >= 0) {
		requestAnimationFrame(() => {
			const cont = entity.value?.querySelectorAll('.cascade-level')[lastSelectLevel.value] as HTMLElement;
			const findIt = cont?.querySelector('.dropdown-item.is-focused') as HTMLElement;
			if (findIt) {
				scroll2Middle(findIt, cont);
			}
		});
	}
});

function toggleDropdown() {
	isOpen.value = !isOpen.value;
	if (isOpen.value) {
		updatePresetValue();
	}
}

// 获取级联层级的必填状态
function getCascadeRequire(level: number = 0) {
	if (typeof props.required === 'boolean') {
		return props.required;
	}
	if (typeof props.required === 'string') {
		// 暂没想好怎么处理用 name/index 来匹配的，先忽略
		return false;
	}
	return (props?.required as boolean[])[level];
}

// 设置组件预设值
async function updatePresetValue() {
	const currentValue = modelValue.value;
	if (currentValue?.length) {
		lastSelectLevel.value = currentValue.length - 1;
		// 检测后续值是否存在于级联列表中
		// 如果其中某个节点不匹配则更新节点
		for (const [i, value] of currentValue.entries()) {
			const level = cascadeList.value[i];
			if (value && level.value !== value) {
				await updateNodeData(i, value);
			}
		}
	}
}

// 获取组件选择值
function getSelectedValue(values: any[]): { icon: string | string[], title: string } | null {
	const matchVal = values.reduce((result: any, value: any) => {
		let find: any;
		for (const item of cascadeList.value) {
			find = item.list.find((l: any) => l.value === value);
			if (find) {
				break;
			}
		}
		if (find) {
			const title = result.title ? result.title : [];
			title.push(find.title);
			Object.assign(result, {
				icon: iconNormalize(find.icon),
				title
			});
		}
		return result;
	}, {});
	if (Object.keys(matchVal).length) {
		let resultTitle = matchVal.title.join(' / ');
		if (props.valueLess) {
			resultTitle = matchVal.title[matchVal.title.length - 1];
		}
		return Object.assign(matchVal, {
			title: resultTitle
		});
	}
	return null;
}

// 加载数据的函数工厂
function loadDataFactory(staticNode: any, level: number, data: any) {
	let func;
	if (props.lazy) {
		func = props.lazyLoad as () => Promise<TVO.CascadeItem[]>;
	}
	else {
		func = () => new Promise<TVO.CascadeItem[]>((resolve, reject) => {
			if (staticNode && staticNode?.children) {
				resolve(staticNode.children);
			}
			else {
				reject(ERROR_NO_SUBLIST);
			}
		});
	}
	// 如果允许缓存则从缓存中获取
	if (props.cache) {
		func = getCacheDataFunc(func, level, data);
	}

	return func;
}

// 更新级联列表节点
function updateNodeData(level: number, data: any) {
	if (!data) {
		return;
	}
	// 将当前选择的值更新到级联列表所在层级里
	cascadeList.value[level].value = data;
	const currentList = cascadeList.value[level].list;
	const findNode = currentList.find((item: any) => item.value === data);
	isLoading.value = true;
	// 获取加载数据函数
	const loadDataFn = loadDataFactory(findNode, level, data);
	// 将级联列表在当前层级后可能存在的旧数据清除
	cascadeList.value.splice(level + 1);
	// 获取下级数据，如果有的话
	return loadDataFn({data, level, hasChild: !!findNode?.children}).then(
			(subList: TVO.CascadeItem[]) => {
				lastSelectLevel.value = level + 1;
				cascadeList.value.push({
					list    : subList,
					required: getCascadeRequire(level + 1),
					value   : ''
				});
				// 缓存结果
				if (props.cache) {
					cacheStore.value[`cache_${ level }_${ data }`] = subList;
				}
			}
	).catch(() => {}).finally(() => {
		isLoading.value = false;
	});
}

// 选择级联层级的值
async function selectLevel(index: number, value: any) {
	keyIndex.value = 0;
	await updateNodeData(index, value);
	if (!cascadeList.value[index + 1]) {
		isOpen.value = false;
		modelValue.value = cascadeValue.value;
	}
	else if (props.mode !== 'combo') {
		modelValue.value = cascadeValue.value;
	}
}

// 获取缓存中的数据
function getCacheDataFunc(fbFn: Function, level: number, data: string | number) {
	// cache_level_data: []
	// 从缓存中读取数据，如果没有数据则从原方法中获取
	if (cacheStore.value[`cache_${ level }_${ data }`] && cacheStore.value[`cache_${ level }_${ data }`].length) {
		return () => new Promise<TVO.CascadeItem[]>(resolve => {
			resolve(cacheStore.value[`cache_${ level }_${ data }`]);
		});
	}
	else {
		return fbFn;
	}
}

function frontFocus() {
	frontRef.value && frontRef.value.focus();
}

function resetKeyIndex() {
	keyIndex.value = -1;
}

function keyAction(e: any) {
	// 未打开的情况下按 Tab 就不进行任何操作保证默认行为的执行
	if (!isOpen.value && e.code === 'Tab') {
		return;
	}
	// 如果是箭头按键和 Tab 的输入就先获取当前值为索引
	if (e.code.startsWith('Arrow') || e.code === 'Tab') {
		if (isOpen.value && keyIndex.value === -1) {
			keyIndex.value = cascadeList.value[lastSelectLevel.value].list.findIndex((item: any) => item.value === lastSelectValue.value);
		}
	}
	const levelList = cascadeList.value[lastSelectLevel.value]?.list;
	const action = handler(e, levelList, !isOpen.value);

	switch (action) {
		case undefined:
		case 'Tab':
		case 'ArrowUp':
		case 'ArrowDown':
			e.preventDefault();
			break;
		case 'Escape':
			isOpen.value = false;
			break;
		case 'ArrowLeft':
			e.preventDefault();
			if (lastSelectLevel.value > 0) {
				lastSelectLevel.value--;
				// 找到现值在列表中的索引
				const levelData = cascadeList.value[lastSelectLevel.value];
				keyIndex.value = levelData.list.findIndex((item: any) => item.value === levelData.value);
				cascadeList.value[lastSelectLevel.value].value = '';
				cascadeList.value.splice(lastSelectLevel.value + 1);
			}
			break;
		case 'ArrowRight':
			e.preventDefault();
			if (levelList[keyIndex.value]?.children) {
				selectLevel(lastSelectLevel.value, levelList[keyIndex.value].value);
			}
			break;
		case 'Toggle':
			e.preventDefault();
			toggleDropdown();
			break;
		case 'Space':
		case 'Enter':
			e.preventDefault();
			selectLevel(lastSelectLevel.value, levelList[keyIndex.value].value);
			break;
	}
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value.focus();
	emit('error', is, msg);
}

const classList = computed(() => {
	return {
		'is-active': isOpen.value,
		'is-up'    : isUp.value,
		'is-shake' : isError.value,
		'is-danger': isError.value,
		'is-small' : isReallySmall.value
	}
});

provide('isSmall', isReallySmall);

defineExpose({
	setError
});
</script>

<template>
	<div ref="entity" class="vb-cascade" :class="{'is-disabled': disabled}">
		<!-- 组合选择 -->
		<template v-if="mode === 'combo'">
			<div class="dropdown cascade-dropdown is-block" :class="classList" @keydown="keyAction">
				<select
						class="entity-shadow" tabindex="-1" aria-hidden="true" required
						@focus="frontFocus" v-if="modelValue == undefined && required"></select>
				<div class="dropdown-trigger">
					<button
							ref="frontRef" type="button" class="button is-fullwidth is-justify-content-space-between"
							aria-haspopup="true" aria-controls="dropdown-menu" @click="toggleDropdown" :disabled="disabled">
						<span class="is-flex is-align-items-center" style="overflow: hidden;" v-if="comboShowValue">
							<i :class="comboShowValue.icon" v-if="comboShowValue.icon"></i>
							<FasIcon :icon="holderIcon" v-else-if="holderIcon"/>
							{{ comboShowValue.title }}
						</span>
						<span class="has-text-grey-light" v-else>
							<FasIcon :icon="holderIcon" v-if="holderIcon"/> {{ placeholder || $vbt('cascade.placeholder') }}
						</span>
						<span class="icon is-small">
							<FasIcon icon="angle-down" aria-hidden="true"/>
						</span>
					</button>
				</div>
				<div class="dropdown-menu" role="menu">
					<div class="dropdown-content" @mouseover="resetKeyIndex">
						<div class="cascade-level" :key="level" v-for="(item, level) in cascadeList">
							<template :key="node.value as string" v-for="(node, index) in item.list">
								<a
										class="dropdown-item"
										:class="{'is-disabled': node.disabled, 'is-active': cascadeValue.includes(node.value), 'is-focused': keyIndex === index && lastSelectLevel === level}"
										@click="selectLevel(level, node.value)">
									<span>{{ node.title }}</span>
									<i class="icon is-small" v-if="node.children">
										<FasIcon icon="spinner" spin-pulse v-if="lastSelectValue === node.value && isLoading"/>
										<FasIcon icon="angle-right" v-else/>
									</i>
								</a>
							</template>
							<div class="dropdown-item is-disabled" v-if="!item?.list.length">
								<Empty :text="$vbt('cascade.empty')"></Empty>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
		<!-- 分离下拉框 -->
		<div class="is-grouped" v-else>
			<SelectorUI
					class="cascade-item" :class="{'is-danger is-shake': isError}" :disabled="disabled" :required="item?.required"
					:list="item.list" :placeholder="placeholder || $vbt('cascade.placeholder')" :model-value="item.value"
					@update:modelValue="selectLevel(index, $event)" :key="item.value" v-for="(item, index) in cascadeList"/>
			<div class="dropdown cascade-item" v-if="isLoading">
				<div class="dropdown-trigger is-fullwidth">
					<button
							type="button" class="button is-fullwidth is-justify-content-space-between"
							:class="{'is-small': isReallySmall}"
							aria-label="loading" aria-busy="true">
						<span class="has-text-grey-light">{{ loadingText || $vbt('cascade.loading') }}</span>
						<span class="icon is-small has-text-grey-light">
							<FasIcon icon="spinner" spin-pulse/>
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-cascade {
	.cascade-dropdown {
		&.is-small {
			.button, .input, .dropdown-item {
				line-height: 1.5;
				font-size: 0.75rem;
			}
		}

		&.is-active {
			.dropdown-trigger .button {
				.icon {
					transform: rotate(-180deg);
				}
			}
		}

		&.is-danger {
			--bulma-focus-h: var(--bulma-danger-h);
			--bulma-focus-s: var(--bulma-danger-s);
			--bulma-focus-l: var(--bulma-danger-l);

			.dropdown-trigger .button {
				border-color: va.$danger;

				.icon {
					color: va.$danger;
				}
			}
		}
	}

	// combo style

	.entity-shadow {
		position: absolute;
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: 0;
	}

	.dropdown-trigger {
		> .button:focus {
			border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
		}

		.button:not(:focus,:focus-visible) {
			box-shadow: none;
		}

		.button {
			&[disabled] {
				background-color: var(--bulma-background);
				border-color: var(--bulma-background);
				color: var(--bulma-text-weak);
				opacity: 1;

				.icon {
					opacity: .7;
				}
			}
		}

		.icon {
			color: va.$link;
			transition: transform .3s ease;
		}
	}

	&:hover:not(.is-disabled) {
		.dropdown-trigger .icon {
			color: var(--bulma-body-color);
		}
	}

	.dropdown-menu {
		max-width: 100%;

		.dropdown-content {
			display: flex;

			.cascade-level {
				overflow: auto;
				overscroll-behavior: contain;
				flex-grow: 1;
				width: 12em;
				max-height: 15em;

				&:not(:last-child) {
					border-right: solid 1px va.$split-color;
				}

				> .dropdown-item {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding-right: 0.25em;

					&.is-disabled {
						opacity: .7;
						pointer-events: none;
						padding-right: 1rem;

						.is-empty {
							flex-grow: 1;
							text-align: center;
						}

						&:only-child {
							font-size: .75rem;
							height: 100%;
						}
					}

					&.is-focused:not(.is-active) {
						--bulma-dropdown-item-background-l-delta: var(--bulma-dropdown-item-hover-background-l-delta);
					}
				}
			}
		}
	}


	// detach style
	.is-grouped {
		display: flex;
		align-items: center;

		.cascade-item {
			flex-grow: 1;

			&:not(:last-child) {
				margin-right: 0.25rem;
			}

			.is-fullwidth {
				width: 100%;
			}
		}
	}
}
</style>