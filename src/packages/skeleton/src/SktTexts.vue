<script setup lang="tsx">
import { computed, defineComponent, inject, ref } from 'vue';

defineOptions({inheritAttrs: false});
const {line = 4, active} = defineProps<{
	line?: number;
	active?: boolean;
}>();
const parentActive = inject('active', ref(false));
const isActive = computed(() => active || parentActive.value);
const lastWidth = computed(() => {
	return Math.max(10, Math.round(Math.random() * 95));
});
const TextCom = defineComponent(() => {
	return () => <ul class="vb-skeleton__texts">
		{
			[...Array(line)].map((_, i) => {
				const styleCss = i + 1 === line ? `width:${ lastWidth.value }%` : '';
				return <li class={ {'is-active': isActive.value} } style={ styleCss }></li>;
			})
		}
	</ul>
});
</script>

<template>
	<Suspense>
		<slot>
			<TextCom/>
		</slot>
		<template #fallback>
			<TextCom/>
		</template>
	</Suspense>
</template>

<style lang="scss">
.vb-skeleton__texts {
	margin: 0;
	padding: 0;
	list-style: none;
	min-width: 5rem;

	li {
		margin: .4em 0;
		padding: 0;
		background-color: var(--bulma-background);
		border-radius: var(--bulma-radius);
		height: 1.1em;

		&:first-child {
			margin: .7em 0 1em;
			width: 50%;
		}
	}
}
</style>