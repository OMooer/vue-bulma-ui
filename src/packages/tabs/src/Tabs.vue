<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const props = defineProps({
	currentIndex: {
		type   : Number,
		default: 0
	},
	list        : {
		type   : Array,
		default: []
	}
});
const emit = defineEmits(['change']);
const activeIndex = ref(0);

watchEffect(() => {
	if (typeof props.currentIndex !== 'undefined') {
		setTimeout(() => {
			changeTab(props.currentIndex);
		});
	}
});

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