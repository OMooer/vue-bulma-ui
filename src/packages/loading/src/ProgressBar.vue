<script setup lang="ts">
import { computed, inject, ref, type Ref } from 'vue';

defineProps({
	size: {
		type   : Number,
		default: 3
	}
});
const percent = inject('percent', ref(0));
const status = inject('status') as Ref<'load' | 'success' | 'error'>;
const isLoad = computed(() => status.value === 'load');
const isError = computed(() => status.value === 'error');
const isSuccess = computed(() => status.value === 'success');
</script>

<template>
	<progress
			class="progress" :class="{'is-link': isLoad, 'is-success': isSuccess, 'is-danger': isError}"
			:value="percent" max="100" :style="{height: size + 'px'}">
		{{ percent }}%
	</progress>
</template>