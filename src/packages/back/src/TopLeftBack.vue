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
	<div class="vb-back">
		<a class="back-link is-link" @click="back">
			<FasIcon icon="chevron-left"/>
			<slot name="back">{{ text || $vbt('back.text') }}</slot>
		</a>
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.vb-back {
	display: inline-flex;
	align-items: center;

	.back-link:not(:only-child) {
		margin-right: 1rem;
	}
}
</style>
