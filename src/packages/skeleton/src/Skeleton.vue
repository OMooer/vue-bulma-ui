<script setup lang="ts">
import SktButton from './SktButton.vue';
import SktImage from './SktImage.vue';
import SktAvatar from './SktAvatar.vue';
import SktTexts from './SktTexts.vue';
import {
	type Component,
	computed,
	defineAsyncComponent,
	defineComponent,
	h,
	provide, toRef,
	type VNodeChild,
	watchEffect
} from 'vue';

const {loading = true, active, graph} = defineProps<{
	loading?: boolean;
	active?: boolean;
	graph?: {
		grid?: VBSkeleton.Grid;
	};
}>();

const slots = defineSlots<{ default: () => VNodeChild | undefined; }>();
let asyncDefaultVNode: Component;
watchEffect(() => {
	const {resolve, promise} = Promise.withResolvers<Component>();
	asyncDefaultVNode = defineAsyncComponent(() => promise);
	if (!loading) {
		resolve(() => slots.default?.());
	}
});

// 获取布局网格
const layoutGrid = computed(() => {
	// 如果没有布局信息则返回默认布局
	if (!graph || !graph.grid) {
		return [[{type: 'text'}]];
	}
	let grid = graph.grid;
	// 如果数组不是二维的则转换为二维数组
	if (!Array.isArray(graph.grid[0])) {
		grid = [graph.grid] as VBSkeleton.GraphicsGrid;
	}
	return grid as VBSkeleton.GraphicsGrid;
});

// 获取最大列数的行数
const maxColsRow = computed(() => {
	let maxCols = 0;
	let rowResult = 0;
	for (let i = 0; i < layoutGrid.value.length; i++) {
		if (layoutGrid.value[i].length > maxCols) {
			maxCols = layoutGrid.value[i].length;
			rowResult = i;
		}
	}
	return rowResult;
});

// 获取网格列的宽度
function getColWidth(item: any) {
	return item.span ?? 0;
}

// 获取节点
function getItems() {
	// 打平布局
	return layoutGrid.value.flat().map((item) => {
		let sktItem;
		switch (item.type) {
			case 'text':
				sktItem = h(SktTexts, {...item});
				break;
			case 'avatar':
				sktItem = h(SktAvatar, {...item});
				break;
			case 'image':
				sktItem = h(SktImage, {...item});
				break;
			case 'button':
				sktItem = h(SktButton, {...item});
				break;
			default:
				sktItem = item.type ?? '';
		}
		const colWidth = getColWidth(item);
		return h('div', {
			class: 'cell',
			style: colWidth ? {
				gridColumn: `span ${ colWidth }`
			} : null
		}, sktItem);
	});
}

function getGridTemplate() {
	return layoutGrid.value[maxColsRow.value].map(item => {
		return item.type === 'text' ? '1fr' : 'auto';
	}).join(' ');
}

const skeletonVNode = defineComponent(() => {
	return () => {
		return h('div', {
			class: 'grid',
			style: {
				gridTemplateColumns: getGridTemplate()
			}
		}, getItems());
	}
});

provide('active', toRef(() => active));
</script>

<template>
	<Suspense :timeout="1000">
		<template #default>
			<Component :is="asyncDefaultVNode" v-if="asyncDefaultVNode"/>
		</template>
		<template #fallback>
			<div class="vb-skeleton">
				<Component :is="skeletonVNode"/>
			</div>
		</template>
	</Suspense>
</template>

<style scoped lang="scss">
@keyframes shimmer {
	0% {
		transform: translateX(-40%);
	}
	100% {
		transform: translateX(40%);
	}
}

.vb-skeleton {
	:deep(.is-active) {
		position: relative;
		overflow: hidden;

		&::after {
			content: "";
			position: absolute;
			top: 0;
			bottom: 0;
			inset-inline-start: -150%;
			inset-inline-end: -150%;
			background-image: linear-gradient(100deg, transparent 25%, var(--bulma-background-hover) 37%, transparent 63%);
			animation: shimmer 1.5s infinite linear;
		}
	}
}
</style>