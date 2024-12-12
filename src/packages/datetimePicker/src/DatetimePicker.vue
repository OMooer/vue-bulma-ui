<script lang="ts">
import Calendar from 'sa-calendar';
import { h, ref, watch, computed, withDirectives, inject, onMounted } from 'vue';
import TimePicker from './TimePicker.vue';
import { isElementPartiallyHidden, isTruthy } from '../../../utils';

function dateFormat(d: Date, f: string = 'YYYY-MM-DD hh:mm:ss') {
	const year  = d.getFullYear(),
	      month = d.getMonth() + 1,
	      day   = d.getDate();
	return `${ year }-${ month.toString().padStart(2, '0') }-${ day.toString().padStart(2, '0') }`;
}

export default {
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
		readonly  : {
			type   : Boolean,
			default: false
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
	emits       : ['update:modelValue', 'error'],
	setup(props, {emit, expose}) {
		const isParentSmall = inject('isSmall', false);
		const isError = ref(false);
		const isRight = ref(false);
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
			else if (innerDate.value) {
				let datetime = innerDate.value;
				if (formatType.value === 'datetime-local' && innerTime.value) {
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

		let instance: Calendar | undefined;

		onMounted(() => {
			entity.value.addEventListener('click', (e: any) => {
				if (props.readonly) {
					return;
				}
				if (entity.value.getAttribute('open') !== 'open') {
					isRight.value = false;
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
					requestAnimationFrame(() => {
						if (instance) {
							isRight.value = isElementPartiallyHidden(instance.$parent[0]);
						}
					});
				}
				e.stopPropagation();
			});
		});

		expose({
			setError
		});

		return {
			entity,
			setError,
			isError,
			isRight,
			isParentSmall,
			isAddonTime,
			formatType,
			formatMax,
			formatMin,
			langPack,
			innerRange,
			innerDate,
			innerTime,
			instance
		};
	},
	render() {
		const that = this;
		const props = this.$props;

		const directiveFn = (el: any, binding?: any) => {
			if (el.value || binding?.modifiers?.force) {
				el.type = el.getAttribute('data-type');
				if (binding?.modifiers?.force) {
					that.entity?.dispatchEvent(new Event('click'));
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

		return h('div', {
					class: {
						'vb-datetime': true,
						'is-disabled': isTruthy(props.disabled),
						'is-shake'   : that.isError,
						'is-danger'  : that.isError,
						'is-right'   : that.isRight,
						'is-small'   : that.isParentSmall
					}
				},
				[
					h('div', {
								class: {
									'field'     : true,
									'has-addons': that.isAddonTime,
								}
							},
							[
								// 日期主体框
								props.isRange
										// 范围选择
										? h('div', {
											'ref'            : el => that.entity = el,
											'role'           : 'calendar',
											'data-editable'  : props.readonly ? null : 'true',
											'data-auto-close': props.autoClose ? 'true' : null,
											'data-week-start': props.weekStart,
											'data-today'     : props.showToday ? 'true' : null,
											'data-show-time' : that.formatType === 'datetime-local' ? 'true' : null,
											'data-min'       : that.formatMin,
											'data-max'       : that.formatMax,
											'data-range'     : true,
											'data-split'     : props.splitText,
											'data-language'  : props.locale,
											'data-lang-pack' : that.langPack,
											onChange         : (e: any) => {
												let detail = e.detail;
												if (e.target !== that.entity) {
													const p = e.target.dataset?.role;
													const v = e.target.value;
													detail ??= {
														start: p === 'start' ? v : that.innerRange[0] ?? '',
														end  : p === 'end' ? v : that.innerRange[1] ?? '',
													}
												}
												// 如果没有显示到秒得去掉秒
												if (!props.step || Number(props.step) % 60 === 0) {
													detail.start = detail.start.split(':').slice(0, 2).join(':');
													detail.end = detail.end.split(':').slice(0, 2).join(':');
												}
												that.innerRange = [detail.start, detail.end];
											}
										}, [
											withDirectives(h('input', {
												'type'       : that.formatType,
												'data-type'  : that.formatType,// ? 'datetime-local' : 'date',
												'data-role'  : 'start',
												'step'       : props.step,
												'value'      : that.innerRange[0],
												'placeholder': JSON.parse(that.langPack)?.rangeStart,
												'readonly'   : isTruthy(props.readonly),
												'required'   : isTruthy(props.required),
												onClick      : (e: Event) => e.preventDefault(),
												onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
												onBlur       : (e: Event) => directiveFn(e.target)
											}), [[insertPlaceDirect]]),
											withDirectives(h('input', {
												'type'       : that.formatType,
												'data-type'  : that.formatType,// ? 'datetime-local' : 'date',
												'data-role'  : 'end',
												'step'       : props.step,
												'value'      : that.innerRange[1],
												'placeholder': JSON.parse(that.langPack)?.rangeEnd,
												'readonly'   : isTruthy(props.readonly),
												'required'   : isTruthy(props.required),
												onClick      : (e: Event) => e.preventDefault(),
												onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
												onBlur       : (e: Event) => directiveFn(e.target)
											}), [[insertPlaceDirect]])
										])
										// 单一时间
										: h('div', {class: 'control is-expanded'}, h('input', {
											'ref'  : el => that.entity = el,
											'class': {
												'input'    : true,
												'is-danger': that.isError
											},
											'type' : 'date',//formatType.value,
											'min'  : that.formatMin,
											'max'  : that.formatMax,
											// 'step'           : props.step,
											'disabled'       : isTruthy(props.disabled),
											'required'       : isTruthy(props.required),
											'readonly'       : isTruthy(props.readonly),
											'value'          : that.innerDate,
											'role'           : 'calendar',
											'data-editable'  : props.readonly ? null : 'true',
											'data-auto-close': props.autoClose ? 'true' : null,
											'data-week-start': props.weekStart,
											'data-today'     : props.showToday ? 'true' : null,
											'data-language'  : props.locale,
											'data-lang-pack' : that.langPack,
											onChange(e: any) {
												that.setError(false);
												that.innerDate = e.target.value;
											},
											onClick(e: Event) {
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
													that.setError(true, e.target.validationMessage);
												}
												if (e.relatedTarget && !e.relatedTarget?.closest('.date-panel')) {
													that.instance?.dismiss();
												}
												that.instance = undefined;
											}
										})),

								// 如果是非范围选择且是 datetime-local 类型则附加时间选择组件
								that.isAddonTime && (
										h(TimePicker, {
											class     : 'control is-right',
											showSecond: Number(props.step) % 60 !== 0,
											step      : props.step,
											modelValue: that.innerTime,
											'onUpdate:modelValue'(val: string) {
												that.innerTime = val;
											},
											onError: that.setError
										})
								)
							]
					)
				]
		);
	}
};
</script>

<style scoped lang="scss">
@import "../../../scss/variables";

.vb-datetime {
	position: relative;
	border-radius: var(--bulma-radius);

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

	&.is-danger {
		--bulma-focus-h: var(--bulma-danger-h);
		--bulma-focus-s: var(--bulma-danger-s);
		--bulma-focus-l: var(--bulma-danger-l);

		[role=calendar][data-range=true] {
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

	[role=calendar][data-range=true] {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(.5em - 1px) calc(.75em - 1px);
		box-sizing: border-box;
		border: solid 1px $input-border-color;
		border-radius: var(--bulma-radius);
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
			--bulma-input-border-l-delta: var(--bulma-hover-border-l-delta);
		}

		&:focus-within, &[open=open] {
			border-color: hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l));
			box-shadow: var(--bulma-focus-shadow-size) hsla(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l), var(--bulma-focus-shadow-alpha));
			z-index: 3;
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
		cursor: not-allowed;
		user-select: none;

		[role=calendar] {
			pointer-events: none;
			background-color: var(--bulma-background);
			border-color: var(--bulma-background);
			color: var(--bulma-text-weak);

			input::placeholder,
			input::-webkit-datetime-edit-text {
				color: var(--bulma-text-weak);
			}
		}
	}
}
</style>

<style lang="scss">
@import "../../../scss/variables";
// 弹出窗样式
.vb-datetime.is-right > .date-panel {
	right: 0 !important;
}

.date-panel {
	top: auto !important;
	left: auto !important;

	&.card {
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
			--calendar-radius: 4px;
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
					border-radius: var(--calendar-radius);

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
						cursor: not-allowed;

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
							border-radius: var(--calendar-radius) 0 0 var(--calendar-radius);
						}

						&:nth-of-type(7n), &.last-of {
							border-top-right-radius: var(--calendar-radius);
							border-bottom-right-radius: var(--calendar-radius);
						}

						&:last-of-type:not(.last-of) {
							border-top-right-radius: var(--calendar-radius);
							border-bottom-right-radius: var(--calendar-radius);
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
