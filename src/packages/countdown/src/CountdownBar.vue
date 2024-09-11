<script setup lang="ts">
import { computed, ref } from 'vue';
import Countdown from './Countdown.vue';

const props = defineProps({
	size  : {
		type   : Number,
		default: 2
	},
	appear: {
		type   : Boolean,
		default: true
	},
	time  : {
		type   : Number,
		default: 60
	}
});
const showBar = ref(false);
const current = ref(100);
const stepTime = 20;
const split = computed(() => 100 / (props.time * 1000 / stepTime));
let timer: any;

function startBar() {
	showBar.value = true;
	timer = setInterval(() => {
		current.value -= split.value;
		if (current.value <= 0) {
			clearInterval(timer);
		}
	}, stepTime);
}

function stopBar() {
	clearInterval(timer);
	current.value = 100;
	showBar.value = false;
}
</script>

<template>
	<Countdown :appear :time @running="startBar" @stop="stopBar" #default="cdSlots">
		<progress
				class="vb-countdown-bar progress is-link" :style="{height: size + 'px'}" max="100" :value="current"
				v-if="showBar"></progress>
		<slot v-bind="cdSlots"/>
	</Countdown>
</template>