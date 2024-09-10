<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
	inheritAttrs: false
});
const props = defineProps({
	min : Number,
	max : Number,
	step: {
		type   : Number,
		default: 1
	}
});
let timer: any;
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
	if (isMinimum.value) {
		return;
	}
	modelValue.value -= props.step;
}

function addNumber() {
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
	timer = setInterval(() => {
		minusNumber();
	}, 100);
}

function autoAdd() {
	timer = setInterval(() => {
		addNumber();
	}, 100);
}

function removeAuto() {
	clearInterval(timer);
}
</script>

<template>
	<div class="vb-increment-num field has-addons">
		<div class="control">
			<button
					type="button" class="button is-rounded" v-bind:class="$attrs.class" :disabled="isMinimum"
					@click="minusNumber" @mousedown="autoMinus" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon"><FasIcon icon="minus"/></span>
			</button>
		</div>
		<div class="control">
			<input
					type="number" readonly class="input" v-bind:class="$attrs.class" :step @keydown.prevent="keyAuto"
					v-model.number="modelValue">
		</div>
		<div class="control">
			<button
					type="button" class="button is-rounded" v-bind:class="$attrs.class" :disabled="isMaximum"
					@click="addNumber" @mousedown="autoAdd" @mouseup="removeAuto" @mouseleave="removeAuto">
				<span class="icon"><FasIcon icon="plus"/></span>
			</button>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-increment-num {
	input {
		text-align: center;
		width: 5em;

		&::-webkit-clear-button,
		&::-webkit-inner-spin-button,
		&::-webkit-calendar-picker-indicator {
			display: none;
		}
	}
}
</style>