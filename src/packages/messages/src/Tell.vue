<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import Notify from './Notify.vue';
import Popup from './Popup.vue';
import Toast from './Toast.vue';

const emit = defineEmits(['remove']);
const props = defineProps({
	data: {
		type   : Array,
		default: () => []
	},
	max : Number
});
const toastRef = ref();
const notifyRef = ref();
const popupRef = ref();
const refs = {
	toast : toastRef,
	notify: notifyRef,
	popup : popupRef
};
const toastList = ref<OP.MsgObj[]>([]);
const notifyList = ref<OP.MsgObj[]>([]);
const popupList = ref<OP.MsgObj[]>([]);

watchEffect(() => {
	toastList.value = props.data.filter((item: any) => item.type === 'toast').map((item: any) => {
		return item.package;
	});
	notifyList.value = props.data.filter((item: any) => item.type === 'notify').map((item: any) => {
		return item.package;
	});
	popupList.value = props.data.filter((item: any) => item.type === 'popup').map((item: any) => {
		return item.package;
	});
});

function tell(type: 'toast' | 'notify' | 'popup', data: OP.MsgObj) {
	const thisRef = refs[type as keyof typeof refs]?.value;
	thisRef && thisRef?.add(data);
}

function revoke(type: 'toast' | 'notify' | 'popup', id: symbol) {
	const thisRef = refs[type as keyof typeof refs]?.value;
	thisRef && thisRef?.remove(id);
}

function remove(...args: any[]) {
	emit('remove', ...args);
}

defineExpose({
	tell,
	revoke
});
</script>

<template>
	<Toast ref="toastRef" position="bottom" :max :list="toastList" @remove="remove"/>
	<Notify ref="notifyRef" :max :list="notifyList" @remove="remove"/>
	<Popup ref="popupRef" :list="popupList" @remove="remove"/>
</template>