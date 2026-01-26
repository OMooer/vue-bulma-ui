<script setup lang="ts">
import type { VBMenu } from '@/types/shim';
import type { PropType } from 'vue';
import MenuItem from './MenuItem.vue';

defineProps({
	locale     : {
		type   : String,
		default: 'zh-cn'
	},
	menuData   : {
		type   : Array as PropType<VBMenu.Item[]>,
		default: []
	},
	activeClass: String,
	exactClass : String
});

</script>

<template>
	<nav class="vb-menu">
		<MenuItem :locale :data="menuData" :exactClass :activeClass/>
	</nav>
</template>

<style lang="scss">
@use "@/scss/variables" as va;

.vb-menu {
	// 链接的外边距
	--link-margin-inline: 0;
	// 链接的内边距
	--link-padding-l: 0.25em;
	--link-padding-r: 0.25em;
	// 链接颜色
	--link-color: var(--bulma-text);
	// 链接悬浮颜色
	--link-hover-color: var(--bulma-text-strong);
	// 链接悬浮背景色
	--link-hover-bg-color: var(--bulma-background-hover);
	// 链接激活颜色
	--link-active-color: var(--bulma-white);
	// 链接激活背景色
	--link-active-bg-color: var(--bulma-link-70);
	// 边框颜色
	--border-color: var(--bulma-border);
	// 链接圆角
	--radius: var(--bulma-radius);
	// 图标颜色
	--icon-color: var(--bulma-link);
	// 子菜单背景色
	--submenu-bg-color: var(--bulma-scheme-main-bis);
	// 子菜单外边距
	--submenu-margin: var(--link-margin-inline);

	overflow-x: hidden;
	-ms-overflow-style: none;
	scrollbar-width: none;

	// 整个菜单无当前激活（即无完全匹配中的菜单）
	&:not(:has(.is-exact-link)) {
		// 存在激活的节点，通常是此模块下的非导航页面
		li.is-active {
			// 此节点但不存在任何的下级菜单
			&:not(:has(.next-menu)) {
				> .menu-link {
					@include va.currentMenu;
				}
			}

			// 此节点的下级节点是最终激活的节点且匹配了非导航页面
			&:has(>.next-menu>ul>li.is-active>.menu-link:only-child) {
				> .menu-link {
					background-color: var(--link-hover-bg-color);
				}
			}
		}
	}
}
</style>