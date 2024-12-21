<script setup lang="ts">
import { provide, ref } from 'vue';
import { isTruthy } from '@/utils';
import InteractiveTracker from '../../InteractiveTracker';

const emit = defineEmits(['close']);
defineOptions({
	inheritAttrs: false
});
defineProps({
	title    : String,
	maskClose: {
		type   : [Boolean, String],
		default: false
	},
	hasClose : {
		type   : [Boolean, String],
		default: true
	},
	hasCancel: {
		type   : Boolean,
		default: true
	},
	style    : null
});
const isShow = ref(true);
const isMainShow = ref(true);
const isMoving = ref(false);
const modalX = ref(0);
const modalY = ref(0);

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

provide('modalDismiss', dismiss);
defineExpose({
	dismiss
});
</script>

<template>
	<Teleport to="body">
		<div
				class="vb-modal modal" :class="[$attrs.class, isMainShow ? 'is-active' : null]"
				:style="`--modal-x: ${modalX}px; --modal-y: ${modalY}px`">
			<div class="modal-background" @click="mClose(maskClose)"></div>
			<Transition name="animate-zoom" @after-leave="afterDismissAnimate" appear>
				<div :class="[title ? 'modal-card' : 'modal-content']" :style="style" v-show="isShow">
					<template v-if="title">
						<InteractiveTracker
								tag="header" class="modal-card-head" :class="{'is-moving': isMoving}"
								@start="isMoving = true" @end="isMoving = false" v-model:x="modalX" v-model:y="modalY">
							<p class="modal-card-title">{{ title }}</p>
							<button
									type="button" class="delete" aria-label="close" @click="dismiss" v-if="isTruthy(hasClose)"></button>
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
@import "../../../scss/animates";

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
