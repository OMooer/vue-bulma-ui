<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps({
	text: {
		type    : String,
		required: true
	}
});
const charList = computed(() => {
	return props.text?.split('') ?? [];
});
const oldPoints = ref<string[]>([]);
watch(charList, (newList, oldList) => {
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
});
</script>

<template>
	<span class="vb-animate-number" :key="text">
		<template v-for="(char, index) in charList">
			<span v-if="isNaN(parseInt(char, 0))">{{ char }}</span>
			<span
					class="number-char"
					:style="`--ani-init: -${Number(oldPoints[index]) || 0};
					--ani-point: -${char};
					--ani-delay: ${charList.length - index}`"
					v-else>
				{{ char }}
			</span>
		</template>
	</span>
</template>

<style scoped lang="scss">
@keyframes scrollNum {
	0% {
		transform: translateY(calc(var(--ani-init) * 1.3em));
	}
	100% {
		transform: translateY(calc(var(--ani-point) * 1.3em));
	}
}

@keyframes fadeOut {
	to {
		display: none;
	}
}

@keyframes charShow {
	from {
		text-indent: -10em;
	}
	to {
		text-indent: 0;
	}
}

.vb-animate-number {
	all: inherit;
	display: inline-flex;

	> span {
		display: inline-block;
		overflow: hidden;
		line-height: 1.3;
		text-align: center;
	}

	.number-char {
		--time-duration: .8s;
		--time-delay: calc(var(--ani-delay) * .1s);
		--end-delay: calc(var(--time-delay) + var(--time-duration));

		position: relative;
		animation: charShow 0s ease-in-out var(--end-delay) both;
		min-width: 1ch;

		&::after {
			content: '0123456789';
			position: absolute;
			display: block;
			word-break: break-all;
			font-weight: inherit;
			text-indent: initial;
			top: 0;
			left: 0;
			animation: scrollNum var(--time-duration) steps(10) var(--time-delay) both, fadeOut 0s var(--end-delay) both;
		}
	}
}
</style>