<script setup lang="ts">
import { useKeydown } from '@/actions/keydown';
import { useUILocale } from '@/actions/locale';
import { computed, inject, ref, watch, watchEffect } from 'vue';
import Empty from '../../empty';
import { isOverBoxSize, isTruthy, scroll2Middle, vFocus } from '@/utils';

const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	modelValue?: any;
	list: TVO.List;
	collapse?: number;
	placeholder?: string;
	isSmall?: boolean;
	removeConfirm?: Function;
	required?: boolean;
	disabled?: boolean;
	emptyText?: string;
}>(), {collapse: 0});
const emit = defineEmits(['update:modelValue', 'error']);
const {$vbt} = useUILocale();
const {keyIndex, handler} = useKeydown();
const isReallySmall = computed(() => isParentSmall || props.isSmall);
const isError = ref(false);
// 内置值，在未提供 modelValue 时也保证 UI 的可用性
const innerValue = ref<TVO.Value[]>([]);
// 当前值
const currentValue = computed({
	get() {
		// 合并传值
		if (props.modelValue) {
			// 如果数据没有长度表示清空
			if (!props.modelValue.length) {
				return [];
			}
			else {
				const mergeValue: TVO.Value[] = [];
				mergeValue.push(...props.modelValue, ...innerValue.value);
				return Array.from(new Set(mergeValue));
			}
		}
		return innerValue.value;
	},
	set(arrayVal) {
		innerValue.value = arrayVal;
	}
});
// 面板开关状态
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
// 输入框真身
const tagEntity = ref();
// 搜索词
const keyword = ref('');
let closeMethod = '';
const isRequired = computed(() => {
	return props.required && !currentValue.value.length;
});
// 实际使用数据列表
const useList = ref<TVO.List>([]);
watchEffect(() => {
	if (props?.list) {
		setTimeout(() => {
			useList.value = (props?.list || []).map((item: TVO.Item) => {
				return {
					title   : item.title,
					value   : item.value,
					icon    : item.icon,
					disabled: item.disabled
				}
			});
		});
	}
});
// 匹配关键词后展示列表
const filterList = computed(() => {
	return useList.value.filter((item: TVO.Item) => item.title.indexOf(keyword.value) > -1)
			.map((item: any) => {
				return Object.assign({}, item, {
					selected: (currentValue.value || []).includes(item.value)
				});
			});
});
// 当前已选的 tag 列表
const selectedTags = computed(() => {
	return currentValue.value.map((value: TVO.Value) => {
		const item = getValueItem(value);
		return {
			title: item?.title || value,
			value,
			icon : item?.icon
		} as TVO.Item
	});
});
// 根据合并值要展示的已选列表
const showSelectedTags = computed(() => {
	return isOpen.value ? selectedTags.value : selectedTags.value.slice(props.collapse * -1);
});

function getValueItem(value: TVO.Value): TVO.Item {
	return useList.value.find((item: TVO.Item) => item.value === value) as unknown as TVO.Item;
}

// 选择值
function selectValue(item: TVO.Item) {
	item.selected = !item.selected;
	if (item.selected) {
		currentValue.value.push(item.value);
		emit('update:modelValue', currentValue.value);
	}
	else {
		removeSelected(item.value);
	}
	keyword.value = '';
}

// 删除值
function removeValue(item: TVO.Item) {
	(new Promise((resolve) => {
		if (props.removeConfirm) {
			props.removeConfirm().then(
					() => resolve(true),
					() => false
			);
		}
		else {
			resolve(true);
		}
	})).then(
			() => {
				item.selected = false;
				removeSelected(item.value);
			}
	);
}

// 删除对应的值数据，并更新数据列表状态
function removeSelected(value: TVO.Value) {
	const idx = currentValue.value.findIndex((item: TVO.Value) => item === value);
	if (idx > -1) {
		useList.value.forEach(item => {
			if (item.value === value) {
				item.selected = false
			}
		});
		currentValue.value.splice(idx, 1);
		emit('update:modelValue', currentValue.value);
	}
}

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-tags.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = tagEntity.value?.closest('.vb-tags').querySelector('.dropdown-menu');
		requestAnimationFrame(() => {
			if (target) {
				isUp.value = isOverBoxSize(target, 0)('bottom');
			}
			frontFocus();
		});
		closeMethod = '';
		document.addEventListener('click', event, {capture: true});
	}
	else {
		isUp.value = false;
		keyword.value = '';
		keyIndex.value = -1;
		if (closeMethod !== 'tab') {
			frontFocus();
		}
		document.removeEventListener('click', event, {capture: true});
	}
});

