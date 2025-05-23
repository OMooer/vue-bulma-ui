<script setup lang="ts">
import { computed, inject, ref } from 'vue';

defineOptions({inheritAttrs: false});
const isParentSmall = inject('isSmall', ref(false));
const props = defineProps({
	disabled: Boolean,
	isSmall : Boolean
});
const switchValue = defineModel();
const isReallySmall = computed(() => isParentSmall.value || props.isSmall);
</script>

<template>
	<label
			class="vb-switch"
			:class="{'is-disabled': disabled, 'is-on': switchValue, 'is-small': isReallySmall, 'is-custom': $slots.icon}">
		<slot name="icon" class="is-custom-icon"></slot>
		<span class="text"><slot>&nbsp;</slot></span>
		<input type="checkbox" :disabled v-model="switchValue"/>
	</label>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-switch {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: space-between;
	overflow: hidden;
	padding: 0 .5em;
	border: solid 1px var(--bulma-border);
	border-radius: 2.5em;
	cursor: pointer;
	line-height: normal;
	font-size: 1rem;
	height: 2.5em;
	min-width: 5em;
	transform: scale(.85);
	transform-origin: left;

	input {
		appearance: none;
		opacity: 0;
		order: 0;
		width: 1.9em;
		height: 50%;
	}

	.text {
		position: relative;
		flex-grow: 1;
		order: 1;
		padding: 0 .5em;
		text-align: center;
		user-select: none;
		font-size: 1rem;
		z-index: 5;
	}

	&::before, &::after {
		content: "";
		position: absolute;
		left: 0;
		border-radius: 2.5em;
	}

	&::before {
		background: hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-ter-l) + 0%));
		width: 100%;
		height: 100%;
		transition: background-color .3s ease;
	}

	&::after {
		right: 0;
		background: va.$white;
		box-shadow: va.$shadow;
		border-radius: 50%;
		width: 2.4em;
		height: 2.4em;
		z-index: 5;
		transition: left .3s ease;
	}

	&:hover:not(.is-disabled) {
		border-color: hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-border-l) + var(--bulma-hover-border-l-delta)));
	}

	&:focus-within {
		border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
		box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
	}

	&.is-on {
		border-color: va.$success;

		&::before {
			background-color: va.$green;
		}

		&::after {
			left: calc(100% - 2.4em);
			right: 0;
		}

		&:focus-within, &:hover {
			border-color: va.$success;
			box-shadow: 0 0 0 0.125em rgba(va.$success, .25);
		}

		input {
			order: 3;
		}

		.text {
			color: va.$white;
		}
	}

	&.is-small {
		font-size: .75rem;

		.text {
			font-size: .875rem;
		}
	}

	&.is-custom {
		&::before, &::after {
			display: none;
		}

		:deep(.is-custom-icon) {
			position: absolute;
			left: 0;
			right: 0;
			box-shadow: va.$shadow;
			border-radius: 50%;
			width: 2.4em;
			height: 2.4em;
			z-index: 5;
			transition: left .3s ease;
		}

		&.is-on :deep(.is-custom-icon) {
			left: calc(100% - 2.4em);
			right: 0;
		}
	}

	&.is-disabled {
		cursor: not-allowed;
		background-color: var(--bulma-background);
		border-color: var(--bulma-background);
		color: var(--bulma-text-weak);

		&:hover {
			border-color: var(--bulma-background);
			box-shadow: none;
		}

		&::before {
			opacity: .5;
		}

		&::after {
			box-shadow: none;
		}
	}
}
</style>