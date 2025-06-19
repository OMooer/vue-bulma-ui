<script setup lang="ts">
import { ref } from 'vue';
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

const menuList = ref(props.data);
menuList.value.forEach(item => {
	if (item.children?.length) {
		item.folded = true;
	}
});

function getMenuTitle(title: string | { [propName: string]: string }): string {
	// 如果 title 是包含多语言的在这里处理
	if (typeof title === 'object') {
		return getI18nData(title, props.locale);
	}
	return title;
}

function toggleFold(currentMenu: VBMenu.Item, folded: boolean) {
	currentMenu.folded = folded;
	// 折叠其他菜单及子菜单
	const foldOtherMenu = (list: VBMenu.Item[]) => {
		for (const item of list) {
			if (item !== currentMenu) {
				item.folded = true;
				// 子菜单都折叠
				if (item?.children?.length) {
					foldOtherMenu(item?.children ?? []);
				}
			}
		}
	}
	if (!folded) {
		// 折叠同一级的其他菜单
		foldOtherMenu(menuList.value);
		// 如果是展开的则往上处理父级菜单的展开
		emit('toggle', true);
	}
}
</script>

<template>
	<ul :style="`--level: ${props.level}`">
		<li
				:class="item.folded ? undefined : {[activeClass]: true, 'is-active': true}"
				:key="(item as any).name ?? (item as any).url" v-for="item in menuList">
			<Link
					class="menu-link" :exactClass
					:to="item.external === true ? item.url : {name: item.name}"
					:title="getMenuTitle(item.title)"
					@state="toggleFold(item, !$event)">
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
						class="icon next-icon" :class="{'roll-down': !item?.folded}"
						@click.prevent.stop="item.folded = !item.folded"
						v-if="item.children?.length">
					<FasIcon icon="angle-right"/>
				</span>
			</Link>
			<div class="next-menu" v-if="item.children?.length">
				<MenuItem
						:level="level + 1" :locale :data="item.children" :exactClass :activeClass
						@toggle="toggleFold(item, !$event)"/>
			</div>
		</li>
	</ul>
</template>

<style scoped lang="scss">
ul {
	margin: 0;
	padding: 0;
	list-style: none;

	:deep(.menu-link) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 0.25em 0 var(--padding-left, 0.25em);

		.menu-title {
			display: flex;
			align-items: center;
			justify-content: flex-start;

			.icon {
				margin-right: .25em;
				transition: none;
			}
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

			> ul {
				overflow: hidden;

				> li > :deep(.menu-link) {
					--padding-left: calc(1em * var(--level) + 0.5em);
				}
			}
		}

		&.is-active {
			> .next-menu {
				grid-template-rows: 1fr;
			}
		}
	}
}
</style>