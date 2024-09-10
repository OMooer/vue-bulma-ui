<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import Modal from '../../modal';

declare interface Props {
	source: string | { name: string; url: string };
	canDelete?: boolean;
	forceFile?: boolean;
	isSmall?: boolean;
}

const isParentSmall = inject('isSmall', false);
const props = defineProps<Props>();
const emit = defineEmits(['delete']);

const isReallySmall = computed(() => isParentSmall || props.isSmall);
const sourceName = computed(() => {
	if (typeof props.source === 'object') {
		return props.source?.name || props.source?.url;
	}
	return props.source.substring(props.source.lastIndexOf('/') + 1) || '点击查看';
});
const sourceUrl = computed(() => {
	let _url = props.source as string;
	if (typeof props.source === 'object') {
		_url = props.source?.url || 'about:blank' as string;
	}
	if (_url === 'about:blank' || _url.startsWith('data:') || _url.startsWith('http') || _url.startsWith('/')) {
		return _url;
	}
	return '//' + _url;
});
const isImage = computed(() => {
	const dotPosition = sourceUrl.value.lastIndexOf('.');
	const extName = sourceUrl.value.substring(dotPosition + 1);
	return !props.forceFile && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extName.toLowerCase());
});

const isPreview = ref(false);

function showPreview() {
	isPreview.value = true;
}

function deleteSource() {
	emit('delete');
}
</script>

<template>
	<div :class="isImage ? 'image-source' : ['file-source file', {'is-small': isReallySmall}]" v-bind="$attrs">
		<!-- 图片形式 -->
		<figure class="image" v-if="isImage">
			<img :src="sourceUrl" :alt="sourceName" @click="showPreview">
		</figure>
		<!-- 文件形式 -->
		<a class="file-label" :href="sourceUrl" download rel="external" v-else>
			<span class="file-cta">
				<span class="file-icon"><FasIcon icon="file-arrow-down"/></span>
			</span>
			<span class="file-name">{{ sourceName }}
				<button type="button" class="file-delete button is-ghost" :class="{'is-small' : isReallySmall}" @click.stop.prevent="deleteSource" v-if="canDelete">
					<FasIcon icon="trash-can"/>
				</button>
			</span>
		</a>
	</div>
	<!-- 预览 -->
	<Modal mask-close style="width: auto" @close="isPreview = false" v-if="isPreview">
		<div class="upload-preview">
			<figure class="image">
				<img :src="sourceUrl" :alt="sourceName">
			</figure>
			<a class="trash-upload" @click="deleteSource" v-if="canDelete">
				<FasIcon icon="trash-can"/>
			</a>
		</div>
	</Modal>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

.image-source, .file-source {
	margin-bottom: .25rem;
}

.file-source {
	position: relative;
	width: 100%;

	.file-label {
		flex-grow: 1;
		min-width: 10rem;

		.file-cta {
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;

			.file-icon {
				margin: 0;
			}
		}
	}

	.file-name {
		padding-right: 1.5em;
		flex-grow: 1;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		white-space: normal;
		max-width: 100%;
	}

	.file-delete {
		position: absolute;
		right: 0;
		top: 0;
		padding-left: 0;
		padding-right: 0;
		width: 1.5em;
		height: 100%;

		&:hover {
			color: $danger;
		}

		&:focus {
			box-shadow: none;
		}
	}
}

.image-source {
	min-width: 6rem;
	min-height: 4rem;
	background-color: $light;
	width: 100%;
	height: 100%;

	.image {
		width: fit-content;
		max-width: 100%;
		max-height: 100%;
	}
}

.upload-preview {
	overflow: hidden;
	margin: -1.5rem;
	border-radius: .25rem;

	&:hover {
		.trash-upload {
			transform: none;
		}
	}

	.image {
		width: fit-content;
		max-width: 100%;
		max-height: 100%;
	}


	.trash-upload {
		position: fixed;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		box-sizing: border-box;
		background-color: rgba(0, 0, 0, .5);
		font-size: 1.5rem;
		color: $white;
		bottom: 0;
		left: 0;
		right: 0;
		transform: translateY(100%);
		transition: transform .3s ease;

		&:hover {
			color: $danger;
		}
	}
}
</style>
