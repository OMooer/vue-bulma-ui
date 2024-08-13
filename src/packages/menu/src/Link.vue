<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { RouterLink, useLink, useRoute } from 'vue-router';

const emit = defineEmits(['state']);
const props = defineProps({
	exactClass:{
		type: String,
    default: 'is-exact-link'
	},
	// @ts-ignore
	...RouterLink.props
});
// @ts-ignore
const {route, isActive} = useLink(props);
const currentRoute = useRoute();
// 重新计算路由命中状态
const isPathMatched = ref(false);
const isRouteActive = computed(() => isActive.value || isPathMatched.value);
watchEffect(() => {
	// 组件不是以子组件存在于父级路由下面，但是路由地址存在从属关系的将在此匹配（排除根路径，否则所有的都会被匹配）
	isPathMatched.value = currentRoute.fullPath.startsWith(route.value.fullPath) && route.value.fullPath !== '/';
});
// 更新路由命中状态
watchEffect(() => {
	emit('state', isRouteActive.value);
});

const isExternalLink = computed(() => {
	return typeof props.to === 'string' && (
			props.to.startsWith('http:')
			|| props.to.startsWith('https:')
			|| props.to.startsWith('//')
			|| props.to.startsWith('mailto:')
	);
});

</script>

<template>
	<a v-if="isExternalLink" v-bind="$attrs" :href="to" target="_blank" rel="nofollow noreferrer noopener">
		<slot/>
	</a>
	<router-link v-else v-bind="$props" custom :to="route.fullPath" v-slot="{isExactActive, href, navigate}">
		<a
				:href="href"
				:title="($attrs as any).title"
				:class="[{[exactClass]: isExactActive}, $attrs.class]"
				@click="navigate"
		>
			<slot/>
		</a>
	</router-link>
</template>

<style scoped lang="scss">
a[target=_blank] {
	justify-content: flex-start !important;

	&::after {
		content: '↗';
		display: inline-block;
		margin-left: 0.5em;
		border: 1px solid;
		border-radius: 2px;
		line-height: 1;
		font-size: smaller;
		width: 1em;
		height: 1em;
	}
}
</style>