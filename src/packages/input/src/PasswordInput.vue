<script setup lang="ts">
import { computed, inject, ref } from 'vue';

defineOptions({
	inheritAttrs: false
});
const isParentSmall = inject('isSmall', false);
const props = defineProps<{
	modelValue?: any;
	type?: 'password' | 'text';
	readonly?: boolean;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	pattern?: string;
	minlength?: string | number;
	maxlength?: string | number;
}>();
const emit = defineEmits(['update:modelValue', 'showPlain', 'error']);
const showPassword = ref(false);
const isError = ref(false);
const entity = ref();
const bindProps = computed(() => {
	const {modelValue, type, ...binds} = props;
	return binds;
});
const inner = ref('');
const innerValue = computed({
	get() {
		return typeof props.modelValue === 'undefined' ? inner.value : props.modelValue;
	},
	set(value: any) {
		inner.value = value;
		update(value);
	}
});

function update(val: any) {
	setError(false);
	emit('update:modelValue', val);
}

function checkInput(e: Event) {
	const el = e.target as HTMLInputElement;
	if (!el.checkValidity()) {
		let errorMessage = el.validationMessage;
		if (el.validity.patternMismatch) {
			errorMessage = el.getAttribute('data-error-pattern') || errorMessage;
		}
		setError(true, errorMessage);
	}
}

function toggleShow() {
	showPassword.value = !showPassword.value;
	emit('showPlain', showPassword.value);
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div class="vb-password control is-expanded has-icons-right">
		<input
				ref="entity" :type="showPassword ? 'text' : 'password'" autocomplete="off"
				:class="['input', isError ? 'is-shake is-danger' : null, isParentSmall ? 'is-small' : null]"
				v-bind="bindProps" v-model="innerValue" @change="checkInput">
		<span :class="['icon', 'is-small', 'is-right', {'show': showPassword}]" @click="toggleShow">
			<FasIcon :icon="['fas', showPassword ? 'eye' : 'eye-slash']"/>
		</span>
	</div>
</template>

<style scoped lang="scss">
.vb-password {
	&.control {
		.icon {
			pointer-events: auto;
			cursor: pointer;

			&:hover {
				color: var(--bulma-input-icon-hover-color);
			}

			[data-theme=dark] & {
				--bulma-input-icon-color: hsla(221deg, 14%, 89%, .5);
			}

			&.show {
				color: var(--bulma-text-strong);
			}

		}

		[disabled] + .icon {
			pointer-events: none;
			color: var(--bulma-input-icon-color) !important;
		}
	}
}
</style>
