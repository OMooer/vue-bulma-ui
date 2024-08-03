<script setup lang="ts">

</script>

<template>
	<div class="ball-loading">
		<div class="ball"></div>
	</div>
</template>

<style scoped lang="scss">
// 动画
@keyframes ball {
	0% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-2em);
	}
	100% {
		transform: translateY(0);
	}
}

@keyframes blur {
	0% {
		filter: blur(2px);
		transform: scale(1);
	}
	50% {
		filter: blur(1px);
		transform: scale(.5);
	}
	100% {
		filter: blur(2px);
		transform: scale(1);
	}
}

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
	background-color: rgba(255, 255, 255, .4);

	$ballSize: 26px;

	// 阴影
	&::after {
		content: '';
		background-color: $black;
		border-radius: 50%;
		opacity: .3;
		width: calc($ballSize * 2.5);
		height: calc($ballSize / 2);
		animation: blur 1s ease-in-out 0.1s infinite;
	}

	// 小球
	.ball {
		background-image: radial-gradient(closest-corner circle at 50% 15%, $white-bis, $grey-darker);
		border-radius: 50%;
		width: $ballSize;
		height: $ballSize;
		margin: calc($ballSize / 3) 0;
		animation: ball 1s ease-in-out infinite;
	}

}
</style>