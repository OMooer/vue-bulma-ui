<script setup lang="ts">
import { FontAwesomeIcon as FontIcon } from '@fortawesome/vue-fontawesome';
import InputUI from './InputUI.vue';
import { computed, defineComponent, h, inject, ref, useAttrs, watch } from 'vue';

defineOptions({
	inheritAttrs: false,
	name        : 'VbPassword'
});
const isAtElement = inject('formElement', false);
const attrs = useAttrs();
const props = defineProps<{
	type?: 'password' | 'text';
	readonly?: boolean;
	required?: boolean;
	disabled?: boolean;
	placeholder?: string;
	pattern?: string;
	minlength?: string | number;
	maxlength?: string | number;
	autocomplete?: string;
}>();
const emit = defineEmits(['update:modelValue', 'showPlain', 'error']);
const innerValue = defineModel({default: ''});
const showPassword = ref(false);
const isError = ref(false);
const entity = ref();
const bindProps = computed(() => {
	const {type, ...binds} = props;
	return binds;
});

watch(innerValue, () => {
	setError(false);
});

const inputVNode = defineComponent(() => {
	return () => [
		h(InputUI, {
			ref: entity,
			type : showPassword.value ? 'text' : 'password',
			class: [attrs.class, 'vb-password'],
			...bindProps.value,
			modelValue: innerValue.value,
			'onUpdate:modelValue'(val: string) {
				innerValue.value = val;
			},
			onError: setError
		}),
		h('span', {
			class  : ['icon', 'is-small', 'is-right', {'show': showPassword.value}],
			onClick: toggleShow
		}, h(FontIcon, {icon: ['fas', showPassword.value ? 'eye' : 'eye-slash']}))
	]
});

function toggleShow() {
	showPassword.value = !showPassword.value;
	emit('showPlain', showPassword.value);
}

function setError(is: boolean, msg?: string) {
	isError.value = is;
	is && entity.value?.$el.focus();
	emit('error', is, msg);
}

defineExpose({
	setError
});
</script>

<template>
	<template v-if="isAtElement">
		<Component :is="inputVNode"/>
	</template>
	<div class="control is-expanded has-icons-right" :class="{'has-icons-left': $slots?.leftIcon}" v-else>
		<Component :is="inputVNode"/>
		<slot name="leftIcon"/>
	</div>
</template>

<style lang="scss">
.vb-password.vb-password {
	+ .icon.icon {
		pointer-events: auto;
		cursor: pointer;

		&:hover {
			color: var(--bulma-input-icon-hover-color);
		}

		[data-theme=dark] & {
			--bulma-input-icon-color: hsla(221deg, 14%, 89%, .5);
		}

		&.show {
			color: var(--bulma-text-strong);
		}
	}

	&[disabled] + .icon {
		pointer-events: none;
		color: var(--bulma-input-icon-color) !important;
	}
}

@media (prefers-color-scheme: dark) {
	.vb-password + .icon {
		--bulma-input-icon-color: hsla(221deg, 14%, 89%, .5);
	}
}
</style>
