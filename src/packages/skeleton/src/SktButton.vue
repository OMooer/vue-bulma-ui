<script setup lang="tsx">
import type { VBSkeleton } from '@/types/shim';
import { computed, defineComponent, inject, ref } from 'vue';

interface Props extends Omit<VBSkeleton.ButtonSkeleton, 'type' | 'line'> {
	active?: boolean;
}

defineOptions({inheritAttrs: false});
const {active, shape = 'none', size = 'none', width, height, center} = defineProps<Props>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const hasStyle = computed(() => !!(width || height));
const ButtonCom = defineComponent(() => {
	return () => <div
			class={ {
				'vb-skeleton__button': true,
				'is-active'          : isActive.value,
				'is-large'           : size === 'large',
				'is-small'           : size === 'small',
				'is-square'          : shape === 'square',
				'is-round'           : shape === 'round',
				'is-centered'        : center
			} }
			style={ hasStyle.value ? {width, height} : undefined }
	>
	</div>
});
</script>

<template>
	<Suspense>
		<slot>
			<ButtonCom/>
		</slot>
		<template #fallback>
			<ButtonCom/>
		</template>
	</Suspense>
</template>

<style lang="scss">
.vb-skeleton__button {
	background-color: var(--bulma-background);
	width: 5.5em;
	height: 2em;
	border-radius: var(--bulma-radius);

	&.is-round {
		border-radius: 9999px;
	}

	&.is-large {
		font-size: 1.5em;
	}

	&.is-small {
		font-size: 0.75em;
	}

	&.is-square {
		border-radius: 0;
	}

	&.is-centered {
		justify-self: center;
		align-self: center;
	}
}
</style>