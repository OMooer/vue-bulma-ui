<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

defineEmits(['toggle']);
const slots = defineSlots();
const props = defineProps({
	'header'      : String,
	'panel'       : null,
	'gap'         : {type: Number, default: 0},
	'showArrow'   : {type: Boolean, default: true},
	'iconPosition': {type: String, default: 'end'}
});
const panelRef = ref();
const panelHeight = ref(0);
const showing = ref(false);
const showPanel = ref(!props.panel?.folded);
const isFolded = ref(props.panel?.folded);
let timer: number;

onMounted(() => {
	panelHeight.value = panelRef.value.offsetHeight;
});

watch(() => props.panel?.folded, (isFold) => {
	if (timer) {
		window.clearTimeout(timer);
	}
	showPanel.value = true;
	// 折叠时直接设置 css 动画
	if (isFold) {
		showing.value = true;
	}
	// 延时处理 css 动画
	window.setTimeout(() => {
		showing.value = true;
		panelHeight.value = panelRef.value.offsetHeight;
		isFolded.value = isFold;
	});
	// 等待动画执行完
	timer = window.setTimeout(() => {
		showing.value = false;
		showPanel.value = !isFold;
	}, 300);
});
const styles = computed(() => {
	const sty = {};
	if (showing.value) {
		Object.assign(sty, {overflow: 'auto', height: panelHeight.value + 'px'});
	}
	return sty;
});
const gaps = computed(() => {
	return Math.max(0, props.gap);
});
const isShowExtra = computed(() => {
	return !props.panel?.folded && slots?.primaryButton;
});
const isArrowStart = computed(() => {
	return props.iconPosition === 'start';
});
</script>

<template>
	<section
			class="card" :class="{'is-static': panel?.force, 'is-fold': isFolded, 'is-gap': gaps}"
			:style="gaps ? {'margin-top': gaps + 'em'} : {}">
		<header @click="$emit('toggle', panel?.key)">
			<p class="card-box-title">
				<slot name="title" :folded="panel?.folded">
					<strong class="is-size-6" v-if="panel?.name">{{ panel.name }}</strong>
				</slot>
				<slot name="subtitle" :folded="panel?.folded"/>
			</p>

			<div class="buttons are-small" @click.stop v-if="isShowExtra">
				<slot name="primaryButton" :folded="panel?.folded"/>
			</div>

			<button type="button" class="card-header-icon" :class="{'is-start-pos': isArrowStart}" v-if="showArrow">
				<span class="icon" :class="{'roll-down': !panel?.folded}"><FasIcon icon="angle-right"/></span>
			</button>
		</header>

		<div class="card-body" :style="styles" v-show="showPanel">
			<div ref="panelRef" class="panel-content">
				<slot/>
			</div>
		</div>
		<slot name="footer" :folded="panel?.folded"/>
	</section>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";

.card {
	--bulma-block-spacing: 0;

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: .75rem;
		cursor: pointer;

		.card-box-title {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			flex-grow: 1;
			order: 1;

			strong {
				line-height: 1.875;

				&:not(:only-child) {
					margin-bottom: .25rem;
				}
			}
		}

		.card-header-icon {
			padding: 0.1875rem 0;
			order: 3;

			.icon {
				transition: all .3s ease;

				&.roll-down {
					transform: rotate(90deg);
				}
			}

			&.is-start-pos {
				order: 0;
			}
		}

		.buttons {
			margin-bottom: 0;
			order: 2;

			:deep(.button) {
				margin-bottom: 0;
			}
		}
	}

	.card-body {
		margin: 0 .75rem;
		border-top: solid 1px $split-color;
		transition: height .3s ease-in, opacity .3s ease-in, border .3s ease-in;

		.panel-content {
			padding: .75rem .25rem;
			font-size: .875rem;
		}
	}

	&.is-static {
		header {
			cursor: default;
		}
	}

	&.is-gap {
		&:first-of-type {
			margin-top: 0 !important;
		}
	}

	&:not(.is-gap):not(:first-of-type) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	&:not(.is-gap):not(:last-of-type) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	&.is-fold .card-body {
		overflow: hidden;
		border-top: solid 0 transparent;
		height: 0 !important;
		opacity: 0;
	}
}
</style>
