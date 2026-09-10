<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch, watchEffect } from 'vue';

const props = defineProps({
	sets       : {
		type    : Array,
		required: true
	},
	current    : Number,
	allowSwitch: {
		type   : Boolean,
		default: true
	},
	isBoxed    : Boolean
});
const emit = defineEmits(['change']);
const stepsRef = useTemplateRef('steps');
const stepHistory = ref<{ n: number; text: string; }[]>([]);
// 步骤值
const stepValue = ref(0);
// 实际指针队列的下标值
const point = ref(-1);
// 返回大步骤展示队列用于导航
const filterSteps = computed(() => {
	return stepHistory.value.filter((item: any) => item.n % 1 === 0);
});
// 返回当前步骤的小步骤总数
const subSteps = computed(() => {
	return stepHistory.value.filter((item: any) => Math.floor(item.n) === stepValue.value);
});
const subProgress = computed(() => {
	// 切分每个小步骤的进度
	const sp = 100 / subSteps.value.length;
	// 获取当前小步骤的位置索引
	const index = subSteps.value.findIndex((item: any) => item.n === stepHistory.value[point.value].n);
	// 如果索引不存在，则返回0
	if (index === -1) {
		return 0;
	}
	return sp * index;
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
	if (next >= stepHistory.value.length) {
		return [-1, -1];
	}
	// 如果小于0则返回初始
	if (next < 0) {
		next = 0;
	}
	// 指标下标、对应指针的步骤值
	return [next, stepHistory.value[next].n];
}

onMounted(() => {
	if (stepsRef.value) {
		const li = stepsRef.value.querySelector('li');
		const min = Math.min(li?.offsetWidth || 0, li?.offsetHeight || 0);
		stepsRef.value.style.setProperty('--size', `${ min }`);
	}
});

watchEffect(() => {
	if (stepsRef.value) {
		if (subProgress.value) {
			stepsRef.value.style.setProperty('--progress', `${ subProgress.value }`);
		}
		else {
			stepsRef.value.style.removeProperty('--progress');
		}
	}
});
watch(() => stepValue.value, () => {
	if (stepsRef.value) {
		stepsRef.value.classList.add('not-transition');
		nextTick(() => {
			requestAnimationFrame(() => {
				stepsRef.value!.classList.remove('not-transition');
			});
		});
	}
});

defineExpose({
	// go fn is deprecated
	go: step,
	step,
	resolve
});
</script>

<template>
	<ul ref="steps" class="steps" :class="{'is-box-style': isBoxed}">
		<li :class="{'is-active': index === stepValue}" :key="item.n" v-for="(item, index) in filterSteps">
			<a :aria-readonly="allowSwitch ? undefined : 'true'" @click="changeStep(index)">
				{{ item.text }}
			</a>
		</li>
	</ul>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

@property --progress {
	syntax: '<number>';
	inherits: true;
	initial-value: 0;
}

.steps {
	$normal: va.$grey-lighter;
	$completed: va.$link-light;
	$active: va.$primary;
	--completed: #{$completed};

	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	margin: 2rem auto;
	counter-reset: stepList;
	transition: --progress 0.3s ease;

	&.not-transition {
		transition: none;
	}

	li {
		display: flex;
		align-items: center;
		font-size: .875rem;
		counter-increment: stepList;

		a {
			color: var(--completed);
			white-space: nowrap;

			&[aria-readonly=true] {
				cursor: default;
			}

			&::before {
				content: "✓";
				display: inline-flex;
				align-items: center;
				justify-content: center;
				margin-right: .5em;
				background-color: var(--completed);
				border: solid 1px var(--completed);
				border-radius: 50%;
				color: va.$white;
				width: 1.5em;
				height: 1.5em;
			}
		}

		&:not(:last-of-type)::after {
			content: "";
			margin: 0 .5em;
			background-color: var(--completed);
			height: 1px;
			width: 8em;
		}

		&.is-active {
			--deg: 90deg;
			font-weight: bold;

			a {
				color: var(--bulma-body-color);

				&::before {
					content: counter(stepList);
					background-color: $active;
					border-color: $active;
					color: va.$white;
				}
			}

			&::after {
				background-image: linear-gradient(var(--deg), var(--completed) calc(var(--progress) * 1%), transparent calc(var(--progress) * 1%));
				background-color: $normal;
			}

			~ li {
				a {
					color: var(--bulma-body-color);

					&::before {
						content: counter(stepList);
						background-color: transparent;
						border-color: $normal;
						color: var(--bulma-body-color);
					}
				}

				&::after {
					background-color: $normal;
				}
			}
		}
	}

	&.is-box-style {
		--square-side: calc(1px * calc(var(--size, 32) * sqrt(2) / 2) - 1px);

		li {
			position: relative;
			background-color: var(--bulma-background);
			border: solid var(--bulma-border);
			border-width: 1px 0;

			&:first-child {
				border-top-left-radius: var(--bulma-radius);
				border-bottom-left-radius: var(--bulma-radius);
				border-left-width: 1px;

				&::after, a {
					clip-path: polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%);
				}

				a {
					padding-inline-start: 1.5em;
				}
			}

			&:last-child {
				border-top-right-radius: var(--bulma-radius);
				border-bottom-right-radius: var(--bulma-radius);
				border-right-width: 1px;

				&::before {
					display: none;
				}

				&::after {
					margin-inline-end: 0;
				}

				&::after, a {
					clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 17% 50%);
				}

				a {
					margin-inline-end: 0;
					padding-inline-end: 1.5em;
				}
			}

			&::before, &::after {
				content: "";
				position: absolute;
			}

			// 小方块箭头
			&::before {
				right: 0;
				border: solid var(--bulma-info-15-invert);
				border-width: 1px 1px 0 0;
				transform: translateX(50%) rotate(45deg);
				box-shadow: 2px -2px 2px 0 rgba(90, 90, 90, 0.1);
				width: var(--square-side);
				height: var(--square-side);
				z-index: 2;
			}

			// 背景底色
			&::after {
				margin: 0 -1.5em 0 0;
				inset: 0;
				border-radius: inherit;
				background-color: var(--completed);
				width: auto;
				height: auto;
				z-index: 1;
			}

			&::after, a {
				clip-path: polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%, 17% 50%);
			}

			a {
				position: relative;
				display: block;
				margin-inline-end: -1.5em;
				padding-inline: 2.5em;
				border-radius: inherit;
				line-height: 2.5rem;
				color: #FFF;
				height: 2.5rem;
				z-index: 2;
				order: 1;

				&::before {
					background-color: transparent;
					border-color: #FFF;
				}
			}

			&.is-active {
				&::before {
					border-color: var(--bulma-border);
				}

				&::after {
					background-color: $active;
				}

				~ li {
					&::before {
						border-color: var(--bulma-border);
						box-shadow: none;
					}

					&::after {
						background-color: transparent;
					}
				}
			}
		}
	}

	&.is-icoless {
		a::before {
			display: none !important;
		}
	}
}

