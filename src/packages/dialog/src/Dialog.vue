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
const isDoneState = ref(false);

function openNow(ev: Event) {
	if (ev.target === ev.currentTarget) {
		return;
	}
	if (!props.show) {
		opened.value = false;
		doneHandler();
		return;
	}
	isDoneState.value = props.type !== 'confirm';
	opened.value = true;
}

function doneHandler() {
	emit('done');
}

function chooseHandler(o: boolean) {
	isDoneState.value = o;
	modalRef.value.dismiss(); // --> closeHandler()
}

function closeHandler() {
	if (isDoneState.value) {
		doneHandler();
	}
	opened.value = false;
	emit('close', isDoneState.value);
}
</script>

<template>
	<figure class="vb-dialog-popup" v-bind="$attrs" @click.capture="openNow">
		<slot/>
	</figure>
	<Modal
			ref="modalRef"
			escClose
			:hasClose="false"
			@close="closeHandler"
			style="width: auto;min-width: 20rem;"
			v-if="openDialog">
		<h2 class="title is-6 has-text-centered mb-3" v-if="title">{{ title }}</h2>
		<slot name="content">
			<p class="has-text-centered is-size-6">{{ content }}</p>
		</slot>
		<template #footer>
			<footer class="card-footer">
				<button
						type="button"
						class="card-footer-item has-text-link has-text-weight-bold"
						:style="primaryColor ? `color: ${primaryColor} !important;` : undefined"
						@click="chooseHandler(true)">{{ doneText || $vbt('dialog.doneText') }}
				</button>
				<button
						type="button"
						class="card-footer-item has-text-link" @click="chooseHandler(false)"
						v-if="type === 'confirm'">{{ cancelText || $vbt('dialog.cancelText') }}
				</button>
			</footer>
		</template>
	</Modal>
</template>