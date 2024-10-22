<script setup lang="ts">
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { isPromise, scaleGenerator } from '../../../utils';
import Loading, { AnimateDot } from '../../loading';

const {current = 0, list = [], showSide = true, confirmRemove} = defineProps<{
	current: number;
	list: (string | Normal.PhotoObj)[];
	showSide?: boolean;
	confirmRemove?: () => Promise<void>;
}>();
const emit = defineEmits(['close', 'delete']);

const gallery = useTemplateRef<HTMLElement>('galleryRef');
const sidebar = useTemplateRef<HTMLElement>('sideRef');
const mainer = useTemplateRef<HTMLElement>('mainRef');
const photos = ref<Normal.PhotoObj[]>([]);
watchEffect(() => {
	photos.value = list.map((item: any) => {
		if (typeof item === 'string') {
			return {
				small : item,
				origin: item
			}
		}
		return item;
	});
});
const currentIndex = ref(current);
watch(() => currentIndex.value, () => {
	nextTick(scrollSidebar);
}, {immediate: true});
const isFullscreen = ref(!!document.fullscreenElement);
const photoIsReady = ref(false);
const photoScaleRatio = ref(0);
const offsetX = ref(0);
const offsetY = ref(0);

const currentPhoto = computed(() => photos.value?.[currentIndex.value]);
const scale = computed(() => {
	return scaleGenerator(photoScaleRatio.value);
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

function movePhoto(e: any) {
	e.preventDefault();
	const target = mainer.value?.querySelector('figure img') as HTMLElement;
	const {width = 0, height = 0} = target?.getBoundingClientRect() ?? {};
	const wrapWidth = mainer.value?.offsetWidth ?? document.documentElement.clientWidth;
	const wrapHeight = mainer.value?.offsetHeight ?? document.documentElement.clientHeight;
	// 正值是减，负值是加
	// x轴允许滚动
	if (width > wrapWidth) {
		offsetX.value -= e.deltaX;
	}
	// y轴允许滚动
	if (height > wrapHeight) {
		offsetY.value -= e.deltaY;
	}
}

onBeforeMount(() => {
	document.addEventListener('fullscreenchange', () => {
		isFullscreen.value = !!document.fullscreenElement;
	})
});
onBeforeUnmount(() => {
	document.removeEventListener('fullscreenchange', () => {
		isFullscreen.value = !!document.fullscreenElement;
	})
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
						<img :src="item.small" :alt="index.toString()">
					</figure>
				</a>
			</div>
			<div ref="mainRef" class="vb-gallery__main" :style="`--scale: ${scale}`" @wheel.prevent.stop>
				<figure @click.stop @wheel="movePhoto" :style="`transform: translate(${offsetX}px, ${offsetY}px)`">
					<Loading @wheel.stop.prevent v-if="!photoIsReady">
						<AnimateDot class="rainbow"/>
					</Loading>
					<img :src="currentPhoto?.origin" alt="" @load="ready" v-show="photoIsReady"/>
				</figure>

				<!-- 工具栏 -->
				<div class="vb-gallery__tools" @click.stop @wheel.stop.prevent v-if="photoIsReady">
					<slot name="tools" :remove="() => deletePhoto(currentIndex)" :fullscreen="fullscreen">
						<div class="tool-item">
							<a aria-label="delete photo" @click="deletePhoto(currentIndex)">
								<FasIcon icon="trash-can" size="xl"/>
							</a>
						</div>
						<div class="tool-item is-grouped">
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
						<div class="tool-item">
							<a aria-label="toggle fullscreen" @click="fullscreen">
								<FasIcon :icon="isFullscreen ? 'compress' : 'expand'" size="xl"/>
							</a>
						</div>
						<div class="tool-item">
							<a :href="currentPhoto?.origin" target="_blank" download="download" aria-label="download photo">
								<FasIcon icon="download" size="xl"/>
							</a>
						</div>
					</slot>
				</div>
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

	&.is-fullscreen {
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

	&__tools {
		position: absolute;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: space-evenly;
		gap: 1em;
		padding: .7em 1em .3em;
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
			}

			&.is-grouped {
				display: flex;
				gap: .5em;
			}
		}
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
	}
}
</style>