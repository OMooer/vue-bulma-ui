<script setup lang="ts">
import { computed } from 'vue';

const {type = 'button', mode} = defineProps<{
	type?: 'button' | 'submit' | 'reset';
	mode?: 'primary' | 'success' | 'info' | 'link' | 'dark' | 'light' | 'danger' | 'warning';
}>();
const modeCls = computed(() => mode ? `is-${ mode }` : '');
</script>

<template>
	<button :type class="button" :class="[$attrs.class, modeCls]">
		<slot/>
	</button>
</template>