watch(keyIndex, (index) => {
	if (index >= 0) {
		requestAnimationFrame(() => {
			const cont = entity.value?.querySelector('.dropdown-content') as HTMLElement;
			const findIt = cont?.querySelector('.dropdown-item.is-focused') as HTMLElement;
			if (findIt) {
				scroll2Middle(findIt, cont);
			}
		});
	}
});

function frontFocus() {
	tagEntity.value && tagEntity.value.focus();
}

function toggleShow(ev: Event) {
	if ((ev.target as HTMLElement) === tagEntity.value && isOpen.value || props.disabled) {
		return;
	}
	isOpen.value = !isOpen.value;
}

function resetKeyIndex() {
	keyIndex.value = -1;
}

function keyAction(e: any) {
	const isInput = e.target.tagName === 'INPUT';
	const action = handler(e, filterList.value, !isOpen.value);
	const justIt = () => {
		if (keyIndex.value >= 0) {
			selectValue(filterList.value[keyIndex.value]);
		}
	}
	switch (action) {
		case undefined:
		case 'ArrowUp':
		case 'ArrowDown':
			if (!isInput) {
				e.preventDefault();
			}
			break;
		case 'Backspace':
			if (!isInput) {
				e.preventDefault();
			}
			if (keyword.value.length === 0) {
				if (currentValue.value.length) {
					const last = currentValue.value.slice(-1);
					removeSelected(last[0]);
				}
			}
			break;
		case 'Escape':
			isOpen.value = false;
			break;
		case 'Toggle':
			if (!isInput || !isOpen.value) {
				toggleShow(e);
				e.preventDefault();
			}
			break;
		case 'Space':
			if (!isInput) {
				justIt();
				e.preventDefault();
			}
			break;
		case 'Enter':
			//  如果值已经选中则直接关闭
			if (filterList.value[keyIndex.value]?.selected) {
				isOpen.value = false;
			}
			else if (!isOpen.value) {
				isOpen.value = true;
			}
			else {
				justIt();
			}
			e.preventDefault();
			break;
	}
}

