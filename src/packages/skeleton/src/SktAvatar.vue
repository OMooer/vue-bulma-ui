<script setup lang="tsx">
import { computed, defineComponent, inject, ref } from 'vue';

defineOptions({inheritAttrs: false});
const {active, style = 'round'} = defineProps<{
	active?: boolean;
	style?: 'round' | 'none';
}>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const AvatarCom = defineComponent(() => {
	return () => <div class={ {'vb-skeleton__avatar': true, 'is-active': isActive.value, 'is-round': style === 'round'} }>
	</div>
});
</script>

<template>
	<Suspense>
		<slot>
			<AvatarCom/>
		</slot>
		<template #fallback>
			<AvatarCom/>
		</template>
	</Suspense>
</template>

<style lang="scss">
.vb-skeleton__avatar {
	background-color: var(--bulma-background);
	width: 2.5rem;
	height: 2.5rem;
	border-radius: var(--bulma-radius);

	&.is-round {
		border-radius: 50%;
	}
}
</style>