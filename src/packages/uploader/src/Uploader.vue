<script setup lang="ts">
import { computed, ref } from 'vue';
import { abbrNumber, isTruthy } from '../../utils';
import PreviewSource from '../data/PreviewSource.vue';

defineOptions({
	inheritAttrs: false
});
const props = defineProps({
	id         : {
		type   : String,
		default: function() {
			return 'upload_' + Math.random().toString().substring(2);
		}
	},
	type       : {
		type   : String,
		default: 'file'
	},
	name       : {
		type   : String,
		default: 'uploadFile'
	},
	accept     : {
		type   : [String, Array],
		default: 'image/jpeg,image/jpg,image/gif,image/png'
	},
	modelValue : null,
	placeholder: {
		type   : String,
		default: '选择上传文件'
	},
	required   : [Boolean, String],
	disabled   : [Boolean, String],
	multiple   : [Boolean, String],
	max        : {
		type   : Number,
		default: 1024 * 1024 * 1 // 1M
	},
	limit      : {
		type   : Number,
		default: 0 // 不限制
	}
});
const emit = defineEmits(['update:modelValue', 'start', 'error', 'status']);
// 上传队列
const uploadQueue = ref<{ [propName: string]: any }[]>([]);
// 上传状态 init ready start success error complete
const uploadState = ref('init');
// 上传进度（模拟假的）
const uploadProgress = ref(0);
// 错误状态
const uploadError = computed(() => {
	return uploadState.value === 'error';
});
// 开始上传标识
const isStarting = ref(false);
// 文件允许格式
const formatAccept = computed(() => {
	return (props.accept instanceof Array) ? props.accept.join(',') : props.accept;
});
// 格式化文件允许格式文字
const friendlyAccept = computed(() => {
	return (props.accept as string).split(',').map(item => {
		const rmType = item.replace(/(image|text|video|audio|application)\//g, '');
		switch (rmType) {
			case 'plain':
				return 'txt';
			case 'vnd.rar':
				return 'rar';
			case 'vnd.openxmlformats-officedocument.wordprocessingml.document':
				return 'docx';
			case 'msword':
				return 'doc';
			case 'vnd.ms-excel':
				return 'xls';
			case 'vnd.openxmlformats-officedocument.spreadsheetml.sheet':
				return 'xlsx';
			default:
				return rmType;
		}
	}).join('、');
});
// 超出限制的列表
const oversizeList = computed(() => {
	return uploadQueue.value.filter((item: any) => item.status === 'limit');
});
// 满足正常上传的文件数量
const satisfyList = computed(() => {
	return uploadQueue.value.filter((item: any) => item.status !== 'limit');
});
// 存在已上传文件
const hasValue = computed(() => {
	return !!props.modelValue?.length;
});
// 是否必填属性，如果必填且有值则在原生 file input 上面不再进行设置
const isRequired = computed(() => {
	return isTruthy(props.required) && !hasValue.value;
});

/* 数量检测 */
function checkFilesLimit(files: any) {
	// 检查是否超出可选数量
	const lastAllowTotal = props.limit - files.length - (props?.modelValue?.length || 0);
	if (props.limit > 0 && lastAllowTotal < 0) {
		// 还允许剩余上传数量
		statusChanged('error', {limit: lastAllowTotal + files.length});
		return true;
	}
}

/* 大小检测 */
function filesInit(files: any) {
	uploadQueue.value = [];
	const formData = new FormData();
	for (let i = 0; i < files.length; i++) {
		const item = files[i];
		const uq = {
			name  : item.name,
			size  : item.size,
			status: 'init'
		};
		// 判断文件大小是否超出要求
		if (item.size > props.max) {
			uq.status = 'limit';
		}
		else {
			formData.append(props.name, item);
		}
		uploadQueue.value.push(uq);
	}
	return formData;
}

function selectFilesOrDir(ev: any) {
	const files = ev.target.files;
	if (checkFilesLimit(files)) {
		return;
	}
	const filesFormData = filesInit(files);
	ev.target.value = '';

	if (satisfyList.value.length) {
		startUpload(filesFormData);
	}
	else {
		statusChanged('error', {maximum: oversizeList.value});
	}
}

function startUpload(data: any) {
	readyStartProgress();
	statusChanged('start', data);
}

function completedUpload(data: []) {
	const result = satisfyList.value.map((item, index) => {
		return {
			name: item.name,
			url : data[index]
		}
	});
	if (isTruthy(props.multiple) && props.modelValue && props.modelValue.length) {
		result.unshift(...props.modelValue);
	}
	emit('update:modelValue', result);
}

function statusChanged(state: string, detail?: any) {
	uploadState.value = state;
	switch (state) {
		case 'start':
			isStarting.value = true;
			emit('start', {handler: statusChanged, detail});
			break;
		case 'progress':
			uploadProgress.value = Math.max(uploadProgress.value, detail);
			break;
		case 'success':
			uploadProgress.value = 100;
			setTimeout(() => {
				isStarting.value = false;
				uploadProgress.value = 0;
				completedUpload(detail);
			}, 200);
			break;
		case 'error':
			uploadProgress.value = 100;
			setTimeout(() => {
				isStarting.value = false;
				uploadProgress.value = 0;
			}, 200);
			// 上传组件的错误事件与其它表单组件不一样
			// 区别在于发送的事件不存在「是否错误」的第一个参数
			// 默认就是存在错误的，在事件处理时如果与 FormElement 结合需特殊处理
			emit('error', detail);
			break;
	}
	emit('status', {status: state, detail});
}

function remove(index: number) {
	const newValue = [...props.modelValue];
	newValue.splice(index, 1);
	emit('update:modelValue', newValue);
}

/* 模拟进度条 */
function readyStartProgress() {
	if (uploadProgress.value < 95) {
		setTimeout(() => {
			const newProgress = uploadProgress.value + 1;
			uploadProgress.value = Math.min(newProgress, 100);
			readyStartProgress();
		}, 30);
	}
	else if (uploadProgress.value < 99) {
		setTimeout(() => {
			const newProgress = uploadProgress.value + 0.5;
			uploadProgress.value = Math.min(newProgress, 100);
			readyStartProgress();
		}, 1000);
	}
}

function setError(is: boolean, msg?: string) {
	if (is) {
		statusChanged('error', msg);
	}
	else {
		statusChanged('init');
	}
}

defineExpose({
	setError
});
</script>

<template>
	<div class="vb-uploader" :class="{'is-disabled': isTruthy(disabled), 'is-danger': uploadError}">
		<div
				:class="[
						'vb-uploader-progress',
						uploadError ? 'has-background-danger' : 'has-background-success',
						{'is-more': isTruthy(multiple) && hasValue}
				]"
				:style="{width: uploadProgress+'%'}" v-show="isStarting"></div>
		<input
				class="file-input" type="file" tabindex="-1" :id :name="id" :disabled="isTruthy(disabled)"
				:accept="formatAccept" @change="selectFilesOrDir" :required="isRequired" :multiple="isTruthy(multiple)"
				v-if="type==='file'">
		<input
				class="file-input" type="file" tabindex="-1" :id :name="id" :disabled="isTruthy(disabled)"
				directory mozDirectory webkitDirectory @change="selectFilesOrDir" :required="isRequired" v-else>
		<label class="uploader-label" :for="id">
			<slot
					:selectedUpload="selectFilesOrDir"
					:removedUpload="remove"
					:setError="setError"
					:status="uploadState"
					:result="modelValue"
					:isMultiple="isTruthy(multiple)"
					:allowAccept="friendlyAccept"
					:allowMax="abbrNumber(max, 'byte')"
					:allowLimit="limit">
				<div class="upload-result" @click.stop.prevent v-if="hasValue">
					<slot name="result" :removedUpload="remove">
						<PreviewSource
								:source="item" canDelete @delete="remove(index)" :key="item" v-for="(item, index) in modelValue"/>
					</slot>
				</div>
				<div class="file" :class="{'is-danger': uploadError}" v-if="!hasValue || isTruthy(multiple)">
					<div class="file-label">
						<span class="file-cta">
							<span class="file-icon">
								<FasIcon icon="upload"/>
							</span>
							<span class="file-label">{{ placeholder }}</span>
						</span>
					</div>
				</div>
			</slot>
		</label>
	</div>
	<slot
			name="tips"
			:isMultiple="isTruthy(multiple)"
			:allowAccept="friendlyAccept"
			:allowMax="abbrNumber(max, 'byte')"
			:allowLimit="limit"/>
</template>

<style lang="scss">
.vb-uploader {
	position: relative;
	width: 100%;

	&-progress {
		position: absolute;
		opacity: .15;
		z-index: 10;
		height: 100%;
		transition: background-color .3s ease;

		&.is-more {
			bottom: 0;
			height: 2.5rem;
		}
	}

	&.is-disabled {
		opacity: .5;
		pointer-events: none;
	}

	.file-input {
		z-index: 0;
	}

	.uploader-label {
		position: relative;
		//z-index: 2;

		> .file > .file-label {
			flex-grow: 1;

			> .file-cta {
				width: 100%;
			}
		}
	}
}
</style>
