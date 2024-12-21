<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue';
import DataView from './DataView.vue';
import { ERROR_DATA_ITEM_OUTSIDE } from '@/utils';

defineOptions({inheritAttrs: false});
const {label, vertical, fullWidth, bordered, colspan, rowspan, start} = defineProps<{
	label: string;
	vertical?: boolean;
	fullWidth?: boolean;
	bordered?: boolean;
	colspan?: number | string;
	rowspan?: number | string;
	start?: number | string;
}>();
const currentThis = getCurrentInstance();
const isOverused = ref(false);
const classList = computed(() => {
	const cols = Number(colspan);
	const rows = Number(rowspan);
	const startAt = Number(start);
	return [
		vertical ? 'is-vertical' : null,
		fullWidth ? 'is-full' : null,
		bordered ? 'is-bordered' : null,
		cols ? `is-col-span-${ cols }` : null,
		rows ? `is-row-span-${ rows }` : null,
		startAt ? `is-col-start-${ startAt === -1 ? 'end' : startAt }` : null,
	]
});
if (currentThis?.parent?.type !== DataView) {
	console.error(ERROR_DATA_ITEM_OUTSIDE);
	isOverused.value = true;
}
</script>
<template>
	<template v-if="isOverused">
		<slot/>
	</template>
	<div class="data-item" :class="classList" v-else>
		<div class="data-label">{{ label }}</div>
		<div class="data-text content">
			<slot/>
		</div>
	</div>
</template>