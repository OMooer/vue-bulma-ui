<script lang="ts">
import Calendar from 'sa-calendar';
import { h, defineComponent, ref, watch, computed, withDirectives, inject, onMounted } from 'vue';
import TimePicker from './TimePicker.vue';
import { isTruthy } from '../../../utils';

function dateFormat(d: Date, f: string = 'YYYY-MM-DD hh:mm:ss') {
	const year  = d.getFullYear(),
	      month = d.getMonth() + 1,
	      day   = d.getDate();
	return `${ year }-${ month.toString().padStart(2, '0') }-${ day.toString().padStart(2, '0') }`;
}

export default defineComponent({
	name        : 'DatetimePicker',
	inheritAttrs: true,
	props       : {
		modelValue: [String, Array],
		disabled  : [Boolean, String],
		required  : [Boolean, String],
		locale    : {
			type   : String,
			default: 'zh-cn'
		},
		type      : {
			type   : String,
			default: 'date'
		},
		isRange   : [Boolean, String],
		editable  : {
			type   : Boolean,
			default: true
		},
		autoClose : {
			type   : Boolean,
			default: false
		},
		weekStart : {
			type: [String, Number]
		},
		showToday : {
			type   : Boolean,
			default: false
		},
		min       : [Date, String, Number],
		max       : [Date, String, Number],
		step      : [String, Number],
		splitText : {
			type   : String,
			default: '-'
		},
		messages  : Object
	},
	setup(props, {emit, expose}) {
		const isParentSmall = inject('isSmall', false);
		const isError = ref(false);
		const entity = ref();
		const innerDate = ref('');
		const innerTime = ref('');
		const innerRange = ref(['', '']);

		const isAddonTime = computed(() => !props.isRange && formatType.value === 'datetime-local');

		const formatMin = computed(() => {
			return props.min ? dateFormat(new Date(props.min as Date), 'YYYY-MM-DD') : null;
		});
		const formatMax = computed(() => {
			return props.max ? dateFormat(new Date(props.max as Date), 'YYYY-MM-DD') : null;
		});
		const formatType = computed(() => {
			return ['datetime', 'datetime-local'].includes(props.type) ? 'datetime-local' : 'date';
		});
		const langPack = computed(() => {
			const lang = props.messages?.[props.locale] ?? props.messages;
			let packText = lang ? (lang?.calendar || lang) : undefined;
			packText = Object.assign({
				rangeStart: '年/月/日',
				rangeEnd  : '年/月/日'
			}, packText);
			return JSON.stringify(packText);
		});

		const directiveFn = (el: any, binding?: any) => {
			if (el.value || binding?.modifiers?.force) {
				el.type = el.getAttribute('data-type');
				if (binding?.modifiers?.force) {
					entity.value?.dispatchEvent(new Event('click'));
				}
			}
			else {
				el.type = 'text';
			}
		}
		const insertPlaceDirect = {
			beforeMount: directiveFn,
			updated    : directiveFn
		}

		// 同步组件值与内部值
		watch(() => props.modelValue, (val: any) => {
			if (!val) {
				return;
			}
			if (props.isRange) {
				innerRange.value = val;
			}
			else {
				if (formatType.value === 'datetime-local') {
					const [d, t] = val.split('T');
					innerDate.value = d;
					if (t) {
						innerTime.value = t;
					}
				}
				else {
					innerDate.value = val;
				}
			}
		}, {immediate: true});
		watch([innerDate, innerTime, innerRange], () => {
			if (props.isRange) {
				emit('update:modelValue', innerRange.value);
			}
			else if (innerDate.value && innerTime.value) {
				let datetime = innerDate.value;
				if (formatType.value === 'datetime-local') {
					datetime += 'T' + innerTime.value;
				}
				emit('update:modelValue', datetime);
			}
		});

		function setError(is: boolean, msg?: string) {
			isError.value = is;
			if (is && !document.activeElement?.closest('.vb-datetime')) {
				entity.value.focus();
			}
			emit('error', is, msg);
		}

		let instance: typeof Calendar;

		onMounted(() => {
			entity.value.addEventListener('click', (e: any) => {
				if (entity.value.getAttribute('open') !== 'open') {
					instance = new Calendar({
						trigger: entity.value,
						mount  : entity.value.closest('.vb-datetime'),
						css    : {
							mainClass    : 'date-panel card',
							selectedClass: 'selected has-background-link has-text-white',
							lefter       : 'left-wrap',
							righter      : 'buttons',
							primaryButton: 'button is-primary is-small',
							defaultButton: 'button is-small',
							editClass    : 'input is-small'
						}
					});
					entity.value.focus();
				}
				e.stopPropagation();
			});
		});

		expose({
			setError
		});

		return () => {
			return h('div', {
						class: {
							'vb-datetime': true,
							'is-disabled': isTruthy(props.disabled),
							'is-shake'   : isError.value,
							'is-small'   : isParentSmall
						}
					},
					[
						h('div', {
									class: {
										'field'     : true,
										'has-addons': isAddonTime.value,
									}
								},
								[
									// 日期主体框
									props.isRange
											// 范围选择
											? h('div', {
												'ref'            : entity,
												'role'           : 'calendar',
												'data-editable'  : props.editable ? 'true' : null,
												'data-auto-close': props.autoClose ? 'true' : null,
												'data-week-start': props.weekStart,
												'data-today'     : props.showToday ? 'true' : null,
												'data-show-time' : formatType.value === 'datetime-local' ? 'true' : null,
												'data-min'       : formatMin.value,
												'data-max'       : formatMax.value,
												'data-range'     : true,
												'data-split'     : props.splitText,
												'data-language'  : props.locale,
												'data-lang-pack' : langPack.value,
												onChange         : (e: any) => {
													let detail = e.detail;
													if (e.target !== entity.value) {
														const p = e.target.dataset?.role;
														const v = e.target.value;
														detail ??= {
															start: p === 'start' ? v : innerRange.value[0] ?? '',
															end  : p === 'end' ? v : innerRange.value[1] ?? '',
														}
													}
													// 如果没有显示到秒得去掉秒
													if (!props.step || Number(props.step) % 60 === 0) {
														detail.start = detail.start.split(':').slice(0, 2).join(':');
														detail.end = detail.end.split(':').slice(0, 2).join(':');
													}
													innerRange.value = [detail.start, detail.end];
												}
											}, [
												withDirectives(h('input', {
													'type'       : formatType.value,
													'data-type'  : formatType.value,// ? 'datetime-local' : 'date',
													'data-role'  : 'start',
													'step'       : props.step,
													'value'      : innerRange.value[0],
													'placeholder': JSON.parse(langPack.value)?.rangeStart,
													'required'   : isTruthy(props.required),
													onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
													onBlur       : (e: Event) => directiveFn(e.target)
												}), [[insertPlaceDirect]]),
												withDirectives(h('input', {
													'type'       : formatType.value,
													'data-type'  : formatType.value,// ? 'datetime-local' : 'date',
													'data-role'  : 'end',
													'step'       : props.step,
													'value'      : innerRange.value[1],
													'placeholder': JSON.parse(langPack.value)?.rangeEnd,
													'required'   : isTruthy(props.required),
													onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
													onBlur       : (e: Event) => directiveFn(e.target)
												}), [[insertPlaceDirect]])
											])
											// 单一时间
											: h('div', {class: 'control is-expanded'}, h('input', {
												'ref'  : entity,
												'class': {
													'input'    : true,
													'is-danger': isError.value
												},
												'type' : 'date',//formatType.value,
												'min'  : formatMin.value,
												'max'  : formatMax.value,
												// 'step'           : props.step,
												'disabled'       : isTruthy(props.disabled),
												'required'       : isTruthy(props.required),
												'value'          : innerDate.value,
												'role'           : 'calendar',
												'data-editable'  : props.editable ? 'true' : null,
												'data-auto-close': props.autoClose ? 'true' : null,
												'data-week-start': props.weekStart,
												'data-today'     : props.showToday ? 'true' : null,
												'data-language'  : props.locale,
												'data-lang-pack' : langPack.value,
												onChange(e: any) {
													setError(false);
													innerDate.value = e.target.value;
												},
												onClick(e: any) {
													e.preventDefault();
												},
												onTouchstart(e: any) {
													if (e.target.getAttribute('open') === 'open') {
														e.preventDefault();
													}
													else {
														e.target.disabled = true;
														setTimeout(() => {
															e.target.disabled = false;
															e.target.click();
														});
													}
												},
												onBlur(e: any) {
													if (!e.target.checkValidity() && e.target.value) {
														setError(true, e.target.validationMessage);
													}
													if (e.relatedTarget && !e.relatedTarget?.closest('.date-panel')) {
														instance?.dismiss();
													}
													instance = undefined;
												}
											})),

									// 如果是非范围选择且是 datetime-local 类型则附加时间选择组件
									isAddonTime.value && (
											h(TimePicker, {
												class     : 'control is-right',
												showSecond: Number(props.step) % 60 !== 0,
												step      : props.step,
												modelValue: innerTime.value,
												'onUpdate:modelValue'(val: string) {
													innerTime.value = val;
												},
												onError: setError
											})
									)
								]
						)
					]
			);
		}
	}
});
</script>

