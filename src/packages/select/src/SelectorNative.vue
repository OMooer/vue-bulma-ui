<script setup lang="ts">
import { computed, inject, ref, watchEffect } from 'vue';

defineOptions({
	inheritAttrs: false
});
const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	modelValue?: any;
	list: TVO.List;
	placeholder?: string;
	required?: boolean;
	isSmall?: boolean;
}>(), {
	modelValue : '',
	placeholder: '请选择'
});
const emit = defineEmits(['update:modelValue', 'error']);
const isError = ref(false);
const entity = ref();
const isNotNull = computed(() => props.required);
const selectedValue = ref('');

watchEffect(() => {
	selectedValue.value = props.modelValue ?? '';
});

function update(e: Event) {
	if (checkInput(e)) {
		setError(false);
		emit('update:modelValue', selectedValue.value);
	}
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
	return el.checkValidity();
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
	<div class="select is-fullwidth" :class="{'is-small': isSmall || isParentSmall, 'is-shake is-danger': isError}">
		<select ref="entity" v-bind="$attrs" :required @change="update" v-model="selectedValue">
			<option value="" :disabled="isNotNull">{{ placeholder }}</option>
			<option :value="item.value" :disabled="item.disabled" :key="item.value as string" v-for="item in list">
				{{ item.title }}
			</option>
		</select>
	</div>
</template>
