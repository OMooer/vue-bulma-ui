<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, inject, provide, type Ref, ref, toRef } from 'vue';
import { abbrNumber, ERROR_ACCEPT, isTruthy, runPromiseSequence } from '@/utils';
import { ext2mime } from '@/utils/mime';
import PreviewSource from './PreviewSource.vue';

type HookMethod = 'select';

defineOptions({
	inheritAttrs: false
});
const isParentSmall = inject('isSmall', ref(false));
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
		type     : [String, Array],
		default  : '.jpeg,.jpg,.gif,.png',
		validator: (val: string | []) => {
			const list = typeof val === 'string' ? val.split(',') : val;
			if (list.some((item: string) => /^\S+\/\S+$/.test(item))) {
				console.warn(ERROR_ACCEPT);
				return false;
			}
			return true;
		}
	},
	modelValue : null,
	placeholder: {
		type: String,
	},
	required   : [Boolean, String],
	disabled   : [Boolean, String],
	multiple   : [Boolean, String],
	max        : {
		type   : Number,
		default: 1024 * 1024 * 0.5 // 500Kb
	},
	limit      : {
		type   : Number,
		default: 0 // 不限制
	},
	isSmall    : Boolean,
	width      : Number,
	height     : Number,
});
const emit = defineEmits(['update:modelValue', 'start', 'error', 'status']);
const {$vbt} = useUILocale();
const isReallySmall = computed(() => isParentSmall.value || props.isSmall);
const modelInnerValue = computed(() => {
	if (typeof props.modelValue === 'string' && props.modelValue) {
		return [props.modelValue];
	}
	return props.modelValue;
}) as Ref<any[]>;
// Hook 信息
const hooks = new Map();
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
// 文件允许类型格式
const formatAccept = computed(() => {
	const list = acceptExtNames.value.map((extName: string) => {
		return ext2mime(extName);
	});
	return list.filter((item) => !!item).join(',').split(',');
});
// 过滤后允许的扩展名
const acceptExtNames = computed<string[]>(() => {
	const list = (props.accept instanceof Array) ? props.accept : props.accept.split(',');
	return (list as string[]).map((item: string) => {
		// 不允许 MIME 类型设置所以返回空
		if (/^\S+\/\S+$/.test(item) || item === '*') {
			return '';
		}
		else if (item.startsWith('.')) {
			return item.substring(1);
		}
		return item;
	}).filter((item) => !!item);
});
// 设置到 input 的 accept 属性
const acceptAttr = computed(() => {
	return acceptExtNames.value.map(item => `.${ item }`).join(',');
});
// 不合规的文件列表
const getNonCompliantFiles = computed(() => {
	const oversize = uploadQueue.value.filter((item: any) => item.status === 'limit');
	const invalid = uploadQueue.value.filter((item: any) => item.status === 'invalid');
	const result = {};
	if (oversize.length) {
		Object.assign(result, {maximum: oversize});
	}
	if (invalid.length) {
		Object.assign(result, {invalid: invalid});
	}
	return result;
});
// 满足正常上传的文件列表
const satisfyList = computed(() => {
	return uploadQueue.value.filter((item: any) => item.status === 'init');
});
// 允许的上传总数
const totalLimit = computed(() => {
	return isTruthy(props.multiple) ? props.limit : 1;
});
// 存在已上传文件
const hasValue = computed(() => {
	return !!modelInnerValue.value?.length;
});
// 剩余可上传数量
const remainQuota = computed(() => {
	return totalLimit.value - (modelInnerValue.value?.length || 0);
});
// 是否必填属性，如果必填且有值则在原生 file input 上面不再进行设置
const isRequired = computed(() => {
	return isTruthy(props.required) && !hasValue.value;
});

/* 格式检测 */
function checkFileFormat(file: any) {
	if (acceptExtNames.value.length === 0) {
		return true;
	}
	// 如果文件类型存在优先判断类型
	if (file.type && formatAccept.value.length) {
		return formatAccept.value.includes(file.type);
	}
	// 类型不存在通过扩展名判断（不严谨）
	const extName: string = file.name?.substring(file.name.lastIndexOf('.') + 1) ?? '';
	return acceptExtNames.value.includes(extName);
}

/* 数量检测 */
function checkFilesLimit(files: any) {
	// 检查是否超出可选数量
	const sumLastTotal = remainQuota.value - files.length;
	if (totalLimit.value > 0 && sumLastTotal < 0) {
		// 还允许剩余上传数量
		statusChanged('error', {limit: remainQuota.value});
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
		// 判断文件格式是否允许
		if (!checkFileFormat(item)) {
			uq.status = 'invalid';
		}
		// 判断文件大小是否超出要求
		else if (item.size > props.max) {
			uq.status = 'limit';
		}
		else {
			formData.append(props.name, item);
		}
		uploadQueue.value.push(uq);
	}
	return formData;
}

// 选择完上传目标对象后开始处理
function selectFilesOrDir(ev: any) {
	const files = ev.target.files;
	// 如果不是可多选的上传，则只能上传一个文件，重复上传将在这里删掉前面的文件
	if (!isTruthy(props.multiple)) {
		if (modelInnerValue.value?.length) {
			remove(0);
		}
	}
	// 检测数量是否超出限制
	else if (checkFilesLimit(files)) {
		return;
	}
	// 上传文件信息检测并初始化，返回要上传的 formData 数据
	const filesFormData = filesInit(files);
	ev.target.value = '';

	// 因为 formData 数据可能无文件信息
	// 检查允许上传的目标列表存在时开始上传
	if (satisfyList.value.length) {
		startUpload(filesFormData);
	}
	else {
		statusChanged('error', getNonCompliantFiles.value);
	}
}

