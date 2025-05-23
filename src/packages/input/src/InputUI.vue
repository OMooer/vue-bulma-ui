<script setup lang="ts">
import { inject, ref, InputHTMLAttributes, watch } from 'vue';

type InputProps = /* @vue-ignore */Omit<InputHTMLAttributes, 'onError'> & {};
defineProps<InputProps>();
const isParentSmall = inject('isSmall', ref(false));
const innerValue = defineModel({default: ''});
const emit = defineEmits(['error']);
const isError = ref(false);
const entity = ref();

watch(innerValue, () => {
	setError(false);
});

function checkInput(e: Event) {
	// 因为设置了 value.trim 导致触发了 HTML 自身验证的一个特性（由脚本更改的 value 不会触发 minlength 验证）
	// 所以如果输入框正好有限制最小长度需求建议改为 pattern 属性的方式限制，否则在此检测无法生效
	const el = e.target as HTMLInputElement;
	if (!el.checkValidity()) {
		let errorMessage = el.validationMessage;
		if (el.validity.patternMismatch) {
			errorMessage = el.getAttribute('data-error-pattern') || errorMessage;
		}
		setError(true, errorMessage);
	}
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
	<input
			ref="entity" type="text" autocomplete="off"
			v-model="innerValue" @change="checkInput"
			:class="['input', isError ? 'is-shake is-danger' : null, isParentSmall ? 'is-small' : null]"
	>
</template>

<style lang="scss" scoped>
.input[type="number"] {
	-moz-appearance: textfield;

	&::-webkit-inner-spin-button,
	&::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
}
</style>