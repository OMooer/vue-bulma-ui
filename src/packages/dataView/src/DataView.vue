<script setup lang="ts">
import { computed } from 'vue';

defineOptions({inheritAttrs: false});
const {columns} = defineProps<{
	columns?: number | string;
}>();
const classList = computed(() => {
	const cols = Number(columns);
	if (!cols) {
		return;
	}
	return `is-${ cols }`;
});
</script>

<template>
	<div class="vb-dataview" :class="classList">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.vb-dataview {
	$maxCol: 6;
	display: grid;
	grid-template-columns: repeat(var(--cols, 2), 1fr);
	gap: .125rem .175rem;

	@for $i from 1 through $maxCol {
		&.is-#{$i} {
			--cols: #{$i};
		}
	}

	:deep(.data-item) {
		display: flex;
		overflow: hidden;
		border-radius: var(--bulma-radius);

		.data-label, .data-text {
			padding: .5em .75em;
		}

		.data-label {
			background-color: var(--bulma-background);
			border: solid 0 var(--bulma-border);
			border-right-width: 1px;
			word-break: break-all;
			font-weight: bold;
			width: min(25%, 9rem);
			min-width: 5rem;
		}

		.data-text {
			flex-grow: 2;
			background-color: var(--bulma-background-hover);
		}

		&.is-bordered {
			border: solid 1px var(--bulma-border);
		}

		&.is-vertical {
			flex-direction: column;

			.data-label {
				border: solid 0 var(--bulma-border);
				border-bottom-width: 1px;
				white-space: nowrap;
				width: 100%;
			}
		}

		&.is-full {
			grid-column: 1 / -1;
		}

		@for $i from 2 through 12 {
			&.is-row-span-#{$i} {
				grid-row: span #{$i};
			}
		}
		@for $i from 2 through $maxCol {
			&.is-col-span-#{$i} {
				grid-column: span #{$i};
			}
		}

		@for $i from 1 through $maxCol - 1 {
			&.is-col-start-#{$i} {
				grid-column-start: #{$i};
			}
		}

		&.is-col-start-end {
			grid-column-end: -1;
		}
	}
}
</style>