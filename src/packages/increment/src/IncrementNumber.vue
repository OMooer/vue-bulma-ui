<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { useTimer } from '@/actions/timer';
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
const {$vbt} = useUILocale();
const {timeout, interval, clear} = useTimer();
let timerId: ReturnType<typeof setTimeout>;
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
		e.preventDefault();
		addNumber();
	}
	else if (e.code === 'ArrowDown') {
		e.preventDefault();
		minusNumber();
	}
}

function autoMinus() {
	timerId = timeout(() => {
		longPress = true;
		timerId = interval(() => {
			minusNumber();
		}, 100);
	}, 200);
}

function autoAdd() {
	timerId = timeout(() => {
		longPress = true;
		timerId = interval(() => {
			addNumber();
		}, 100);
	}, 200);
}

function removeAuto() {
	clear(timerId);
}
</script>

<template>
	<div class="vb-increment field has-addons" @keydown.capture="keyAuto">
		<div class="control">
			<button
					type="button" class="button" v-bind:class="$attrs.class as string" :disabled="disabled || isMinimum"
					:aria-label="$vbt('increment.minus')"
					@click="minusNumber" @touchstart="autoMinus" @touchend="removeAuto"
					@mousedown="autoMinus" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon" aria-hidden="true"><FasIcon icon="minus"/></span>
			</button>
		</div>
		<div class="control">
			<input
					type="number"
					class="input"
					v-bind:class="$attrs.class as string"
					readonly
					:disabled
					:step="step"
					v-model.number="modelValue">
		</div>
		<div class="control">
			<button
					type="button" class="button" v-bind:class="$attrs.class as string" :disabled="disabled || isMaximum"
					:aria-label="$vbt('increment.plus')"
					@click="addNumber" @touchstart="autoAdd" @touchend="removeAuto"
					@mousedown="autoAdd" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon" aria-hidden="true"><FasIcon icon="plus"/></span>
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