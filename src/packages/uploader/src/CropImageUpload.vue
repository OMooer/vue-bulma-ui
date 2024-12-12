<script setup lang="ts">
import { computed, inject, ref, useTemplateRef, watch } from 'vue';
import InteractiveTracker from '../../InteractiveTracker';
import PreviewSource from './PreviewSource.vue';

const {result, status = 'init'} = defineProps<{
	result?: any;
	status?: string;
}>();
const emit = defineEmits(['removed', 'error']);
const startUpload = inject('startUpload') as Function;
const setHooks = inject('setHooks') as Function;
const width = inject('width', 200);
const height = inject('height', 200);
const disabled = inject('disabled', ref(false));
const cropperStep = ref<'select' | 'crop' | 'confirm' | 'progress' | 'completed'>('select');
const isSubmitted = ref(false);
const tranX = ref(0);
const tranY = ref(0);
const scale = ref(1);
const brightSize = 0.6;
const sideSize = (1 - brightSize) / 2;
let originFormData: FormData | null = null;
const imageData = ref({
	key : '',
	data: null,
	name: '',
	type: ''
});
const imageCanvas = ref();
const cropImageResult = ref();
const isChanged = ref(true);
const promiseState = {
	resolve: (value: unknown) => {},
	reject : (reason?: string) => {}
};
const previewEl = useTemplateRef('preview');
const previewImage = computed(() => {
	if (!imageData.value?.data) {
		return null;
	}
	// 将本地文件数据生成图片预览
	return URL.createObjectURL(imageData.value.data);
});

watch(() => status, (s) => {
	if (s === 'error') {
		cropperStep.value = cropperStep.value === 'progress' ? 'crop' : 'select';
	}
	else if (s === 'success') {
		cropperStep.value = 'completed';
	}
});
watch([scale, tranX, tranY], () => {
	isChanged.value = true;
});

// 增加上传组件选择文件 Hook
if (setHooks) {
	setHooks('select', (file: FormData) => {
		// 如果已经是裁剪过的同一个文件，则直接返回裁剪结果
		if (!isSubmitted.value) {
			originFormData = file;
			// 选取出文件数据，只取第一张图片
			const [key, image] = file.entries().next().value;
			imageData.value = {
				key,
				data: image,
				name: image.name,
				type: image.type
			};
			cropperStep.value = 'crop';
		}

		return new Promise((resolve, reject) => {
			promiseState.resolve = resolve;
			promiseState.reject = reject;
		});
	});
}

function checkImageSafeRange() {
	const img = previewEl.value as HTMLImageElement;
	const imgSize = calcImageSize(img);
	const viewWidth  = width * brightSize,
	      viewHeight = height * brightSize;
	const sideHorizontal = width * sideSize,
	      sideVertical   = height * sideSize;
	const changes: (() => void)[] = [];
	// 如果图片宽高小于裁剪框宽高，则进行强制放大
	if (Math.round(imgSize.width) < viewWidth || Math.round(imgSize.height) < viewHeight) {
		const newScale = Number(Math.max(viewWidth / imgSize.renderWidth, viewHeight / imgSize.renderHeight).toFixed(3));
		changes.push(() => {
			scale.value = newScale;
			tranX.value = 0;
			tranY.value = 0;
		});
	}
	// 如果图片偏移超出了裁剪框范围，则进行强制偏移
	else {
		// x轴偏移
		if (imgSize.offsetLeft > sideHorizontal) {
			const leftDiff = imgSize.width / 2 - viewWidth / 2;
			changes.push(() => tranX.value = leftDiff / scale.value);
		}
		else if (imgSize.offsetRight > sideHorizontal) {
			const rightDiff = viewWidth / 2 - imgSize.width / 2;
			changes.push(() => tranX.value = rightDiff / scale.value);
		}
		// y轴偏移
		if (imgSize.offsetTop > sideVertical) {
			const topDiff = imgSize.height / 2 - viewHeight / 2;
			changes.push(() => tranY.value = topDiff / scale.value);
		}
		else if (imgSize.offsetBottom > sideVertical) {
			const bottomDiff = viewHeight / 2 - imgSize.height / 2;
			changes.push(() => tranY.value = bottomDiff / scale.value);
		}
	}
	if (changes.length) {
		resetToSafe(() => {
			changes.forEach((fn) => fn());
		});
	}
}

