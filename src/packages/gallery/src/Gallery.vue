<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { ExifOperator } from '@imnull/exif';
import { webRequestImageBlob } from '@imnull/imgkit-web';
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch, watchEffect } from 'vue';
import {
	debounce,
	EVENT_TO_BOTTOM,
	EVENT_TO_LEFT,
	EVENT_TO_RIGHT, EVENT_TO_TOP,
	flattenVNode,
	isPromise,
	scaleGenerator
} from '@/utils';
import Loading, { AnimateDot } from '../../loading';
import InteractiveTracker from '../../InteractiveTracker';

const {
	      current     = 0,
	      list        = [],
	      maskClose,
	      showExif,
	      showSide    = true,
	      showZoom,
	      showToolbar = true,
	      confirmRemove
      } = defineProps<{
	current?: number;
	list: (string | Normal.PhotoObj)[];
	maskClose?: boolean;
	showExif?: boolean;
	showSide?: boolean;
	showZoom?: boolean;
	showToolbar?: boolean;
	confirmRemove?: () => Promise<void>;
}>();
const emit = defineEmits(['close', 'delete']);
const slots = defineSlots();

const gallery = useTemplateRef<HTMLElement>('galleryRef');
const sidebar = useTemplateRef<HTMLElement>('sideRef');
const mainer = useTemplateRef<HTMLElement>('mainRef');
const {$vbt} = useUILocale();
const photos = ref<Normal.PhotoObj[]>([]);
watchEffect(() => {
	photos.value = list.map((item: any) => {
		if (typeof item === 'string') {
			return {
				name  : item.substring(item.lastIndexOf('/') + 1),
				small : item,
				origin: item
			}
		}
		let {name, small, origin} = item;
		if (!small && origin) {
			small = origin;
		}
		if (small && !origin) {
			origin = small;
		}
		name ??= origin.substring(origin.lastIndexOf('/') + 1);
		return {
			name,
			small,
			origin
		};
	});
});
const currentIndex = ref(current);
watch(() => currentIndex.value, () => {
	nextTick(scrollSidebar);
}, {immediate: true});
let mainRect: any;
let moveDirection: { x: string; y: string } = {x: '', y: ''};
const isFullscreen = ref(!!document.fullscreenElement);
const photoIsReady = ref(false);
const photoIsFailed = ref(false);
const photoScaleRatio = ref(0);
const scale = ref(1);
const minScaleRatio = 0;
const maxScaleRatio = 5;
const offsetX = ref(0);
const offsetY = ref(0);

const currentPhoto = computed(() => photos.value?.[currentIndex.value]);
const currentPhotoExif = ref();
const showExifInfo = ref(false);
watchEffect(() => {
	if (currentPhoto.value?.origin && showExif) {
		(async () => {
			currentPhotoExif.value = await getPhotoExif(currentPhoto.value?.origin as string);
		})();
	}
});

async function getPhotoExif(url: string) {
	try {
		const fileBlob = await webRequestImageBlob(url);
		const fileReader = new FileReader();
		fileReader.readAsArrayBuffer(fileBlob);
		const buf = await new Promise<ArrayBuffer>((resolve) => {
			fileReader.onload = () => {
				resolve(fileReader.result as ArrayBuffer);
			}
		});
		const of = new ExifOperator(buf);
		return of.getExif();
	}
	catch (e) {
		return null;
	}
}

const showTools = computed(() => {
	// 如果选项设置了不显示则直接不显示
	if (!showToolbar) {
		return false;
	}
	const tools = slots.tools;
	// 没有设置插槽显示默认的
	if (!tools) {
		return true;
	}
	// 有插槽且有内容就显示
	const len = flattenVNode(tools?.());
	return len.length > 0;
});

function getMainRect() {
	let {width, height, top, bottom, left, right} = mainer.value?.getBoundingClientRect() ?? {};
	width ??= document.documentElement.clientWidth;
	height ??= document.documentElement.clientHeight;
	top ??= 0;
	bottom ??= height;
	left ??= 0;
	right ??= width;

	return {
		width,
		height,
		top,
		bottom,
		left,
		right
	}
}

