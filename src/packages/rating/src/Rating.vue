<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
	star     : {
		type   : Number,
		default: 5
	},
	max      : Number,
	fill     : {
		type   : Array,
		default: ['★']
	},
	showScore: Boolean,
	readonly : Boolean
});
const score = defineModel({default: 0});
const shapes = computed(() => {
	const [a, b] = props.fill;
	return [a, b ?? a];
});
// 最大评分
const maxScore = computed(() => props.max || props.star);
// 当前评级
const currentRank = computed(() => makeHalfOrUp(score.value / maxScore.value * props.star));
// 是否显示半星
const isHalfStar = computed(() => {
	const splitNumb = makeHalfOrUp(props.star / maxScore.value);
	return splitNumb % 1 > 0;
});
// 星星步骤
const starStep = computed(() => {
	const step: number[] = [];
	const s = isHalfStar.value ? 0.5 : 1;
	for (let i = 0; i < props.star; i += s) {
		step.push(i + s);
	}
	return step;
});

function makeHalfOrUp(num: number) {
	const check = () => {
		// 非值返回0
		if (!num) {
			return 0;
		}
		num = Number(num.toFixed(1));
		// 整数返回自身
		if (num % 1 === 0) {
			return num;
		}
		// 检查小数是否小于0.5
		return num % 1 <= 0.5 ? Math.floor(num) + 0.5 : Math.ceil(num);
	}
	return Math.abs(check());
}

function rating(rank: number) {
	score.value = Number((rank / props.star * maxScore.value).toFixed(1));
}
</script>

<template>
	<div class="vb-rating">
		<div class="stars" :class="{'is-disabled': readonly}">
				<span
						:data-init="shapes[0]" :data-star="shapes[1]"
						:class="{'is-active': rank <= currentRank, 'is-half': isHalfStar}"
						@click="rating(rank)"
						v-for="rank in starStep"></span>
		</div>
		<div class="score" v-if="showScore">
			<slot :score="score" :rank="currentRank">{{ score }}</slot>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-rating {
	display: inline-flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5em;
	user-select: none;

	.stars {
		display: flex;
		align-items: center;
		font-weight: initial;
		line-height: 1;

		&.is-disabled {
			pointer-events: none;
		}

		span {
			position: relative;
			display: block;
			cursor: pointer;
			overflow: hidden;
			font-family: Arial, "Helvetica Neue", "Courier New", sans-serif;
			font-size: 1em;
			width: 1em;
			height: 1em;

			&.is-half {
				width: .5em;

				&:nth-child(even) {
					&::before, &::after {
						right: 0;
					}
				}
			}

			&.is-active {
				&::after {
					display: block;
				}
			}

			&:hover ~ span {
				&::after {
					display: none !important;
				}
			}

			&::before, &::after {
				position: absolute;
				overflow: hidden;
				text-align: center;
				width: 1em;
			}

			&::before {
				content: attr(data-init);
				z-index: 1;
				color: var(--rating-color, #D3D3D3);
			}

			&::after {
				content: attr(data-star);
				display: none;
				z-index: 2;
			}
		}

		// 鼠标放上来的时候全部显示
		&:hover:has(span:hover) {
			span::after {
				display: block;
			}
		}
	}

	.score {
		line-height: initial;
	}
}
</style>