<script setup lang="ts">
import { ref, watch } from 'vue';

defineOptions({inheritAttrs: false});
const props = defineProps({
	currentIndex: {
		type: Number
	},
	list        : {
		type   : Array,
		default: () => []
	}
});
const emit = defineEmits(['change']);
const activeIndex = ref(0);

watch(() => props.currentIndex, (current) => {
	if (typeof current !== 'undefined') {
		changeTab(current);
	}
}, {immediate: true});

function changeTab(index: number) {
	if (index === activeIndex.value) {
		return;
	}
	activeIndex.value = index;
	emit('change', index);
}
</script>

<template>
	<div class="vb-tabs">
		<div class="tabs" v-bind="$attrs">
			<ul>
				<slot :current="activeIndex" :changeTab="changeTab">
					<li :class="{'is-active': activeIndex === index}" :key="item as string" v-for="(item, index) in list">
						<a @click="changeTab(index)"><span>{{ item }}</span></a>
					</li>
				</slot>
			</ul>
		</div>
		<div class="tabs-content" v-if="Object.keys($slots).filter((n:string) => n !== 'default').length">
			<template :key="index" v-for="(_, index) in list">
				<slot :name="`item${index}`" v-if="$slots[`item${index}`] && activeIndex === index"/>
			</template>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.vb-tabs {
	display: flex;
	flex-direction: column;

	.tabs {
		&.is-bottom {
			order: 2;
			margin-bottom: 0;
			transform: scaleY(-1);

			ul li a span {
				display: inline-block;
				transform: scaleY(-1);
			}

			& + .tabs-content {
				order: 1;
				margin-bottom: var(--bulma-block-spacing);
			}
		}
	}
}
</style>