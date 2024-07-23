<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

const props = defineProps({
	sets       : {
		type    : Array,
		required: true
	},
	current    : Number,
	allowSwitch: {
		type   : Boolean,
		default: true
	}
});
const emit = defineEmits(['change']);
const stepHistory = ref<{ n: number; text: string; }[]>([]);
// 步骤值
const stepValue = ref(0);
// 实际指针队列的下标值
const point = ref(-1);
// 返回大步骤展示队列用于导航
const filterSteps = computed(() => {
	return stepHistory.value.filter((item: any) => item.n % 1 === 0);
});

// 获取当前步骤指针的实际下标位置
function getPoint(point: number) {
	return stepHistory.value.findIndex((item: any) => item.n === point);
}

// 从 sets 属性中打平所有步骤生成实际的步骤队列数组
watchEffect((cl) => {
	for (let i = 0; i < props.sets?.length; i++) {
		if (props.sets[i] instanceof Array) {
			(props.sets[i] as []).forEach((sub: string, idx: number) => {
				stepHistory.value.push({
					n   : Number(`${ i }.${ idx }`),
					text: sub
				});
			});
		}
		else {
			stepHistory.value.push({
				n   : i,
				text: props.sets[i] as string
			});
		}
	}

	cl(() => {
		stepHistory.value = [];
	});
});

watchEffect(() => {
	stepValue.value = Math.round(props.current ?? 0);
	point.value = getPoint(Number(props.current ?? 0));
});

// 直接跳转到大步骤，跳过小步骤
function changeStep(index: number) {
	if (!props.allowSwitch) {
		return;
	}
	// 如果当前大步骤未变化则不进行任何步骤移动
	if (stepValue.value !== index) {
		point.value = getPoint(filterSteps.value[index].n);
		updateStep(index);
	}
}

// 更新步骤值
function updateStep(n: number) {
	stepValue.value = Math.round(n);
	emit('change', n);
}

/**
 * 调用行进步骤，不跳过每个小步骤
 * @param {number} n 行进方向，正值表示向前，负值表示向后
 */
function step(n: number) {
	const [next, stepValue] = resolve(n);
	if (next === -1) {
		return;
	}
	point.value = next;
	updateStep(stepValue);
}

/**
 * 获取行进步骤的步骤信息
 * @param {number} n 行进方向，正值表示向前，负值表示向后
 * @returns {[number, number]} [指标下标, 指针对应的步骤值]
 */
function resolve(n: number): [number, number] {
	// 移动实际指针下标
	let next = point.value + (n >= 0 ? 1 : -1);
	// 如果超出队列长度，异常处理
	if (next > stepHistory.value.length) {
		return [-1, -1];
	}
	// 如果小于0则返回初始
	if (next < 0) {
		next = 0;
	}
	// 指标下标、对应指针的步骤值
	return [next, stepHistory.value[next].n];
}

defineExpose({
	// go fn is deprecated
	go: step,
	step,
	resolve
});
</script>

<template>
	<ul class="steps">
		<li :class="{'is-active': index === stepValue}" v-for="(item, index) in filterSteps">
			<a @click="changeStep(index)">
				{{ item.text }}
			</a>
		</li>
	</ul>
</template>

<style scoped lang="scss">
.steps {
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	margin: 2rem auto;
	counter-reset: stepList;

	li {
		display: flex;
		align-items: center;
		font-size: .875rem;
		counter-increment: stepList;

		a {
			color: $info;
			white-space: nowrap;
		}

		&::before {
			content: "✓";
			display: inline-flex;
			align-items: center;
			justify-content: center;
			margin-right: .25rem;
			background-color: $info;
			border: solid 1px $info;
			border-radius: 50%;
			color: $white;
			width: 1.5rem;
			height: 1.5rem;
		}

		&:not(:last-of-type)::after {
			content: "";
			margin: 0 .5rem;
			background-color: $info;
			height: 1px;
			width: 8rem;
		}

		&.is-active {
			font-weight: bold;

			a {
				color: $black;
			}

			&::before {
				content: counter(stepList);
				background-color: $primary;
				border-color: $primary;
				color: $white;
			}

			&::after {
				background-color: $grey-lighter;
			}

			~ li {
				a {
					color: $black;
				}

				&::before {
					content: counter(stepList);
					background-color: transparent;
					border-color: $grey-lighter;
					color: $black;
				}

				&::after {
					background-color: $grey-lighter;
				}
			}
		}
	}
}

@media screen and (max-width: 768px) {
	.steps {
		justify-content: flex-start;

		li {
			display: none;

			&.is-active {
				display: flex;

				+ li {
					display: flex;
				}
			}
		}
	}
}
</style>
