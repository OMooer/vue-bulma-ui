<script setup lang="ts">
import { computed, watch } from 'vue';
import { useTellMe } from '@/actions/inform';

const emit = defineEmits(['remove']);
const props = defineProps({
	position: {
		type     : String,
		validator: (value: string) => {
			return ['top', 'bottom'].includes(value);
		},
		default  : 'top'
	},
	animate : {
		type   : String,
		default: 'animate-list'
	},
	max     : {
		type   : Number,
		default: 2
	},
	list    : {
		type   : Array,
		default: []
	}
});
const {add, remove, list} = useTellMe();
const timerMap: { [propName: symbol]: number } = {};
const isTop = computed(() => {
	return props.position === 'top';
});
watch(props.list, (toastList) => {
	if (toastList.length) {
		(toastList as OP.MsgObj[]).forEach((item: OP.MsgObj) => {
			addToast(item);
		});
	}
});

function autoClose(toast: OP.MsgObj) {
	if (toast.autoClose) {
		timerMap[toast.id] = window.setTimeout(() => {
			removeToast(toast.id);
		}, toast.autoClose);
	}
}

function addToast(toast: OP.MsgObj) {
	add(toast).then((toast) => {
		if (list.value.length > props.max) {
			removeToast(list.value[0].id);
		}
		autoClose(toast);
	}).catch(() => {});
}

function removeToast(id: symbol) {
	remove(id).then(
			() => {
				emit('remove', id);
			}
	);
}

defineExpose({
	add   : addToast,
	remove: removeToast,
});
</script>

<template>
	<TransitionGroup :name="animate" tag="div" class="vb-toasts" :class="isTop ? 'is-top' : 'is-bottom'">
		<div class="toast box has-background-dark has-text-white-ter" :key="item.id" v-for="item in list as OP.MsgObj[]">
			{{ item.message }}
		</div>
	</TransitionGroup>
</template>

<style scoped lang="scss">
@import "../../../scss/animates";

.vb-toasts {
	position: fixed;
	left: 0;
	right: 0;
	z-index: 9998;
	display: flex;
	flex-direction: column;
	align-items: center;

	$mar: 10px;

	.toast {
		padding-top: 0.75rem;
		padding-bottom: 0.75rem;
		text-align: center;
		font-size: 0.825rem;
		max-width: 90%;

		&:not(:last-child) {
			margin: 0 0 0.5rem;
		}
	}

	&.is- {
		&top {
			top: $mar;
		}

		&bottom {
			bottom: $mar;
		}
	}
}
</style>