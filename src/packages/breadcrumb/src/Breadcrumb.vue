<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { Link } from '@/packages/menu';
import { getI18nData } from '@/utils';
import { FontAwesomeIcon as FontIcon } from '@fortawesome/vue-fontawesome';
import { computed, defineComponent, h, ref, type Ref, type VNodeChild } from 'vue';

type BaseProp = {
	locale?: string;
	separator?: string;
	submenu?: boolean;
}
type Props = BaseProp & ({
	list: VBBreadcrumb.Item[];
	router?: never;
} | {
	router: any;
	list?: never;
});

defineOptions({inheritAttrs: false});
const {separator = '/', list, router, submenu, locale} = defineProps<Props>();
const slots = defineSlots<{ separator?: () => VNodeChild | undefined; }>();
const {locale: $locale} = useUILocale();
const showSubMenu = ref(true);

function hideSubMenu() {
	showSubMenu.value = false;
	setTimeout(() => {
		showSubMenu.value = true;
	}, 100);
}

function getChildren(r: any) {
	return r?.children.map((item: any) => {
		return {
			url : (r.path === '/' ? r.path : (r.path + '/')) + item.path,
			text: item.meta?.title ?? item.name ?? item.path,
			icon: item.meta?.icon
		}
	});
}

const currentLocale = computed(() => locale ?? $locale.value);
// 将 $router 的路径转换为面包屑 list 格式
const breadcrumbList = computed(() => {
	if (list) {
		return list;
	}
	const routeList = [];
	// 去掉最后一个 / 字符
	const fullPath = router.currentRoute.value.fullPath.replace(/\/$/, '');
	const paths = fullPath.split('/');
	for (let i = 0; i < paths.length; i++) {
		let url = paths.slice(0, i + 1).join('/');
		if (url.indexOf('/') !== 0) {
			url = '/' + url;
		}
		const currentRoute = router.resolve(url);
		const r = currentRoute.matched.at(-1);
		const children = submenu ? getChildren(r) : [];
		const ie: any = {
			url : r.path,
			text: r.meta?.title ?? r.name ?? r.path,
			icon: r.meta?.icon
		};
		if (children.length) {
			ie.children = children;
		}

		routeList.push(ie)
	}
	return routeList;
}) as Readonly<Ref<VBBreadcrumb.Item[]>>;

// 从列表渲染出组件结构
const breadcrumbs = defineComponent(() => {
	return () => {
		return h('ul', {
			class: {
				'is-custom': !!slots.separator
			},
			style: {
				'--bcm-separator': `'${ separator }'`
			}
		}, breadcrumbList.value.map((item, index) => {
			const result = [];
			const isEnd = index === breadcrumbList.value.length - 1;
			const nextChild = breadcrumbList.value[Math.min(index + 1, breadcrumbList.value.length - 1)];
			// 如果自定义了分隔，则在此添加相应的节点
			if (slots.separator && index > 0) {
				result.push(h('li', [slots.separator?.()]));
			}
			const menuVNode = h(Link, {to: item.url}, {
				default: () => [
					item.icon ? h('span', {class: 'icon is-small'}, h(FontIcon, {icon: item.icon.split(' ')})) : null,
					h('span', getI18nData(item.text, currentLocale.value))
				]
			});
			// 获取非最后一个节点的子节点
			const children = isEnd ? [] : item.children?.filter(child => child.url !== nextChild.url).map(child => {
				return h(Link, {
					class: 'dropdown-item',
					to   : child.url
				}, {default: () => getI18nData(child.text, currentLocale.value)})
			});
			// 生成下拉子菜单
			let childrenVNode;
			if (!isEnd && children?.length) {
				childrenVNode = h('div', {class: 'dropdown is-hoverable'}, [
					h('div', {class: 'dropdown-trigger'}, [
						menuVNode,
						h('span', {class: 'icon is-small'}, h(FontIcon, {icon: 'angle-down', 'aria-hidden': true}))
					]),
					h('div', {
						class  : 'dropdown-menu',
						role   : 'menu',
						style  : showSubMenu.value ? null : 'display: none;',
						onClick: hideSubMenu
					}, h('div', {class: 'dropdown-content'}, children))
				]);
			}

			result.push(h('li',
					{class: {'is-active': isEnd}},
					submenu && childrenVNode ? childrenVNode : menuVNode)
			);

			return result;
		}).flat());
	}
});
</script>

<template>
	<nav class="vb-breadcrumb breadcrumb" aria-label="breadcrumbs">
		<Component :is="breadcrumbs"/>
	</nav>
</template>

<style scoped lang="scss">
.vb-breadcrumb {
	:deep(>ul) {
		li + li::before {
			content: var(--bcm-separator, '/');
		}

		&.is-custom {
			li::before {
				content: none;
			}
		}

		.dropdown-trigger {
			display: flex;
			align-items: center;
			padding-right: var(--bulma-breadcrumb-item-padding-horizontal);

			> a {
				padding-right: 0;
			}
		}

		.dropdown-menu {
			min-width: 100%;

			a.dropdown-item {
				padding: 0.375rem 1rem;
				justify-content: flex-start;
			}
		}
	}
}
</style>