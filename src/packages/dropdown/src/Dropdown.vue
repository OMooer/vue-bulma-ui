<script setup lang="ts">
import { computed, ref, watch } from 'vue';

withDefaults(defineProps<{
	list: TVO.List;
	hasArrow?: boolean;
}>(), {hasArrow: true});
const emit = defineEmits(['active']);
const isOpen = ref(false);
const isUp = ref(false);
const canMenuHoverIt = ref(true);
const entity = ref();

const classList = computed(() => {
	return {
		'vb-dropdown': true,
		'dropdown'   : true,
		'is-active'  : isOpen.value,
		'is-up'      : isUp.value
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
		const docHeight = document.documentElement.clientHeight;
		const bottom = entity.value.getBoundingClientRect().top + entity.value.offsetHeight + 300;
		isUp.value = bottom > docHeight;
		document.addEventListener('click', event, {capture: true});
	}
	else {
		document.removeEventListener('click', event, {capture: true});
	}
});

function toggleDropdown() {
	isOpen.value = !isOpen.value;
}

function selectValue(value: any) {
	emit('active', value);
	isOpen.value = false;
}

function menuClicked(e: any) {
	// 为了让菜单自动关闭， 因为鼠标一直 hover 菜单， 导致下拉菜单点击选择后没自动关闭
	if (e.target.closest('a.dropdown-item')) {
		canMenuHoverIt.value = false;
		setTimeout(() => {
			canMenuHoverIt.value = true;
		}, 200);
	}
}
</script>

<template>
	<div ref="entity" :class="classList" @click="menuClicked">
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
		<div class="dropdown-menu is-fullwidth" role="menu" v-show="canMenuHoverIt">
			<div class="dropdown-content">
				<div class="dropdown-scroll-view">
					<template :key="index" v-for="(item, index) in list">
						<hr class="dropdown-divider" v-if="!item">
						<a class="dropdown-item" :class="{'is-disabled': item.disabled}" @click="selectValue(item.value)" v-else>
							<i :class="item.icon" v-if="item.icon"></i>
							<span>{{ item.title }}</span>
						</a>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
@import "../../../scss/variables";

.vb-dropdown {
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

	&:hover {
		.dropdown-trigger .icon {
			color: $black;
		}
	}

	.dropdown-trigger {
		> .button {
			border: 0;
			box-shadow: none !important;
		}

		.icon {
			color: $link;
			transition: transform .3s ease;
			height: auto;
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
