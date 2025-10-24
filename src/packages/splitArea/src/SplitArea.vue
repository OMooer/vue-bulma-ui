<script setup lang="ts">
import InteractiveTracker from '../../InteractiveTracker';
import { computed, ref, useTemplateRef } from 'vue';

defineOptions({inheritAttrs: false});

const {
	      draggable  = true,
	      bordered   = true,
	      direction  = 'horizontal',
	      basicStart = '20%',
	      minStart   = 0,
	      minEnd     = 0
      } = defineProps<{
	draggable?: boolean;
	bordered?: boolean;
	direction?: 'horizontal' | 'vertical';
	basicStart?: string;
	minStart?: number;
	minEnd?: number;
}>();

const isDragging = ref(false);
const isBordered = ref(bordered);
const basic = ref(basicStart);

const styleObj = computed(() => {
	return {
		'--basic-start': basic.value,
		'--bordered'   : isBordered.value ? 0.85 : 0
	}
});
const splitArea = useTemplateRef<HTMLElement>('splitArea');

function endDrag() {
	isDragging.value = false;
	isBordered.value = bordered;
}

function clickHandle(e: MouseEvent) {
	e.preventDefault();
	if (!draggable) {
		return;
	}
	const setBasic = (e.target as HTMLElement)?.dataset.basic;
	if (!setBasic) {
		return;
	}

	if (!splitArea.value) {
		return;
	}

	const rect = splitArea.value.getBoundingClientRect();
	const currentBasic = parseInt(basic.value);

	if (setBasic === 'start') {
		// 如果小于等于原始的 basicStart 则设置为 0
		if (currentBasic <= parseInt(basicStart)) {
			const start = Math.max(minStart, 0);
			basic.value = `${ (start / rect[direction === 'horizontal' ? 'width' : 'height'] * 100).toFixed(2) }%`;
		}
		else {
			basic.value = basicStart;
		}
	}
	else if (setBasic === 'end') {
		// 如果小于原始的 basicStart 则设置为 basicStart
		if (currentBasic < parseInt(basicStart)) {
			basic.value = basicStart;
		}
		else {
			const end = (rect[direction === 'horizontal' ? 'width' : 'height'] - minEnd) / rect[direction === 'horizontal'
					? 'width'
					: 'height'] * 100;
			basic.value = `${ Math.min(100, end).toFixed(2) }%`;
		}
	}
}

function dragging(o: any) {
	if (!draggable) {
		return;
	}
	const {x: clientX, y: clientY} = o.client;

	if (!clientX || !clientY) {
		return;
	}

	if (!splitArea.value) {
		return;
	}

	isDragging.value = true;
	isBordered.value = true;

	const rect = splitArea.value.getBoundingClientRect();

	if (direction === 'horizontal') {
		const x = Math.max(minStart, Math.min(clientX - rect.left, rect.width));
		const max = Math.min(x, rect.width - minEnd);
		const percentage = (max / rect.width) * 100;
		basic.value = `${ percentage.toFixed(2) }%`;
	}
	else {
		const y = Math.max(minStart, Math.min(clientY - rect.top, rect.height));
		const max = Math.min(y, rect.height - minEnd);
		const percentage = (max / rect.height) * 100;
		basic.value = `${ percentage.toFixed(2) }%`;
	}
}

function preventScroll(e: TouchEvent) {
	if (isDragging.value) {
		e.preventDefault();
	}
}
</script>

<template>
	<div
			ref="splitArea"
			:class="['vb-split-area', direction, isDragging ? 'is-dragging' : null]"
			:style="styleObj"
			@touchmove="preventScroll">
		<div class="vb-split-area-start">
			<slot name="start"></slot>
		</div>
		<InteractiveTracker
				class="vb-split-area-line"
				:data-draggable="draggable"
				:event-trigger="['drag']"
				@click="clickHandle"
				@ing="dragging" @end="endDrag">
			<span class="line-before" data-basic="start" v-if="bordered">❮</span>
			<span class="line-after" data-basic="end" v-if="bordered">❯</span>
		</InteractiveTracker>
		<div class="vb-split-area-end">
			<slot name="end"></slot>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-split-area {
	position: relative;
	overflow: hidden;
	display: flex;
	width: 100%;
	height: 100%;

	.vb-split-area-line {
		position: absolute;
		background-color: var(--bulma-border);
		opacity: var(--bordered);
		user-select: none;
		width: 3px;
		height: 3px;
		z-index: 2;
		transition: opacity 0.2s ease-in-out;

		&:not([data-draggable=true]) {
			cursor: default !important;
		}

		.line-before, .line-after {
			position: absolute;
			background-color: var(--bulma-border-weak);
			cursor: pointer;
			color: var(--bulma-grey);
			text-align: center;
			font-size: 12px;
			width: 12px;
			height: 18px;
			z-index: 3;
		}

		.line-before {
			border-radius: 10px 0 0 10px;
			transform: translate(-90%, -50%);
		}

		.line-after {
			border-radius: 0 10px 10px 0;
			transform: translate(10%, -50%);
		}
	}

	&.horizontal {
		flex-direction: row;

		&.is-dragging {
			cursor: col-resize;
		}

		> .vb-split-area-line {
			top: 0;
			left: var(--basic-start);
			height: 100%;
			cursor: col-resize;
			transform: translateX(-50%);

			.line-before, .line-after {
				top: 50%;
			}
		}

		> .vb-split-area-start {
			overflow: auto;
			width: var(--basic-start);
		}

		> .vb-split-area-end {
			overflow: auto;
			width: calc(100% - var(--basic-start));
		}
	}

	&.vertical {
		flex-direction: column;

		&.is-dragging {
			cursor: row-resize;
		}

		> .vb-split-area-line {
			top: var(--basic-start);
			left: 0;
			width: 100%;
			cursor: row-resize;
			transform: translateY(-50%);

			.line-before, .line-after {
				left: 50%;
			}

			.line-before {
				transform: translate(-100%, -75%) rotate(90deg);
			}

			.line-after {
				transform: translate(-100%, -10%) rotate(90deg);
			}
		}

		> .vb-split-area-start {
			overflow: auto;
			height: var(--basic-start);
		}

		> .vb-split-area-end {
			overflow: auto;
			height: calc(100% - var(--basic-start));
		}
	}
}
</style>