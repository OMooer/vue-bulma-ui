<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, ref } from 'vue';
import Modal from '../../modal';

const emit = defineEmits(['done', 'close']);
const props = withDefaults(defineProps<{
	show?: boolean;
	type?: 'alert' | 'confirm';
	title?: string;
	content?: string;
	doneText?: string;
	cancelText?: string;
	primaryColor?: string;
}>(), {show: true, type: 'alert'});
const {$vbt} = useUILocale();
const opened = ref(false);
const openDialog = computed(() => {
	return props.show && opened.value;
});
const modalRef = ref();

function openNow(ev: Event) {
	if (ev.target === ev.currentTarget) {
		return;
	}
	if (!props.show) {
		doneHandler();
		return;
	}
	opened.value = true;
}

function doneHandler() {
	opened.value = false;
	emit('done');
}

function chooseHandler(o: boolean) {
	o && doneHandler();
	emit('close', o);
	modalRef.value.dismiss();
}
</script>

<template>
	<figure class="vb-dialog-popup" v-bind="$attrs" @click.capture="openNow">
		<slot/>
	</figure>
	<Modal ref="modalRef" :hasClose="false" @close="opened=false" style="width: auto;min-width: 20rem;" v-if="openDialog">
		<h2 class="title is-6 has-text-centered mb-3" v-if="title">{{ title }}</h2>
		<slot name="content">
			<p class="has-text-centered is-size-6">{{ content }}</p>
		</slot>
		<template #footer>
			<footer class="card-footer">
				<a
						class="card-footer-item has-text-weight-bold" :class="[primaryColor]"
						@click="chooseHandler(true)">{{ doneText || $vbt('dialog.doneText') }}</a>
				<a
						class="card-footer-item" @click="chooseHandler(false)"
						v-if="type === 'confirm'">{{ cancelText || $vbt('dialog.cancelText') }}</a>
			</footer>
		</template>
	</Modal>
</template>