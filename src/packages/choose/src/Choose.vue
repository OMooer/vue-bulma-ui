<script setup lang="ts">
import { computed, watch } from 'vue';

declare type CheckBox = {
	type: 'checkbox';
	only?: boolean;
}
declare type Radio = {
	type: 'radio';
}
declare type Prop = (CheckBox | Radio) & {
	name?: string;
	required?: boolean;
	disabled?: boolean;
	list: TVO.List;
}
const props = withDefaults(defineProps<Prop>(), {name: Math.random().toString(36).slice(2)});
const modelValue = defineModel({default: () => []});
const className = computed(() => props.type === 'radio' ? 'radios' : 'checkboxes');
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
</script>

<template>
	<div class="vb-choose" :class="className">
		<label :class="type" :key="item.value" v-for="item in list">
			<input :name :type :required="innerRequired(item)" :disabled :value="item.value" v-model="innerValue">
			{{ item.title }}
		</label>
	</div>
</template>