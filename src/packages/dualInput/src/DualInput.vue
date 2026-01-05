<script setup lang="ts">
import { computed, ref } from 'vue';

defineOptions({
	inheritAttrs: false
});
const props = defineProps<{
	formatter?: (value: string) => string;
	placeholder?: string;
	disguise?: boolean;
}>();
const modelValue = defineModel({default: ''});
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
	}, 100);
}

function changeValueShow(e: Event) {
	isEditable.value = false;
}

defineExpose({
	activeInput
});
</script>

<template>
	<div class="dual-input" :class="{'is-readable': !isEditable, 'is-disguise': disguise}">
		<input
				ref="entityInput" class="input" v-bind="$attrs" :placeholder v-model="modelValue"
				@focus="activeInput" @blur="changeValueShow">
		<div
				class="shadow-input control" :class="[{'is-empty': isEmptyValue}, $attrs.class]" :style="$attrs.style as any"
				@click="activeInput" v-if="!isEditable">
			{{ innerText }}
		</div>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.dual-input {
	display: flex;
	align-items: center;
	border-radius: var(--bulma-radius);

	.field.has-addons .control:not(:first-child) & {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.field.has-addons .control:not(:last-child) & {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	&:not(.is-disguise) {
		&:hover {
			@include va.file-bg-color();
			cursor: text;
		}
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
	}

	input {
		min-width: 0;
		width: 100%;

		&::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
			appearance: none;
		}
	}

	.shadow-input {
		overflow: hidden;
		padding: var(--bulma-control-padding-vertical) var(--bulma-control-padding-horizontal);
		border: 1px solid transparent;
		white-space: nowrap;
		z-index: 1;

		&.is-empty {
			color: var(--bulma-input-placeholder-color);
			font-weight: normal;
		}
	}

	&.is-disguise {
		.shadow-input {
			border-radius: var(--bulma-input-radius);
			border-color: var(--bulma-input-border-color);
			color: hsl(var(--bulma-input-h), var(--bulma-input-s), var(--bulma-input-color-l));
			box-shadow: inset 0 0.0625em 0.125em hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-scheme-invert-l), 0.05);
			transition-duration: var(--bulma-duration);
			transition-property: background-color, border-color, box-shadow, color;

			&:hover {
				--bulma-input-border-l-delta: var(--bulma-input-hover-border-l-delta);
			}

			&.is-empty {
				color: var(--bulma-input-placeholder-color);
			}

			.field.has-addons .control:not(:first-child) & {
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}

			.field.has-addons .control:not(:last-child) & {
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}
		}
	}
}
</style>
