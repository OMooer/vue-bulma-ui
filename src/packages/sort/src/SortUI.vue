<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

const emit = defineEmits(['sort']);
const props = defineProps({
	state: {
		type   : String,
		default: 'none'
	}
});
const orderBy = ref('none');
const sorts = ref(['none', 'desc', 'asc']);
const sortClass = computed(() => {
	const icons = {
		'fas'      : true,
		'sort'     : orderBy.value === 'none',
		'sort-desc': orderBy.value === 'desc',
		'sort-asc' : orderBy.value === 'asc'
	} as any;
	return Object.keys(icons).filter((item: string) => icons[item]);
});
watchEffect(() => {
	orderBy.value = sorts.value.includes(props.state) ? props.state : 'none';
});

function changeSort() {
	let newSort = sorts.value.indexOf(orderBy.value) + 1;
	if (newSort >= sorts.value.length) {
		newSort = 0;
	}
	orderBy.value = sorts.value[newSort];
	emit('sort', orderBy.value);
}
</script>

<template>
	<a class="sort-btn" @click.prevent="changeSort">
		<FasIcon :icon="sortClass"></FasIcon>
	</a>
</template>

<style scoped lang="scss">
.sort-btn {
	margin: 0 .2em;
	cursor: pointer;

	&:hover {
		color: $blue;
	}
}
</style>