function imgBoundaryInfo() {
	const target = mainer.value?.querySelector('figure img') as HTMLElement;
	const {width = 0, height = 0, top = 0, bottom = 0, left = 0, right = 0} = target?.getBoundingClientRect() ?? {};
	mainRect ??= getMainRect();

	return {
		width,
		height,
		top,
		bottom,
		left,
		right,
		isOverflowWidth : width > mainRect.width,
		isOverflowHeight: height > mainRect.height,
		isNotLeftAlign  : left > mainRect.left,
		isNotTopAlign   : top > mainRect.top,
		isNotRightAlign : right < mainRect.right,
		isNotBottomAlign: bottom < mainRect.bottom
	}
}

function scrollSidebar() {
	const active = sidebar.value?.querySelector('.is-active');
	if (active) {
		let {
			    offsetTop   : top    = 0,
			    offsetLeft  : left   = 0,
			    offsetWidth : width  = 0,
			    offsetHeight: height = 0
		    } = active as HTMLElement;
		const halfWidth = (sidebar.value?.offsetWidth ?? 0) / 2;
		const halfHeight = (sidebar.value?.offsetHeight ?? 0) / 2;
		top -= halfHeight - height;
		left -= halfWidth - width;
		sidebar.value?.scrollTo({top, left, behavior: 'smooth'});
	}
}

function switchShow(index: number) {
	if (currentIndex.value === index) {
		return;
	}
	photoIsReady.value = false;
	photoIsFailed.value = false;
	showExifInfo.value = false;
	currentIndex.value = index;
	zoomReset();
}

function jumpPhoto(e: 'x' | 'y', {dir, detail}: Tracker.MoveEventData) {
	// 多指操作不执行跳转
	if (detail.multiple) {
		return;
	}
	// 如果滑动距离小于80px，则不进行跳转
	if (Math.abs(detail.offset) < 80) {
		return;
	}
	// 如果滑动的方向有超出容器的也不进行跳转
	const info = imgBoundaryInfo();
	if ((e === 'x' && info.isOverflowWidth) || (e === 'y' && info.isOverflowHeight)) {
		return;
	}
	// 在小屏上只接受 x 轴滑动，相反的只接受 y 轴滑动
	const clientWidth = document.documentElement.clientWidth;
	const smallScreen = 1024;
	if (clientWidth <= smallScreen && e === 'y') {
		return;
	}
	if (clientWidth > smallScreen && e === 'x') {
		return;
	}
	// 根据滑动的方向进行跳转
	let index: number;
	// 上一张
	if (dir === (e === 'x' ? EVENT_TO_RIGHT : EVENT_TO_TOP)) {
		index = (currentIndex.value - 1 + photos.value?.length) % photos.value?.length;
	}
	// 下一张
	else {
		index = (currentIndex.value + 1) % photos.value?.length;
	}
	switchShow(index);
}

function movePhoto(d: 'x' | 'y', n: number) {
	// 如果是低于一倍的缩小比例，则不进行移动
	if (photoScaleRatio.value < 1) {
		return;
	}
	// 获取容器与图片的边界信息
	const info = imgBoundaryInfo();
	// 如果展示图片的宽高并未超出容器，也不允许在该方向的移动
	if (!info.isOverflowWidth && d === 'x') {
		return;
	}
	if (!info.isOverflowHeight && d === 'y') {
		return;
	}

	// 允许移动，但不可以超出边界
	if (d === 'x') {
		if (
				(info.isNotLeftAlign && moveDirection.x === EVENT_TO_RIGHT)
				||
				(info.isNotRightAlign && moveDirection.x === EVENT_TO_LEFT)
		) {
			return;
		}
		offsetX.value = n;
	}
	if (d === 'y') {
		if (
				(info.isNotTopAlign && moveDirection.y === EVENT_TO_BOTTOM)
				||
				(info.isNotBottomAlign && moveDirection.y === EVENT_TO_TOP)
		) {
			return;
		}
		offsetY.value = n;
	}
}

