<script setup lang="ts">
import { ref } from 'vue';
import { getI18nData } from '../../../utils';
import Link from './Link.vue';

const props = withDefaults(defineProps<{
	data: VBMenu.Item[];
	locale?: string;
	activeClass?: string;
	exactClass?: string;
}>(), {
	activeClass: 'is-active'
});

const menuList = ref(props.data);
menuList.value.forEach(item => {
	// 如果 title 是包含多语言的在这里处理
	if (typeof item.title === 'object') {
		item.title = getI18nData(item.title, props.locale);
	}
	if (item.children?.length) {
		item.folded = true;
	}
});
</script>

<template>
	<ul>
		<li :class="{[activeClass]: !item.folded, 'is-active': !item.folded}" v-for="item in menuList">
			<Link
					class="menu-link" :exactClass
					:to="item.external ? item.url : {name: item.name}"
					:title="item.title"
					@state="item.folded =! $event">
				<div class="menu-title">
					<span class="icon" v-if="item.icon">
						<i :class="item.icon" v-if="typeof item.icon === 'string'"></i>
						<Component :is="item.icon" v-else/>
					</span>
					<span class="text" :data-code="item.title.substring(0,1)">{{ item.title }}</span>
				</div>
				<span class="icon next-icon" :class="{'roll-down': !item?.folded}" v-if="item.children?.length">
					<FasIcon icon="angle-right"/>
				</span>
			</Link>
			<div class="next-menu" v-if="item.children?.length">
				<MenuItem :data="item.children" :exactClass :activeClass/>
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
		padding: 0 .25em;

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
					padding-left: 1.5em;

					~ .next-menu .menu-link {
						padding-left: 2.5em;
					}
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