<script setup lang="ts">
import { ExifOperator } from '@imnull/exif';
import { webRequestImageBlob } from '@imnull/imgkit-web';
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { debounce, flattenVNode, isPromise, scaleGenerator } from '../../../utils';
import Loading, { AnimateDot } from '../../loading';

const {current = 0, list = [], maskClose, showSide = true, showZoom, showToolbar = true, confirmRemove} = defineProps<{
	current?: number;
	list: (string | Normal.PhotoObj)[];
	maskClose?: boolean;
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
const isFullscreen = ref(!!document.fullscreenElement);
const photoIsReady = ref(false);
const photoScaleRatio = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);

const currentPhoto = computed(() => photos.value?.[currentIndex.value]);
const currentPhotoExif = ref();
const showExifInfo = ref(false);
watchEffect(() => {
	if (currentPhoto.value?.origin) {
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

const scale = computed(() => {
	return scaleGenerator(photoScaleRatio.value);
});
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

watch(() => photoScaleRatio.value, () => {
	offsetX.value = offsetY.value = 0;
});

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
	showExifInfo.value = false;
	currentIndex.value = index;
	photoScaleRatio.value = 0;
	offsetX.value = offsetY.value = 0;
}

function deletePhoto(index: number) {
	const cb = confirmRemove && isPromise(confirmRemove) ? confirmRemove : (() => Promise.resolve());
	cb().then(
			() => {
				emit('delete', index);
				photoIsReady.value = false;
				photos.value?.splice(index, 1);
				if (!photos.value?.length) {
					emit('close');
					return;
				}
				if (currentIndex.value >= photos.value?.length) {
					currentIndex.value = photos.value?.length - 1;
				}
			}
	);
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

function zoomIn() {
	photoScaleRatio.value++;
	if (photoScaleRatio.value > 5) {
		photoScaleRatio.value = 5;
	}
}

function zoomOut() {
	photoScaleRatio.value--;
	if (photoScaleRatio.value < -4) {
		photoScaleRatio.value = -4;
	}
}

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

function movePhoto(e: any) {
	e.preventDefault();
	const target = mainer.value?.querySelector('figure img') as HTMLElement;
	const {width = 0, height = 0, top = 0, bottom = 0, left = 0, right = 0} = target?.getBoundingClientRect() ?? {};
	mainRect ??= getMainRect();
	// 正值是减，负值是加
	// x轴允许滚动
	if (width > mainRect.width) {
		// 目标到右边界不再移动
		if (e.deltaX > 0 && right <= mainRect.right) {
			return;
		}
		// 目标到左边界则不再移动
		if (e.deltaX < 0 && left >= mainRect.left) {
			return;
		}
		offsetX.value -= e.deltaX;
	}
	// y轴允许滚动
	if (height > mainRect.height) {
		// 目标到底部边界则不再移动
		if (e.deltaY > 0 && bottom <= mainRect.bottom) {
			return;
		}
		// 目标到顶部边界则不再移动
		if (e.deltaY < 0 && top >= mainRect.top) {
			return;
		}
		offsetY.value -= e.deltaY;
	}
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
			<a class="vb-gallery__delete delete" aria-label="Close" @click="exit"></a>
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
					@wheel.prevent.stop @click="maskClickHandler">
				<figure @wheel="movePhoto" :style="`transform: translate(${offsetX}px, ${offsetY}px)`">
					<Loading @wheel.stop.prevent v-if="!photoIsReady">
						<AnimateDot class="rainbow"/>
					</Loading>
					<img :src="currentPhoto?.origin" :alt="currentPhoto?.name" @load="ready" @click.stop v-show="photoIsReady"/>
				</figure>

				<!-- 缩放工具 -->
				<div class="vb-gallery__zoom" @click.stop v-if="showZoom">
					<a :class="{'is-disabled': photoScaleRatio <= -4}" @click="zoomOut">
						<FasIcon icon="magnifying-glass-minus" size="xl"/>
					</a>
					<a :class="{'is-disabled': photoScaleRatio === 0}" @click="photoScaleRatio=0">
						<FasIcon icon="magnifying-glass" size="xl"/>
					</a>
					<a :class="{'is-disabled': photoScaleRatio >= 5}" @click="zoomIn">
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
						<div class="tool-item">
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
	z-index: 40;
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
		}
	}

	&__delete {
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

		figure {
			display: flex;
			align-items: center;
			user-select: none;
			margin: auto;
			max-width: 100%;
			max-height: 100%;

			img {
				display: block;
				transform: scale(var(--scale, 1));
			}

			&:hover + .vb-gallery__tools {
				transform: translateY(0);
			}
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
			width: 100%;
			height: 5em;

			&__item {
				width: 5em;
			}
		}

		&__zoom {
			display: none;
		}
	}
}
</style>