<script setup lang="ts">
import TimelineItem from './TimelineItem.vue';
import { flattenVNode, isEmptyElement, vScrollbar } from '@/utils';
import { cloneVNode, defineComponent, h, onMounted, ref, useAttrs, type VNodeChild, withDirectives } from 'vue';

const {mode = 'left', reverse, pending} = defineProps<{
	mode?: 'left' | 'right' | 'top' | 'bottom' | 'center';
	reverse?: boolean;
	pending?: string;
}>();
const slots = defineSlots<{ default: () => VNodeChild | undefined; }>();
const attrs = useAttrs();

function getNewChild(node: any, index: number) {
	if (isEmptyElement(node)) {
		return;
	}
	const newProps = {
		key: node.props?.key ?? index,
	};
	if (node.type === TimelineItem) {
		Object.assign(newProps, node.props);
		return cloneVNode(node, newProps);
	}
	return h(TimelineItem, newProps, () => node);
}

const getItems = () => {
	const newItems = flattenVNode(slots.default?.()).map(getNewChild);
	if (pending) {
		newItems.push(h(TimelineItem, {
			pending: true,
			color  : 'var(--bulma-link-75)'
		}, h('span', {style: {color: 'var(--bulma-grey)'}}, pending)));
	}
	if (reverse) {
		newItems.reverse();
	}
	return newItems;
}

const timelineEntity = ref();
const TimeLine = defineComponent(() => {
	return () => withDirectives(h('ul', {
		...attrs,
		class: {
			'vb-timeline'   : true,
			[`is-${ mode }`]: mode,
		},
		ref  : timelineEntity
	}, getItems() as []), [
		[vScrollbar, ['is-horizontal-scroll'], 'x'],
		[vScrollbar, ['is-vertical-scroll'], 'y']
	]);
});

onMounted(() => {
	if (reverse) {
		timelineEntity.value?.scroll({top: 0, left: 0});
	}
	else {
		timelineEntity.value?.scroll({top: timelineEntity.value.scrollHeight, left: timelineEntity.value.scrollWidth});
	}
});
</script>

<template>
	<TimeLine/>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

@mixin pendingStyle($dir) {
	@if $dir == 'block' {
		padding-block-end: 3.2em;
	} @else {
		padding-inline-end: 3.2em;
	}
	&::after {
		border-style: dotted;
	}
}

.vb-timeline {
	display: flex;
	overflow: auto;

	@include va.scrollbar();

	&.is-vertical-scroll {
		--vertical-padding: .5em;
		padding-right: calc(var(--vertical-padding) + var(--scrollbar-width, .5em));
	}

	&.is-horizontal-scroll {
		--horizontal-padding: .5em;
		padding-bottom: calc(var(--horizontal-padding) + var(--scrollbar-height, .95em));
	}

	// 左对齐
	&.is-left {
		flex-direction: column;

		:deep(.vb-timeline-item) {
			padding-inline-end: 0;

			&.is-pending:first-of-type {
				@include pendingStyle('block');
			}

			&:has(+.is-pending) {
				@include pendingStyle('block');
			}
		}
	}

	// 右对齐
	&.is-right {
		flex-direction: column;
		align-items: flex-end;

		:deep(.vb-timeline-item) {
			flex-flow: row-reverse;
			padding-inline-end: 0;
			text-align: right;

			&::after {
				left: unset;
				right: 0;
				transform: translate(-0.675em, 0.875em);
			}

			&.is-pending:first-of-type {
				@include pendingStyle('block');
			}

			&:has(+.is-pending) {
				@include pendingStyle('block');
			}
		}
	}

	// 上对齐
	&.is-top {
		:deep(.vb-timeline-item) {
			flex-flow: column;
			padding-block-end: 0;

			&::after {
				border-width: 2px 0 0;
				width: calc(100% - 0.375em);
				height: unset;
				transform: translate(0.875em, 0.675em);
			}

			&.is-pending:first-of-type {
				@include pendingStyle('inline');
			}

			&:has(+.is-pending) {
				@include pendingStyle('inline');
			}
		}
	}

	// 下对齐
	&.is-bottom {
		:deep(.vb-timeline-item) {
			flex-flow: column-reverse;
			padding-block-end: 0;

			&::after {
				border-width: 2px 0 0;
				top: unset;
				bottom: 0;
				width: calc(100% - 0.375em);
				height: unset;
				transform: translate(0.875em, -0.675em);
			}

			&.is-pending:first-of-type {
				@include pendingStyle('inline');
			}

			&:has(+.is-pending) {
				@include pendingStyle('inline');
			}
		}
	}

	// 居中对齐
	&.is-center {
		flex-flow: column;

		:deep(.vb-timeline-item) {
			padding-inline-end: 0;
			width: calc(50% + 0.75em);

			&:nth-child(odd) {
				flex-flow: row-reverse;
				text-align: right;

				&::after {
					left: unset;
					right: 0;
					transform: translate(-0.675em, 0.875em);
				}
			}

			&:nth-child(even) {
				align-self: flex-end;
			}

			&.is-pending:first-of-type {
				@include pendingStyle('block');
			}

			&:has(+.is-pending) {
				@include pendingStyle('block');
			}
		}
	}
}
</style>