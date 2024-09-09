<script setup lang="ts">
import { computed, inject } from 'vue';

defineOptions({
	inheritAttrs: false
});
const isParentSmall = inject('isSmall', false);
const props = defineProps({
	isSmall: Boolean
});
const switchValue = defineModel();
const isReallySmall = computed(() => isParentSmall || props.isSmall);
</script>

<template>
	<label class="vb-switch" :class="{'is-on': switchValue, 'is-small': isReallySmall, 'is-custom': $slots.icon}">
		<slot name="icon" class="is-custom-icon"></slot>
		<span class="text"><slot>&nbsp;</slot></span>
		<input type="checkbox" v-model="switchValue"/>
	</label>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

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
	}

	&::before {
		background: hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-ter-l) + 0%));
		width: 100%;
		height: 100%;
		transition: background-color .3s ease;
	}

	&::after {
		right: 0;
		background: $white;
		box-shadow: $shadow;
		border-radius: 50%;
		width: 2.4em;
		height: 2.4em;
		z-index: 5;
		transition: left .3s ease;
	}

	&:hover {
		border-color: hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-border-l) + var(--bulma-hover-border-l-delta)));
	}

	&:focus-within {
		border-color: $blue;
		box-shadow: 0 0 0 0.125em rgba($link, .25);
	}

	&.is-on {
		border-color: $success;

		&::before {
			background-color: $green;
		}

		&::after {
			left: calc(100% - 2.4em);
			right: 0;
		}

		&:focus-within {
			border-color: $success;
			box-shadow: 0 0 0 0.125em rgba($success, .25);
		}

		input {
			order: 3;
		}

		.text {
			color: $white;
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
			box-shadow: $shadow;
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
}
</style>