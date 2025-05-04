<script setup lang="tsx">
import { computed, defineComponent, inject, ref } from 'vue';

defineOptions({inheritAttrs: false});
const {active, width, height} = defineProps<{
	active?: boolean;
	width?: string;
	height?: string;
}>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const ImageCom = defineComponent(() => {
	return () => <div class={ {'vb-skeleton__image': true, 'is-active': isActive.value} } style={ {width, height} }>
		<svg viewBox="0 0 1098 1024" xmlns="http://www.w3.org/2000/svg">
			<path
					d="M365.714286 329.142857q0 45.714286-32.036571 77.677714t-77.677714 32.036571-77.677714-32.036571-32.036571-77.677714 32.036571-77.677714 77.677714-32.036571 77.677714 32.036571 32.036571 77.677714zM950.857143 548.571429l0 256-804.571429 0 0-109.714286 182.857143-182.857143 91.428571 91.428571 292.571429-292.571429zM1005.714286 146.285714l-914.285714 0q-7.460571 0-12.873143 5.412571t-5.412571 12.873143l0 694.857143q0 7.460571 5.412571 12.873143t12.873143 5.412571l914.285714 0q7.460571 0 12.873143-5.412571t5.412571-12.873143l0-694.857143q0-7.460571-5.412571-12.873143t-12.873143-5.412571zM1097.142857 164.571429l0 694.857143q0 37.741714-26.843429 64.585143t-64.585143 26.843429l-914.285714 0q-37.741714 0-64.585143-26.843429t-26.843429-64.585143l0-694.857143q0-37.741714 26.843429-64.585143t64.585143-26.843429l914.285714 0q37.741714 0 64.585143 26.843429t26.843429 64.585143z"
			></path>
		</svg>
	</div>
});
</script>

<template>
	<Suspense>
		<slot>
			<ImageCom/>
		</slot>
		<template #fallback>
			<ImageCom/>
		</template>
	</Suspense>
</template>

<style lang="scss">
.vb-skeleton__image {
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	background-color: var(--bulma-background);
	border-radius: var(--bulma-radius);
	width: 100%;
	height: 100%;

	svg {
		margin: 0.25em;
		width: 4rem;
		min-width: 1rem;

		path {
			fill: var(--bulma-background-hover);
		}
	}
}
</style>