function resetToSafe(fn: () => void) {
	const image = previewEl.value as HTMLImageElement;
	image.style.transition = 'transform .3s .2s ease';
	fn();
	setTimeout(() => {
		image.style.transition = null as unknown as string;
	}, 600);
}

function calcImageSize(img: HTMLImageElement) {
	// 获取图片与父容器的位置数据
	const parentRect = img.parentElement?.getBoundingClientRect();
	const imgRect = img.getBoundingClientRect();
	// 获取图片原始宽高
	const naturalWidth = img.naturalWidth, naturalHeight = img.naturalHeight;
	// 计算图片宽高比
	const viewWidRatio = naturalWidth / imgRect.width,
	      viewHeiRatio = naturalHeight / imgRect.height;
	// 获取图片的边距偏移
	const offsetLeft   = imgRect.left - (parentRect?.left ?? 0),
	      offsetTop    = imgRect.top - (parentRect?.top ?? 0),
	      offsetRight  = (parentRect?.right ?? 0) - imgRect.right,
	      offsetBottom = (parentRect?.bottom ?? 0) - imgRect.bottom;

	return {
		offsetLeft,
		offsetTop,
		offsetRight,
		offsetBottom,
		widthRatio  : viewWidRatio,
		heightRatio : viewHeiRatio,
		renderWidth : img.offsetWidth,
		renderHeight: img.offsetHeight,
		naturalWidth,
		naturalHeight,
		width       : imgRect.width,
		height      : imgRect.height
	}
}

function createCropCanvas(img: HTMLImageElement) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	canvas.width = width;
	canvas.height = height;
	const imgSize = calcImageSize(img);
	let offsetLeft = width * sideSize - imgSize.offsetLeft,
	    offsetTop  = height * sideSize - imgSize.offsetTop;
	const cropWidth  = width * brightSize,
	      cropHeight = height * brightSize;
	ctx?.drawImage(img,
			Math.ceil(offsetLeft * imgSize.widthRatio),
			Math.ceil(offsetTop * imgSize.heightRatio),
			Math.floor(cropWidth * imgSize.widthRatio),
			Math.floor(cropHeight * imgSize.heightRatio),
			0, 0, width, height);
	return canvas;
}

function cropImage() {
	// 重新触发上传事件
	if (isSubmitted.value) {
		startUpload(originFormData);
	}
	// 如果没有更改过则不需要再裁剪
	if (isChanged.value) {
		// 通过 canvas 裁剪
		imageCanvas.value = createCropCanvas(previewEl.value as HTMLImageElement);
		cropImageResult.value = imageCanvas.value.toDataURL(imageData.value.type || 'image/png', 1);
	}
	cropperStep.value = 'confirm';
}

function confirmImage() {
	imageCanvas.value.toBlob((blob: Blob) => {
		if (!blob) {
			return promiseState.reject();
		}
		const formData = new FormData();
		formData.append(imageData.value.key, blob, imageData.value.name);
		promiseState.resolve(formData);
		cropperStep.value = 'progress';
		// 添加一个已经提交上传过的标记
		isSubmitted.value = true;
		isChanged.value = false;
	}, imageData.value.type || 'image/png', 1);
}

function cancelImage() {
	promiseState.reject();
	originFormData = null;
	imageData.value = null as any;
	cropperStep.value = 'select';
	isSubmitted.value = false;
	tranX.value = 0;
	tranY.value = 0;
	scale.value = 1;
}

function remove() {
	cancelImage();
	emit('removed', 0);
}
</script>

