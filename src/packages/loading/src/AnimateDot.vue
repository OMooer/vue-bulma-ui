<script setup lang="ts">
defineProps(['text']);
</script>

<template>
	<div class="dot-loading">
		<div class="dot-list">
			<span></span>
			<span></span>
			<span></span>
		</div>
		<p class="text" v-if="text">{{ text }}</p>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;
@use "@/scss/animates";

.vb-loading.top-loading {
	.dot-loading {
		height: 100vh;
	}
}

.dot-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: va.$grey;
	width: 100%;
	height: 100%;

	.text {
		margin: .5em 0;
		user-select: none;
		font-size: .75em;

		&::after {
			display: inline-block;
			content: '...';
		}
	}

	$pointSize: 7px;

	.dot-list {

		span {
			display: inline-block;
			margin: calc($pointSize / 2);
			background-color: va.$grey-darker;
			border-radius: 50%;
			width: $pointSize;
			height: $pointSize;

			&:first-child {
				animation: scaleInOut 1s ease-in-out infinite;
			}

			&:nth-child(2) {
				animation: scaleInOut 1s ease-in-out 0.2s infinite;
			}

			&:last-child {
				animation: scaleInOut 1s ease-in-out 0.6s infinite;
			}
		}
	}

	&.rainbow {
		.dot-list {
			span {
				&:first-child {
					background-color: #FB3B4E;
				}

				&:nth-child(2) {
					background-color: #3DFA40;
				}

				&:last-child {
					background-color: #05F1D6;
				}
			}
		}

		.text {
			background-image: linear-gradient(to left, #FB3B4E, #FAF43D, #05F1D6);
			background-clip: text;
			-webkit-text-fill-color: transparent;
		}
	}
}
</style>