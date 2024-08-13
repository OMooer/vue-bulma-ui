<script setup lang="ts">
defineProps(['isQuestion', 'tips', 'inline']);
</script>

<template>
	<span class="vb-tips icon" :data-tips="tips" v-if="!$slots?.default">
		<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-exclamation']"/>
	</span>
	<div class="vb-tips inline" v-else-if="inline">
		<span class="icon">
			<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-exclamation']"/>
		</span>
		<slot/>
	</div>
	<div class="vb-tips dropdown is-hoverable" v-else>
		<div class="dropdown-trigger">
			<span class="icon">
				<FasIcon :icon="['fas', isQuestion ? 'circle-question' : 'circle-exclamation']"/>
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
@import "../../../scss/variables";

.vb-tips.icon {
	display: inline-flex;
	align-items: flex-end;
	justify-content: center;
	color: $link;
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
		color: #fff;
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
		}
	}
}

.vb-tips.dropdown {
	.dropdown-menu {
		transform: translateX(-4rem);
		
		.dropdown-item {
			overflow: hidden;
			max-width: 25rem;
		}
	}
}

.vb-tips.inline {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: .75rem;
}
</style>