<template>
	<div class="crop-image" :class="{'is-danger': status === 'error', 'is-disabled': disabled}">
		<template v-if="cropperStep === 'completed'">
			<div class="upload-result" @click.stop.prevent>
				<PreviewSource :source="result[0]" can-delete @delete="remove" v-if="result && result.length"/>
			</div>
		</template>
		<template v-else-if="cropperStep === 'progress' || cropperStep === 'confirm'">
			<div class="crop-result" @click.stop.prevent>
				<figure class="image image-opacity-bg" :style="{width:`${width}px`, height:`${height}px`}">
					<img :src="cropImageResult" :alt="imageData.name"/>
				</figure>
				<div class="buttons">
					<button
							type="button" class="button is-small is-light" :disabled="cropperStep === 'progress' || disabled"
							@click="cropperStep = 'crop'">返回
					</button>
					<button type="button" class="button is-small is-ghost" :disabled>
						{{ cropperStep === 'confirm' ? '等待上传' : '正在上传' }}
					</button>
					<button
							type="button" class="button is-small is-primary" :class="{'is-loading': cropperStep === 'progress'}"
							:disabled @click="confirmImage">确定上传
					</button>
				</div>
			</div>
		</template>
		<template v-else-if="cropperStep === 'crop'">
			<div class="cropper" @click.stop.prevent>
				<InteractiveTracker
						class="cropper__image-container image-opacity-bg" @end="checkImageSafeRange"
						:style="{width:`${width}px`, height:`${height}px`, '--scale': scale, '--x': `${tranX}px`, '--y': `${tranY}px`}"
						v-model:scale="scale" v-model:x="tranX" v-model:y="tranY"
				>
					<img ref="preview" :src="previewImage" alt="preview" @load="checkImageSafeRange" v-if="previewImage"/>
				</InteractiveTracker>
				<div class="cropper__controller">
					<label class="is-flex is-gap-0.5">
						<span class="is-size-7">缩放</span>
						<input
								type="range" min="0.1" max="3" step="0.1" :disabled @change="checkImageSafeRange"
								v-model.number="scale">
						<span class="is-size-7">{{ Math.round(scale * 100) }}%</span>
					</label>
					<div class="buttons">
						<button type="button" class="button is-small" :disabled @click="cancelImage">取消</button>
						<button type="button" class="button is-small is-dark" :disabled @click="cropImage">确定</button>
					</div>
				</div>
			</div>
		</template>
		<template v-else>
			<div class="select-image" :style="{width:`${width}px`, height:`${height}px`}">
				<FasIcon icon="circle-plus" size="2xl"/>
			</div>
		</template>
	</div>
</template>

<style scoped lang="scss">
.crop-image {
	border-radius: var(--bulma-radius);

	&.is-disabled {
		.select-image {
			border-color: var(--bulma-background);
			color: var(--bulma-text-weak);
		}

		.cropper {
			opacity: .5;

			&__image-container {
				border-color: var(--bulma-background);
				box-shadow: none;
			}
		}

		.crop-result {
			opacity: .5;

			figure {
				border-color: var(--bulma-background);
				box-shadow: none;
			}
		}
	}

	.image-opacity-bg {
		background-color: #FFF;
		background-image: linear-gradient(45deg, #CCC 25%, transparent 25%, transparent 75%, #CCC 75%, #CCC), linear-gradient(45deg, #CCC 25%, transparent 25%, transparent 75%, #CCC 75%, #CCC);
		background-size: 12px 12px;
		background-position: 0 0, 6px 6px;
	}

	.select-image {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		background-color: var(--bulma-background);
		border: 1px dashed var(--bulma-border);
		border-radius: inherit;
		cursor: pointer;

		&:hover {
			border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
		}
	}

	&.is-danger .select-image {
		border-color: hsl(var(--bulma-danger-h), var(--bulma-danger-s), var(--bulma-danger-l));
	}

	.upload-result {
		overflow: hidden;
		border: solid 1px var(--bulma-border);
		border-radius: inherit;

		:deep(.image-source) {
			margin: 0;
		}
	}

	.crop-result {
		display: flex;
		flex-direction: column;
		gap: .5em;
		border-radius: inherit;

		figure {
			overflow: hidden;
			border: 1px solid hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
			border-radius: inherit;
		}

		.buttons {
			justify-content: center;
			width: 100%;

			.button {
				flex-grow: 1;

				&.is-ghost {
					cursor: default;
				}
			}
		}
	}

	.cropper {
		border-radius: inherit;

		&__image-container {
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			border: 1px solid hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
			border-radius: inherit;
			user-select: none;

			&::after {
				content: '';
				position: absolute;
				inset: 0;
				background: rgba(0, 0, 0, 0.7);
				mask-image: linear-gradient(black 20%, transparent 20%, transparent 80%, black 80%), linear-gradient(to right, black 20%, transparent 20%, transparent 80%, black 80%);
			}

			img {
				display: block;
				transform: scale(var(--scale)) translate(var(--x), var(--y));
				max-width: 100%;
				max-height: 100%;
			}
		}

		&__controller {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.75em;
			margin-top: .5em;

			input[type=range] {
				width: 6.25rem;
			}
		}
	}
}
</style>