function deletePhoto(index: number) {
	const cb = confirmRemove && isPromise(confirmRemove) ? confirmRemove : (() => Promise.resolve());
	cb().then(
			() => {
				emit('delete', index);
				photoIsReady.value = false;
				photoIsFailed.value = false;
				photos.value?.splice(index, 1);
				if (!photos.value?.length) {
					emit('close');
					return;
				}
				offsetX.value = offsetY.value = 0;
				if (currentIndex.value >= photos.value?.length) {
					currentIndex.value = photos.value?.length - 1;
				}
			}
	);
}

function fixPosition() {
	const info = imgBoundaryInfo();
	// 如果宽度小于容器那么 x 轴复位
	if (!info.isOverflowWidth) {
		offsetX.value = 0;
	}
	// 如果宽度大于容器且没有左对齐，那么进行对齐
	else if (info.isNotLeftAlign) {
		offsetX.value = info.width / 2 - mainRect.width / 2;
	}
	// 如果宽度大于容器且没有右对齐，那么进行对齐
	else if (info.isNotRightAlign) {
		offsetX.value = mainRect.width / 2 - info.width / 2;
	}
	// 如果高度小于容器那么 y 轴复位
	if (!info.isOverflowHeight) {
		offsetY.value = 0;
	}
	// 如果高度大于容器且没有上对齐，那么进行对齐
	else if (info.isNotTopAlign) {
		offsetY.value = info.height / 2 - mainRect.height / 2;
	}
	// 如果高度大于容器且没有下对齐，那么进行对齐
	else if (info.isNotBottomAlign) {
		offsetY.value = mainRect.height / 2 - info.height / 2;
	}
}

function ready() {
	photoIsReady.value = true;
}

function maskClickHandler() {
	if (maskClose) {
		exit();
	}
}

function fullscreen() {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	}
	else {
		gallery.value?.requestFullscreen();
	}
}

function exit() {
	if (document.fullscreenElement) {
		document.exitFullscreen();
	}
	emit('close');
}

// 放大
function zoomIn() {
	photoScaleRatio.value++;
	if (photoScaleRatio.value > maxScaleRatio) {
		photoScaleRatio.value = maxScaleRatio;
	}
	setScale();
}

// 缩小
function zoomOut() {
	photoScaleRatio.value--;
	if (photoScaleRatio.value < minScaleRatio) {
		photoScaleRatio.value = minScaleRatio;
	}
	setScale();
}

// 重置1倍
function zoomReset() {
	photoScaleRatio.value = 0;
	setScale();
}

// 设置缩放比例
function setScale() {
	offsetX.value = offsetY.value = 0;
	scale.value = scaleGenerator(photoScaleRatio.value);
}

function updateScale(s: number) {
	for (let i = minScaleRatio; i < maxScaleRatio; i++) {
		if (s < scaleGenerator(i)) {
			photoScaleRatio.value = Math.max(minScaleRatio, i - 1);
			break;
		}
		else if (i === maxScaleRatio) {
			photoScaleRatio.value = maxScaleRatio;
		}
	}
	scale.value = s;
}

function fullscreenChangeHandler() {
	isFullscreen.value = !!document.fullscreenElement;
}

function resizeHandler(e: Event) {
	// 如果窗口变得跟屏幕一样大，那么认为是使用了系统级的全屏，同样设置全屏状态
	if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
		if (!isFullscreen.value) {
			fullscreen();
		}
	}
	mainRect = getMainRect();
}

const resizeFn = debounce(resizeHandler, 300);

onBeforeMount(() => {
	document.addEventListener('fullscreenchange', fullscreenChangeHandler)
	window.addEventListener('resize', resizeFn)
});
onBeforeUnmount(() => {
	document.removeEventListener('fullscreenchange', fullscreenChangeHandler)
	window.removeEventListener('resize', resizeFn)
});
</script>