<style lang="scss">
@import "../../../scss/variables";

.vb-datetime {
	position: relative;

	input[type="text"],
	input[type="datetime-local"],
	input[type="date"] {
		&::-webkit-clear-button,
		&::-webkit-inner-spin-button,
		&::-webkit-calendar-picker-indicator {
			display: none;
		}
	}

	.field:not(:last-child) {
		margin: 0;
	}

	&.is-small {
		[role=calendar] {
			line-height: 1.5;
			font-size: 0.75rem;

			&[data-range=true] {
				line-height: 1.5;
				font-size: 0.75rem;
			}
		}

		[role=calendar][data-range=true] {
			input[type="text"],
			input[type="datetime-local"],
			input[type="date"] {
				font-size: 0.75rem;
			}
		}
	}

	[role=calendar][data-range=true] {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(.5em - 1px) calc(.75em - 1px);
		box-sizing: border-box;
		border: solid 1px $input-border-color;
		border-radius: 4px;
		cursor: default;
		line-height: 20px;
		font-size: 1rem;
		height: 2.5em;
		width: 100%;
		transition: border var(--bulma-duration);

		&:before {
			content: attr(data-split);
			order: 1;
		}

		&:hover {
			--bulma-input-border-l-delta: var(--bulma-input-hover-border-l-delta);
		}

		input[type="text"],
		input[type="datetime-local"],
		input[type="date"] {
			padding: 0;
			background: none;
			box-shadow: none;
			border: none;
			outline: none;
			text-align: center;
			font-size: 1rem;
			color: inherit;
			width: 49%;

			&:last-of-type {
				order: 1;
			}
		}

		input[type="text"] {
			cursor: default;
		}

		[role=range] {
			display: block;
			cursor: default;
			width: 6rem;

			&:last-of-type {
				order: 1
			}
		}
	}

	&.is-disabled {
		cursor: no-drop;

		.control {
			opacity: .7;
		}

		[role=calendar] {
			pointer-events: none;
			background-color: var(--bulma-input-disabled-background-color);
			border-color: var(--bulma-input-disabled-border-color);
		}
	}
}

