<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps({
	text: {
		type    : String,
		required: true
	}
});
const charList = computed(() => {
	return props.text?.toString().split('') ?? [];
});
const isAnimate = ref(true);
const oldPoints = ref<string[]>([]);
let timer: any;
watch(charList, (newList, oldList, onCleanup) => {
	onCleanup(() => {
		isAnimate.value = false;
		timer && clearTimeout(timer);
	});
	isAnimate.value = true;
	timer = setTimeout(() => {
		isAnimate.value = false;
	}, newList.length * 100 + 400);
	if (oldList) {
		oldPoints.value = oldList;
		// 如果数组长度不一致，在前面补齐数组长度
		if (newList.length > oldList.length) {
			const pad = Array(newList.length - oldList.length).fill('0');
			oldPoints.value = [...pad, ...oldList];
		}
		// 如果数组长度一致，删除多余元素
		else if (newList.length < oldList.length) {
			oldPoints.value = oldList.slice(-newList.length);
		}
	}
}, {immediate: true});
</script>

<template>
	<span class="vb-animate-number" :key="text">
		<template v-for="(char, index) in charList">
			<span v-if="isNaN(parseInt(char, 0))">{{ char }}</span>
			<span
					class="number-char"
					:class="{'is-animation': isAnimate}"
					:style="isAnimate ? `
						--ani-init: -${Number(oldPoints[index]) || 0};
						--ani-point: -${char};
						--ani-delay: ${charList.length - index};
					` : null"
					v-else>
				{{ char }}
			</span>
		</template>
	</span>
</template>

<style scoped lang="scss">
@keyframes scrollNum {
	0% {
		transform: translateY(calc(var(--ani-init) * 1em));
	}
	100% {
		transform: translateY(calc(var(--ani-point) * 1em));
	}
}

.vb-animate-number {
	display: inline-flex;

	> span {
		display: inline-block;
		overflow: hidden;
		line-height: 1 !important;
		text-align: center;
	}

	.number-char {
		position: relative;
		min-width: 1ch;

		&.is-animation {
			--time-duration: .4s;
			--time-delay: calc(var(--ani-delay) * .1s);
			--end-delay: calc(var(--time-delay) + var(--time-duration));
			text-indent: -10em;

			&::after {
				content: '0123456789';
				position: absolute;
				display: block;
				word-break: break-all;
				white-space: break-spaces;
				font-weight: inherit;
				text-indent: initial;
				top: 0;
				left: 0;
				animation: scrollNum var(--time-duration) steps(10) var(--time-delay) both;
			}
		}
	}
}
</style>