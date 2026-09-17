<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, ref, watchEffect } from 'vue';

const emit = defineEmits(['sort']);
const props = defineProps({
	state: {
		type   : String,
		default: 'none'
	}
});
const {$vbt} = useUILocale();
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
const sortLabel = computed(() => {
	const state = $vbt(orderBy.value === 'none' ? 'sort.none' : orderBy.value === 'asc' ? 'sort.asc' : 'sort.desc');
	return `${ $vbt('sort.label') } (${ state })`;
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
	<button
			type="button"
			class="sort-btn"
			:class="{'is-active': orderBy !== 'none'}"
			:aria-label="sortLabel"
			@click="changeSort">
		<FasIcon :icon="sortClass" aria-hidden="true"></FasIcon>
	</button>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.sort-btn {
	margin: 0 .2em;
	cursor: pointer;

	&:hover, &.is-active {
		color: va.$blue;
	}
}
</style>
