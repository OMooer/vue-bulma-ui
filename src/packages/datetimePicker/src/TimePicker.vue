<script setup lang="ts">
import { computed, inject, nextTick, ref, useTemplateRef, watch } from 'vue';
import { isOverWindow } from '../../../utils';

const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	min?: string;
	max?: string;
	showSecond?: boolean;
	placeholder?: string;
	disabled?: boolean;
	required?: boolean;
}>(), {placeholder: '请选择', min: '00:00:00', max: '23:59:59'});
const emit = defineEmits(['error']);
const modelValue = defineModel();
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const hourValue = ref();
const minuteValue = ref();
const secondValue = ref();

const hours = makeList(24);
const minutes = makeList(60);
const seconds = makeList(60);

const hourValueCP = computed({
	get() {
		return hourValue.value;
	},
	set(val) {
		hourValue.value = val.toString();
	}
});
const minuteValueCP = computed({
	get() {
		return minuteValue.value;
	},
	set(val) {
		minuteValue.value = val.toString();
	}
});
const secondValueCP = computed({
	get() {
		return secondValue.value;
	},
	set(val) {
		secondValue.value = val.toString();
	}
});
const concatValue = computed(() => {
	const vals = ['', '', ''];
	hourValue.value && (vals[0] = hourValue.value.toString().padStart(2, '0'));
	minuteValue.value && (vals[1] = minuteValue.value.toString().padStart(2, '0'));
	secondValue.value && (vals[2] = secondValue.value.toString().padStart(2, '0'));
	return vals;
});
const rangeLimit = computed(() => {
	const minimum = props.min.split(':');
	minimum[0] = minimum[0] || '00';
	minimum[1] = minimum[1] || '00';
	minimum[2] = minimum[2] || '00';
	const maximum = props.max.split(':');
	maximum[0] = maximum[0] || '23';
	maximum[1] = maximum[1] || '59';
	maximum[2] = maximum[2] || '59';

	return {
		min: minimum,
		max: maximum
	}
});
const classList = computed(() => {
	return {
		'vb-time-picker': true,
		'dropdown'      : true,
		'is-block'      : true,
		'is-active'     : isOpen.value,
		'is-disabled'   : props.disabled,
		'is-up'         : isUp.value,
		'is-shake'      : isError.value,
		'is-danger'     : isError.value,
		'is-small'      : isParentSmall
	}
});

const shadowEl = useTemplateRef<HTMLInputElement>('shadow');

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-time-picker.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = entity.value;
		const offset = target.querySelector('.dropdown-menu').offsetHeight;
		isUp.value = isOverWindow(target, offset);
		document.addEventListener('click', event, {capture: true});
		// 滚动到指定位置
		scrollOptions(target);
	}
	else {
		document.removeEventListener('click', event, {capture: true});
	}
});

watch([hourValue, minuteValue, secondValue], () => {
	setError(false);
	nextTick(() => {
		updateValue();
	})
});

function scrollOptions(target: any) {
	const scrollView = target.querySelectorAll('.dropdown-scroll-view');
	scrollView.forEach((item: any) => {
		// 找到第一个激活选择的值
		const active = item.querySelector('.is-active');
		if (active) {
			setTimeout(() => {
				const top = active.offsetTop - item.offsetHeight / 2;
				item.scroll({top: Math.max(top, 0), behavior: 'smooth'});
			});
		}
	});
}

function makeList(total: number) {
	return Array(total).fill(0).map((_, i) => {
		return (i).toString().padStart(2, '0');
	});
}

function focusIn(e: any) {
	const to = e.relatedTarget ?? entity.value.querySelector('.time-field input');
	to?.focus();
}

function updateValue() {
	const [h, m, s] = concatValue.value;
	// 如果值超出范围则报错
	if (Number(h) > 23 || Number(m) > 59 || Number(s) > 59) {
		setError(true, 'out of range');
		return;
	}
	if (!shadowEl.value?.reportValidity() || checkOutRange(h, m, s).some(b => b)) {
		setError(true, 'out of range');
		return;
	}
	// 更新值
	modelValue.value = concatValue.value.filter(v => !!v).join(':');
	nextTick(() => {
		scrollOptions(entity.value);
	});
}

