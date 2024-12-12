<script setup lang="ts">
import { computed, inject, nextTick, ref, useTemplateRef, watch } from 'vue';
import { isOverBoxSize, OUT_OF_RANGE } from '../../../utils';

const isParentSmall = inject('isSmall', false);
const props = withDefaults(defineProps<{
	min?: string;
	max?: string;
	step?: string | number;
	showSecond?: boolean;
	disabled?: boolean;
	required?: boolean;
	readonly?: boolean;
}>(), {min: '00:00:00', max: '23:59:59'});
const emit = defineEmits(['error']);
const modelValue = defineModel<string>();
const isError = ref(false);
const isOpen = ref(false);
const isUp = ref(false);
const entity = ref();
const hourValue = ref();
const minuteValue = ref();
const secondValue = ref();

let factory;
const hours = makeList(24, 'hours');
const minutes = makeList(60, 'minutes');
const seconds = makeList(60, 'seconds');

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
	return vals.slice(0, props.showSecond ? 3 : 2);
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
		'is-active'     : isOpen.value && !props.readonly,
		'is-disabled'   : props.disabled,
		'is-up'         : isUp.value,
		'is-shake'      : isError.value,
		'is-danger'     : isError.value,
		'is-small'      : isParentSmall
	}
});

const shadowEl = useTemplateRef<HTMLInputElement>('shadow');
const shadowStep = computed(() => {
	return rangeLimit.value.min[2] !== '00' ? 'any' : (props.step || 'any');
});

const event = (ev: Event) => {
	if (!(ev.target as HTMLElement).closest('.vb-time-picker.is-active')) {
		isOpen.value = false;
	}
};

watch(isOpen, (is) => {
	if (is) {
		// 计算位置决定展开方向
		const target = entity.value?.querySelector('.dropdown-menu');
		requestAnimationFrame(() => {
			isUp.value = isOverBoxSize(target, 0)('bottom');
		});
		document.addEventListener('click', event, {capture: true});
		// 滚动到指定位置
		scrollOptions(target);
	}
	else {
		isUp.value = false;
		document.removeEventListener('click', event, {capture: true});
	}
});

watch(modelValue, () => {
	const time = modelValue.value?.split(':');
	if (time && time instanceof Array) {
		const [h, m, s] = time;
		h && (hourValue.value = h);
		m && (minuteValue.value = m);
		s && (secondValue.value = s);
	}
}, {immediate: true})

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

function validTimeFactory(step: number) {
	// const time = new Set<string>();
	const hour   = new Set<number>(),
	      minute = new Set<number>(),
	      second = new Set<number>();
	let n = 0, lastHour = 0;
	while (1) {
		const d = new Date(n * 1000);
		const h = d.getUTCHours(),
		      m = d.getUTCMinutes(),
		      s = d.getUTCSeconds();
		if (hour.has(h) && lastHour > h) {
			break;
		}
		// time.add([h, m, s].join(':'));
		lastHour = h;
		hour.add(h);
		minute.add(m);
		second.add(s);
		n += step;
	}
	// console.log(Array.from(time));
	return {
		hours  : Array.from(hour).sort((a, b) => a - b).map(i => i.toString().padStart(2, '0')),
		minutes: Array.from(minute).sort((a, b) => a - b).map(i => i.toString().padStart(2, '0')),
		seconds: Array.from(second).sort((a, b) => a - b).map(i => i.toString().padStart(2, '0'))
	}
}

function makeList(total: number, name: 'hours' | 'minutes' | 'seconds') {
	const step = Number(props.step) || 0;
	if (!step) {
		factory = (() => {
			const opts = [];
			for (let i = 0; i < total; i++) {
				opts.push(i.toString().padStart(2, '0'));
			}
			return {[name]: opts};
		})()
	}
	factory ??= validTimeFactory(step);
	return factory[name] ?? [];
}

