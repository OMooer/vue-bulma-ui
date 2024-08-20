<script setup lang="ts">
import { provide, ref } from 'vue';
import { isTruthy } from '../../../utils';

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
		<div class="vb-modal modal" :class="[$attrs.class, isMainShow ? 'is-active' : null]">
			<div class="modal-background" @click="mClose(maskClose)"></div>
			<Transition name="animate-zoom" @after-leave="afterDismissAnimate" appear>
				<div :class="[title ? 'modal-card' : 'modal-content']" :style="style" v-show="isShow">
					<template v-if="title">
						<header class="modal-card-head">
							<p class="modal-card-title">{{ title }}</p>
							<button
									type="button" class="delete" aria-label="close" @click="dismiss" v-if="isTruthy(hasClose)"></button>
						</header>
						<section class="modal-card-body">
							<slot/>
						</section>
						<footer class="modal-card-foot">
							<slot name="primary-buttons"/>
							<button type="button" class="button" @click="dismiss" v-if="isTruthy(hasCancel)">Cancel</button>
						</footer>
					</template>
					<div class="card" v-else>
						<button
								type="button" class="delete is-right" aria-label="close" @click="dismiss"
								v-if="isTruthy(hasClose)"></button>
						<div class="card-content">
							<slot/>
						</div>
						<slot name="footer"/>
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<style lang="scss">
@import "../../../scss/animates";

.vb-modal.modal {
	.modal-card-title {
		font-size: .94rem;
		font-weight: bold;
	}

	.modal-card-head {
		padding-top: .8rem;
		padding-bottom: .8rem;
	}

	.modal-card-foot {
		padding-top: .5rem;
		padding-bottom: .5rem;

		.button {
			font-size: .75rem;
		}
	}

	.card {
		position: relative;
		margin: 1em;
		overflow: hidden;
		box-sizing: border-box;
		height: calc(100% - 2em);

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
</style>