function checkKeyBehavior(e: any) {
	// 按下回退键删除为空后再次按下将跳至上一个输入框删除
	if (e.code === 'Backspace') {
		if (e.target.value.length === 0) {
			e.target.previousElementSibling?.focus();
		}
		e.target.type = 'text';
		e.target.setSelectionRange(e.target.value.length, e.target.value.length);
		e.target.type = 'number';
		return;
	}
	// 阻止按下负号键
	if (e.key === '-') {
		e.preventDefault();
		return;
	}
	// 其它非数字键不做处理
	if (isNaN(Number(e.key))) {
		return;
	}
	// 如果输入框值长度已经等于2则清空原值相当于从头输入
	if (e.target.value.length >= 2) {
		e.target.value = '';
	}
	// 如果输入时已经有一位长度了，则在输入后跳到下一个输入框
	else if (e.target.value.length === 1) {
		setTimeout(() => {
			if (shadowEl.value?.checkValidity()) {
				e.target.nextElementSibling?.focus();
				e.target.nextElementSibling?.select();
			}
		});
	}
}

function padValue(inp: string, e: any) {
	if (e.relatedTarget) {
		// 如果失去焦点后不在组件内了，关闭弹层
		if (e.relatedTarget.closest('.vb-time-picker') !== entity.value) {
			isOpen.value = false;
		}
		// 如果焦点去到了 shadow 则阻止后面的处理，等它回来
		if (e.relatedTarget === shadowEl.value) {
			return;
		}
	}
	if (!e.target.value) {
		return;
	}
	switch (inp) {
		case 'hour':
			hourValue.value = e.target.value.padStart(2, '0');
			break;
		case 'minute':
			minuteValue.value = e.target.value.padStart(2, '0');
			break;
		case 'second':
			secondValue.value = e.target.value.padStart(2, '0');
			break;
	}
}

function selectValue(inp: string, value: string) {
	if (!value) {
		return;
	}
	switch (inp) {
		case 'hour':
			hourValue.value = value.padStart(2, '0');
			break;
		case 'minute':
			minuteValue.value = value.padStart(2, '0');
			break;
		case 'second':
			secondValue.value = value.padStart(2, '0');
			break;
	}
}

function checkOutRange(h: string, m: string, s: string) {
	const rMin = rangeLimit.value.min,
	      rMax = rangeLimit.value.max;
	const tMin = [h || rMin[0], m || rMin[1], s || rMin[2]],
	      tMax = [h || rMax[0], m || rMax[1], s || rMax[2]];
	return [tMin.join('') < rMin.join(''), tMax.join('') > rMax.join('')];
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<div ref="entity" :class="classList">
		<div class="dropdown-trigger">
			<input
					ref="shadow"
					class="shadow-time" type="time" step="1" :disabled :required
					:min="rangeLimit.min.slice(0, showSecond ? 3 : 2).join(':')"
					:max="rangeLimit.max.slice(0, showSecond ? 3 : 2).join(':')"
					@focus="focusIn"
					:value="concatValue.every(v=>v)?concatValue.join(':'):''"
			>
			<div class="time-field" @click="focusIn">
				<input
						type="number" placeholder="--" :required :disabled
						@focus="isOpen = true" @blur="padValue('hour', $event)" @keydown="checkKeyBehavior"
						min="0" max="23" @click.stop
						v-model="hourValueCP">
				:
				<input
						type="number" placeholder="--" :required :disabled
						@focus="isOpen = true" @blur="padValue('minute', $event)" @keydown="checkKeyBehavior"
						min="0" max="59" @click.stop
						v-model="minuteValueCP">
				<template v-if="showSecond">
					:
					<input
							type="number" placeholder="--" :required :disabled
							@focus="isOpen = true" @blur="padValue('second', $event)" @keydown="checkKeyBehavior"
							min="0" max="59" @click.stop
							v-model="secondValueCP">
				</template>
			</div>
		</div>
		<div class="dropdown-menu is-fullwidth" role="menu">
			<div class="dropdown-content">
				<div class="dropdown-scroll-view">
					<a
							class="dropdown-item"
							:class="{
								'is-active': hourValue?.padStart(2,'0') === i,
								'is-disabled': checkOutRange(i, '', '').some(b => b)
							}"
							@click="selectValue('hour', i)"
							v-for="i in hours">{{ i }}</a>
				</div>
				<div class="dropdown-scroll-view">
					<a
							class="dropdown-item"
							:class="{
								'is-active': minuteValue?.padStart(2,'0') === i,
								'is-disabled': checkOutRange(hourValue, i, '').some(b => b)
							}"
							@click="selectValue('minute', i)"
							v-for="i in minutes">{{ i }}</a>
				</div>
				<div class="dropdown-scroll-view" v-if="showSecond">
					<a
							class="dropdown-item"
							:class="{
								'is-active': secondValue?.padStart(2,'0') === i,
								'is-disabled': checkOutRange(hourValue, minuteValue, i).some(b => b)
							}"
							@click="selectValue('second', i)"
							v-for="i in seconds">{{ i }}</a>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss">