function blurEntity(e: any) {
	if (e.relatedTarget && !entity.value?.contains(e.relatedTarget)) {
		closeMethod = 'tab';
		isOpen.value = false;
	}
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div
			ref="entity"
			class="vb-tags control"
			:class="{
				'is-active': isOpen,
				'is-small': isReallySmall,
				'is-disabled': disabled,
				'is-shake': isError,
				'is-danger': isError
			}"
			:data-required="required" @click="toggleShow" @blur.capture="blurEntity" @keydown="keyAction">
		<span class="icon is-small">
			<FasIcon icon="angle-down" aria-hidden="true"/>
		</span>
		<div class="dropdown" :class="{'is-active': isOpen, 'is-up': isUp}">
			<div class="dropdown-trigger">
				<div class="tag-list field is-grouped is-grouped-multiline" v-if="selectedTags.length">
					<div class="control" v-for="item in showSelectedTags">
						<div class="tags has-addons" :class="{'are-medium': !isReallySmall}">
							<span class="tag">
								<i :class="item.icon" v-if="item.icon"></i>
								{{ item.title }}
							</span>
							<a class="tag is-delete" @click.stop="removeValue(item)"></a>
						</div>
					</div>
					<div class="control" v-if="!isOpen && isTruthy(collapse) && selectedTags.length > collapse">
						<div class="tags">
							<a
									class="tag is-rounded" :class="{'is-medium': !isReallySmall}">+{{
									selectedTags.length - collapse
								}}</a>
						</div>
					</div>
				</div>
				<input
						type="text" autocomplete="off" class="input"
						ref="tagEntity"
						:class="{'is-small': isReallySmall, 'is-expanded': isTruthy(collapse), 'is-alpha': selectedTags.length && !isOpen}"
						:placeholder="placeholder || $vbt('tags.placeholder')"
						:required="isRequired"
						:disabled="disabled"
						v-model="keyword">
			</div>
			<div class="dropdown-menu is-fullwidth" @click.stop @mouseover="resetKeyIndex">
				<ul class="dropdown-content" tabindex="0">
					<li v-for="(item, index) in filterList">
						<a
								class="tag-item dropdown-item"
								:class="{'is-active': item.selected, 'is-disabled': item.disabled, 'is-focused': keyIndex === index}"
								@click="selectValue(item)">
							<span>
								<i :class="item.icon" v-if="item.icon"></i>
								{{ item.title }}
							</span>
							<span class="icon" v-if="item.selected">
								<FasIcon icon="check"/>
							</span>
						</a>
					</li>
					<li class="dropdown-item is-disabled" v-if="!filterList.length">
						<Empty :text="emptyText || $vbt('tags.emptyText')"></Empty>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-tags {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border: solid 1px va.$input-border-color;
	border-radius: var(--bulma-radius);
	cursor: default;
	transition: border var(--bulma-duration);

	&:hover:not(.is-disabled,.is-danger) {
		--bulma-input-border-l-delta: var(--bulma-input-hover-border-l-delta);

		> .icon {
			color: var(--bulma-body-color);
		}
	}

	&:focus-within, &.is-active {
		border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
		box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
	}

	&.is-danger {
		--bulma-focus-h: var(--bulma-danger-h);
		--bulma-focus-s: var(--bulma-danger-s);
		--bulma-focus-l: var(--bulma-danger-l);

		border-color: va.$danger;

		> .icon {
			color: va.$danger;
		}
	}

	&.is-active > .icon {
		transform: rotate(-180deg);
	}

	&.is-small {
		.button, .input, .dropdown-item {
			line-height: 1.5;
			font-size: 0.75rem;
		}

		.tag-list {
			padding: 0.3125rem;

			.control {
				.tag {
					height: 1.5em;
				}

				.is-delete {
					width: 1.5em;
				}
			}
		}
	}

	&.is-disabled {
		background-color: var(--bulma-background);
		border-color: var(--bulma-background);
		color: var(--bulma-text-weak);
		cursor: not-allowed;

		> .icon {
			pointer-events: none;
			cursor: not-allowed;
			opacity: .7;
		}

		.dropdown-trigger > .input {
			background-color: transparent;
		}
	}

	> .icon {
		order: 1;
		position: absolute;
		right: 0.75em;
		margin: 0;
		cursor: pointer;
		color: va.$link;
		z-index: 1;
		transition: transform .3s ease;
	}

	.tag-list {
		--bulma-block-spacing: 0;
		overflow: hidden;
		padding: .25rem .5rem;
		gap: .25rem !important;

		.control {
			.tag {
				height: 1.875em;
			}

			.is-delete {
				margin-left: 0;
			}

			.tags > span.tag {
				padding-right: 0.25em;
			}
		}
	}

	.dropdown {
		width: 100%;

		.dropdown-trigger {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			width: 100%;

			input {
				border-color: transparent;
				box-shadow: none;
				outline: none;
				height: calc(2.5em - 2px);

				&.is-expanded {
					flex-grow: 1;
					width: auto;
				}

				&.is-alpha {
					position: absolute;
					opacity: 0;
				}

				&:focus {
					box-shadow: none;
				}
			}
		}

		.is-fullwidth {
			min-width: auto;
			width: max(6rem, 100%);
		}

		.dropdown-content {
			overflow: auto;
			overscroll-behavior: contain;
			max-height: 300px;
		}

		.dropdown-item.is-disabled {
			opacity: .5;
			pointer-events: none;
		}

		.tag-item {
			display: flex;
			align-items: center;
			justify-content: space-between;

			&.is-active {
				padding-right: 1rem;
			}

			&.is-focused:not(.is-active) {
				--bulma-dropdown-item-background-l-delta: var(--bulma-dropdown-item-hover-background-l-delta);
			}

			> .icon {
				margin-left: 1rem;
				width: 1rem;
				height: 1rem;
			}
		}
	}
}
</style>
