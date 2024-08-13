<script setup lang="ts">
import {computed, ref} from 'vue';

defineOptions({
	inheritAttrs: false
});
const emit = defineEmits(['update:modelValue', 'change', 'tab']);
const props = defineProps(['modelValue', 'text', 'placeholder']);
const isEditable = ref(false);
const innerValue = computed({
	get() {
		return props.modelValue;
	},
	set(v) {
		emit('update:modelValue', v);
	}
});
const innerText = computed(() => {
	return props.text || props.modelValue || props.placeholder;
});
const isEmptyValue = computed(() => {
	return !props.modelValue && !props.text;
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
	emit('change', (e.target as HTMLInputElement).value);
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
		<input ref="entityInput" v-bind="$attrs" tabindex="-1" @keydown="dispatchTab" v-model="innerValue" @blur="changeValueShow">
		<div class="shadow-input" :class="{'is-empty': isEmptyValue}" @click="activeInput" v-if="!isEditable">
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
	padding: calc(.5em - 1px) 0;
	border-radius: 4px;
	height: 100%;
	
	.field.has-addons .control:not(:last-child) & {
		margin-right: 1px;
	}
	
	&:focus-within {
		outline: solid 1px $link;
		background-color: transparent !important;
		box-shadow: 0 0 0 0.125em rgba($link, .25);
	}
	
	&:hover {
		background-color: $white-ter;
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
		font-size: 1.25rem;
		font-weight: bold;
	}
	
	input {
		background-color: transparent;
		min-width: 0;
		width: 100%;
		
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
		color: $black;
		z-index: 1;
		
		&.is-empty {
			color: $grey-lighter;
		}
	}
}
</style>
