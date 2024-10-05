<script setup lang="ts">
import { computed, inject, ref, watch, watchEffect } from 'vue';
import Empty from '../../empty';
import { isOverWindow, isTruthy, vFocus } from '../../../utils';

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
}>(), {collapse: 0, emptyText: '无数据'});
const emit = defineEmits(['update:modelValue', 'error']);
const isReallySmall = computed(() => isParentSmall || props.isSmall);
const isError = ref(false);
const placeholderText = computed(() => {
	return props.placeholder;
});
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
// 输入框真身
const tagEntity = ref();
// 搜索词
const keyword = ref('');
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
		tagEntity.value.focus();
		// 计算位置决定展开方向
		const target = tagEntity.value;
		const offset = target.closest('.vb-tags').querySelector('.dropdown-menu').offsetHeight;
		isUp.value = isOverWindow(target, offset);
		document.addEventListener('click', event, {capture: true});
	}
	else {
		keyword.value = '';
		document.removeEventListener('click', event, {capture: true});
	}
});

function toggleShow(ev: Event) {
	if ((ev.target as HTMLElement) === tagEntity.value && isOpen.value || props.disabled) {
		return;
	}
	isOpen.value = !isOpen.value;
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
			class="vb-tags control"
			:class="{
				'is-active': isOpen,
				'is-small': isReallySmall,
				'is-disabled': disabled,
				'is-shake': isError,
				'is-danger': isError
			}"
			:data-required="required" @click="toggleShow">
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
						:class="{'is-small': isReallySmall, 'is-expanded': isTruthy(collapse)}"
						:placeholder="placeholderText"
						:required="isRequired"
						:disabled="disabled"
						v-focus="isOpen"
						v-model="keyword" v-show="!selectedTags.length || isOpen">
			</div>
			<div class="dropdown-menu is-fullwidth" @click.stop>
				<ul class="dropdown-content">
					<li v-for="item in filterList">
						<a
								class="tag-item dropdown-item"
								:class="{'is-active': item.selected, 'is-disabled': item.disabled}"
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
						<Empty :text="emptyText"></Empty>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
@import "../../../scss/variables";

.vb-tags {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border: solid 1px $input-border-color;
	border-radius: 4px;
	cursor: default;
	transition: border var(--bulma-duration);

	&:hover:not(.is-disabled) {
		--bulma-input-border-l-delta: var(--bulma-input-hover-border-l-delta);

		> .icon {
			color: var(--bulma-body-color);
		}
	}

	&:focus-within, &.is-active {
		border-color: $link;
		box-shadow: 0 0 0 0.125em rgba($link, .25);
	}

	&.is-danger {
		border-color: $danger;

		&:focus-within, &.is-active {
			box-shadow: 0 0 0 0.125em rgba($danger, .25);
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
		opacity: .7;
		background-color: var(--bulma-input-disabled-background-color);
		border-color: var(--bulma-input-disabled-border-color);
		cursor: no-drop;

		> .icon {
			pointer-events: none;
			cursor: no-drop;
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
		color: $link;
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

				&:focus {
					box-shadow: none;
				}
			}
		}

		.is-fullwidth {
			width: 100%;
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

			> .icon {
				margin-left: 1rem;
				width: 1rem;
				height: 1rem;
			}
		}
	}
}
</style>