// 弹出窗样式
.vb-datetime .date-panel {
	top: auto !important;
	left: auto !important;
}

.date-panel.card {
	position: absolute;
	padding: 1rem;
	box-sizing: border-box;
	min-width: 15rem;
	max-width: 35rem;
	z-index: 9988;

	&.is-multiple {
		min-width: 30rem;
	}

	input[type="datetime-local"],
	input[type="date"] {
		&::-webkit-clear-button,
		&::-webkit-inner-spin-button,
		&::-webkit-calendar-picker-indicator {
			display: none;
		}
	}

	.op-arrow {
		a {
			display: block;
			padding: 2px;
			color: var(--bulma-link-text);
			fill: var(--bulma-link-text);
		}

		svg {
			width: 1rem;
			height: 1rem;
		}
	}

	.calendar-body {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		font-size: .8rem;
		width: 100%;

		dl {
			width: 47%;

			&:only-of-type {
				width: 100%;
			}

			dt {
				font-weight: bold;
			}

			dd {
				height: 14.2em;
			}

			li {
				text-align: center;
				line-height: 2;
				cursor: default;
				width: calc(100% / 7);
			}

			ul:last-of-type li {
				cursor: pointer;
				border-radius: 4px;

				&:empty {
					cursor: default;
				}

				&:hover {
					color: $link;
				}

				&.today {
					background-color: $primary-dark;
					color: $white;
				}

				&.disabled {
					opacity: .2;
					cursor: no-drop;

					&:hover {
						color: var(--bulma-text);
					}
				}

				&.selected {
					background-color: $primary-dark;
					border-top-right-radius: 0;
					border-bottom-right-radius: 0;
					color: $white;

					~ .selected {
						border-radius: 0;
					}

					&.first-of, &.last-of {
						background-color: $link-dark;
					}

					&:nth-of-type(7n+1), &.first-of {
						border-radius: 4px 0 0 4px;
					}

					&:nth-of-type(7n), &.last-of {
						border-top-right-radius: 4px;
						border-bottom-right-radius: 4px;
					}

					&:last-of-type:not(.last-of) {
						border-top-right-radius: 4px;
						border-bottom-right-radius: 4px;
					}
				}

			}
		}
	}

	.calendar-foot:not(:empty) {
		overflow: hidden;
		margin-top: .5em;

		.left-wrap {
			display: flex;
			flex-grow: 1;

			input:has(+input) {
				border-right: 0;
				border-top-right-radius: 0;
				border-bottom-right-radius: 0;
			}

			input + input {
				border-left: 0;
				border-top-left-radius: 0;
				border-bottom-left-radius: 0;
			}
		}
	}

	.calendar-modal {
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: .25em;
		background: var(--bulma-background);
		overflow: hidden;
		padding: 0 !important;

		.cell {
			display: flex;
			flex-direction: column;
			align-items: center;

			.cell-head {
				padding: 1rem 0 .5rem;
			}

			ol {
				display: flex;
				flex-wrap: wrap;
				flex-grow: 1;
				font-size: .875rem;

				li {
					display: flex;
					align-items: center;
					justify-content: center;

					a {
						padding: 2px 5px;
						color: var(--bulma-text);

						&:hover {
							color: $link;
						}
					}
				}
			}

			&:first-of-type {
				box-shadow: $shadow;
				background: var(--bulma-body-background-color);

				ol li {
					flex-basis: 33%;
				}
			}

			&:last-of-type ol li {
				flex-basis: 50%;

				a {
					flex-grow: 1;
					text-align: center;
				}
			}
		}
	}
}

@media screen and (max-width: 768px) {
	.date-panel.card {
		min-width: unset !important;
		max-width: 100%;

		.calendar-body {
			flex-direction: column;
			gap: .5em;

			dl {
				width: 100%;
			}
		}

		.calendar-foot {
			display: flex;
			flex-direction: column;
			gap: .5em;
			align-items: center;

			.left-wrap {
				width: 100%;
			}

			.buttons {
				width: 100%;
				justify-content: flex-end;

				.button {
					flex-grow: 1;
				}
			}
		}
	}
}
</style>
