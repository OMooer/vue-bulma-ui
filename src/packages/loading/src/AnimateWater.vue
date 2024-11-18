<script setup lang="ts">
import { inject, onMounted, ref, useTemplateRef, watchEffect } from 'vue';

defineOptions({inheritAttrs: false});
const {bgColor} = defineProps<{ bgColor?: string; }>();
const percent = inject('percent', ref(0));
const water = useTemplateRef<HTMLElement>('waterRef');
const wid = ref();
const hei = ref();
onMounted(() => {
	wid.value = water.value?.offsetWidth;
	hei.value = water.value?.offsetHeight;
	water.value?.style.setProperty('--rect-width', wid.value);
	water.value?.style.setProperty('--rect-height', hei.value);
	if (bgColor) {
		if (bgColor === 'inherit') {
			water.value?.querySelectorAll('.wave').forEach((el) => {
				(el as HTMLElement).style.backgroundColor = 'inherit';
			});
		}
		else {
			water.value?.style.setProperty('--wave-color', bgColor);
		}
	}
});
watchEffect(() => {
	if (percent.value) {
		water.value?.style.setProperty('--percent', percent.value + '%');
	}
});
</script>

<template>
	<div ref="waterRef" class="water-loading">
		<div class="wave"></div>
		<div class="wave"></div>
		<div class="wave"></div>
	</div>
</template>

<style scoped lang="scss">
@keyframes wave {
	100% {
		transform: translate(-50%, 0) rotate(720deg);
	}
}

.water-loading {
	--circle-diameter: calc(2px * sqrt(var(--rect-width) * var(--rect-width) + var(--rect-height) * var(--rect-height)));

	position: relative;
	overflow: hidden;
	background: inherit;
	border-radius: inherit;
	width: 100%;
	height: 100%;

	&::before {
		content: "";
		background: linear-gradient(to bottom, var(--bulma-success), var(--bulma-success) 40%, var(--bulma-primary-30));
		position: absolute;
		width: 100%;
		height: calc(var(--percent) + 40%);
		left: 0;
		bottom: 0;
	}

	.wave {
		position: absolute;
		width: var(--circle-diameter);
		height: var(--circle-diameter);
		left: 50%;
		bottom: calc(var(--percent) + 5%);
		background: var(--wave-color, var(--bulma-scheme-main));
		opacity: .8;
		border-radius: 45% 47% 44% 42%;
		transform: translate(-50%, 0);
		animation: wave 10s linear infinite;

		&:nth-child(2) {
			border-radius: 38% 46% 43% 47%;
			transform: translate(-50%, 0) rotate(-135deg);
		}

		&:nth-child(3) {
			border-radius: 42% 46% 37% 40%;
			transform: translate(-50%, 0) rotate(135deg);
		}
	}
}
</style>