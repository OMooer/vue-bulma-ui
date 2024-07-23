<script setup lang="ts">
import { useBack } from './navigationBack';

const emit = defineEmits();
const props = defineProps({
	router: {
		type    : null,
		required: true
	}
});
const back = useBack(emit, props.router);
</script>

<template>
	<button type="button" class="button" @click="back">
		<slot>返回</slot>
	</button>
</template>

<style scoped lang="scss">

</style>