@import "../../../scss/variables";

.vb-time-picker {
	&.is-small {
		--bulma-radius: var(--bulma-radius-small);
		--bulma-control-size: var(--bulma-size-small);

		.dropdown-item {
			line-height: 1.5;
			font-size: var(--bulma-size-small);
		}
	}

	&.is-up {
		.dropdown-menu .dropdown-content {
			margin-bottom: 0;
		}
	}

	&.is-disabled {
		.dropdown-trigger > .button {
			background-color: var(--bulma-input-disabled-background-color);
			border-color: var(--bulma-input-disabled-border-color);
			opacity: .7;
		}
	}

	&.is-danger {
		.dropdown-trigger {
			> .time-field {
				outline: solid 1px $danger !important;
				box-shadow: 0 0 0 0.125em rgba($danger, .25) !important;
			}
		}
	}

	.dropdown-trigger {
		.shadow-time {
			position: absolute;
			opacity: 0;
			inset: 0;
			z-index: 0;
		}

		.time-field {
			position: relative;
			z-index: 1;
			display: flex;
			align-items: center;
			padding: var(--bulma-control-padding-vertical) var(--bulma-control-padding-horizontal);
			border-radius: var(--bulma-radius);
			background-color: hsl(var(--bulma-scheme-h), var(--bulma-scheme-s), calc(var(--bulma-scheme-main-l) + 0%));
			border: solid 1px var(--bulma-border);
			font-size: var(--bulma-control-size);
			height: var(--bulma-control-height);

			&:focus-within {
				outline: solid 1px $link;
				box-shadow: 0 0 0 0.25em rgba($link, .25);
			}

			input {
				flex-grow: 1;
				font-size: var(--bulma-control-size);
				height: 100%;
				background-color: transparent;
				border: none;
				color: hsl(var(--bulma-input-h), var(--bulma-input-s), var(--bulma-input-color-l));
				outline: none;
				text-align: center;

				&::placeholder {
					color: $placeholder-color;
				}

				&::-webkit-inner-spin-button, &::-webkit-calendar-picker-indicator {
					appearance: none;
					display: none;
				}
			}

			&:not(:first-child) input {
				border-left: 0;
			}
		}
	}

	.dropdown-menu {
		&.is-fullwidth {
			width: 100%;
		}

		.dropdown-content {
			display: flex;
			margin: 0 0 1em;

			.dropdown-scroll-view {
				overflow: auto;
				max-height: 12em;
				flex-grow: 1;
				border-right: solid 1px $split-color;

				&:last-of-type {
					border-right: 0;
				}
			}

			.dropdown-item {
				display: flex;
				align-items: center;

				i.flags {
					flex-shrink: 0;
				}
			}

			.dropdown-item.is-disabled {
				opacity: .5;
				pointer-events: none;
			}
		}
	}
}
</style>
