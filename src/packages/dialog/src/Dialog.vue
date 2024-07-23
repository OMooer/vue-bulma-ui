<script setup lang="ts">
import { computed, ref } from 'vue';
import Modal from '../../modal';

const emit = defineEmits(['done', 'close']);
const props = defineProps({
	show      : {
		type   : Boolean,
		default: true
	},
	type      : {
		type   : String,
		default: 'alert'
	},
	title     : String,
	content   : String,
	doneText  : {
		type   : String,
		default: '确定'
	},
	cancelText: {
		type   : String,
		default: '取消'
	}
});
const opened = ref(false);
const openDialog = computed(() => {
	return props.show && opened.value;
});
const modalRef = ref();

function openNow(ev: Event) {
	if (ev.target === ev.currentTarget) {
		return;
	}
	opened.value = true;
}

function chooseHandler(o: boolean) {
	o && emit('done');
	emit('close', o);
	modalRef.value.dismiss();
}
</script>

<template>
	<figure class="vb-dialog-popup" v-bind="$attrs" @click.capture="openNow">
		<slot/>
	</figure>
	<Modal ref="modalRef" hasClose="false" @close="opened=false" style="width: auto;min-width: 20rem;" v-if="openDialog">
		<h2 class="title is-6 has-text-centered mb-3" v-if="title">{{ title }}</h2>
		<slot name="content">
			<p class="has-text-centered is-size-6">{{ content }}</p>
		</slot>
		<template #footer>
			<footer class="card-footer">
				<a class="card-footer-item has-text-weight-bold" @click="chooseHandler(true)">{{ doneText }}</a>
				<a class="card-footer-item" @click="chooseHandler(false)" v-if="type === 'confirm'">{{ cancelText }}</a>
			</footer>
		</template>
	</Modal>
</template>