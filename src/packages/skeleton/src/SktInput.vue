<script setup lang="tsx">
import type { VBSkeleton } from '@/types/shim';
import { computed, defineComponent, inject, ref } from 'vue';

interface Props extends Omit<VBSkeleton.InputSkeleton, 'type' | 'line' | 'size'> {
	active?: boolean;
}

defineOptions({inheritAttrs: false});
const {active, shape = 'none', width, height} = defineProps<Props>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const hasStyle = computed(() => !!(width || height));
const InputCom = defineComponent(() => {
	return () => <div
			class={ {
				'vb-skeleton__input': true,
				'is-active'         : isActive.value,
				'is-square'         : shape === 'square',
				'is-round'          : shape === 'round'
			} }
			style={ hasStyle.value ? {width, height} : undefined }
	>
	</div>
});
</script>

<template>
	<Suspense>
		<slot>
			<InputCom/>
		</slot>
		<template #fallback>
			<InputCom/>
		</template>
	</Suspense>
</template>

<style lang="scss">
.vb-skeleton__input {
	background-color: var(--bulma-background);
	width: 15em;
	height: 2em;
	border-radius: var(--bulma-radius);

	&.is-round {
		border-radius: 9999px;
	}

	&.is-square {
		border-radius: 0;
	}
}
</style>