<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTellMe } from '@/actions/inform';
import { useUILocale } from '@/actions/locale';

const emit = defineEmits(['remove', 'hover']);
const props = defineProps({
	animate: {
		type   : String,
		default: 'animate-slide-up'
	},
	list   : {
		type   : Array,
		default: []
	}
});
const {$vbt} = useUILocale();
const {add, remove, list} = useTellMe();
const timerMap: { [propName: symbol]: number } = {};
const never = ref(false);
const show = ref(true);
const currentPopup = computed(() => {
	return list.value[0];
});
const showPopup = computed({
	get() {
		return currentPopup.value && show.value;
	},
	set(v: boolean) {
		show.value = v;
	}
});

watch(props.list, (popupList) => {
	if (popupList.length) {
		(popupList as OP.MsgObj[]).forEach((item: OP.MsgObj) => {
			addPopup(item);
		});
	}
});

watch(() => currentPopup.value, (popup) => {
	if (popup) {
		autoClose(popup);
	}
});

function autoClose(popup: OP.MsgObj) {
	if (popup.autoClose) {
		timerMap[popup.id] = window.setTimeout(() => {
			closePopup();
		}, popup.autoClose);
	}
}

function hoverPopup(id: symbol) {
	clearTimeout(timerMap[id]);
	emit('hover', id);
}

function closePopup() {
	showPopup.value = false;
}

function addPopup(popup: OP.MsgObj) {
	add(Object.assign({autoClose: 20000}, popup, {showClose: true})).catch(() => {});
}

function removePopup(id: symbol) {
	remove(id).then(() => {
		emit('remove', id, never.value);
		never.value = false;
	});
	show.value = true;
}

defineExpose({
	add   : addPopup,
	remove: removePopup,
});
</script>

<template>
	<Transition :name="animate" @afterLeave="removePopup(currentPopup.id)">
		<div
				class="vb-popup box"
				@mouseover="hoverPopup(currentPopup.id)" @mouseleave="autoClose(currentPopup)"
				v-if="showPopup">
			<button
					type="button" class="delete is-small" aria-label="close" @click="closePopup"
					v-if="currentPopup.showClose"></button>
			<div class="popup-body">
				<figure class="image is-1by1" v-if="currentPopup.image">
					<img :src="currentPopup.image" alt="cover">
				</figure>
				<slot :text="currentPopup.message">
					<p class="is-normal">{{ currentPopup.message }}</p>
				</slot>
			</div>
			<div class="never-show" v-if="!currentPopup.autoClose">
				<label class="checkbox"><input type="checkbox" v-model="never">{{ $vbt('popup.doNotShow') }}</label>
			</div>
		</div>
	</Transition>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-popup.box {
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	z-index: 9999;
	border: solid 1px va.$split-color;

	> .delete {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
	}

	.popup-body {
		display: flex;
		align-items: flex-start;
		width: 15rem;
		min-height: 4.5rem;

		.image {
			margin: 0.35rem 0.5rem 0 0;
			flex-shrink: 0;
			padding-top: 25%;
			width: 25%;
		}

		.is-normal {
			word-break: break-all;
			font-size: 0.875rem;
		}
	}

	.never-show {
		margin-top: 1rem;
		font-size: 0.75rem;

		.checkbox {
			display: flex;
			align-items: center;

			[type=checkbox] {
				margin-right: 0.25rem;
			}
		}
	}
}
</style>