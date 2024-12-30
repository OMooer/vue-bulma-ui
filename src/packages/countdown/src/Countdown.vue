<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps({
	appear: {
		type   : Boolean,
		default: false
	},
	time  : {
		type   : Number,
		default: 60
	}
});
const emit = defineEmits(['start', 'stop']);
const seconds = ref(props.time);
const running = ref(false);

function countdown() {
	emit('start');
	running.value = true;
	const timer = setInterval(() => {
		seconds.value--;
		if (seconds.value <= 0) {
			clearInterval(timer);
			seconds.value = props.time;
			running.value = false;
			emit('stop', countdown);
		}
	}, 1000);
}

onMounted(() => {
	if (props?.appear) {
		countdown();
	}
});
</script>

<template>
	<slot :total="time" :seconds="seconds" :start="countdown" :running="running"/>
</template>