function startUpload(formDataOfFiles: FormData) {
	uploadState.value = 'init';
	emit('status', {status: 'init'});
	// 增加处理文件的扩展 hook
	const selectHooks = hooks.get('select') ?? [];
	selectHooks.push((d: FormData) => Promise.resolve(d));
	runPromiseSequence(selectHooks, formDataOfFiles).then(
			(data) => {
				readyStartProgress();
				statusChanged('start', data);
			}
	).catch(() => {});
}

function setHooks(method: HookMethod, fn: <T>(a: T) => Promise<T>) {
	if (hooks.has(method)) {
		hooks.get(method).push(fn);
	}
	else {
		hooks.set(method, [fn]);
	}
}

function completedUpload(data: string | string[] | Normal.AnyObj[]) {
	if (typeof data === 'string') {
		data = [data];
	}
	// 从允许上传列表里匹配上传结果，更新展示
	const result = satisfyList.value.map((item, index) => {
		return {
			name: item.name,
			url : data[index]
		}
	});
	if (isTruthy(props.multiple) && modelInnerValue.value && modelInnerValue.value.length) {
		result.unshift(...modelInnerValue.value);
	}
	emit('update:modelValue', formatResult(result));
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
	const newValue = [...modelInnerValue.value];
	newValue.splice(index, 1);
	emit('update:modelValue', formatResult(newValue));
}

/* 适配上传结果到目标 */
function formatResult(res: string | string[] | Normal.AnyObj[]) {
	if (props.modelValue instanceof Array) {
		return (res instanceof Array) ? res : [res];
	}
	// 如果是字符串结果则从数据中取出唯一字符值返回，或者找不到
	return typeof res === 'string' ? res : ((r: any) => {
		if (!r) {
			return '';
		}
		if ('url' in r) {
			return r.url;
		}
		return r;
	})(res[0]);
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

provide('setHooks', setHooks);
provide('startUpload', startUpload);
provide('disabled', toRef(() => isTruthy(props.disabled)));
provide('width', toRef(props, 'width'));
provide('height', toRef(props, 'height'));
defineExpose({
	setError
});
</script>

<template>
	<div
			class="vb-uploader" :class="{'is-disabled': isTruthy(disabled), 'is-danger': uploadError}"
			:style="{width: width + 'px'}">
		<div
				:class="{
					'vb-uploader-progress': true,
					'has-background-danger' : uploadError,
					'has-background-success': !uploadError,
					'is-more': isTruthy(multiple) && hasValue
				}"
				:style="{ width: uploadProgress + '%' }" v-show="isStarting"></div>
		<input
				class="file-input" type="file" tabindex="-1" :id :name="id" :disabled="isTruthy(disabled)"
				:accept="acceptAttr" @change="selectFilesOrDir" :required="isRequired"
				:multiple="isTruthy(multiple)"
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
					:result="modelInnerValue"
					:accept="acceptExtNames"
					:max="abbrNumber(max, 'byte')"
					:limit="totalLimit">
				<div class="upload-result" @click.stop.prevent v-if="hasValue">
					<slot name="result" :removedUpload="remove">
						<PreviewSource
								:source="item" :isSmall canDelete @delete="remove(index)" :key="item"
								v-for="(item, index) in modelInnerValue"/>
					</slot>
				</div>
				<div :class="{'file': 1, 'is-danger is-shake': uploadError, 'is-small': isReallySmall}" v-if="remainQuota > 0">
					<div class="file-label">
						<span class="file-cta">
							<span class="file-icon">
								<FasIcon icon="upload"/>
							</span>
							<span class="file-label">{{ placeholder || $vbt('uploader.placeholder') }}</span>
						</span>
					</div>
				</div>
			</slot>
		</label>
	</div>
	<slot name="tips" :accept="acceptExtNames" :max="abbrNumber(max, 'byte')" :limit="totalLimit"/>
</template>

<style scoped lang="scss">
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
		cursor: not-allowed;

		.uploader-label, .file-input {
			pointer-events: none;
		}

		.file .file-cta {
			background-color: var(--bulma-background);
			border-color: var(--bulma-background);
			color: var(--bulma-text-weak);
		}
	}

	&:focus-within {
		.file {
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
			border-radius: var(--bulma-radius);

			.file-cta {
				border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			}
		}
	}

	&.is-danger {
		--bulma-focus-h: var(--bulma-danger-h);
		--bulma-focus-s: var(--bulma-danger-s);
		--bulma-focus-l: var(--bulma-danger-l);
	}

	.file-input {
		top: auto;
		bottom: 0;
		width: 0;
		height: 3em;
		z-index: 0;

		&:has( + .uploader-label > .is-small) {
			height: 2.2em;
		}
	}

	.uploader-label {
		position: relative;

		> .file > .file-label {
			flex-grow: 1;

			> .file-cta {
				width: 100%;
			}
		}
	}
}
</style>
