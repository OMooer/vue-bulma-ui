<script setup lang="ts">
import { cloneVNode, computed, defineComponent, h, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { flattenVNode } from '../../../utils';

const props = defineProps({
	showControl   : {
		type   : Boolean,
		default: true
	},
	showIndicator : {
		type   : Boolean,
		default: true
	},
	autoplay      : Boolean,
	duration      : {
		type   : Number,
		default: 5000
	},
	seamless      : Boolean,
	wheeled       : Boolean,
	previousMargin: {
		type   : String,
		default: '0px'
	},
	nextMargin    : {
		type   : String,
		default: '0px'
	}
});
const slots = defineSlots();
const current = ref(0);
const percent = ref(0);
let autoTimer: any, percentTimer: any, wheelTimer: any, regulateTimer: any;
let startX = 0, offsetX = 0;
let wheelOffsetX = 0, wheelCapture = false;

const total = computed(() => {
	return slots.default?.()?.length || 0;
});
const currentIndex = computed(() => {
	return props.seamless ? current.value + 1 : current.value;
});
const isStart = computed(() => {
	return !props.seamless && current.value <= 0;
});
const isEnd = computed(() => {
	return !props.seamless && current.value >= total.value - 1;
});

const cont = useTemplateRef<HTMLElement>('cont');
const swiperItems = defineComponent(() => {
	return () => {
		return h(getItems)
	}
});

// 自动播放时的进度
function startPercent() {
	percentTimer = setTimeout(() => {
		percent.value++;
		if (percent.value < 100) {
			startPercent();
		}
	}, props.duration / 100);
}

// 自动播放
function autoplay() {
	percentTimer && clearTimeout(percentTimer);
	startPercent();
	autoTimer && clearTimeout(autoTimer);
	autoTimer = setTimeout(() => {
		if (props.seamless) {
			right();
		}
		else {
			moveTo((current.value + 1) % total.value);
		}
	}, props.duration - (props.duration * (percent.value / 100)));
}

function pausePlay() {
	if (props.autoplay) {
		percentTimer && clearTimeout(percentTimer);
		autoTimer && clearTimeout(autoTimer);
	}
}

function startPlay() {
	if (props.autoplay) {
		autoplay();
	}
}

function moveTo(index: number) {
	percent.value = 0;
	current.value = index;
	containerRegulate();
	startPlay();
}

function left(offset: number = 0) {
	if (current.value <= 0) {
		if (!props.seamless) {
			containerRegulate();
			return;
		}
		current.value = total.value;
		containerOffsetTrans(offset);
	}
	moveTo(--current.value);
}

function right(offset: number = 0) {
	if (current.value >= total.value - 1) {
		if (!props.seamless) {
			containerRegulate();
			return;
		}
		current.value = -1;
		containerOffsetTrans(offset);
	}
	moveTo(++current.value);
}

// 内容容器校正设置
function containerRegulate() {
	if (cont.value) {
		cont.value.style.transform = `translateX(calc(${ currentIndex.value }* (-100% + ${ props.previousMargin } + ${ props.nextMargin }) + ${ props.previousMargin }))`;
	}
}

// 内容容器偏移设置
function containerOffsetTrans(offset: number) {
	if (cont.value) {
		const container = cont.value as HTMLElement;
		container.style.transition = 'none';
		container.style.transform = `translateX(calc(${ currentIndex.value }* (-100% + ${ props.previousMargin } + ${ props.nextMargin }) + ${ props.previousMargin } + ${ offset }px))`;
		container.offsetWidth;
		container.style.transition = '';
	}
}

// 滚动事件
function wheelContainer(e: any) {
	if (e.deltaX === 0 || !e.target.closest('.swiper-container') || !props.wheeled) {
		return;
	}
	e.preventDefault();
	// 当滚动事件完全停止之后重置滚动状态
	wheelTimer && clearTimeout(wheelTimer);
	wheelTimer = setTimeout(() => {
		wheelOffsetX = 0;
		wheelCapture = false;
	}, 200);
	// 如果滚动已经进行处理的话，直接返回不再执行
	if (wheelCapture) {
		return;
	}

	const width = e.currentTarget.offsetWidth;
	const padding = 50;
	const min = Math.min(1, currentIndex.value) * width + padding;
	const max = -1 * Math.min(1, total.value - (props.seamless ? -1 : 1) - currentIndex.value) * width - padding;
	wheelOffsetX -= e.deltaX;
	// 正数代表从左到右滑动
	wheelOffsetX = wheelOffsetX > 0 ? Math.min(min, wheelOffsetX) : Math.max(max, wheelOffsetX);
	// 如果移动位置达到边界的话，设置捕获状态，阻止后续的移动事件
	if (wheelOffsetX === min || wheelOffsetX === max) {
		wheelCapture = true;
	}
	// 即时定位新的位置
	containerOffsetTrans(wheelOffsetX);
	// 清除可能存在的校正延时
	regulateTimer && clearTimeout(regulateTimer);
	// 如果滚动位置超过阈值，则直接跳转上一页或下一页，并设置捕获状态
	if (Math.abs(wheelOffsetX) > width * .3) {
		wheelCapture = true;
		wheelOffsetX > 0 ? left(wheelOffsetX) : right(wheelOffsetX);
	}
	else {
		// 如果没有超过阈值，则一段时间后校正回当前页所在位置
		regulateTimer = setTimeout(() => {
			containerRegulate();
		}, 200);
	}
}

// 生成绑定属性的组件节点
function getNewChild(node: any, _index: number) {
	const prop = {
		style: {
			width : `calc(100% - ${ props.previousMargin } - ${ props.nextMargin })`,
			height: '100%'
		},
		onMouseenter() {
			pausePlay();
		},
		onMouseleave() {
			startPlay();
		},
		onTouchstart(e: TouchEvent) {
			const {clientX} = e.touches[0];
			pausePlay()
			startX = clientX;
		},
		onTouchmove(e: TouchEvent) {
			const {clientX} = e.changedTouches[0];
			const diff = startX - clientX
			offsetX = diff > 0 ? -1 * diff : Math.abs(diff);
			containerOffsetTrans(offsetX);
			e.preventDefault();
		},
		onTouchend(e: any) {
			const target = e.target.parentNode as HTMLElement;
			// 如果两次相差超过30%则认为是滑动切换
			const {clientX} = e.changedTouches[0];
			if (Math.abs(startX - clientX) >= target.offsetWidth * .3) {
				startX > clientX ? right(offsetX) : left(offsetX);
				return;
			}
			containerRegulate();
			startPlay();
		}
	};
	return cloneVNode(node, prop);
}

// 获取内容节点，如果是无缝轮播的话拷贝第一个和最后一个节点
function getItems() {
	const defaultSlots = slots.default?.();
	const items = props.seamless ? [defaultSlots.slice(-1), defaultSlots, defaultSlots.slice(0, 1)].flat() : defaultSlots;
	return flattenVNode(items).map(getNewChild);
}

onMounted(() => {
	containerRegulate();
	startPlay();
});
onBeforeUnmount(() => {
	autoTimer && clearTimeout(autoTimer);
	percentTimer && clearTimeout(percentTimer);
});
</script>

<template>
	<div class="vb-swiper" @wheel="wheelContainer">
		<div ref="cont" class="swiper-container" v-if="total">
			<Component :is="swiperItems"/>
		</div>
		<slot name="control" :index="current" :left="()=>left()" :right="()=>right()" v-if="showControl && total">
			<a class="swiper-control left" :class="{'is-disabled': isStart}" @click="left()">
				<FasIcon icon="chevron-left"/>
			</a>
			<a class="swiper-control right" :class="{'is-disabled': isEnd}" @click="right()">
				<FasIcon icon="chevron-right"/>
			</a>
		</slot>
		<slot
				name="indicator" :total="total" :index="current" :moveTo="moveTo" :percent="percent"
				v-if="showIndicator && total">
			<ol class="swiper-indicator" :style="`--bg-percent: ${percent}%`">
				<li :class="{'is-active': i === current + 1}" @click="moveTo(i - 1)" v-for="i in total"></li>
			</ol>
		</slot>
	</div>
</template>

<style scoped lang="scss">
.vb-swiper {
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	overflow: hidden;
	width: 100%;

	.swiper-container {
		display: -webkit-box;
		flex-grow: 1;
		width: 100%;
		height: 100%;
		transition: transform .3s ease-in-out;
	}

	.swiper-control {
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		top: 50%;
		margin-top: -1em;
		background: hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-background-l), .2);
		border-radius: 50%;
		color: hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), .2);
		width: 2em;
		height: 2em;
		z-index: 5;

		&.left {
			left: .5em;
		}

		&.right {
			right: .5em;
		}

		&:hover {
			background: hsla(var(--bulma-scheme-h), var(--bulma-scheme-s), var(--bulma-background-l), .5);
			color: var(--bulma-body-text);
		}

		&.is-disabled {
			pointer-events: none;
			opacity: 0;
		}
	}

	.swiper-indicator {
		display: flex;
		justify-content: center;
		align-items: center;
		position: absolute;
		margin: .4em 1em;
		padding: 0;
		list-style: none;
		bottom: 0;
		z-index: 4;

		li {
			margin: 0 .15em;
			background: rgba(255, 255, 255, .3);
			border-radius: 4px;
			box-shadow: 0 0 3px -1px var(--bulma-grey);
			cursor: pointer;
			width: 1.5em;
			height: .3em;

			&.is-active {
				--m: min(calc(var(--bg-percent) * 50), calc(1% * 50));
				--a: calc(100% - var(--m));
				background-color: hsla(var(--bulma-primary-h), var(--bulma-primary-s), var(--bulma-primary-l), var(--a));
				background-image: linear-gradient(to right, var(--bulma-primary) var(--bg-percent), transparent var(--bg-percent));
			}
		}
	}
}
</style>