<template>
	<teleport to="body">
		<div ref="galleryRef" class="vb-gallery" :class="{'is-fullscreen': isFullscreen}">
			<a class="vb-gallery__close delete" aria-label="Close" @click="exit"></a>
			<div ref="sideRef" class="vb-gallery__side" v-if="showSide">
				<a
						class="vb-gallery__side__item" :class="{'is-active': index === currentIndex}" @click="switchShow(index)"
						v-for="(item, index) in photos" :key="item.small">
					<figure class="image is-3by2">
						<img :src="item.small" :alt="item.name">
					</figure>
				</a>
			</div>
			<div
					ref="mainRef" class="vb-gallery__main" :style="`--scale: ${scale}`"
					@wheel.prevent.stop @touchmove.prevent @click="maskClickHandler">
				<InteractiveTracker
						tag="figure" :style="`transform: translate(${offsetX}px, ${offsetY}px)`"
						:x="offsetX" :y="offsetY" :scale="scale"
						@direction="moveDirection = $event"
						@xSlide="jumpPhoto('x', $event)" @ySlide="jumpPhoto('y', $event)"
						@end="fixPosition"
						@update:scale="updateScale"
						@update:x="movePhoto('x', $event)"
						@update:y="movePhoto('y', $event)">
					<Loading :timeout="1000*60*10" v-if="!photoIsReady && !photoIsFailed">
						<AnimateDot class="rainbow"/>
					</Loading>
					<div class="vb-gallery__error" v-if="photoIsFailed">
						<img draggable="false" src="@/assets/bad_photo.png" alt="error"/>
						<p>{{ $vbt('gallery.error') }}</p>
					</div>
					<img
							draggable="false" :src="currentPhoto?.origin" :alt="currentPhoto?.name" @load="ready" @click.stop
							@error="photoIsFailed = true; photoIsReady = true;" v-show="photoIsReady" v-else/>
				</InteractiveTracker>

				<!-- 缩放工具 -->
				<div class="vb-gallery__zoom" @click.stop v-if="showZoom && !photoIsFailed">
					<a :class="{'is-disabled': photoScaleRatio <= minScaleRatio}" @click="zoomOut">
						<FasIcon icon="magnifying-glass-minus" size="xl"/>
					</a>
					<a :class="{'is-disabled': photoScaleRatio === 0}" @click="zoomReset">
						<FasIcon icon="magnifying-glass" size="xl"/>
					</a>
					<a :class="{'is-disabled': photoScaleRatio >= maxScaleRatio}" @click="zoomIn">
						<FasIcon icon="magnifying-glass-plus" size="xl"/>
					</a>
				</div>

				<!-- 工具栏 -->
				<div class="vb-gallery__tools" @click.stop @wheel.stop.prevent v-if="photoIsReady && showTools">
					<slot name="tools" :remove="() => deletePhoto(currentIndex)" :fullscreen="fullscreen">
						<div class="tool-item">
							<a aria-label="delete photo" @click="deletePhoto(currentIndex)">
								<FasIcon icon="trash-can" size="xl"/>
							</a>
						</div>
						<div class="tool-item is-fullscreen-btn">
							<a :class="{'is-toggle': isFullscreen}" aria-label="toggle fullscreen" @click="fullscreen">
								<FasIcon :icon="isFullscreen ? 'compress' : 'expand'" size="xl"/>
							</a>
						</div>
						<div class="tool-item">
							<a :href="currentPhoto?.origin" target="_blank" download="download" aria-label="download photo">
								<FasIcon icon="download" size="xl"/>
							</a>
						</div>
						<div class="tool-item" v-if="currentPhotoExif">
							<a :class="{'is-toggle': showExifInfo}" aria-label="photo exif" @click="showExifInfo = !showExifInfo">
								<FasIcon icon="circle-info" size="xl"/>
							</a>
						</div>
					</slot>
				</div>
			</div>
			<!-- Exif 信息 -->
			<div class="vb-gallery__exif-info" @click.stop v-if="currentPhotoExif" v-show="showExifInfo">
				<p v-for="[key, value] in Object.entries(currentPhotoExif)">
					{{ key }}: {{ value }}
				</p>
			</div>
		</div>
	</teleport>
</template>

