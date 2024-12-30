<script setup lang="ts">
import { watch } from 'vue';
import { useTellMe } from '@/actions/inform';

const emit = defineEmits(['remove']);
const props = defineProps({
	animate: {
		type   : String,
		default: 'animate-list-to-left'
	},
	max    : {
		type   : Number,
		default: 5
	},
	list   : {
		type   : Array,
		default: []
	}
});
const {add, remove, list} = useTellMe();
const timerMap: { [propName: symbol]: number } = {};
watch(props.list, (notifyList) => {
	if (notifyList.length) {
		(notifyList as OP.MsgObj[]).forEach((item: OP.MsgObj) => {
			addNotify(item);
		});
	}
});

function autoClose(notify: OP.MsgObj) {
	if (notify.autoClose) {
		timerMap[notify.id] = window.setTimeout(() => {
			removeNotify(notify.id);
		}, notify.autoClose);
	}
}

function addNotify(notify: OP.MsgObj) {
	add(Object.assign(notify,
			notify.type === 'danger' && !('autoClose' in notify)
					? {autoClose: 10000}
					: {},
			{
				showClose: notify.type === 'danger'
			}
	)).then((notify) => {
		if (list.value.length > props.max) {
			removeNotify(list.value[0].id);
		}
		autoClose(notify);
	}).catch(() => {});
}

function removeNotify(id: symbol) {
	remove(id).then(
			() => {
				emit('remove', id);
			}
	);
}

defineExpose({
	add   : addNotify,
	remove: removeNotify,
});
</script>

<template>
	<TransitionGroup :name="animate" tag="div" class="vb-notify">
		<div class="message" :class="'is-' + item.type" :key="item.id" v-for="item in list as OP.MsgObj[]">
			<button
					type="button" class="delete" aria-label="delete"
					@click="removeNotify(item.id)" v-if="item.showClose"></button>
			<div class="message-body">
				{{ item.message }}
			</div>
		</div>
	</TransitionGroup>
</template>

<style scoped lang="scss">
@import "../../../scss/animates";

.vb-notify {
	position: fixed;
	right: 0;
	top: 3.25rem;
	z-index: 9999;

	.message {
		position: relative;

		.delete {
			display: none;
			position: absolute;
			top: 0;
			left: 0;
			transform: translate(-40%, -40%) scale(.8);
		}

		.message-body {
			padding: .8em 1em;
			min-width: 10rem;
			max-width: 18rem;
		}

		&:hover {
			.delete {
				display: block;
			}
		}

		&:not(:last-child) {
			margin-bottom: .5rem;
		}
	}
}
</style>