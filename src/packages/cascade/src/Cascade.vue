<script setup lang="ts">
import { computed, inject, provide, ref, watch } from 'vue';
import Empty from '../../empty';
import SelectorUI from '../../select';

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
}>(), {mode: 'detach', cache: false, placeholder: '选择', loadingText: '加载中'});
const emit = defineEmits(['update:modelValue', 'error']);

const isLoading = ref(false);
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const current = ref();
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
const findValue = ref();
const internalValue = computed(() => {
	return findValue.value || findSelectedValue(props?.modelValue || []);
});

const captureEvent = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.cascade-dropdown.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const docHeight = document.documentElement.clientHeight;
		const bottom = entity.value.getBoundingClientRect().top + entity.value.offsetHeight + 300;
		isUp.value = bottom > docHeight;
		document.addEventListener('click', captureEvent, {capture: true});
	}
	else {
		document.removeEventListener('click', captureEvent, {capture: true});
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
				await updateNodeData(i, value);
			}
		}
	}
}

// 获取组件选择值
function findSelectedValue(modelValue: any[]) {
	const matchVal = modelValue.reduce((result: any, value: any) => {
		let find;
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
	let loadedData;
	if (props.lazy) {
		loadedData = props.lazyLoad as () => Promise<TVO.CascadeItem[]>;
	}
	else {
		loadedData = () => new Promise<TVO.CascadeItem[]>((resolve, reject) => {
			if (findNode && findNode?.children) {
				resolve(findNode.children);
			}
			else {
				reject('has not children');
			}
		});
	}
	// 如果允许缓存则从缓存中获取
	if (props.cache) {
		loadedData = loadCacheData(loadedData, level, data);
	}

	cascadeList.value.splice(level + 1);
	return loadedData({data, level, hasChild: !!findNode?.children}).then(
			(subList: TVO.CascadeItem[]) => {
				isLoading.value = false;
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
	).catch(() => {
		isLoading.value = false;
	});
}

// 选择级联层级的值
async function selectLevel(index: number, value: any) {
	current.value = value;
	await updateNodeData(index, value);
	if (!cascadeList.value[index + 1]) {
		isOpen.value = false;
		confirmValue.value = true;
		findValue.value = findSelectedValue(cascadeValue.value);
		emit('update:modelValue', cascadeValue.value);
	}
	else if (props.mode !== 'combo') {
		emit('update:modelValue', cascadeValue.value);
	}
}

// 获取缓存中的数据
function loadCacheData(fbFn: Function, level: number, data: string | number) {
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
			<div class="dropdown cascade-dropdown is-block" :class="classList">
				<select
						class="entity-shadow" tabindex="-1" aria-hidden="true" required
						@focus="frontFocus" v-if="!modelValue && required"></select>
				<div class="dropdown-trigger">
					<button
							ref="frontRef" type="button" class="button is-fullwidth is-justify-content-space-between"
							aria-haspopup="true" aria-controls="dropdown-menu" @click="toggleDropdown" :disabled="disabled">
						<span class="is-flex is-align-items-center" style="overflow: hidden;" v-if="internalValue">
							<i :class="internalValue.icon" v-if="internalValue.icon"></i>
							{{ internalValue.title }}
						</span>
						<span class="has-text-grey-light" v-else>
								<FasIcon :icon="holderIcon" v-if="holderIcon"/> {{ placeholder }}
						</span>
						<span class="icon is-small">
							<FasIcon icon="angle-down" aria-hidden="true"/>
						</span>
					</button>
				</div>
				<div class="dropdown-menu" role="menu">
					<div class="dropdown-content">
						<div class="cascade-level" v-for="(item, index) in cascadeList">
							<template v-for="node in item.list">
								<a
										class="dropdown-item"
										:class="{'is-disabled': node.disabled, 'is-active': cascadeValue.includes(node.value)}"
										@click="selectLevel(index, node.value)">
									<span>{{ node.title }}</span>
									<i class="icon is-small" v-if="node.children">
										<FasIcon icon="spinner" spin-pulse v-if="current === node.value && isLoading"/>
										<FasIcon icon="angle-right" v-else/>
									</i>
								</a>
							</template>
							<div class="dropdown-item is-disabled" v-if="!item?.list.length">
								<Empty text="- 空 -"></Empty>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
		<div class="is-grouped" v-else>
			<SelectorUI
					class="cascade-item" :disabled="disabled" :required="item?.required"
					:list="item.list" :placeholder="placeholder" :model-value="item.value"
					@update:modelValue="selectLevel(index, $event)" v-for="(item, index) in cascadeList"/>
			<div class="dropdown cascade-item" v-if="isLoading">
				<div class="dropdown-trigger is-fullwidth">
					<button
							type="button" class="button is-fullwidth is-justify-content-space-between"
							:class="{'is-small': isReallySmall}"
							aria-label="loading" aria-busy="true">
						<span class="has-text-grey-light">{{ loadingText }}</span>
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
@import "../../../scss/variables";

.vb-cascade {
	.cascade-dropdown.is-small {
		.button, .input, .dropdown-item {
			line-height: 1.5;
			font-size: 0.75rem;
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
		.button {
			box-shadow: none;

			&[disabled] {
				background-color: var(--bulma-input-disabled-background-color);
				border-color: var(--bulma-input-disabled-border-color);
				opacity: .7;
			}
		}

		.icon {
			color: $link;
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
				flex-grow: 1;
				width: 12em;
				max-height: 15em;

				&:not(:last-child) {
					border-right: solid 1px $split-color;
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