<script setup lang="ts">
import { EMPTY_IMG } from '@/utils';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
	src: string;
	name?: string;
	size?: 'sm' | 'xl' | '2xl';
	r?: string | number;
}>();
const normal = ref(EMPTY_IMG);
const loadedFailed = ref(false);
const url = computed(() => {
	return loadedFailed.value ? normal.value : (props.src || normal.value);
});
const radius = computed(() => {
	if (typeof props.r === 'undefined') {
		return props.r;
	}
	if (typeof props.r === 'number') {
		return props.r + 'px';
	}
	return isNaN(Number(props.r)) ? props.r : props.r + 'px';
});

watch(() => props.src, () => {
	loadedFailed.value = false;
});

function noImage() {
	loadedFailed.value = true;
}
</script>

<template>
	<img
			class="avatar"
			:class="{'sm':size==='sm','xl':size==='xl','xxl':size==='2xl'}"
			:alt="name ?? 'Avatar'" :src="url"
			:style="typeof r !== 'undefined' ? `border-radius: ${radius};` : undefined"
			@error="noImage">
</template>

<style scoped lang="scss">
.avatar {
	display: inline-block;
	background-color: #777;
	border-radius: 50%;
	font-size: .75rem;
	width: 2em;
	height: 2em;

	&.sm {
		font-size: 0.5rem;
	}

	&.xl {
		font-size: 1.25rem;
	}

	&.xxl {
		font-size: 2rem;
	}
}
</style>