<script setup lang="ts">
import { useBack } from './navigationBack';

const emit = defineEmits();
const props = defineProps({
	router   : {
		type    : null,
		required: true
	},
	indexName: {
		type   : String,
		default: 'home'
	},
	loginName: {
		type   : String,
		default: 'login'
	}
});
const back = useBack(emit, props.router, {home: props.indexName, login: props.loginName});
</script>

<template>
	<button type="button" class="button" @click="back">
		<slot>返回</slot>
	</button>
</template>