<script setup lang="ts">
import AnimateNum from '@/packages/animateNumber';
import type { Props } from './types/badge';
import { computed } from 'vue';

defineOptions({inheritAttrs: false});
const {
	      type = 'none',
	      state, preset, color,
	      size,
	      effect, active, less,
	      text,
	      max  = 0, number = 1
      } = defineProps<Props>();
const classCss = computed(() => {
	const stateStyle = {
		''       : null,
		'success': 'success',
		'error'  : 'danger',
		'default': 'grey',
		'process': 'link'
	}[state ?? ''];

	return {
		'vb-badge'            : true,
		'is-corner'           : type === 'corner',
		'is-ribbon'           : type === 'ribbon',
		'is-active'           : active || state === 'process',
		'is-danger'           : !stateStyle && !preset && !color,
		[`is-${ preset }`]    : preset && !stateStyle,
		[`is-${ stateStyle }`]: stateStyle,
		[`is-${ size }`]      : size,
	}
});
const styleCss = computed(() => {
	return !preset && !state ? {
		'background-color': color
	} : null
});
const numberValue = computed(() => {
	return (number > max && max > 0) ? `${ max }+` : number;
});
const content = computed(() => {
	return text ?? numberValue.value.toString();
});
</script>

<template>
	<Transition name="animate-zoom">
		<span :class="classCss" :style="styleCss" :data-title="content" :aria-label="content" v-if="number > 0">
			<template v-if="!less">
				<AnimateNum :text="content" v-if="effect"/>
				<template v-else>{{ content }}</template>
			</template>
		</span>
	</Transition>
</template>

<style scoped lang="scss">
@use "@/scss/animates";

.vb-badge {
	--pre-shadow: #CCC;
	display: inline-flex;
	padding: 0.25em 0.5em;
	border-radius: 9999px;
	line-height: 1;
	color: var(--bulma-text-invert);

	// 颜色
	$colors: primary, success, warning, danger, info;
	@each $value in $colors {
		&.is-#{$value} {
			--af-border-color: var(--bulma-#{$value}-60);
			--af-border-shadow: var(--bulma-#{$value}-45);
			background-color: var(--bulma-#{$value}-60);
		}
	}

	&.is-dark {
		--af-border-color: var(--bulma-dark);
		--af-border-shadow: var(--bulma-black);
		background-color: var(--bulma-dark);
	}

	&.is-light {
		--af-border-color: var(--bulma-light);
		--af-border-shadow: var(--bulma-grey-lighter);
		background-color: var(--bulma-light);
		color: var(--bulma-grey);
	}

	&.is-grey {
		--af-border-color: var(--bulma-grey-lighter);
		background-color: var(--bulma-grey-lighter);
		color: var(--bulma-dark);
	}

	&.is-link {
		--af-border-color: var(--bulma-link-65);
		background-color: var(--bulma-link-65);
	}

	// 活动动画
	&.is-active {
		position: relative;

		&::after {
			content: "";
			position: absolute;
			display: block;
			inset: 0;
			border-radius: inherit;
			border: solid 0.125em var(--af-border-color);
			animation: pulse 1s infinite ease-in-out;
		}
	}

	// 缎带标
	&.is-ribbon {
		position: absolute;
		top: 0;
		right: 0;
		padding: 0.5em;
		border-radius: 0.1875em 0.1875em 0 0.1875em;
		box-shadow: 0 0.125em 0.1875em -0.0625em var(--af-border-shadow, var(--pre-shadow));
		transform: translate(10px, 0.4em);

		&::after {
			content: "";
			position: absolute;
			display: block;
			border: solid 7px;
			border-color: transparent var(--af-border-shadow, var(--pre-shadow)) transparent transparent;
			right: 0;
			bottom: 0;
			width: 0;
			height: 0;
			z-index: -1;
			transform: translate(0, 14px) rotate(45deg);
			transform-origin: top right;
		}
	}

	// 角标
	&.is-corner {
		position: absolute;
		top: 0;
		right: 0;
		border: solid .0625em var(--bulma-background);
		box-sizing: content-box;
		z-index: 3;
		transform: translate(50%, -50%);
		transform-origin: top right;
	}

	// 无数字点标
	&:empty {
		padding: 0;
		line-height: 0;
		font-size: 0;
		width: .375em;
		height: .375em;
	}

	// 大小
	&.is-xs {
		font-size: 0.6875rem;
	}

	&.is-sm {
		font-size: 0.875rem;
	}

	&.is-lg {
		font-size: 1.25rem;
	}

	&.is-xl {
		font-size: 1.5rem;
	}

	&.is-2xl {
		font-size: 2rem;
	}
}

@media (prefers-color-scheme: dark) {
	.vb-badge {
		--pre-shadow: #555;
	}
}

[data-theme="dark"] .vb-badge {
	--pre-shadow: #555;
}
</style>