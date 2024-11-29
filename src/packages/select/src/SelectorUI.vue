<script setup lang="ts">
import { computed, inject, onUpdated, ref, watch } from 'vue';
import { isOverBoxSize, vFocus } from '../../../utils';
import Empty from '../../empty';

const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	modelValue?: any;
	list: TVO.List;
	placeholder?: string;
	holderIcon?: string;
	filter?: boolean;
	disabled?: boolean;
	required?: boolean;
	filterText?: string;
	emptyText?: string;
}>(), {placeholder: '请选择', emptyText: '无数据', filterText: '筛选'});
const emit = defineEmits(['update:modelValue', 'error']);
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const keyword = ref('');

const findValue = computed(() => {
	const find = props.list?.find((item: any) => item.value === props.modelValue);
	return find || null;
});
// 如果设置的值并不存在，则更新值为空
onUpdated(() => {
	if (!findValue.value && props.modelValue) {
		emit('update:modelValue', null);
	}
});

const classList = computed(() => {
	return {
		'vb-select'  : true,
		'dropdown'   : true,
		'is-block'   : true,
		'is-active'  : isOpen.value,
		'is-disabled': props.disabled,
		'is-up'      : isUp.value,
		'is-shake'   : isError.value,
		'is-danger'  : isError.value,
		'is-small'   : isParentSmall
	}
});

const filterList = computed(() => {
	return props.list.filter((item: { title: string; value: any; }) => item.title.includes(keyword.value));
});

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-select.is-active')) {
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
		document.addEventListener('click', event, {capture: true});
	}
	else {
		isUp.value = false;
		keyword.value = '';
		document.removeEventListener('click', event, {capture: true});
	}
});

function toggleDropdown() {
	isOpen.value = !isOpen.value;
}

function selectValue(value: any) {
	setError(false);
	emit('update:modelValue', value);
	isOpen.value = false;
}

function frontFocus() {
	frontRef.value && frontRef.value.focus();
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div ref="entity" :class="classList" :data-required="required">
		<select
				class="entity-shadow" tabindex="-1" aria-hidden="true" required
				@focus="frontFocus" v-if="modelValue == undefined && required"></select>
		<div class="dropdown-trigger">
			<button
					ref="frontRef" type="button" @click="toggleDropdown" :disabled="disabled"
					class="button is-fullwidth is-justify-content-space-between" aria-haspopup="true"
					aria-controls="dropdown-menu">
				<span class="is-flex is-align-items-center" style="overflow: hidden;" v-if="findValue">
					<i :class="findValue.icon" v-if="findValue.icon"></i>
					{{ findValue.title }}
				</span>
				<span class="has-text-grey-light" v-else>
						<FasIcon :icon="holderIcon" v-if="holderIcon"/> {{ placeholder }}
				</span>
				<span class="icon is-small">
					<FasIcon icon="angle-down" aria-hidden="true"/>
				</span>
			</button>
		</div>
		<div class="dropdown-menu is-fullwidth" role="menu">
			<div class="dropdown-content">
				<template v-if="filter">
					<div class="dropdown-item filter">
						<input type="search" class="input" :placeholder="filterText" v-focus v-model="keyword">
					</div>
					<hr class="dropdown-divider filter-line"/>
				</template>
				<div class="dropdown-scroll-view">
					<a
							class="dropdown-item"
							@click="selectValue(item.value)"
							:class="{'is-active': item.value === modelValue, 'is-disabled': item.disabled}"
							:key="item.value.toString()" v-for="item in filterList">
						<i :class="item.icon" v-if="item.icon"></i>
						<span>{{ item.title }}</span>
					</a>
					<div class="dropdown-item is-disabled" v-if="!filterList.length">
						<Empty :text="emptyText"></Empty>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

.vb-select {
	&.is-small {
		.button, .input, .dropdown-item {
			line-height: 1.5;
			font-size: 0.75rem;
		}
	}

	&.is-up {
		.dropdown-menu .dropdown-content {
			margin-bottom: 0;

			.filter {
				order: 2;
			}

			.filter-line {
				order: 1;
			}
		}
	}

	&.is-active {
		.dropdown-trigger > .button {
			border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));

			.icon {
				transform: rotate(-180deg);
			}
		}
	}

	&.is-disabled {
		.dropdown-trigger > .button {
			background-color: var(--bulma-background);
			border-color: var(--bulma-background);
			color: var(--bulma-text-weak);
			opacity: 1;

			.icon {
				opacity: .7;
			}
		}
	}

	&.is-danger {
		--bulma-focus-h: var(--bulma-danger-h);
		--bulma-focus-s: var(--bulma-danger-s);
		--bulma-focus-l: var(--bulma-danger-l);

		.dropdown-trigger {
			> .button {
				border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			}

			.icon {
				color: $danger;
			}
		}
	}

	&:hover:not(.is-disabled,.is-danger) {
		.dropdown-trigger .icon {
			color: var(--bulma-body-color);
		}
	}

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
		}

		.icon {
			color: $link;
			transition: transform .3s ease;
		}
	}

	.dropdown-menu {
		&.is-fullwidth {
			width: 100%;
		}

		.dropdown-content {
			display: flex;
			flex-direction: column;
			margin: 0 0 1em;

			.dropdown-scroll-view {
				overflow: auto;
				overscroll-behavior: contain;
				max-height: 300px;
			}

			.dropdown-item {
				display: flex;
				align-items: center;

				i.flags {
					flex-shrink: 0;
				}
			}

			.dropdown-item.is-disabled {
				opacity: .5;
				pointer-events: none;
			}
		}
	}
}
</style>
