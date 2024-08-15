<script lang="ts">
import Calendar from 'sa-calendar';
import { h, defineComponent, ref, watch, computed, withDirectives } from 'vue';
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
		modelValue: null,
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
		showTime  : {
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
	setup(props, {slots, emit, expose}) {
		const isError = ref(false);
		const entity = ref();
		const formatMin = computed(() => {
			return props.min ? dateFormat(new Date(props.min as Date), 'YYYY-MM-DD') : null;
		});
		const formatMax = computed(() => {
			return props.max ? dateFormat(new Date(props.max as Date), 'YYYY-MM-DD') : null;
		});
		const inner = ref('');
		const innerRange = ref(['', '']);
		const innerValue = computed({
			get() {
				return typeof props.modelValue === 'undefined' ?
						(props.isRange ? innerRange.value : inner.value)
						: props.modelValue;
			},
			set(value: any) {
				if (props.isRange) {
					innerRange.value = value;
				}
				else {
					inner.value = value;
				}
				emit('update:modelValue', value);
			}
		});

		const langPack = computed(() => {
			let packText = (props?.messages && props.messages[props.locale])
					? props.messages[props.locale]?.calendar
					: undefined;
			packText ??= {
				rangeStart: 'YYYY-MM-DD',
				rangeEnd  : 'YYYY-MM-DD'
			};
			return JSON.stringify(packText);
		});

		const directiveFn = (el: any) => {
			if (el.value) {
				el.type = el.getAttribute('data-type');
			}
			else {
				el.type = 'text';
			}
		}
		const insertPlace = {
			beforeMount: directiveFn,
			updated    : directiveFn
		}

		let instance: typeof Calendar;

		function setError(is: boolean, msg?: string) {
			isError.value = is;
			is && entity.value.focus();
			emit('error', is, msg);
		}

		watch(() => entity.value, (el: any) => {
			if (!el) {
				return;
			}
			entity.value.addEventListener('click', (e: any) => {
				if (entity.value.getAttribute('open') !== 'open') {
					instance = new Calendar({
						trigger: entity.value,
						css    : {
							mainClass    : 'date-panel card',
							selectedClass: 'selected has-background-link has-text-white',
							primaryClass : 'button is-primary is-small'
						}
					});
					entity.value.focus();
				}
				e.stopPropagation();
			});
		}, {immediate: true});

		expose({
			setError
		});

		return () => {
			return h('div', {
						class: {
							'vb-datetime': true,
							'field'      : true,
							'is-disabled': isTruthy(props.disabled),
							'is-shake'   : isError.value
						}
					},
					[
						slots?.default ? slots.default() : [],
						h('div', {
									class: 'control is-expanded'
								},
								props.isRange
										// 范围选择
										? h('div', {
											'ref'            : entity,
											'role'           : 'calendar',
											'data-editable'  : props.editable ? 'true' : null,
											'data-auto-close': props.autoClose ? 'true' : null,
											'data-week-start': props.weekStart,
											'data-today'     : props.showToday ? 'true' : null,
											'data-show-time' : props.showTime ? 'true' : null,
											'data-min'       : formatMin.value,
											'data-max'       : formatMax.value,
											'data-range'     : true,
											'data-split'     : props.splitText,
											'data-language'  : props.locale,
											'data-lang-pack' : langPack.value,
											onChange         : (e: any) => {
												innerValue.value = [e.detail.start, e.detail.end];
											}
										}, [
											// h('span', {role: 'range'}),
											// h('span', {role: 'range'})
											withDirectives(h('input', {
												'type'       : 'text',
												'data-type'  : props.showTime ? 'datetime-local' : 'date',
												'step'       : props.step,
												'value'      : innerValue.value[0],
												'placeholder': JSON.parse(langPack.value)?.rangeStart,
												'required'   : isTruthy(props.required)
											}), [[insertPlace]]),
											withDirectives(h('input', {
												'type'       : 'text',
												'data-type'  : props.showTime ? 'datetime-local' : 'date',
												'step'       : props.step,
												'value'      : innerValue.value[1],
												'placeholder': JSON.parse(langPack.value)?.rangeEnd,
												'required'   : isTruthy(props.required)
											}), [[insertPlace]])
										])
										// 单一时间
										: h('input', {
											'ref'            : entity,
											'class'          : {
												'input'    : true,
												'is-danger': isError.value
											},
											'type'           : props.type,
											'min'            : formatMin.value,
											'max'            : formatMax.value,
											'step'           : props.step,
											'disabled'       : isTruthy(props.disabled),
											'required'       : isTruthy(props.required),
											'value'          : innerValue.value,
											'role'           : 'calendar',
											'data-editable'  : props.editable ? 'true' : null,
											'data-auto-close': props.autoClose ? 'true' : null,
											'data-week-start': props.weekStart,
											'data-today'     : props.showToday ? 'true' : null,
											'data-show-time' : props.showTime ? 'true' : null,
											'data-language'  : props.locale,
											'data-lang-pack' : langPack.value,
											onChange         : (e: any) => {
												setError(false);
												innerValue.value = e.target.value;
											},
											onBlur           : (e: any) => {
												if (!e.target.checkValidity() && e.target.value) {
													setError(true, e.target.validationMessage);
												}
												if (e.relatedTarget && !e.relatedTarget?.getAttribute('role-action')) {
													instance?.dismiss();
												}
											}
										})
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

	input[type="text"],
	input[type="datetime-local"],
	input[type="date"] {
		&::-webkit-clear-button,
		&::-webkit-inner-spin-button,
		&::-webkit-calendar-picker-indicator {
			display: none;
		}
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
		pointer-events: none;
		cursor: no-drop;

		.control {
			opacity: .5;
		}

		[role=calendar] {
			background-color: $grey-lightest;
			border-color: $grey-lightest;
		}
	}
}

// 弹出窗样式
.date-panel.card {
	position: absolute;
	padding: 1rem;
	box-sizing: border-box;
	max-width: 35rem;
	z-index: 9988;

	&:not(.is-multiple) {
		width: 15rem;
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
						color: $black;
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
}

@media screen and (max-width: 768px) {
	.date-panel.card {
		max-width: 15rem;

		.calendar-body {
			flex-direction: column;
			gap: 1rem;

			dl {
				width: 100%;
			}
		}
	}
}
</style>
