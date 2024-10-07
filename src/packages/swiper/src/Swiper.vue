<script setup lang="ts">
import { cloneVNode, computed, defineComponent, h, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { flattenVNode } from '../../../utils';

const props = defineProps({
	showControl  : {
		type   : Boolean,
		default: true
	},
	showIndicator: {
		type   : Boolean,
		default: true
	},
	autoplay     : Boolean,
	duration     : {
		type   : Number,
		default: 5000
	},
	seamless     : Boolean
});
const slots = defineSlots();
const current = ref(0);
const percent = ref(0);
let autoTimer: any, percentTimer: any;
let startX = 0, offsetX = 0;

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

function moveTo(index: number) {
	percent.value = 0;
	current.value = index;
	containerRegulate();
	if (props.autoplay) {
		autoplay();
	}
}

function left(offset: number = 0) {
	if (current.value <= 0) {
		if (!props.seamless) {
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
		cont.value.style.transform = `translateX(${ currentIndex.value * -100 }%)`;
	}
}

// 内容容器偏移设置
function containerOffsetTrans(offset: number) {
	if (cont.value) {
		const container = cont.value as HTMLElement;
		container.style.transition = 'none';
		container.style.transform = `translateX(calc(${ currentIndex.value * -100 }% + ${ offset }px))`;
		container.offsetWidth;
		container.style.transition = '';
	}
}

// 生成绑定属性的组件节点
function getNewChild(node: any, _index: number) {
	const prop = {
		style: {
			width : '100%',
			height: '100%'
		},
		onTouchstart(e: TouchEvent) {
			const {clientX} = e.touches[0];
			if (props.autoplay) {
				percentTimer && clearTimeout(percentTimer);
				autoTimer && clearTimeout(autoTimer);
			}
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
			if (props.autoplay) {
				autoplay();
			}
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
	if (props.autoplay) {
		autoplay();
	}
});
onBeforeUnmount(() => {
	autoTimer && clearTimeout(autoTimer);
	percentTimer && clearTimeout(percentTimer);
});
</script>

<template>
	<div ref="swiper" class="vb-swiper">
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
		<slot name="indicator" :index="current" :moveTo="moveTo" :percent="percent" v-if="showIndicator && total">
			<ol class="swiper-indicator">
				<li
						:class="{'is-active': i === current + 1}" @click="moveTo(i - 1)"
						:style="`--bg-percent: ${percent}`"
						v-for="i in total">
				</li>
			</ol>
		</slot>
	</div>
</template>

<style scoped lang="scss">
.vb-swiper {
	position: relative;
	overflow: hidden;
	width: 100%;

	.swiper-container {
		display: -webkit-box;
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
		bottom: 0;
		left: 0;
		right: 0;
		height: 1em;
		margin: 0;
		padding: 0;
		list-style: none;
		z-index: 4;

		li {
			--ind-bg: hsla(var(--bulma-text-h), var(--bulma-text-s), var(--bulma-text-strong-l), .2);
			margin: 0 .1em;
			background: var(--ind-bg);
			border-radius: 2px;
			cursor: pointer;
			width: 1em;
			height: 4px;

			&.is-active {
				--bg-per: calc(var(--bg-percent, 0) * 1%);
				background: linear-gradient(to right, var(--bulma-primary) var(--bg-per, 0%), var(--bulma-dark) var(--bg-per, 0%));
			}
		}
	}
}
</style>