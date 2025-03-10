<script setup lang="ts">
import { computed, provide, ref, watchEffect } from 'vue';

const props = defineProps({
	label     : String,
	tips      : String,
	group     : Boolean,
	floatTips : Boolean,
	floatLabel: Boolean,
	isSmall   : Boolean
});

const isError = ref(false);
const helpMsg = ref();
const wrapTips = computed(() => {
	return props.floatTips ? props.tips?.replace(/\\n/g, '\n') : null;
});

watchEffect(() => {
	if (props.tips) {
		helpMsg.value = props.tips;
	}
});

function catchInvalid(e: any) {
	if (props.floatTips) {
		// 只要是悬浮提示的都阻止默认错误提示
		const target = e.target;
		const firstInvalidEl = target.form.querySelector(':invalid');
		// 延迟避开别的错误表单项的默认聚焦行为
		setTimeout(() => {
			// 在第一个错误项上聚焦
			if (target === firstInvalidEl) {
				target.focus();
			}
		});
		e.preventDefault();
	}
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	helpMsg.value = msg || props?.tips || '';
}

provide('isSmall', props.isSmall);
</script>

<template>
	<div class="field" :class="{'is-float-tips': floatTips, 'is-float-form': floatLabel}">
		<label class="label form-el-label" :class="{'is-small': isSmall}" v-if="label">{{ label }}</label>
		<div
				:data-tips="wrapTips" class="field"
				:class="{
					'is-grouped': group,
					'has-addons': !group && ($slots?.addonLeft || $slots?.addonRight)
				}">
			<slot name="addonLeft"/>
			<div class="control is-expanded" @invalid.capture="catchInvalid">
				<slot :setError="setError"/>
			</div>
			<slot name="addonRight"/>
		</div>
		<slot name="tips" :text="helpMsg" :error="isError">
			<div class="control" v-if="helpMsg && (isError || !floatTips)">
				<p :class="['help', isError ? 'is-danger' : null]">{{ helpMsg }}</p>
			</div>
		</slot>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.field {
	&:has([required],[data-required=true]) {
		.form-el-label {
			&::before {
				content: '*';
				color: va.$danger;
				vertical-align: middle;
				line-height: 1;
			}
		}
	}
}

.is-float-form:has(input,textarea) {
	--float-height: 1em;

	&:has(.field .control .is-small) {
		font-size: var(--bulma-size-small);
	}

	&:has(.field .control .is-medium) {
		font-size: var(--bulma-size-medium);
	}

	&:has(.field .control .is-large) {
		font-size: var(--bulma-size-large);
	}

	.form-el-label {
		position: relative;
		z-index: 10;
		margin-bottom: 0;
		padding: var(--bulma-control-padding-vertical) .75em var(--bulma-control-padding-vertical);
		pointer-events: none;
		font-weight: normal;
		color: var(--bulma-body-color);
		line-height: 1.7;
		height: var(--bulma-control-height);
		transform-origin: left;
		transition: transform .2s ease-in-out;

		&:has(+.field .control input) {
			transform: translateY(.5em);
		}

		&:has(+.field .control .is-small) {
			font-size: var(--bulma-size-small);
		}

		&:has(+.field .control .is-medium) {
			font-size: var(--bulma-size-medium);
		}

		&:has(+.field .control .is-large) {
			font-size: var(--bulma-size-large);
		}

		+ .field {
			margin-top: calc(var(--bulma-control-height) * -1);
		}
	}


	:deep(input) {
		padding-top: calc(var(--bulma-control-padding-vertical) + var(--float-height));
		height: calc(var(--bulma-control-height) + var(--float-height));

		&::placeholder {
			color: transparent;
			font-size: .875em;
		}
	}

	:deep(textarea::placeholder) {
		color: transparent;
		font-size: .875em;
	}

	// 进入焦点或者已输入内容
	&:focus-within, &:has(input:not(:placeholder-shown),textarea:not(:placeholder-shown)) {
		.form-el-label {
			//background-clip: content-box;
			//background-color: var(--bulma-body-background-color);
			color: va.$placeholder-color;
			font-weight: bold;
			transform: scale(.875) translate(-.2em, -.5em) !important;
		}

		:deep(input::placeholder) {
			color: va.$placeholder-color;
		}

		:deep(textarea.textarea) {
			padding-top: calc(var(--bulma-control-height) * .875 - .5em);

			&::placeholder {
				color: va.$placeholder-color;
			}
		}
	}
}

.is-float-tips {
	--floatTop: 2.5rem;

	&:has(.is-small) {
		--floatTop: 1.875rem;
	}

	> .field:first-of-type {
		$bgColor: var(--bulma-body-background-color);

		&::before, &::after {
			content: "";
			position: absolute;
			opacity: 0;
			transition: opacity .3s ease;
		}

		&:has(:focus-visible) {
			position: relative;

			&::before {
				content: attr(data-tips);
				position: absolute;
				transform: translate(-50%, .5rem);
				top: var(--floatTop);
				left: 50%;
				margin-right: -50%;
				z-index: 10;
				opacity: 1;
				padding: .5rem .75rem;
				background-color: $bgColor;
				border: solid 1px va.$split-color;
				border-radius: va.$radius;
				box-shadow: va.$shadow;
				word-break: break-all;
				white-space: pre-wrap;
				font-size: .75rem;
				max-width: 100%;
				min-width: 2rem;
			}

			&::after {
				content: "";
				position: absolute;
				top: var(--floatTop);
				left: 50%;
				z-index: 11;
				opacity: 1;
				margin: .25rem 0 0 0;
				background-color: $bgColor;
				border: solid va.$split-color;
				border-width: 1px 1px 0 0;
				width: .5rem;
				height: .5rem;
				transform: translateX(-50%) rotate(-45deg);
			}
		}
	}
}
</style>