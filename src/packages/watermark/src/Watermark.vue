<script setup lang="ts">
import type { Config, TextMark } from './types/watermark';
import { useWatermark } from './createMark';
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

const props = defineProps<Config>();
const parent = useTemplateRef('parent');
const bgImage = computed(() => {
	const {image, ...config} = props;
	return image || useWatermark(config as TextMark);
});
let wm: HTMLElement;

function generateWatermark() {
	if (!parent.value) {
		return;
	}
	if (wm) {
		wm.remove();
	}
	wm = document.createElement('div');
	wm.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		pointer-events: none;
		overflow: hidden;
	`;
	wm.style.background = `url(${ bgImage.value })`;
	parent.value.appendChild(wm);
}

const ob = new MutationObserver((records) => {
	let isChange = false;
	records.forEach((record) => {
		if (record.removedNodes.length) {
			record.removedNodes.forEach((node) => {
				if (node === wm) {
					isChange = true;
				}
			});
		}
		if (record.target === wm) {
			isChange = true;
		}
		if (isChange) {
			generateWatermark();
		}
	});
});
onBeforeUnmount(() => {
	ob.disconnect();
});
onMounted(() => {
	generateWatermark();
	ob.observe(parent.value as HTMLElement, {
		childList : true,
		subtree   : true,
		attributes: true
	});
});
</script>

<template>
	<div class="vb-watermark" ref="parent">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.vb-watermark {
	position: relative;
}
</style>