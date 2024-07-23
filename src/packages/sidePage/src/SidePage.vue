<script setup lang="ts">
import {onBeforeMount, ref} from "vue";

defineEmits(['close']);

const ready = ref(false);
onBeforeMount(() => {
	ready.value = true;
});

function dismiss() {
	ready.value = false;
}
</script>

<template>
	<div class="side-page" @click="dismiss">
		<transition name="animate-slide-left" @after-leave="$emit('close')" appear>
			<div class="sp-container" @click.stop v-show="ready">
				<!-- 关闭按钮 -->
				<a class="delete is-medium" aria-label="Close" @click="dismiss"></a>
				<div class="sp-scroll-view">
					<slot/>
				</div>
			</div>
		</transition>
	</div>
</template>

<style lang="scss">
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
		background: $white;
		padding: 0 1rem;
		border-left: $grey-lightest solid 1px;
		box-shadow: 0 0 10px $grey-lighter;
		box-sizing: border-box;
		right: 0;
		bottom: 0;
		width: 45%;
		height: 100%;
		
		> .delete {
			position: absolute;
			top: 1rem;
			left: 0;
			transform: translateX(-60%);
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
