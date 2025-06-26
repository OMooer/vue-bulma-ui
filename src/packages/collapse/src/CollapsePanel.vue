<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

defineEmits(['toggle']);
const props = defineProps({
	'title'       : String,
	'panel'       : null,
	'gap'         : {type: Number, default: 0},
	'showArrow'   : {type: Boolean, default: true},
	'iconPosition': {type: String, default: 'end'},
	'force'       : Boolean
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
	// 直接设置 css 动画
	showing.value = true;
	// 延迟处理 css 动画高度
	requestAnimationFrame(() => {
		// 展开时计算实际高度
		if (!isFold) {
			panelHeight.value = panelRef.value.offsetHeight;
		}
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

			<div class="card-operations" v-if="$slots.primaryButton">
				<Transition name="animate-slide-left">
					<div class="buttons are-small" @click.stop v-show="!panel?.folded">
						<slot name="primaryButton" :folded="panel?.folded"/>
					</div>
				</Transition>
			</div>

			<button
					type="button" class="card-header-icon" :class="{'is-start-pos': isArrowStart}" aria-hidden="true"
					v-if="showArrow">
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
@use "@/scss/variables" as va;
@use "@/scss/animates";

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

		.card-operations {
			overflow: hidden;
			order: 2;

			.buttons {
				margin-bottom: 0;

				:deep(.button) {
					margin-bottom: 0;
				}
			}
		}
	}

	.card-body {
		overflow: hidden;
		margin: 0 .75rem;
		border-top: solid 1px va.$split-color;
		transition: height .2s ease-in-out, opacity .2s ease-in-out;

		.panel-content {
			padding: .75rem .25rem;
			font-size: .875rem;
		}
	}

	&.is-static {
		header {
			cursor: default;

			.card-header-icon {
				pointer-events: none;
			}
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
		height: 0 !important;
		opacity: 0;
	}
}
</style>
