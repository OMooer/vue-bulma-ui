<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import Empty from '../../empty';
import { isTruthy } from '../../../utils';

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
const emit = defineEmits(['update:modelValue']);
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
		const docHeight = document.documentElement.clientHeight;
		const bottom = tagEntity.value.getBoundingClientRect().top + tagEntity.value.offsetHeight + 300;
		isUp.value = bottom > docHeight;
		document.addEventListener('click', event, {capture: true});
	}
	else {
		keyword.value = '';
		document.removeEventListener('click', event, {capture: true});
	}
});

function toggleShow(ev: Event) {
	if ((ev.target as HTMLElement) === tagEntity.value && isOpen.value) {
		return;
	}
	isOpen.value = !isOpen.value;
}
</script>

<template>
	<div class="vb-tags" :class="{'is-active': isOpen, 'is-small': isSmall, 'is-disabled': disabled}" @click="toggleShow">
		<span class="icon is-small">
			<FasIcon icon="angle-down" aria-hidden="true"/>
		</span>
		<div class="dropdown" :class="{'is-active': isOpen, 'is-up': isUp}">
			<div class="dropdown-trigger">
				<div class="tag-list field is-grouped is-grouped-multiline" v-if="selectedTags.length">
					<div class="control" v-for="item in selectedTags.slice(collapse*-1)">
						<div class="tags has-addons" :class="{'are-medium': !isSmall}">
							<span class="tag">
								<i :class="item.icon" v-if="item.icon"></i>
								{{ item.title }}
							</span>
							<a class="tag is-delete" @click.stop="removeValue(item)"></a>
						</div>
					</div>
					<div class="control" v-if="isTruthy(collapse) && selectedTags.length > collapse">
						<span class="tag" :class="{'is-medium': !isSmall}">+{{ selectedTags.length - collapse }}</span>
					</div>
				</div>
				<input
						type="text" autocomplete="off" class="input"
						ref="tagEntity"
						:class="{'is-small': isSmall, 'is-expanded': isTruthy(collapse)}"
						:placeholder="placeholderText"
						:required="isRequired"
						:disabled="disabled"
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
.vb-tags {
	display: flex;
	align-items: center;
	justify-content: space-between;
	border: solid 1px $grey-lighter;
	border-radius: 4px;
	cursor: default;

	&:hover {
		border-color: $grey-light;

		> .icon {
			color: $black;
		}
	}

	&:focus-within, &.is-active {
		border-color: $link;
		box-shadow: 0 0 0 0.125em rgba($link, .25);
	}

	&.is-active > .icon {
		transform: rotate(-180deg);
	}

	&.is-small {
		.button, .input, .dropdown-item {
			line-height: 1.5;
			font-size: 0.75rem;
		}
	}

	&.is-disabled {
		pointer-events: none;
		opacity: .5;
		background-color: $grey-lightest;
		border-color: $grey-lightest;
		cursor: no-drop;

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
		overflow: hidden;
		padding: .25rem .5rem 0;

		.control {
			margin-bottom: .25rem !important;
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
