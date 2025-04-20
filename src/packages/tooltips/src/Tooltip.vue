<script setup lang="ts">
defineProps({'isQuestion': Boolean, 'tips': String, 'inline': Boolean});
</script>

<template>
	<span class="vb-tips icon" :data-tips="tips" v-if="!$slots?.default">
		<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-info']"/>
	</span>
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
@use "@/scss/variables" as va;

.vb-tips.icon {
	display: inline-flex;
	align-items: flex-end;
	justify-content: center;
	color: va.$link;
	height: auto;

	&:before {
		content: attr(data-tips);
		white-space: pre-wrap;
		visibility: hidden;
		position: absolute;
		padding: 3px 8px;
		border-radius: 4px;
		background-color: rgba(51, 51, 51, 0.85);
		text-align: left;
		font-size: 12px;
		color: #FFF;
		max-width: 200px;
		transform: translateY(-24px);
		opacity: 0;
		transition: opacity .3s ease-in;
	}

	&:after {
		content: "";
		visibility: hidden;
		position: absolute;
		border: solid 5px;
		border-color: transparent rgba(51, 51, 51, 0.85) rgba(51, 51, 51, 0.85) transparent;
		//border-radius: 2px;
		transform: rotate(45deg) translate(-14px, -13px);
		line-height: 0;
		font-size: 0;
		width: 0;
		height: 0;
		opacity: 0;
		transition: opacity .3s ease-in;
	}

	&:hover {
		&:before, &:after {
			visibility: visible;
			opacity: 1;
			z-index: 9999;
		}
	}
}

.vb-tips.dropdown {
	.dropdown-menu {
		transform: translateX(-30%);

		.dropdown-item {
			overflow: hidden;
			max-width: 25rem;
		}
	}
}
</style>
