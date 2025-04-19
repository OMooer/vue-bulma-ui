<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
	inheritAttrs: false
});
const props = defineProps({
	disabled: Boolean,
	required: Boolean,
	min     : Number,
	max     : Number,
	step    : {
		type   : Number,
		default: 1
	}
});
let timer: any;
let longPress = false;
const modelValue = defineModel({default: 0});
const isMinimum = computed(() => {
	let prop = props.min ?? false;
	prop = typeof prop !== 'boolean' ? true : prop;
	return prop && modelValue.value <= (props.min ?? 0);
});
const isMaximum = computed(() => {
	let prop = props.max ?? false;
	prop = typeof prop !== 'boolean' ? true : prop;
	return prop && modelValue.value >= (props.max ?? 0);
});

function minusNumber() {
	if (longPress) {
		longPress = false;
		return;
	}
	if (isMinimum.value) {
		return;
	}
	modelValue.value -= props.step;
}

function addNumber() {
	if (longPress) {
		longPress = false;
		return;
	}
	if (isMaximum.value) {
		return;
	}
	modelValue.value += props.step;
}

function keyAuto(e: KeyboardEvent) {
	if (e.code === 'ArrowUp') {
		addNumber();
	}
	else if (e.code === 'ArrowDown') {
		minusNumber();
	}
}

function autoMinus() {
	timer = setTimeout(() => {
		longPress = true;
		timer = setInterval(() => {
			minusNumber();
		}, 100);
	}, 200);
}

function autoAdd() {
	timer = setTimeout(() => {
		longPress = true;
		timer = setInterval(() => {
			addNumber();
		}, 100);
	}, 200);
}

function removeAuto() {
	clearInterval(timer);
	clearTimeout(timer);
}
</script>

<template>
	<div class="vb-increment field has-addons" @keydown.capture.prevent="keyAuto">
		<div class="control">
			<button
					type="button" class="button" v-bind:class="$attrs.class" :disabled="disabled || isMinimum"
					@click="minusNumber" @touchstart="autoMinus" @touchend="removeAuto"
					@mousedown="autoMinus" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon"><FasIcon icon="minus"/></span>
			</button>
		</div>
		<div class="control">
			<input
					type="number" class="input" v-bind:class="$attrs.class" readonly :disabled :step v-model.number="modelValue">
		</div>
		<div class="control">
			<button
					type="button" class="button" v-bind:class="$attrs.class" :disabled="disabled || isMaximum"
					@click="addNumber" @touchstart="autoAdd" @touchend="removeAuto"
					@mousedown="autoAdd" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon"><FasIcon icon="plus"/></span>
			</button>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-increment {
	input {
		-moz-appearance: textfield;
		text-align: center;
		width: 5em;

		&::-webkit-clear-button,
		&::-webkit-inner-spin-button,
		&::-webkit-outer-spin-button,
		&::-webkit-calendar-picker-indicator {
			appearance: none;
			display: none;
		}
	}

	input, button {
		transition: none;
	}

	&.has-addons {
		--bulma-block-spacing: 0;
		display: inline-flex;

		input {
			z-index: 5 !important;
		}
	}

	&:focus-within {
		.control {
			--increment-box-shadow-color: hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
			--increment-border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));

			.button {
				--bulma-button-border-width: 1px;
				border-color: var(--increment-border-color);
				box-shadow: var(--bulma-input-focus-shadow-size) var(--increment-box-shadow-color);
			}

			.input {
				border-color: var(--increment-border-color);
				box-shadow: 0 -0.4375em 0 -0.25em var(--increment-box-shadow-color), 0 0.4375em 0 -0.25em var(--increment-box-shadow-color);
			}
		}
	}

	&:has(.is-danger) {
		--bulma-focus-h: var(--bulma-danger-h);
		--bulma-focus-s: var(--bulma-danger-s);
		--bulma-focus-l: var(--bulma-danger-l);
	}
}
</style>