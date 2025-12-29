<script setup lang="ts">
import { ref, TextareaHTMLAttributes, useTemplateRef } from 'vue';

type TextareaProps = { fixed?: boolean; } & /* @vue-ignore */Omit<TextareaHTMLAttributes, 'onError'>;
const {fixed = true} = defineProps<TextareaProps>();
const emit = defineEmits(['error']);
const modelValue = defineModel({default: ''});
const isError = ref(false);
const entity = useTemplateRef('textRef');

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value?.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<textarea
			ref="textRef" class="textarea"
			:class="[fixed ? 'has-fixed-size' : '', isError ? 'is-shake is-danger' : null]"
			@invalid="setError(true, ($event as any).target?.validationMessage)"
			@input="setError(false)"
			v-model="modelValue"></textarea>
</template>