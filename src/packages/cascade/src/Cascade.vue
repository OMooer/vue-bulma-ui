<script setup lang="ts">
import { useKeydown } from '@/actions/keydown';
import { computed, inject, provide, ref, watch } from 'vue';
import { useUILocale } from '@/actions/locale';
import { ERROR_NO_SUBLIST, isOverBoxSize, scroll2Middle } from '@/utils';
import Empty from '../../empty';
import SelectorUI from '../../select';

const {$vbt} = useUILocale();
const {keyIndex, handler} = useKeydown();
const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	modelValue?: any[];
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
const emit = defineEmits(['update:modelValue', 'error']);

const isLoading = ref(false);
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const current = ref();
const currentLevel = ref(0);
const confirmValue = ref();
const cascadeList = ref<{ list: TVO.CascadeItem[]; required?: boolean, value: any }[]>([]);
const cacheStore = ref<{ [propName: string]: TVO.CascadeItem[] }>({});
const isReallySmall = computed(() => isParentSmall || props.isSmall);
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
watch(() => props.modelValue, () => {
	updatePresetValue();
});
// 获取级联选项的值
const cascadeValue = computed(() => {
	return cascadeList.value.map((item: any) => item.value);
});
const comboSelectedData = ref();
const comboShowValue = computed(() => {
	return comboSelectedData.value ?? findSelectedValue(props?.modelValue || []);
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
		frontFocus();
		document.removeEventListener('click', captureEvent, {capture: true});
	}
});

watch(keyIndex, (index) => {
	if (index >= 0) {
		requestAnimationFrame(() => {
			const cont = entity.value?.querySelectorAll('.cascade-level')[currentLevel.value] as HTMLElement;
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
	const modelValue = props.modelValue;
	if (modelValue && modelValue.length) {
		for (let i = 0; i < modelValue.length; i++) {
			const value = modelValue[i];
			if (value) {
				current.value = value;
				currentLevel.value = i;
				await updateNodeData(i, value);
			}
		}
	}
}

// 获取组件选择值
function findSelectedValue(modelValue: any[]) {
	const matchVal = modelValue.reduce((result: any, value: any) => {
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
				icon: find.icon,
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

// 更新级联节点
function updateNodeData(level: number, data: any) {
	if (!data) {
		return;
	}
	cascadeList.value[level].value = data;
	const currentList = cascadeList.value[level].list;
	const findNode = currentList.find((item: any) => item.value === data);
	// 获取下级数据，如果有的话
	isLoading.value = true;
	let loadDataFn;
	if (props.lazy) {
		loadDataFn = props.lazyLoad as () => Promise<TVO.CascadeItem[]>;
	}
	else {
		loadDataFn = () => new Promise<TVO.CascadeItem[]>((resolve, reject) => {
			if (findNode && findNode?.children) {
				resolve(findNode.children);
			}
			else {
				reject(ERROR_NO_SUBLIST);
			}
		});
	}
	// 如果允许缓存则从缓存中获取
	if (props.cache) {
		loadDataFn = getCacheDataFunc(loadDataFn, level, data);
	}

	cascadeList.value.splice(level + 1);
	return loadDataFn({data, level, hasChild: !!findNode?.children}).then(
			(subList: TVO.CascadeItem[]) => {
				currentLevel.value = level + 1;
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
	current.value = value;
	keyIndex.value = 0;
	await updateNodeData(index, value);
	if (!cascadeList.value[index + 1]) {
		isOpen.value = false;
		confirmValue.value = true;
		comboSelectedData.value = findSelectedValue(cascadeValue.value);
		emit('update:modelValue', cascadeValue.value);
	}
	else if (props.mode !== 'combo') {
		emit('update:modelValue', cascadeValue.value);
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
			keyIndex.value = cascadeList.value[currentLevel.value].list.findIndex((item: any) => item.value === current.value);
		}
	}
	const levelList = cascadeList.value[currentLevel.value]?.list;
	const action = handler(e, levelList, !isOpen.value);

	switch (action) {
		case 'Tab':
			e.preventDefault();
			break;
		case 'Escape':
			isOpen.value = false;
			break;
		case 'ArrowLeft':
			e.preventDefault();
			if (currentLevel.value > 0) {
				currentLevel.value--;
				// 找到现值在列表中的索引
				const levelData = cascadeList.value[currentLevel.value];
				keyIndex.value = levelData.list.findIndex((item: any) => item.value === levelData.value);
				cascadeList.value[currentLevel.value].value = '';
				cascadeList.value.splice(currentLevel.value + 1);
			}
			break;
		case 'ArrowRight':
			e.preventDefault();
			if (levelList[keyIndex.value]?.children) {
				selectLevel(currentLevel.value, levelList[keyIndex.value].value);
			}
			break;
		case 'Toggle':
			e.preventDefault();
			toggleDropdown();
			break;
		case 'Space':
		case 'Enter':
			e.preventDefault();
			selectLevel(currentLevel.value, levelList[keyIndex.value].value);
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

provide('isSmall', isReallySmall.value);

defineExpose({
	setError
});
</script>

<template>
	<div ref="entity" class="vb-cascade" :class="{'is-disabled': disabled}">
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
					<div class="dropdown-content"  @mouseover="resetKeyIndex">
						<div class="cascade-level" v-for="(item, level) in cascadeList">
							<template v-for="(node, index) in item.list">
								<a
										class="dropdown-item"
										:class="{'is-disabled': node.disabled, 'is-active': cascadeValue.includes(node.value), 'is-focused': keyIndex === index && currentLevel === level}"
										@click="selectLevel(level, node.value)">
									<span>{{ node.title }}</span>
									<i class="icon is-small" v-if="node.children">
										<FasIcon icon="spinner" spin-pulse v-if="current === node.value && isLoading"/>
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
		<div class="is-grouped" v-else>
			<SelectorUI
					class="cascade-item" :class="{'is-danger is-shake': isError}" :disabled="disabled" :required="item?.required"
					:list="item.list" :placeholder="placeholder || $vbt('cascade.placeholder')" :model-value="item.value"
					@update:modelValue="selectLevel(index, $event)" v-for="(item, index) in cascadeList"/>
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