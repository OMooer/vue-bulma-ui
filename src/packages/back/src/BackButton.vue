<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { useBack } from './navigationBack';

const emit = defineEmits();
const props = defineProps({
	router   : {
		type    : null,
		required: true
	},
	text     : String,
	indexName: {
		type   : String,
		default: 'home'
	},
	loginName: {
		type   : String,
		default: 'login'
	}
});
const {$vbt} = useUILocale();
const back = useBack(emit, props.router, {home: props.indexName, login: props.loginName});
</script>

<template>
	<button type="button" class="button" @click="back">
		<slot>{{ text || $vbt('back.text') }}</slot>
	</button>
</template>