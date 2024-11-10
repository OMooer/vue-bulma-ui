<script setup lang="ts">
import { computed, onBeforeMount, ref } from "vue";

defineEmits(['close']);
const props = defineProps({
	direction: {type: String, default: 'right'},
	hasClose : {type: Boolean, default: true},
});

const contClassName = computed(() => {
	switch (props.direction) {
		case 'top':
			return 'is-top';
		case 'bottom':
			return 'is-bottom';
		case 'left':
			return 'is-left';
		default:
			return 'is-right';
	}
});
const animateName = computed(() => {
	switch (props.direction) {
		case 'top':
			return 'animate-slide-down';
		case 'bottom':
			return 'animate-slide-up';
		case 'left':
			return 'animate-slide-right';
		default:
			return 'animate-slide-left';
	}
});

const ready = ref(false);
onBeforeMount(() => {
	ready.value = true;
});

function dismiss(e: any) {
	if (!e || !e.target.closest('.sp-scroll-view')) {
		ready.value = false;
	}
}
</script>

<template>
	<Teleport to="body">
		<div class="side-page" @click="dismiss">
			<Transition :name="animateName" @after-leave="$emit('close')" appear>
				<div class="sp-container" :class="contClassName" v-show="ready">
					<!-- 关闭按钮 -->
					<a class="delete is-medium" aria-label="Close" @click="dismiss" v-if="hasClose"></a>
					<div class="sp-scroll-view">
						<slot/>
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<style scoped lang="scss">
@import "../../../scss/variables";
@import "../../../scss/animates";

.side-page {
	position: fixed;
	background: rgba(255, 255, 255, .2);
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	z-index: 39;

	.sp-container {
		position: absolute;
		background: var(--bulma-background);
		padding: 0 1rem;
		border: $split-color solid;
		box-shadow: $shadow;
		box-sizing: border-box;

		&.is-left {
			border-width: 0 0 0 1px;
			left: 0;
			bottom: 0;
			width: 45%;
			height: 100%;
		}

		&.is-right {
			border-width: 0 1px 0 0;
			right: 0;
			bottom: 0;
			width: 45%;
			height: 100%;
		}

		&.is-top {
			border-width: 0 0 1px 0;
			top: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: 45%;
		}

		&.is-bottom {
			border-width: 1px 0 0 0;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			height: 45%;
		}

		> .delete {
			position: absolute;
			top: 1rem;
		}

		&.is-left > .delete {
			right: 0;
			transform: translateX(60%);
		}

		&.is-right > .delete {
			left: 0;
			transform: translateX(-60%);
		}

		&.is-top > .delete {
			top: 0;
			right: 0;
		}

		&.is-bottom > .delete {
			top: 0;
			right: 0;
			transform: translateY(-60%);
		}

		.sp-scroll-view {
			overflow: auto;
			padding: 1rem 0;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
		}
	}
}
</style>
