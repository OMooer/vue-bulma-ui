<script setup lang="ts">
import { useKeydown } from '@/actions/keydown';
import { useUILocale } from '@/actions/locale';
import { computed, inject, ref, watch } from 'vue';
import { isOverBoxSize, scroll2Middle, TAB_CLOSE_METHOD, vFocus } from '@/utils';
import Empty from '../../empty';

const isParentSmall = inject('isSmall', ref(false));
const props = defineProps<{
	list: TVO.List;
	placeholder?: string;
	holderIcon?: string;
	filter?: boolean;
	disabled?: boolean;
	required?: boolean;
	filterText?: string;
	emptyText?: string;
}>();
const emit = defineEmits(['error']);
const innerValue = defineModel();
const {$vbt} = useUILocale();
const {keyIndex, handler} = useKeydown();
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const frontRef = ref();
const searchRef = ref();
const keyword = ref('');
let closeMethod = '';

const findValue = computed(() => {
	const find = props.list?.find((item: any) => item.value === innerValue.value);
	return find || null;
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
		'is-small'   : isParentSmall.value
	}
});

const filterList = computed(() => {
	return props.list.filter((item: { title: string; value: any; }) => item.title.includes(keyword.value));
});

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-select.is-active')) {
		closeMethod = TAB_CLOSE_METHOD;
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = entity.value?.querySelector('.dropdown-menu');
		requestAnimationFrame(() => {
			if (target) {
				isUp.value = isOverBoxSize(target, 0)('bottom');
			}
			if (props.filter) {
				searchRef.value && searchRef.value.focus();
			}
		});
		closeMethod = '';
		resetKeyIndex();
		document.addEventListener('click', event, {capture: true});
	}
	else {
		isUp.value = false;
		keyword.value = '';
		keyIndex.value = -1;
		// 如果不是焦点离开的此处将焦点定到按钮上
		if (closeMethod !== TAB_CLOSE_METHOD) {
			frontFocus();
		}
		document.removeEventListener('click', event, {capture: true});
	}
});

// 筛选变化时默认预选中第一个
watch(filterList, (list) => {
	if (list.length && keyword.value) {
		keyIndex.value = 0;
	}
	else {
		keyIndex.value = -1;
	}
}, {immediate: true});

watch(keyIndex, (index) => {
	if (index >= 0) {
		requestAnimationFrame(() => {
			const cont = entity.value?.querySelector('.dropdown-scroll-view') as HTMLElement;
			const findIt = cont?.querySelector('.dropdown-item.is-focused') as HTMLElement;
			if (findIt) {
				scroll2Middle(findIt, cont);
			}
		});
	}
});

function toggleDropdown() {
	isOpen.value = !isOpen.value;
}

function selectValue(value: any) {
	setError(false);
	innerValue.value = value;
	isOpen.value = false;
}

function frontFocus() {
	frontRef.value && frontRef.value.focus();
}

function resetKeyIndex() {
	keyIndex.value = innerValue.value ? filterList.value.findIndex((item: any) => item.value === innerValue.value) : -1;
}

function keyAction(e: any) {
	const isInput = e.target.tagName === 'INPUT';
	const action = handler(e, filterList.value, !isOpen.value);
	const justIt = () => {
		if (keyIndex.value >= 0) {
			selectValue(filterList.value[keyIndex.value].value);
		}
		e.preventDefault();
	}
	switch (action) {
		case undefined:
		case 'ArrowUp':
		case 'ArrowDown':
			e.preventDefault();
			break;
		case 'Escape':
			isOpen.value = false;
			break;
		case 'Toggle':
			if (!isInput) {
				toggleDropdown();
				e.preventDefault();
			}
			break;
		case 'Space':
			if (!isInput) {
				justIt();
			}
			break;
		case 'Enter':
			justIt();
			break;
	}
}

function blurEntity(e: any) {
	if (e.relatedTarget && !entity.value?.contains(e.relatedTarget)) {
		closeMethod = TAB_CLOSE_METHOD;
		isOpen.value = false;
	}
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value?.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div ref="entity" :class="classList" :data-required="required" @blur.capture="blurEntity" @keydown="keyAction">
		<select
				class="entity-shadow" tabindex="-1" aria-hidden="true" required
				@focus="frontFocus" v-if="innerValue == undefined && required"></select>
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
						<FasIcon :icon="holderIcon" v-if="holderIcon"/> {{ placeholder || $vbt('select.placeholder') }}
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
						<input
								type="search" class="input" :placeholder="filterText || $vbt('select.filterText')"
								ref="searchRef" v-model="keyword">
					</div>
					<hr class="dropdown-divider filter-line"/>
				</template>
				<div class="dropdown-scroll-view" @mouseover="resetKeyIndex">
					<a
							class="dropdown-item"
							@click="selectValue(item.value)"
							:class="{'is-active': item.value === innerValue, 'is-disabled': item.disabled, 'is-focused': keyIndex === index}"
							:key="item.value.toString()" v-for="(item, index) in filterList">
						<i :class="item.icon" v-if="item.icon"></i>
						<span>{{ item.title }}</span>
					</a>
					<div class="dropdown-item is-disabled" v-if="!filterList.length">
						<Empty :text="emptyText || $vbt('select.emptyText')"></Empty>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

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
				color: va.$danger;
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
		> .button:focus {
			border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
		}

		.button:not(:focus,:focus-visible) {
			box-shadow: none;
		}

		.icon {
			color: va.$link;
			transition: transform .3s ease;
		}
	}

	.dropdown-menu {
		&.is-fullwidth {
			min-width: auto;
			width: max(6rem, 100%);
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

			.dropdown-item.is-focused:not(.is-active) {
				--bulma-dropdown-item-background-l-delta: var(--bulma-dropdown-item-hover-background-l-delta);
			}

			.dropdown-item.is-disabled {
				opacity: .5;
				pointer-events: none;
			}
		}
	}
}
</style>
