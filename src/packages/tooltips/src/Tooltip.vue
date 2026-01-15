<script setup lang="ts">
defineProps({'isQuestion': Boolean, 'tips': String, 'inline': Boolean, 'noIcon': Boolean});
</script>

<template>
	<span class="vb-tips tooltip" :data-tips="tips" v-if="!$slots?.default">
		<span class="tooltip-icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
	</span>
	<div class="vb-tips tooltip" :data-tips="tips" v-else-if="noIcon">
		<slot/>
	</div>
	<div class="vb-tips icon-text" v-else-if="inline">
		<span class="tooltip-icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
		<slot/>
	</div>
	<div class="vb-tips dropdown is-hoverable" v-else>
		<div class="dropdown-trigger">
			<span class="dropdown-icon">
				<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
			</span>
		</div>
		<div class="dropdown-menu">
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
	--color: rgba(51, 51, 51, var(--color-opacity));
	--text: var(--bulma-white);
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

	&:hover {
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

	.dropdown-menu {
		transform: translateX(-30%);

		.dropdown-item {
			overflow: hidden;
			max-width: 25rem;
		}
	}
}

[data-theme="dark"] {
	.vb-tips.tooltip {
		--color: rgba(195, 195, 195, var(--color-opacity));
		--text: var(--bulma-black);
	}
}

@media (prefers-color-scheme: dark) {
	.vb-tips.tooltip {
		--color: rgba(204, 204, 204, var(--color-opacity));
		--text: var(--bulma-black);
	}
}
</style>
