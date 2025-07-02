<script setup lang="ts">
const {color, pending} = defineProps<{
	color?: string;
	pending?: boolean;
}>();
</script>

<template>
	<li class="vb-timeline-item" :class="{'is-pending': pending}" :style="color ? `--tl-color: ${color};` : undefined">
		<span class="vb-timeline-item__icon">
			<span class="icon">
				<slot name="icon">
					<FasIcon :icon="pending ? 'rotate-right' : 'circle-dot'" :spin-pulse="pending" size="sm" aria-hidden="true"/>
				</slot>
			</span>
		</span>
		<div class="vb-timeline-item__content">
			<slot/>
		</div>
	</li>
</template>

<style scoped lang="scss">
.vb-timeline-item {
	display: flex;
	align-items: baseline;
	flex: none;
	position: relative;

	&__icon {
		flex: none;
		display: block;
		font-size: .875em;
		color: var(--tl-color, var(--bulma-link));
		z-index: 2;
	}

	&__content {
		font-size: .875em;
	}

	&:not(:last-of-type) {
		padding-block-end: 1.8em;
		padding-inline-end: 1.8em;

		&::after {
			content: '';
			position: absolute;
			border-style: solid;
			border-color: var(--bulma-border-weak);
			border-width: 0 2px 0 0;
			height: calc(100% - 0.375em);
			top: 0;
			left: 0;
			transform: translate(0.675em, 0.875em);
			z-index: 0;
		}
	}
}
</style>