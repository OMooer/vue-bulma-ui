<script setup lang="ts">
import PreviewSource from './PreviewSource.vue';
import { computed, ref } from 'vue';

const emit = defineEmits(['upload', 'removed', 'error']);
const props = defineProps(['result', 'status', 'disabled']);
const isDragover = ref(false);
const isUploading = computed(() => {
	return props.status === 'start';
});
const isSuccessfully = computed(() => {
	return props.status === 'success';
});
const hasImageCompleted = computed(() => {
	return props.result && props.result.length;
});
const dragEvents = computed(() => {
	const events = {
		dragenter: (ev: Event) => {
			isDragover.value = true;
			ev.preventDefault();
		},
		dragleave: (ev: Event) => {
			if (ev.target === ev.currentTarget || !(ev as any)?.relatedTarget) {
				isDragover.value = false;
			}
			ev.preventDefault();
		}
	};
	if (!hasImageCompleted.value) {
		Object.assign(events, {
			dragover: (ev: Event) => {
				isDragover.value = true;
				ev.preventDefault();
			}
		});
	}
	return events;
});
const isDenyDrop = computed(() => {
	return hasImageCompleted.value && isDragover.value;
});
const classList = computed(() => {
	return {
		'is-error'   : props.status === 'error',
		'is-dragover': isDragover.value,
		'is-deny'    : isDenyDrop.value,
		'is-success' : isSuccessfully.value
	};
});

async function readFile(url: string) {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	const blob = new Blob([buffer]);
	return new File([blob], url.substring(url.lastIndexOf('/') + 1));
}

function pasteUpload(ev: ClipboardEvent) {
	if (isUploading.value || props.disabled) {
		return;
	}
	const items = ev.clipboardData && ev.clipboardData.items;
	let file;
	if (items && items.length) {
		for (let i = 0; i < items.length; i++) {
			if (items[i].type.indexOf('image') > -1) {
				file = items[i].getAsFile();
				break;
			}
		}
	}
	if (file) {
		parentUpload([file]);
	}
}

async function dragUpload(ev: DragEvent) {
	isDragover.value = false;
	if (isUploading.value || hasImageCompleted.value) {
		return;
	}
	const files = ev.dataTransfer && ev.dataTransfer.files;
	const items = ev.dataTransfer && ev.dataTransfer.items;
	const upFiles = [];
	// 文件跟拖拽对象二选一，优先识别文件
	if (files && files.length) {
		upFiles.push(...files);
	}
	else if (items && items.length) {
		for (let i = 0; i < items.length; i++) {
			// 只有可用地址的对象才通过远程读取后转为上传对象
			if (items[i].type.indexOf('uri-list') > -1) {
				const blob = await (new Promise(resolve => {
					items[i].getAsString((url: string) => {
						readFile(url).then((d) => {
							resolve(d);
						}).catch(() => {
							emit('error', true, 'file upload failed.');
						});
					});
				}));
				upFiles.push(blob);
			}
		}
	}

	parentUpload(upFiles);
}

function parentUpload(files: any[]) {
	if (files && files.length) {
		const ev = {
			target: {
				files
			}
		}
		emit('upload', ev);
	}
}

function parentTrigger(ev: Event) {
	document.getSelection()?.removeAllRanges();
	const parentEl = (ev.currentTarget as HTMLElement).parentNode as HTMLElement;
	parentEl && parentEl.click();
}

function remove() {
	emit('removed', 0);
}
</script>

<template>
	<div
			:contenteditable="!isDenyDrop && !disabled" class="special-upload" :class="classList" v-on="dragEvents"
			@paste.prevent="pasteUpload" @drop.prevent="dragUpload"
			@beforeinput.capture.prevent
			@click.prevent @dblclick.prevent="parentTrigger">
		<div class="focus-el">&nbsp;</div>
		<div class="upload-cont" contenteditable="false">
			<PreviewSource :source="result[0]" can-delete @delete="remove" v-if="result && result.length"/>
			<slot v-else>
				<p>在此按下<kbd>⌘</kbd>+<kbd>v</kbd>/<kbd>CTRL</kbd>+<kbd>v</kbd>
					粘贴图片上传<br>
					或者双击选择文件上传</p>
			</slot>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

.special-upload {
	@include file-bg-color();
	overflow: hidden;
	margin: .5rem 0;
	border-radius: $radius;
	border: dashed 1px $split-color;

	&:hover {
		border-color: $link;
	}

	&:focus, &.is-dragover {
		outline: solid 1px $link;
		border-color: transparent;
		box-shadow: 0 0 0 0.2em rgba($link, .25);
	}

	&.is-success {
		border-style: solid;
	}

	// 不允许拖动上传
	&.is-deny {
		position: relative;
		outline-color: $warning;
		border-color: $warning-light;
		box-shadow: 0 0 0 0.2em rgba($warning, .25);

		&::before {
			content: "";
			position: absolute;
			background-color: rgba($warning-dark, .25);
			top: 0;
			right: 0;
			z-index: 10;
			width: 100%;
			height: 100%;
		}
	}

	.focus-el {
		overflow: hidden;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.upload-cont {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		text-align: center;
		width: 100%;
		min-height: 10rem;

		p {
			font-size: .875rem;
			color: $grey;
		}

		kbd {
			margin: 0 5px;
			padding: 0 .5em;
			border: solid 1px $grey-lightest;
			background-color: $grey;
			border-radius: $radius;
			box-shadow: 1px 1px 1px 0 $grey-light;
			line-height: 1;
			font-size: .75rem;
			color: $white;
		}

		&:has(.image-source) {
			padding: 0;

		}

		:deep(.image-source) {
			margin-bottom: 0;
		}
	}

	&.is-error {
		border: solid 1px $danger;

		&:focus {
			outline-color: $danger;
			border-color: transparent;
			box-shadow: 0 0 0 0.2em rgba($danger, .25);
		}

		.upload-cont {
			background-color: $danger-light;
		}
	}
}
</style>