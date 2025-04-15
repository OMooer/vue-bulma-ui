<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, onMounted, ref, watch } from 'vue';

const {list = []} = defineProps<{
	list: VBGuide.GuideItem[]
}>();
const emit = defineEmits(['exit']);

const {$vbt} = useUILocale();
const show = ref(false);
const current = ref(-1);
const watchIndex = ref(-1);
// 引导信息配置
const guideConfig = ref<VBGuide.GuideStyle>({});
// 当前步骤数据
const currentItem = computed(() => list[current.value]);
// 是否最后一项
const isLast = computed(() => current.value === list.length - 1);
// 当前目标信息
const targetRect = computed(() => {
	const tar = getTarget(current.value);
	// 目标不存在，返回空值
	if (!tar) {
		return {
			top: 0, left: 0, bottom: 0, right: 0,
		};
	}

	// 获取目标对象的视口信息
	const viewRect = tar.getBoundingClientRect();

	return {
		top   : viewRect.top + 'px',
		left  : viewRect.left + 'px',
		bottom: viewRect.bottom + 'px',
		right : viewRect.right + 'px',
	}
});

const styleVar = computed(() => {
	const style: Normal.AnyObj = {};
	if (list.length && currentItem.value) {
		// 目标对象信息
		const config = guideConfig.value;
		// 高亮部分
		style['--g-m-x0'] = config.maskX?.[0] ?? targetRect.value.left;
		style['--g-m-y0'] = config.maskY?.[0] ?? targetRect.value.top;
		style['--g-m-x1'] = config.maskX?.[1] ?? targetRect.value.right;
		style['--g-m-y1'] = config.maskY?.[1] ?? targetRect.value.bottom;
		// 配置对象信息
		let {top, bottom, left, right, offsetX, offsetY} = config;

		// 如果没有设置位置信息则以目标对象的位置设置
		top ??= targetRect.value.bottom as string;
		left ??= targetRect.value.left as string;

		top && (style['--g-top'] = top);
		bottom && (style['--g-bottom'] = bottom);
		left && (style['--g-left'] = left);
		right && (style['--g-right'] = right);
		offsetX && (style['--g-offset-x'] = offsetX);
		offsetY && (style['--g-offset-y'] = offsetY);
	}
	return style;
});

watch(watchIndex, async (now, old) => {
	let beforeUpdated = false;
	// 之前离开后执行
	list[old]?.after?.(old < now ? 'next' : 'prev', getTarget(old));
	// 新的进入前执行
	const before = list[now]?.before ?? (() => Promise.resolve());
	const fn = before(getTarget(now));
	if (fn instanceof Promise) {
		await fn.then((conf) => {
			if (conf && Object.keys(conf).length) {
				// 更新引导配置信息
				Object.assign(guideConfig.value, conf);
				beforeUpdated = true;
			}
			current.value = now;
		});
	}
	else {
		current.value = now;
	}

	// 没有返回新的信息就从配置里获取
	if (!beforeUpdated) {
		const {top, bottom, left, right, offsetX, offsetY, maskX, maskY} = currentItem.value;
		Object.assign(guideConfig.value, {top, bottom, left, right, offsetX, offsetY, maskX, maskY});
	}
});

function getTarget(index: number) {
	let tar = list[index]?.target;
	if (typeof tar === 'string') {
		tar = document.querySelector(tar || 'htmlBody') as HTMLElement;
	}
	return tar;
}

function next() {
	if (current.value < list.length - 1) {
		watchIndex.value++;
	}
	else {
		exit();
	}
}

function prev() {
	if (current.value > 0) {
		watchIndex.value--;
	}
}

function exit(e: string = 'exit') {
	currentItem.value?.after?.(e, getTarget(current.value));
	show.value = false;
	emit('exit', e);
}

onMounted(() => {
	show.value = true;
	requestAnimationFrame(() => {
		next();
	});
});
</script>

<template>
	<div class="vb-guide" :style="styleVar" @wheel.prevent.stop v-if="show">
		<div class="notification is-link" v-if="currentItem">
			<div class="block is-size-7">
				<h2 class="title is-6 mb-2" v-if="currentItem?.title">
					{{ currentItem?.title }}
				</h2>
				<template v-if="$slots[`step${current}`] || ($slots[`stepEnd`] && isLast)">
					<slot :name="`stepEnd`" :content="currentItem?.content" v-if="$slots[`stepEnd`] && isLast"/>
					<slot :name="`step${current}`" :content="currentItem?.content" v-else/>
				</template>
				<p v-else>{{ currentItem?.content }}</p>
			</div>
			<div class="is-flex is-align-items-center">
				<div class="is-size-7 p-2" v-if="!isLast">{{ current + 1 }}/{{ list.length }}</div>
				<div class="buttons is-right is-flex-grow-1">
					<button class="button is-small is-link" @click="prev" :disabled="current === 0" v-if="!isLast">
						{{ $vbt('guide.prev') }}
					</button>
					<button class="button is-small is-link is-inverted" @click="exit('skip')" v-if="!isLast">
						{{ $vbt('guide.exit') }}
					</button>
					<button class="button is-small" :class="isLast ? 'is-success is-fullwidth': 'is-info'" @click="next">
						{{ currentItem?.buttonText || (isLast ? $vbt('guide.finish') : $vbt('guide.next')) }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-guide {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 9997;
	background: rgba(0, 0, 0, 0.7);
	mask-image: linear-gradient(black var(--g-m-y0), transparent var(--g-m-y0), transparent var(--g-m-y1), black var(--g-m-y1)),
	linear-gradient(to right, black var(--g-m-x0), transparent var(--g-m-x0), transparent var(--g-m-x1), black var(--g-m-x1));

	.notification {
		--bulma-notification-padding: 0.75rem;
		position: absolute;
		z-index: 10;
		margin-top: .25em;
		top: var(--g-top, 50%);
		bottom: var(--g-bottom);
		left: var(--g-left, 50%);
		right: var(--g-right);
		max-width: 60%;
		box-shadow: var(--bulma-shadow);
		transform: translate(var(--g-offset-x, 0), var(--g-offset-y, 0));
	}
}
</style>