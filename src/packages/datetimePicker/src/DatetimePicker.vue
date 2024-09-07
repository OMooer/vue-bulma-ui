<script lang="ts">
import Calendar from 'sa-calendar';
import { h, defineComponent, ref, watch, computed, withDirectives, inject } from 'vue';
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
		// showTime  : {
		// 	type   : Boolean,
		// 	default: false
		// },
		min      : [Date, String, Number],
		max      : [Date, String, Number],
		step     : [String, Number],
		splitText: {
			type   : String,
			default: '-'
		},
		messages : Object
	},
	setup(props, {slots, emit, expose}) {
		const isParentSmall = inject('isSmall', false);
		const isError = ref(false);
		const entity = ref();
		const formatMin = computed(() => {
			return props.min ? dateFormat(new Date(props.min as Date), 'YYYY-MM-DD') : null;
		});
		const formatMax = computed(() => {
			return props.max ? dateFormat(new Date(props.max as Date), 'YYYY-MM-DD') : null;
		});
		const formatType = computed(() => {
			return ['datetime', 'datetime-local'].includes(props.type) ? 'datetime-local' : 'date';
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
			const lang = props.messages?.[props.locale] ?? props.messages;
			let packText = lang ? (lang?.calendar || lang) : undefined;
			// 如果语言包的格式不对，抛弃掉
			if (packText && !('rangeStart' in packText && 'rangeEnd' in packText)) {
				packText = undefined;
			}
			packText ??= {
				rangeStart: 'YYYY-MM-DD',
				rangeEnd  : 'YYYY-MM-DD'
			};
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
							rightButtons : 'buttons',
							primaryButton: 'button is-primary is-small',
							defaultButton: 'button is-small',
							editClass    : 'input is-small'
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
							'is-shake'   : isError.value,
							'is-small'   : isParentSmall
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
														start: p === 'start' ? v : innerValue.value[0] ?? '',
														end  : p === 'end' ? v : innerValue.value[1] ?? '',
													}
												}
												innerValue.value = [detail.start, detail.end];
											}
										}, [
											// h('span', {role: 'range'}),
											// h('span', {role: 'range'})
											withDirectives(h('input', {
												'type'       : formatType.value,
												'data-type'  : formatType.value,// ? 'datetime-local' : 'date',
												'data-role'  : 'start',
												'step'       : props.step,
												'value'      : innerValue.value[0],
												'placeholder': JSON.parse(langPack.value)?.rangeStart,
												'required'   : isTruthy(props.required),
												onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
												onBlur       : (e: Event) => directiveFn(e.target)
											}), [[insertPlace]]),
											withDirectives(h('input', {
												'type'       : formatType.value,
												'data-type'  : formatType.value,// ? 'datetime-local' : 'date',
												'data-role'  : 'end',
												'step'       : props.step,
												'value'      : innerValue.value[1],
												'placeholder': JSON.parse(langPack.value)?.rangeEnd,
												'required'   : isTruthy(props.required),
												onFocus      : (e: Event) => directiveFn(e.target, {modifiers: {force: true}}),
												onBlur       : (e: Event) => directiveFn(e.target)
											}), [[insertPlace]])
										])
										// 单一时间
										: h('input', {
											'ref'            : entity,
											'class'          : {
												'input'    : true,
												'is-danger': isError.value
											},
											'type'           : formatType.value,
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
											// 'data-show-time' : props.showTime ? 'true' : null,
											'data-language' : props.locale,
											'data-lang-pack': langPack.value,
											onChange        : (e: any) => {
												setError(false);
												innerValue.value = e.target.value;
											},
											onBlur          : (e: any) => {
												if (!e.target.checkValidity() && e.target.value) {
													setError(true, e.target.validationMessage);
												}
												if (e.relatedTarget && !e.relatedTarget?.closest('.date-panel')) {
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

	.calendar-foot:not(:empty) {
		margin-top: 1rem;

		> div:first-of-type {
			display: flex;
			flex-grow: 1;
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
