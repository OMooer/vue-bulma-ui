<script setup lang="ts">
import { computed, onUpdated, ref, watch } from 'vue';
import Empty from '../../empty';

const props = withDefaults(defineProps<{
	modelValue?: any;
	list: TVO.List;
	placeholder?: string;
	holderIcon?: string;
	filter?: boolean;
	disabled?: boolean;
	required?: boolean;
	emptyText?: string;
}>(), {emptyText: '无数据'});
const emit = defineEmits(['update:modelValue', 'error']);
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const keyword = ref('');
const vFocus = {
	updated: (el: HTMLInputElement) => el.focus()
};

const findValue = computed(() => {
	const find = props.list?.find((item: any) => item.value === props.modelValue);
	return find || null;
});
// 如果设置的值并不存在，则更新值为空
onUpdated(() => {
	if (!findValue.value) {
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
		'is-danger'  : isError.value
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
		const docHeight = document.documentElement.clientHeight;
		const bottom = entity.value.getBoundingClientRect().top + entity.value.offsetHeight + 300;
		isUp.value = bottom > docHeight;
		document.addEventListener('click', event, {capture: true});
	}
	else {
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
				@focus="frontFocus" v-if="!modelValue && required"></select>
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
						<input type="text" class="input" v-focus v-model="keyword">
					</div>
					<hr class="dropdown-divider filter-line"/>
				</template>
				<div class="dropdown-scroll-view">
					<a
							class="dropdown-item"
							@click="selectValue(item.value)"
							:class="{'is-active': item.value === modelValue, 'is-disabled': item.disabled}"
							:key="item.value" v-for="item in filterList">
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

<style lang="scss">
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
			border-color: $link;
			box-shadow: 0 0 0 0.125em rgba($link, .25);

			.icon {
				transform: rotate(-180deg);
			}
		}
	}

	&.is-disabled {
		.dropdown-trigger > .button {
			background-color: $grey-lightest;
			border-color: $grey-lightest;
		}
	}

	&.is-danger {
		.dropdown-trigger {
			> .button {
				border-color: $danger;
				box-shadow: 0 0 0 0.125em rgba($danger, .25);
			}

			.icon {
				color: $danger;
			}
		}
	}

	&:hover {
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
