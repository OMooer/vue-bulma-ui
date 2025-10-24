<script setup lang="ts">
import { provide, ref, watchEffect } from 'vue';
import { isTruthy } from '@/utils';
import InteractiveTracker from '../../InteractiveTracker';

defineOptions({inheritAttrs: false});
const emit = defineEmits(['close']);
const {title, maskClose, hasClose = true, hasCancel = true} = defineProps<{
	title?: string;
	maskClose?: boolean;
	hasClose?: boolean;
	hasCancel?: boolean;
	style?: any;
}>();
const isShow = defineModel('show', {default: true});
const isMainShow = ref(isShow.value);
const isMoving = ref(false);
const modalX = ref(0);
const modalY = ref(0);

watchEffect(() => {
	if (isShow.value) {
		isMainShow.value = true;
	}
});

function open() {
	isShow.value = true;
}

function dismiss() {
	isShow.value = false;
}

function afterDismissAnimate() {
	emit('close');
	isMainShow.value = false;
}

function mClose(isMaskClose: boolean | string) {
	if (isTruthy(isMaskClose)) {
		dismiss();
	}
}

function btnClose(e: Event) {
	const btn = e.target as HTMLElement;
	if (btn?.nodeName === 'BUTTON') {
		if (btn.classList.contains('delete')) {
			dismiss();
		}
	}
}

provide('modalDismiss', dismiss);
defineExpose({
	open,
	dismiss
});
</script>

<template>
	<Teleport to="body" v-if="isMainShow">
		<div
				class="vb-modal modal" :class="[$attrs.class, isMainShow ? 'is-active' : null]"
				:style="`--modal-x: ${modalX}px; --modal-y: ${modalY}px`">
			<div class="modal-background" @click="mClose(maskClose)"></div>
			<Transition name="animate-zoom" @after-leave="afterDismissAnimate" appear>
				<div :class="[title ? 'modal-card' : 'modal-content']" :style="style" v-show="isShow">
					<template v-if="title">
						<InteractiveTracker
								tag="header" class="modal-card-head" :class="{'is-moving': isMoving}" :event-trigger="['drag']"
								@click="btnClose" @start="isMoving = true" @end="isMoving = false"
								v-model:x="modalX" v-model:y="modalY">
							<p class="modal-card-title">{{ title }}</p>
							<button type="button" class="delete" aria-label="close" v-if="isTruthy(hasClose)"></button>
						</InteractiveTracker>
						<section class="modal-card-body">
							<slot :dismiss="dismiss"/>
						</section>
						<footer class="modal-card-foot">
							<slot name="primary-buttons" :dismiss="dismiss"/>
							<button type="button" class="button" @click="dismiss" v-if="isTruthy(hasCancel)">Cancel</button>
						</footer>
					</template>
					<div class="card" v-else>
						<button
								type="button" class="delete is-right" aria-label="close" @click="dismiss"
								v-if="isTruthy(hasClose)"></button>
						<div class="card-content">
							<slot :dismiss="dismiss"/>
						</div>
						<slot name="footer" :dismiss="dismiss"/>
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<style scoped lang="scss">
@use "@/scss/animates";

.vb-modal.modal {
	.modal-card {
		translate: var(--modal-x) var(--modal-y);

		&-head {
			padding-top: .8rem;
			padding-bottom: .8rem;

			&.is-moving {
				cursor: move;
				user-select: none;
			}
		}

		&-title {
			font-size: .94rem;
			font-weight: bold;
		}

		&-foot {
			padding-top: .5rem;
			padding-bottom: .5rem;

			.button {
				font-size: .75rem;
			}
		}
	}

	.modal-content {
		max-width: 100vw;
		max-height: 100vh;

		.card {
			position: relative;
			margin: 1em;
			overflow: hidden;
			box-sizing: border-box;
			height: calc(100% - 2em);

			.card-content {
				overflow: auto;
			}

			.card-content:last-child {
				height: 100%;
			}

			.delete.is-right {
				position: absolute;
				right: 3px;
				top: 3px;
				z-index: 40;
			}
		}
	}
}
</style>
