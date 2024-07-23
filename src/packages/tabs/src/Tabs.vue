<script setup lang="ts">
import { ref } from 'vue';

defineProps({
	list: {
		type   : Array,
		default: []
	}
});
const emit = defineEmits(['change']);
const activeIndex = ref(0);

function changeTab(index: number) {
	activeIndex.value = index;
	emit('change', index);
}
</script>

<template>
	<div class="tabs" v-bind="$attrs">
		<ul>
			<slot :current="activeIndex" :changeTab="changeTab">
				<li :class="{'is-active': activeIndex === index}" v-for="(item, index) in list">
					<a @click="changeTab(index)">{{ item }}</a>
				</li>
			</slot>
		</ul>
	</div>
	<template v-for="(_, index) in list">
		<slot :name="`item${index}`" v-if="$slots[`item${index}`] && activeIndex === index"/>
	</template>
</template>