<script setup lang="ts">

</script>

<template>
	<div class="ball-loading">
		<div class="ball"></div>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;
@use "@/scss/animates";

.vb-loading.top-loading {
	.ball-loading {
		height: 100vh;
	}
}

.ball-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	$ballSize: 26px;

	// 阴影
	&::after {
		content: '';
		background-color: va.$black;
		border-radius: 50%;
		opacity: .3;
		width: calc($ballSize * 2.5);
		height: calc($ballSize / 2);
		animation: blur 1s ease-in-out 0.1s infinite;
	}

	// 小球
	.ball {
		background-image: radial-gradient(closest-corner circle at 50% 15%, va.$white-bis, va.$grey-darker);
		border-radius: 50%;
		width: $ballSize;
		height: $ballSize;
		margin: calc($ballSize / 3) 0;
		animation: ball 1s ease-in-out infinite;
	}

}
</style>