<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import type { VBMenu } from '@/types/shim';
import { computed, inject, ref } from 'vue';
import { getI18nData } from '@/utils';
import Link from './Link.vue';

const emit = defineEmits(['toggle']);
const props = withDefaults(defineProps<{
	data: VBMenu.Item[];
	locale?: string;
	activeClass?: string;
	exactClass?: string;
	level?: number;
}>(), {
	activeClass: 'is-active',
	level      : 0
});
const openedSet = inject('menu-opened-set', ref(new Set<string>()));
const {$vbt} = useUILocale();

const menuList = computed(() => props.data);
const keyOf = (item: any) => item.name ?? item.url;
const isOpened = (item: VBMenu.Item) => {
	return item.children?.length ? (item.pinned === true || openedSet.value.has(keyOf(item))) : false;
}

function getMenuTitle(title: string | { [propName: string]: string }): string {
	// 如果 title 是包含多语言的在这里处理
	if (typeof title === 'object') {
		return getI18nData(title, props.locale);
	}
	return title;
}

function closestOpen(item: VBMenu.Item) {
	toggle(item, true);
	// 往上处理父级菜单的展开
	emit('toggle', true);
}

function matchRouteOpen(item: VBMenu.Item, isMatch: boolean) {
	if (isMatch) {
		openedSet.value.clear();
		closestOpen(item);
	}
}

function toggle(item: VBMenu.Item, isOpen: boolean) {
	if (isOpen) {
		openedSet.value.add(keyOf(item));
	}
	else {
		openedSet.value.delete(keyOf(item));
	}
}
</script>

<template>
	<ul :style="`--level: ${props.level}`">
		<li
				:class="isOpened(item) ? {[activeClass]: true, 'is-active': true} : undefined"
				:key="keyOf(item)" v-for="item in menuList">
			<Link
					class="menu-link" :exactClass
					:to="item.external === true ? item.url : {name: item.name}"
					:title="getMenuTitle(item.title)"
					@state="matchRouteOpen(item, $event)">
				<span class="menu-title">
					<span class="icon" v-if="item.icon">
						<i :class="item.icon" v-if="typeof item.icon === 'string'"></i>
						<Component :is="item.icon" v-else/>
					</span>
					<span class="text" :data-code="getMenuTitle(item.title)?.substring?.(0,1)">
						{{ getMenuTitle(item.title) }}
					</span>
				</span>
				<span
						class="icon next-icon" :class="{'roll-down': isOpened(item)}"
						role="button" tabindex="0" :aria-expanded="isOpened(item)"
						:aria-label="isOpened(item) ? $vbt('menu.collapse') : $vbt('menu.expand')"
						@click.prevent.stop="toggle(item, !isOpened(item))"
						@keydown.enter.prevent.stop="toggle(item, !isOpened(item))"
						@keydown.space.prevent.stop="toggle(item, !isOpened(item))"
						v-if="item.children?.length && !item.pinned">
					<FasIcon icon="angle-right"/>
				</span>
			</Link>
			<div class="next-menu" v-if="item.children?.length">
				<MenuItem
						:level="level + 1" :locale :data="item.children" :exactClass :activeClass
						@toggle="closestOpen(item)"/>
			</div>
		</li>
	</ul>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

ul {
	margin: 0;
	padding: 0;
	list-style: none;

	:deep(.menu-link) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		overflow: hidden;
		margin: 0.125rem var(--link-margin-inline);
		padding-block: 0;
		padding-left: var(--link-padding-l);
		padding-right: var(--link-padding-r);
		color: var(--link-color);
		border-radius: var(--radius);

		&:hover {
			background-color: var(--link-hover-bg-color);
			color: var(--link-hover-color);
		}

		.menu-title {
			display: flex;
			align-items: center;
			justify-content: flex-start;

			.icon {
				margin-right: .25em;
				transition: none;
				color: var(--icon-color);
			}

			.text {
				white-space: nowrap;
				transition: opacity .3s ease, visibility .3s ease;

				&:only-child {
					margin-left: var(--link-padding-l);
				}
			}
		}

		.next-icon {
			color: var(--icon-color);
		}
	}

	> li {
		margin: 0;
		padding: 0;
		list-style: none;

		.next-icon {
			transition: transform .3s ease;

			&.roll-down {
				transform: rotate(90deg);
			}
		}

		> .next-menu {
			display: grid;
			grid-template-rows: 0fr;
			transition: grid-template-rows .3s ease;
			font-size: .9375em;

			> ul {
				overflow: hidden;

				> li > :deep(.menu-link) {
					--link-padding-l: calc(1em * var(--level) + 0.5em);;
				}
			}
		}

		&.is-active {
			> .next-menu {
				grid-template-rows: 1fr;
			}
		}
	}

	li {
		> .menu-link {
			&.is-exact-link {
				@include va.currentMenu;
			}
		}

		// 节点未激活（没有展开），下级有当前激活的节点
		&:not(.is-active):has(.is-exact-link) > .menu-link:not(.is-exact-link) {
			background-color: var(--link-hover-bg-color);
		}

		// 节点激活（已展开），但是当前激活节点是下级的节点而非自身
		&.is-active:has(>.next-menu):not(:has(>.is-exact-link)):not(:has(>.next-menu>ul>li.is-active)),
		&.is-active:has(>.next-menu>ul>li>.is-exact-link:only-child) {
			> .menu-link {
				background-color: var(--link-hover-bg-color);
			}
		}

		// 节点展开但是并没有激活的子节点
		&:not(:has(>.next-menu li.is-active>.next-menu)),
			// 子菜单存在当前激活节点且是最终节点
		&:has(>.next-menu>ul>li>.is-exact-link:only-child) {
			// 如果自身是激活的那么子菜单设置背景颜色等样式
			&.is-active > .next-menu {
				position: relative;
				margin-bottom: .75rem;

				&::before {
					content: "";
					position: absolute;
					pointer-events: none;
					left: var(--submenu-margin);
					right: var(--submenu-margin);
					top: 0;
					bottom: 0;
					background-color: var(--submenu-bg-color);
					box-shadow: 0 0 2px 0 var(--border-color) inset;
					border-radius: var(--radius);
					z-index: 1;
				}

				> ul {
					position: relative;
					z-index: 2;
				}
			}
		}
	}
}
</style>