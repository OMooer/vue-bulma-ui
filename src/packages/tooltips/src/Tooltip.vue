<script setup lang="ts">
defineProps({'isQuestion': Boolean, 'tips': String, 'inline': Boolean, 'noIcon': Boolean});
</script>

<template>
	<span class="vb-tips tooltip" :data-tips="tips" v-if="!$slots?.default">
		<span class="icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
	</span>
	<div class="vb-tips tooltip" :data-tips="tips" v-else-if="noIcon">
		<slot/>
	</div>
	<div class="vb-tips icon-text" v-else-if="inline">
		<span class="icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
		</span>
		<slot/>
	</div>
	<div class="vb-tips dropdown is-hoverable" v-else>
		<div class="dropdown-trigger">
			<span class="icon">
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
	display: inline-flex;
	align-items: flex-start;
	justify-content: center;

	&::before {
		content: attr(data-tips);
		white-space: pre-wrap;
		visibility: hidden;
		position: absolute;
		padding: 3px 8px;
		border-radius: 4px;
		background-color: rgba(51, 51, 51, 0);
		text-align: left;
		font-size: 12px;
		color: transparent;
		max-width: 200px;
		transform: translateY(calc(-100% - 5px));
		transition: background-color .3s ease-in, color .3s ease-in;
	}

	&::after {
		content: "";
		visibility: hidden;
		position: absolute;
		border: solid 5px;
		border-color: transparent rgba(51, 51, 51, 0) rgba(51, 51, 51, 0) transparent;
		transform: translateY(-100%) rotate(45deg);
		line-height: 0;
		font-size: 0;
		width: 0;
		height: 0;
		transition: border-color .3s ease-in;
	}

	&:hover {
		&::before, &::after {
			visibility: visible;
			z-index: 9999;
		}

		&::before {
			background-color: rgba(51, 51, 51, 0.85);
			color: var(--bulma-white);
		}

		&::after {
			border-color: transparent rgba(51, 51, 51, 0.85) rgba(51, 51, 51, 0.85) transparent;
		}
	}
}

.vb-tips.icon-text {
	gap: 0;
}

.vb-tips.dropdown {
	vertical-align: unset;

	.dropdown-trigger {
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
</style>