<style scoped lang="scss">
.vb-gallery {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 100;
	background: hsla(var(--bulma-black-h), var(--bulma-black-s), var(--bulma-black-l), .95);
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: 1fr;
	grid-template-areas: "side main";

	:fullscreen &, &:fullscreen, &.is-fullscreen {
		grid-template-columns: 0 1fr;

		.vb-gallery__side {
			background: hsla(var(--bulma-black-h), var(--bulma-black-s), var(--bulma-black-l), .5);
			box-shadow: var(--bulma-shadow);
			transform: translateX(calc(-100% + .25em));
			z-index: 1;

			&:hover {
				transition: transform .3s ease;
				transform: translateX(0);
			}

			&:not(:hover)::-webkit-scrollbar {
				visibility: hidden;
			}
		}
	}

	&__close {
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
		z-index: 2;
	}

	&__side {
		grid-area: side;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: .75em;
		overflow: auto;
		padding: 1em 1.5em;
		width: 11em;
		border-right: solid 1px var(--bulma-grey-darker);
		overscroll-behavior: contain;
		transition: transform .3s ease 1s;

		&__item {
			flex: none;
			overflow: hidden;
			display: block;
			border-radius: var(--bulma-radius);
			background: #333;
			width: 100%;
			transition: outline-color .3s;

			img {
				opacity: .4;
				transition: opacity .3s;
			}

			&.is-active {
				outline: solid 3px var(--bulma-primary);

				img {
					opacity: 1;
				}
			}

			&:hover img {
				opacity: 1;
			}
		}
	}

	&__main {
		grid-area: main;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		overscroll-behavior: none;

		figure {
			display: flex;
			align-items: center;
			justify-content: center;
			user-select: none;
			overscroll-behavior: none;
			margin: auto;
			max-width: 100%;
			max-height: 100%;

			img {
				display: block;
				transform: scale(var(--scale, 1));
				background: #FEFEFE;
				overscroll-behavior: none;
				object-fit: contain;
				min-width: 1rem;
				min-height: 1rem;
				max-width: 100%;
				max-height: 100%;
			}

			&:hover + .vb-gallery__tools {
				transform: translateY(0);
			}
		}
	}

	&__error {
		display: flex;
		flex-direction: column;
		align-items: center;

		> img:not(.img) {
			background: none;
		}
	}

	&__zoom {
		position: fixed;
		z-index: 1;
		right: .5em;
		top: 50%;
		opacity: .25;
		display: flex;
		flex-direction: column;
		gap: 1em;
		padding: 1em .75rem;
		background: hsla(var(--bulma-black-h), var(--bulma-black-s), calc(var(--bulma-black-l) + 15%), .85);
		border-radius: var(--bulma-radius);
		transition: opacity .3s;
		transform: translateY(-50%);

		&:hover {
			opacity: 1;
		}

		a {
			color: var(--bulma-grey-light);

			&:hover {
				color: var(--bulma-white);
			}

			&.is-disabled {
				pointer-events: none;
				opacity: .3;
			}
		}
	}

	&__tools {
		position: absolute;
		bottom: 0;
		z-index: 3;
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		gap: 2em;
		padding: .7em 1.5em .3em;
		background: hsla(var(--bulma-black-h), var(--bulma-black-s), calc(var(--bulma-black-l) + 15%), .85);
		border-radius: var(--bulma-radius) var(--bulma-radius) 0 0;
		box-shadow: var(--bulma-shadow);
		height: 4em;
		min-width: 10vw;
		transform: translateY(93%);
		transition: transform .3s ease .5s;

		&:hover {
			transform: translateY(0);
			transition: transform .3s ease;
		}

		.tool-item {
			a {
				color: var(--bulma-grey-light);

				&:hover {
					color: var(--bulma-white);
				}

				&.is-disabled {
					pointer-events: none;
					opacity: .3;
				}

				&.is-toggle {
					color: var(--bulma-primary);
				}
			}
		}
	}

	&__exif-info {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		overflow: auto;
		margin: 1em 2em;
		padding: 1em;
		background: rgba(0, 0, 0, .8);
		border-radius: var(--bulma-radius);
		color: rgba(255, 255, 255, .8);
	}
}

@media screen and (max-width: 1024px) {
	.vb-gallery {
		grid-template-columns: 1fr;
		grid-template-rows: auto 1fr;
		grid-template-areas: "side" "main";

		&__side {
			flex-direction: row;
			white-space: nowrap;
			overflow-y: clip;
			width: 100%;
			height: 5em;

			&__item {
				width: 5em;
			}
		}

		&__zoom {
			display: none;
		}

		&__tools {
			.is-fullscreen-btn {
				display: none;
			}
		}
	}
}
</style>