<script setup lang="ts">
import { computed, defineComponent, h, ref, useAttrs, watch } from 'vue';
import { isElementPartiallyHidden, isOverBoxSize } from '@/utils';

defineOptions({
	inheritAttrs: false
});
const props = withDefaults(defineProps<{
	list: TVO.DropdownItem[];
	hasArrow?: boolean;
	isHoverable?: boolean;
	parentElement?: string;
}>(), {hasArrow: true});
const emit = defineEmits(['active']);
const attrs = useAttrs();
const isOpen = ref(false);
const isUp = ref(false);
const isRight = ref(false);
const isFixed = ref(false);
const isOverflowClip = ref(false);
const frSize = ref(0);
const ftSize = ref(0);
const isOpacity = ref(0);
const menuCanHoverIt = ref(true);
const entity = ref();

const classList = computed(() => {
	const cls = attrs.class as string;
	const clsArray = cls ? cls.split(' ') : [];
	const filterCls = Array.from(new Set(clsArray)).filter((c: string) => !['is-hoverable'].includes(c));
	const appendClass = filterCls.reduce((result: any, name: string) => {
		result[name] = true;
		return result;
	}, {});
	return {
		'vb-dropdown': true,
		'dropdown'   : true,
		'is-active'  : isOpen.value,
		'is-up'      : isUp.value,
		'is-right'   : isRight.value,
		'is-fixed'   : isFixed.value,
		...appendClass
	}
});

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-dropdown.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = entity.value?.querySelector('.dropdown-menu');
		const parent = document.querySelector(props.parentElement as string) as HTMLElement;
		const overBox = isOverBoxSize(target, 0, parent);
		const entityRect = entity.value?.getBoundingClientRect();
		requestAnimationFrame(() => {
			frSize.value = document.documentElement.clientWidth - entityRect.left;
			ftSize.value = entityRect.top + entityRect.height / 2 - target.offsetHeight / 2;
			isUp.value = overBox('bottom');
			isRight.value = overBox('right');
			setTimeout(() => {
				// 需要重新定位
				isFixed.value = isUp.value && overBox('top');
				isOverflowClip.value = isFixed.value && isElementPartiallyHidden(target);
				// 最初菜单不可见，计算完位置后可见
				isOpacity.value = 1;
			});
		});
		document.addEventListener('click', event, {capture: true});
	}
	else {
		isUp.value = false;
		isRight.value = false;
		isFixed.value = false;
		isOverflowClip.value = false;
		isOpacity.value = 0;
		document.removeEventListener('click', event, {capture: true});
	}
});

const menuCont = defineComponent(() => {
	return () => {
		return h('div',
				{
					class: 'dropdown-menu',
					role : 'menu',
					style: isFixed.value
							? `--fr-size: ${ frSize.value }px; --ft-size: ${ ftSize.value }px;`
							: `opacity: ${ isOpacity.value }`
				},
				h('div',
						{
							class: 'dropdown-content',
						},
						props.list.map((item) => {
							if (!item) {
								return h('hr', {class: 'dropdown-divider'});
							}
							return h('a', {
								class: {
									'dropdown-item': true,
									'is-disabled'  : item.disabled,
								},
								onClick() {
									selectValue(item.value)
								}
							}, item.icon ? h('i', {class: item.icon}) : h('span', item.title));
						})
				)
		);
	}
});

function toggleDropdown() {
	isOpen.value = !isOpen.value;
}

function selectValue(value: any) {
	emit('active', value);
	isOpen.value = false;
}

function hoverHandler() {
	if (props.isHoverable && !isOpen.value) {
		isOpen.value = true;
	}
}

function leaveHandler() {
	if (props.isHoverable && isOpen.value) {
		isOpen.value = false;
	}
}

function menuClicked(e: any) {
	// 为了让菜单自动关闭， 因为鼠标一直 hover 菜单， 导致下拉菜单点击选择后没自动关闭
	if (e.target.closest('a.dropdown-item')) {
		menuCanHoverIt.value = false;
		setTimeout(() => {
			menuCanHoverIt.value = true;
		}, 200);
	}
}
</script>

<template>
	<div ref="entity" :class="classList" @click="menuClicked" @mouseenter="hoverHandler" @mouseleave="leaveHandler">
		<div class="dropdown-trigger">
			<button
					type="button" @click="toggleDropdown"
					class="button is-fullwidth is-justify-content-space-between"
					aria-haspopup="true" aria-controls="dropdown-menu">
				<slot></slot>
				<span class="icon is-small" v-if="hasArrow">
					<FasIcon icon="angle-down" aria-hidden="true"/>
				</span>
			</button>
		</div>
		<Teleport to="body" v-if="isOverflowClip">
			<div :class="classList">
				<Component :is="menuCont" v-show="menuCanHoverIt"/>
			</div>
		</Teleport>
		<Component :is="menuCont" v-show="menuCanHoverIt" v-else/>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-dropdown {
	&.is-small {
		.button, .input, :deep(.dropdown-item) {
			line-height: 1.5;
			font-size: 0.75rem;
		}
	}

	&.is-fixed.dropdown {
		.dropdown-menu {
			position: fixed;
			top: var(--ft-size, unset);
			bottom: unset;
			right: var(--fr-size);
			width: unset;
			//transform: translate(0, -50%);
		}
	}

	&.is-active {
		.dropdown-trigger > .button {
			.icon {
				transform: rotate(-180deg);
			}
		}
	}

	&:hover {
		.dropdown-trigger .icon {
			color: var(--bulma-body-color);
		}
	}

	.dropdown-trigger {
		> .button {
			--bulma-button-border-width: 0px;
			box-shadow: none !important;
		}

		.icon {
			color: va.$link;
			transition: transform .3s ease;
			height: auto;
		}
	}

	.dropdown-menu {
		text-align: left;

		:deep(.dropdown-content) {
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
