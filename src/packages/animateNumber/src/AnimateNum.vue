<script setup lang="ts">
import { computed } from 'vue';
import { numberSplit } from '../../../utils';

const props = defineProps({
	number: {
		type    : Number,
		required: true
	},
	split : Boolean
});
const numberText = computed(() => {
	return props.split ? numberSplit(props.number, true) : props.number;
});
const charList = computed(() => {
	return numberText.value?.toString().split('') ?? [];
});
</script>

<template>
	<span class="vb-animate-number">
		<template v-for="(char, index) in charList">
			<span v-if="isNaN(parseInt(char, 0))">{{ char }}</span>
			<span
					class="number-char" :key="char" :style="`--ani-point: -${char};--ani-delay: ${charList.length - index}`"
					v-else>
				{{ char }}
			</span>
		</template>
	</span>
</template>

<style scoped lang="scss">
@keyframes scrollNum {
	0% {
		transform: translateY(0);
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