function focusIn(e: any) {
	const to = e.relatedTarget ?? entity.value.querySelector('.time-field input');
	to?.focus();
}

function updateValue() {
	const [h, m, s] = concatValue.value;
	// 如果值超出范围则报错
	if (Number(h) > 23 || Number(m) > 59 || Number(s) > 59) {
		setError(true, OUT_OF_RANGE);
		return;
	}
	if (!shadowEl.value?.reportValidity() || checkOutRange(h, m, s).some(b => b)) {
		setError(true, shadowEl.value?.validationMessage ?? OUT_OF_RANGE);
		return;
	}
	// 如果所有应填值未填完整则不更新值
	if (concatValue.value.slice(0, props.showSecond ? 3 : 2).every(v => !!v)) {
		// 更新值
		modelValue.value = concatValue.value.filter(v => !!v).join(':');
	}
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

function checkDatePicker() {
	const hasOpenPicker = document.querySelector('[role=calendar][open=open]');
	if (hasOpenPicker) {
		document.body.click();
		isOpen.value = true;
	}
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
					class="shadow-time" type="time" :step="shadowStep" :disabled :required :readonly
					:min="rangeLimit.min.slice(0, showSecond ? 3 : 2).join(':')"
					:max="rangeLimit.max.slice(0, showSecond ? 3 : 2).join(':')"
					tabindex="-1" @focus="focusIn"
					:value="concatValue.every(v=>v)?concatValue.join(':'):''"
			>
			<div class="time-field" @click="focusIn">
				<input
						type="number" placeholder="--" :required :disabled :readonly
						@focus="isOpen = true" @blur="padValue('hour', $event)" @keydown="checkKeyBehavior"
						min="0" max="23" @click.stop="checkDatePicker"
						v-model="hourValueCP">
				:
				<input
						type="number" placeholder="--" :required :disabled :readonly
						@focus="isOpen = true" @blur="padValue('minute', $event)" @keydown="checkKeyBehavior"
						min="0" max="59" @click.stop="checkDatePicker"
						v-model="minuteValueCP">
				<template v-if="showSecond">
					:
					<input
							type="number" placeholder="--" :required :disabled :readonly
							@focus="isOpen = true" @blur="padValue('second', $event)" @keydown="checkKeyBehavior"
							min="0" max="59" @click.stop="checkDatePicker"
							v-model="secondValueCP">
				</template>
			</div>
		</div>
		<div class="dropdown-menu is-fullwidth" role="menu" v-if="!readonly">
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

<style scoped lang="scss">
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
		cursor: not-allowed;

		.dropdown-trigger > .time-field {
			background-color: var(--bulma-background);
			border-color: var(--bulma-background);
			color: var(--bulma-text-weak);

			input {
				cursor: not-allowed;
			}
		}
	}

	&.is-danger {
		.dropdown-trigger {
			> .time-field {
				--bulma-focus-h: var(--bulma-danger-h);
				--bulma-focus-s: var(--bulma-danger-s);
				--bulma-focus-l: var(--bulma-danger-l);

				border-color: $danger;

				color: hsl(var(--bulma-danger-h), var(--bulma-danger-s), var(--bulma-text-strong-l));

				input {
					color: hsl(var(--bulma-danger-h), var(--bulma-danger-s), var(--bulma-text-strong-l));

					&::placeholder {
						color: hsl(var(--bulma-danger-h), var(--bulma-danger-s), var(--bulma-text-strong-l));
					}
				}
			}
		}
	}

	.has-addons & {
		.dropdown-trigger .time-field {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
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
				border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
				box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
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
			min-width: auto;
			width: max(9rem, 100%);
		}

		.dropdown-content {
			display: flex;
			margin: 0 0 1em;

			.dropdown-scroll-view {
				overflow: auto;
				overscroll-behavior: contain;
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
				padding-inline-end: 1rem;
			}

			.dropdown-item.is-disabled {
				opacity: .5;
				pointer-events: none;
			}
		}
	}
}
</style>
