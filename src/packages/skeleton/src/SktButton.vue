<script setup lang="tsx">
import { computed, defineComponent, inject, ref } from 'vue';

defineOptions({inheritAttrs: false});
const {active, style = 'none'} = defineProps<{
	active?: boolean;
	style?: 'round' | 'none';
}>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const ButtonCom = defineComponent(() => {
	return () => <div class={ {'vb-skeleton__button': true, 'is-active': isActive.value, 'is-round': style === 'round'} }>
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
}
</style>