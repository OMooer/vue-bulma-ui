<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({
	inheritAttrs: false
});
const emit = defineEmits(['tab']);
const props = defineProps(['formatter', 'placeholder']);
const modelValue = defineModel();
const isEditable = ref(false);
const innerText = computed(() => {
	const placeholder = props.placeholder ?? '';
	const formatter = props.formatter ?? ((v: any) => v);
	return modelValue.value ? formatter(modelValue.value) : placeholder;
});
const isEmptyValue = computed(() => {
	return !modelValue.value;
});
const entityInput = ref();

function activeInput() {
	isEditable.value = true;
	setTimeout(() => {
		entityInput.value.focus();
		entityInput.value.select();
	}, 100);
}

function changeValueShow(e: Event) {
	isEditable.value = false;
}

function dispatchTab(e: any) {
	if (e.keyCode === 9) {
		emit('tab', e.shiftKey);
	}
}

defineExpose({
	activeInput
});
</script>

<template>
	<div class="dual-input" :class="{'is-readable': !isEditable}">
		<input
				ref="entityInput" v-bind="$attrs" tabindex="-1" :placeholder @keydown="dispatchTab" v-model="modelValue"
				@blur="changeValueShow">
		<div
				class="shadow-input" :class="[{'is-empty': isEmptyValue}, $attrs.class]" :style="$attrs.style as any"
				@click="activeInput" v-if="!isEditable">
			{{ innerText }}
		</div>
	</div>
</template>

<style lang="scss">
@import "../../../scss/variables";

.dual-input {
	display: flex;
	align-items: center;
	position: relative;
	overflow: hidden;
	padding: calc(.5em - 1px) .5em;
	border-radius: 4px;
	height: 100%;

	.field.has-addons .control:not(:last-child) & {
		margin-right: 1px;
	}

	&:focus-within {
		outline: solid 1px $link;
		background-color: transparent !important;
		box-shadow: 0 0 0 0.25em rgba($link, .25);
	}

	&:hover {
		@include file-bg-color();
		cursor: text;
	}

	&.is-readable {
		input {
			position: absolute;
			opacity: 0;
			z-index: 0;
		}
	}

	input, .shadow-input {
		flex-grow: 1;
		padding: 0;
		border: 0;
		line-height: 1.5;
		font-size: 1rem;
	}

	input {
		background-color: transparent;
		color: hsl(var(--bulma-input-h), var(--bulma-input-s), var(--bulma-input-color-l));
		min-width: 0;
		width: 100%;

		&::placeholder {
			font-weight: normal;
		}

		&::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
			appearance: none;
		}

		&:focus {
			border: 0;
			box-shadow: none;
			outline: none;
		}
	}

	.shadow-input {
		z-index: 1;

		&.is-empty {
			color: $grey-lighter !important;
			font-weight: normal !important;
		}
	}
}
</style>
