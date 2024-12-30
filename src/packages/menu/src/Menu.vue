<script setup lang="ts">
import MenuItem from './MenuItem.vue';

defineProps({
	locale     : {
		type   : String,
		default: 'zh-cn'
	},
	menuData   : {
		type   : Array<VBMenu.Item>,
		default: []
	},
	activeClass: String,
	exactClass : String
});

</script>

<template>
	<nav class="vb-menu">
		<MenuItem :locale :data="menuData" :exactClass :activeClass/>
	</nav>
</template>