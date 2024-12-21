<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';

const isParentSmall = inject('isSmall', false);
const emit = defineEmits(['error']);
const props = withDefaults(defineProps<{
	type: 'checkbox' | 'radio';
	only?: boolean;
	name?: string;
	required?: boolean;
	disabled?: boolean;
	list: TVO.List;
}>(), {name: Math.random().toString(36).slice(2)});
const modelValue = defineModel({default: () => []});
const isError = ref(false);
const className = computed(() => {
	return [
		props.type === 'radio' ? 'radios' : 'checkboxes',
		isParentSmall ? 'is-small' : '',
		isError.value ? 'is-danger is-shake' : ''
	]
});
const innerValue = computed({
	get() {
		return modelValue.value;
	},
	set(val) {
		if ('only' in props && props.only) {
			modelValue.value = val.slice(-1);
		}
		else {
			modelValue.value = val;
		}
	}
});

watch(() => (props as any).only, () => {
	if (props.type === 'checkbox') {
		innerValue.value = [...innerValue.value];
	}
});

function innerRequired(item: any) {
	if (props.type === 'radio') {
		return props.required;
	}
	if (props.required) {
		if (!modelValue.value.length) {
			return true;
		}
		else {
			return (modelValue.value as any).includes(item.value);
		}
	}
	return false;
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div class="vb-choose" :class="className">
		<label :class="type" :key="item.value.toString()" v-for="item in list">
			<input :name :type :required="innerRequired(item)" :disabled :value="item.value" v-model="innerValue">
			{{ item.title }}
		</label>
	</div>
</template>

<style scoped lang="scss">
.vb-choose {
	&.is-small {
		label {
			display: inline-flex;
			font-size: 0.75rem;

			input {
				margin-right: 0.25rem;
			}
		}
	}

	&:has([disabled]) {
		label {
			cursor: not-allowed;
		}
	}
}
</style>