<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed, reactive, watchEffect } from "vue";
import DatetimePicker from '../../datetimePicker';
import InputUI, { PasswordInput } from '../../input';
import SelectorUI from '../../select';
import SwitchUI from '../../switch';
import Tags from '../../tags';
import FormElement from './FormElement.vue';

const emit = defineEmits(['submit', 'reset']);
const props = defineProps<{
	config?: VBForm.Config;
	submitText?: string;
	disableSubmit?: boolean;
}>();
const formValue = defineModel<Normal.AnyObj>({default: reactive({})});
const {$vbt} = useUILocale();
watchEffect(() => {
	if (props.config) {
		// 根据配置设置默认值
		props.config?.items?.forEach((item: any) => {
			// 防止收集 formValue 的监听依赖导致重复执行这个默认值配置
			setTimeout(() => {
				if (!(item.name in formValue.value)) {
					formValue.value[item.name] = item.value;
				}
			});
		});
	}
});
const hasConfigItems = computed(() => !!props.config?.items?.length);
const isSmall = computed(() => props.config?.isSmall || false);
const classList = computed(() => {
	return {
		"vb-form"     : true,
		'columns'     : hasConfigItems.value,
		'is-multiline': hasConfigItems.value,
		'is-variable' : hasConfigItems.value,
		'is-1'        : hasConfigItems.value
	};
});

const colClassName = computed(() => {
	return props.config?.rowSplits ? 'is-' + Math.round(12 / props.config?.rowSplits) : 'is-full';
});

//表单提交
function submit(e: any) {
	if (props.disableSubmit) {
		return;
	}
	emit("submit", e);
}

// 表单重置
function reset() {
	props.config?.items?.forEach((item: any) => {
		formValue.value[item.name] = item.value;
	});
	emit("reset");
}
</script>

<template>
	<form action="" @submit.prevent="submit" @reset.prevent="reset" :class="classList">
		<!-- 配置表单项 -->
		<template v-for="item in config?.items" v-if="hasConfigItems">
			<slot
					:name="item.slot"
					:class="['column mb-0', item.colspan ? `is-${item.colspan}` : colClassName, {'py-1': isSmall}]"
					v-if="'slot' in item"/>
			<FormElement
					class="column mb-0" :class="[item.colspan ? `is-${item.colspan}` : colClassName, {'py-1': isSmall}]"
					:key="item.name" :label="item.label" :isSmall
					v-else>
				<!-- 输入框 -->
				<InputUI
						type="text"
						:name="item.name"
						:required="item.required"
						:disabled="item.disabled"
						:readonly="item.readonly"
						:minlength="item.min?.toString()"
						:maxlength="item.max?.toString()"
						:placeholder="item.placeholder"
						v-model.trim="formValue[item.name]" v-if="item.type === 'input'"/>
				<InputUI
						type="number"
						:name="item.name"
						:required="item.required"
						:disabled="item.disabled"
						:readonly="item.readonly"
						:min="item.min?.toString()"
						:max="item.max?.toString()"
						:placeholder="item.placeholder"
						v-model.number="formValue[item.name]" v-else-if="item.type === 'number'"/>

				<!-- 密码框 -->
				<PasswordInput
						:name="item.name"
						:required="item.required"
						:disabled="item.disabled"
						:readonly="item.readonly"
						:placeholder="item.placeholder"
						v-model.trim="formValue[item.name]" v-else-if="item.type==='password'"/>

				<!-- 日期 -->
				<DatetimePicker
						type="datetime-local" auto-close
						:required="item.required"
						:min="item.min"
						:max="item.max"
						v-model="formValue[item.name]"
						v-if="item.type==='datetime'"/>
				<DatetimePicker
						is-range
						:required="item.required"
						:min="item.min"
						:max="item.max"
						:messages="{'zh-cn':{calendar:{rangeStart:item.rangeText?.[0], rangeEnd:item.rangeText?.[1]}}}"
						v-model="formValue[item.name]"
						v-else-if="item.type==='dateRange'"/>
				<DatetimePicker
						auto-close
						:required="item.required"
						:min="item.min"
						:max="item.max"
						v-model="formValue[item.name]"
						v-else-if="item.type==='date'"/>

				<!-- tags -->
				<Tags
						:list="item.options" :required="item.required" :disabled="item.disabled"
						:placeholder="item.placeholder"
						:collapse="item.collapse" v-model="formValue[item.name]" v-else-if="item.type === 'tags'"/>

				<!-- 下拉框 -->
				<SelectorUI
						:list="item.options"
						:placeholder="item.placeholder"
						:required="item.required"
						:disabled="item.disabled"
						v-model="formValue[item.name]" v-else-if="item.type === 'select'"/>

				<!-- switch -->
				<SwitchUI :disabled="item.disabled" v-model="formValue[item.name]" v-else-if="item.type === 'switch'"/>
			</FormElement>
		</template>

		<!-- 默认插槽 -->
		<slot v-else/>

		<slot name="formFooter">
			<div class="field is-grouped is-gap-1" :class="{'column': hasConfigItems}">
				<slot name="buttons">
					<template v-if="config?.buttons.length">
						<div class="control" :class="{'is-expanded': btn.fulled}" :key="index" v-for="(btn, index) in config.buttons">
							<button
									:type="btn.type || 'button'"
									:class="[btn.class, btn.fulled ? 'is-fullwidth' : '', isSmall ? 'is-small' : '']"
									@click="btn?.handler">
								{{ btn.text }}
							</button>
						</div>
					</template>
					<div class="control is-expanded" v-else>
						<button
								type="submit" class="button is-success is-fullwidth"
								:class="{'is-small': isSmall}"
								:disabled="disableSubmit">
							{{ submitText || $vbt('form.submitText') }}
						</button>
					</div>
				</slot>
			</div>
		</slot>
	</form>
</template>
