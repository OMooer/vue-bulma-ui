<script setup lang="ts">
import { ref, useId } from 'vue';

defineProps({'isQuestion': Boolean, 'tips': String, 'inline': Boolean, 'noIcon': Boolean});

const tipsDescId = useId();
const ddOpen = ref(false);
</script>

<template>
	<span class="vb-tips tooltip" tabindex="0" :data-tips="tips" :aria-label="tips" v-if="!$slots?.default">
		<span class="tooltip-icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
	</span>
	<div class="vb-tips tooltip" :data-tips="tips" :aria-label="tips" v-else-if="noIcon">
		<slot/>
	</div>
	<div class="vb-tips icon-text" v-else-if="inline">
		<span class="tooltip-icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
		<slot/>
	</div>
	<div class="vb-tips dropdown is-hoverable" @focusin="ddOpen = true" @focusout="ddOpen = false" v-else>
		<div
				class="dropdown-trigger"
				tabindex="0"
				role="button"
				:aria-expanded="ddOpen"
				aria-haspopup="true"
				:aria-describedby="tipsDescId">
			<span class="dropdown-icon" aria-hidden="true">
				<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
			</span>
		</div>
		<div class="dropdown-menu" :id="tipsDescId">
			<div class="dropdown-content">
				<div class="dropdown-item">
					<slot/>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
.vb-tips.tooltip {
	--color-opacity: 0;
	display: inline-flex;
	align-items: flex-start;
	justify-content: center;
	position: relative;

	&::before {
		content: attr(data-tips);
		white-space: pre-wrap;
		visibility: hidden;
		position: absolute;
		padding: 5px 8px;
		border-radius: 4px;
		background-color: var(--color);
		text-align: left;
		font-size: 12px;
		color: transparent;
		min-width: 1.5rem;
		max-width: 10rem;
		width: max-content;
		transform: translateY(calc(-100% - 5px));
		transition: background-color .3s ease-in, color .3s ease-in;
	}

	&::after {
		content: "";
		visibility: hidden;
		position: absolute;
		border: solid 5px;
		border-color: transparent var(--color) var(--color) transparent;
		transform: translateY(-100%) rotate(45deg);
		line-height: 0;
		font-size: 0;
		width: 0;
		height: 0;
		transition: border-color .3s ease-in;
	}

	> .tooltip-icon {
		margin: 0 0.25em;
	}

	&:hover, &:focus-within {
		--color-opacity: 0.85;

		&::before, &::after {
			visibility: visible;
			z-index: 9999;
		}

		&::before {
			color: var(--text);
		}
	}
}

.vb-tips.icon-text {
	line-height: unset;
}

.vb-tips.dropdown {
	vertical-align: unset;

	.dropdown-trigger {
		padding: 0 0.25em;
		line-height: normal;
	}

	&:focus-within .dropdown-menu {
		display: block;
	}

	.dropdown-menu {
		transform: translateX(-30%);

		.dropdown-item {
			overflow: hidden;
			max-width: 25rem;
		}
	}
}

@mixin lightMode {
	--color: rgba(51, 51, 51, var(--color-opacity));
	--text: var(--bulma-white);
}

@mixin darkMode {
	--color: rgba(204, 204, 204, var(--color-opacity));
	--text: var(--bulma-black);
}

[data-theme="light"] {
	.vb-tips.tooltip {
		@include lightMode();
	}
}

[data-theme="dark"] {
	.vb-tips.tooltip {
		@include darkMode();
	}
}

@media (prefers-color-scheme: light) {
	.vb-tips.tooltip {
		@include lightMode();
	}
}

@media (prefers-color-scheme: dark) {
	.vb-tips.tooltip {
		@include darkMode();
	}
}
</style>