@media screen and (max-width: 768px) {
	.steps {
		flex-direction: column;
		margin: 0 1rem;

		li {
			display: flex;
			flex-direction: column;
			justify-content: center;

			a {
				display: flex;
				flex-direction: column-reverse;
				align-items: center;
				justify-content: center;

				&::before {
					margin: .25em 0 0;
				}
			}

			&:not(:last-of-type)::after {
				margin: .5em 0;
				width: 1px;
				height: 4em;
			}

			&.is-active {
				--deg: 180deg;
				display: flex;

				+ li {
					display: flex;
				}
			}
		}

		&.is-box-style {
			li {
				writing-mode: vertical-lr;
				border-width: 0 1px;

				&:first-child {
					border-radius: var(--bulma-radius) var(--bulma-radius) 0 0;

					&::after, a {
						clip-path: polygon(0 0, 100% 0, 100% 82%, 50% 100%, 0 82%);
					}
				}

				&:last-child {
					border-radius: 0 0 var(--bulma-radius) var(--bulma-radius);
					border-bottom-width: 1px;

					&::after, a {
						clip-path: polygon(0 0, 50% 17%, 100% 0, 100% 100%, 0 100%);
					}
				}

				&::before {
					right: unset;
					bottom: 0;
					transform: translateY(50%) rotate(135deg);
				}

				&::after {
					margin: 0 0 -1.5em 0;
					width: auto;
					height: auto;
				}

				&::after, a {
					clip-path: polygon(0 0, 50% 17%, 100% 0, 100% 82%, 50% 100%, 0 82%);
				}

				a {
					flex-direction: row;
					width: 2.5rem;
					height: auto;

					&::before {
						margin: 0 0 .5em;
					}
				}

				&.is-active {
					~ li a, a {
						&::before {
							writing-mode: initial;
						}
					}
				}
			}
		}
	}
}
</style>
