<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

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
	return props.tips?.replace(/\\n/g, '\n');
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

defineExpose({
	setError
});
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

<style lang="scss" scoped>
@import "../../../scss/variables";

.field {
	&:has([required],[data-required]) {
		.form-el-label {
			&::before {
				content: '*';
				color: $danger;
				vertical-align: middle;
				line-height: 1;
			}
		}
	}
}

.is-float-form:has(input) {
	margin-top: .5rem;

	.form-el-label {
		position: relative;
		z-index: 10;
		float: left;
		margin-bottom: -2.5em;
		padding: .5em .75em;
		pointer-events: none;
		font-weight: normal;
		color: $placeholder-color;
		height: 2.5em;
		transition: transform .2s ease-in-out;
	}

	:deep(input::placeholder) {
		color: transparent;
		font-size: .875em;
	}

	&:focus-within, &:has(input:not(:placeholder-shown)) {
		.form-el-label {
			background-clip: content-box;
			background-color: var(--bulma-body-background-color);
			color: var(--bulma-body-color);
			//font-weight: bold;
			transform: translate(-.75em, -50%) scale(.9);
		}

		:deep(input::placeholder) {
			color: $placeholder-color;
		}
	}
}

.is-float-tips > .field:first-of-type {
	&::before, &::after {
		content: "";
		position: absolute;
		opacity: 0;
		transition: opacity .3s ease;
	}

	&:has(:focus-visible) {
		//&:focus-within {
		position: relative;

		&::before {
			content: attr(data-tips);
			position: absolute;
			transform: translate(-50%, .5rem);
			top: 2.5rem;
			left: 50%;
			margin-right: -50%;
			z-index: 10;
			opacity: 1;
			padding: .5rem .75rem;
			background-color: $white;
			border: solid 1px $grey-lighter;
			border-radius: $radius;
			box-shadow: $shadow;
			word-break: break-all;
			white-space: pre-wrap;
			font-size: .75rem;
			max-width: 100%;
			min-width: 2rem;
		}

		&::after {
			content: "";
			position: absolute;
			top: 2.5rem;
			left: 50%;
			z-index: 11;
			opacity: 1;
			margin: .25rem 0 0 0;
			background-color: $white;
			border: solid $grey-lighter;
			border-width: 1px 1px 0 0;
			width: .5rem;
			height: .5rem;
			transform: translateX(-50%) rotate(-45deg);
		}
	}
}
</style>