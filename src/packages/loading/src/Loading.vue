<script setup lang="ts">
import { provide, ref, watch } from 'vue';

const emit = defineEmits(['dismiss']);
const props = defineProps({
	top     : Boolean,
	start   : {
		type   : Boolean,
		default: true
	},
	finished: Boolean,
	progress: Number,
	timeout : {
		type   : Number,
		default: 10000
	}
});
const percent = ref(0);
const status = ref('load');
const isEnd = ref(false);
const isLoading = ref(false);
let timer: any;

watch(() => props.start, (isStarted) => {
	if (isStarted) {
		runBar();
	}
}, {immediate: true});
watch(() => props.finished, (isFinished) => {
	if (isFinished) {
		// 如果异步数据已经加载完成，但进度条还在执行，则设置标识
		if (percent.value < 90) {
			isEnd.value = true;
		}
		// 否则直接执行完成操作
		else {
			finish();
		}
	}
}, {immediate: true});

function runBar() {
	isEnd.value = false;
	percent.value = 0;
	status.value = 'load';
	isLoading.value = true;
	// 启动模拟进度条定时器
	if (timer) {
		clearInterval(timer);
	}
	timer = setInterval(() => {
		percent.value += 1;
		// 模拟进度条只模拟到90%，剩下的等待异步结果或者设置超时
		if (percent.value >= 90) {
			// 停止当前的定时器再执行
			clearInterval(timer);
			// 如果存在完成标识则执行完成操作
			if (isEnd.value) {
				finish();
			}
			// 否则设置等待超时操作
			else {
				// 同时如果存在进度属性则一边监听进度条
				watch(() => props.progress, (newPercent) => {
					if (newPercent) {
						percent.value = Math.max(newPercent, percent.value);
					}
				}, {immediate: true});
				timeout();
			}
		}
	}, 10);
}

function timeout() {
	// 超时关闭进度条
	timer = setTimeout(() => {
		percent.value = 100;
		status.value = 'error';
		dismiss();
	}, props.timeout);
}

function finish() {
	percent.value = 100;
	status.value = 'success';
	dismiss();
}

function dismiss() {
	if (timer) {
		clearInterval(timer);
		clearTimeout(timer);
		timer = null;
	}
	setTimeout(() => {
		isLoading.value = false;
		emit('dismiss', status.value);
	}, 300);
}

provide('dismiss', dismiss);
provide('percent', percent);
provide('status', status);
</script>

<template>
	<div class="vb-loading" :class="{'top-loading': top}" v-if="isLoading">
		<slot>
			<p class="normal"></p>
		</slot>
	</div>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

@property --text-ani {
	syntax: '<string>';
	inherits: false;
	initial-value: '';
}

@keyframes loading-text {
	0% {
		--text-ani: 'loading...';
	}
	10% {
		--text-ani: 'Loading...';
	}
	20% {
		--text-ani: 'LOading...';
	}
	30% {
		--text-ani: 'LOAding...';
	}
	40% {
		--text-ani: 'LOADing...';
	}
	50% {
		--text-ani: 'LOADIng...';
	}
	60% {
		--text-ani: 'LOADINg...';
	}
	70% {
		--text-ani: 'LOADING...';
	}
	80% {
		--text-ani: 'LOADING·..';
	}
	90% {
		--text-ani: 'LOADING··.';
	}
	100% {
		--text-ani: 'LOADING···';
	}
}

.vb-loading {
	.normal {
		margin: 2rem 0;
		user-select: none;
		text-align: center;
		line-height: 4;
		font-family: monospace;
		font-size: .875rem;
		color: $grey;
		animation: loading-text 1.2s ease-in-out alternate-reverse infinite;

		&::before {
			content: var(--text-ani);
		}
	}

	&.top-loading {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		z-index: 9999;
	}
}
</style>