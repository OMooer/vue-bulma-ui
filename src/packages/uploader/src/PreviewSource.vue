<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, inject, ref } from 'vue';
import Gallery from '../../gallery';

interface Props {
	source: string | { name: string; url: string };
	canDelete?: boolean;
	forceFile?: boolean;
	isSmall?: boolean;
}

const {$vbt} = useUILocale();
const isParentSmall = inject('isSmall', ref(false));
const props = defineProps<Props>();
const emit = defineEmits(['delete']);

const isReallySmall = computed(() => isParentSmall.value || props.isSmall);
const sourceName = computed(() => {
	if (typeof props.source === 'object') {
		return props.source?.name || props.source?.url;
	}
	return props.source.substring(props.source.lastIndexOf('/') + 1) || $vbt('uploader.preview.show');
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
		<a class="file-label" :href="sourceUrl" download rel="external" target="_blank" @click.stop v-else>
			<span class="file-cta">
				<span class="file-icon"><FasIcon icon="file-arrow-down"/></span>
			</span>
			<span class="file-name">{{ sourceName }}
			</span>
			<button
					type="button" class="file-delete button is-ghost" :class="{'is-small' : isReallySmall}"
					@click.stop.prevent="deleteSource" v-if="canDelete">
					<span class="icon is-small">
						<FasIcon icon="trash-can"/>
					</span>
			</button>
		</a>
	</div>
	<!-- 预览 -->
	<Gallery
			:list="[{origin:sourceUrl, name:sourceName}]"
			:show-side="false" show-zoom mask-close
			@close="isPreview = false"
			v-if="isPreview">
		<template #tools>
			<a class="trash-upload" @click="deleteSource" v-if="canDelete">
				<FasIcon icon="trash-can"/>
			</a>
		</template>
	</Gallery>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

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

		&:hover:not(:has(.file-delete:hover)) {
			.file-name {
				color: var(--bulma-link);
				text-decoration: underline;
			}
		}
	}

	.file-name {
		padding-right: 2em;
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
		padding-left: 0.5em;
		height: 100%;

		&:hover {
			color: va.$danger;
		}

		&:focus {
			box-shadow: none;
		}
	}
}

.image-source {
	width: 100%;
	height: 100%;

	.image {
		background-color: va.$light;
		min-width: 4.5rem;
		min-height: 3rem;
		width: fit-content;
		max-width: 100%;
		max-height: 100%;
	}
}

.trash-upload {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 1rem;
	box-sizing: border-box;
	font-size: 1.5rem;
	color: va.$white;

	&:hover {
		color: va.$danger;
	}
}
</style>
