<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { RouterLink, useLink, useRoute } from 'vue-router';

defineOptions({
	inheritAttrs: false
});
const emit = defineEmits(['state']);
const props = defineProps({
	// @ts-ignore
	...RouterLink.props,
	exactClass    : {
		type   : String,
		default: 'is-exact-link'
	},
	noExternalIcon: {
		type   : Boolean,
		default: false
	},
});
const linkTo = computed(() => {
	return typeof props.to === 'string' ? props.to : (props.to?.name ?? props.to?.path ?? '');
});
/**
 * ******** 特性说明 *********
 * useLink 返回的 route 是 Computed 对象，由于开发环境与生产环境的机制不同，
 * 在开发环境中使用 useLink() 传入错误的路由时，会马上抛出错误，因为 computed 在创建后就执行了内部逻辑，
 * 但是在生产环境时 computed 只会在读取时才会执行内部逻辑，而错误的位置正好是在 route 里，
 * 这就导致了在开发环境时 useLink() 报错，而在生产环境里要 route.value 才报错。
 * 所以我们如果允许传入错误的路由信息则需要通过 try catch 来捕获这两处可能的出错。
 * 至于为什么要允许错误的路由信息呢，是因为我们需要支持外部的链接使用本组件，而外部链接是不会在路由表里的。
 */
let route = ref(), isActive = ref(false);
try {
	const routeLink = useLink(props as any);
	route = routeLink.route.value ? computed(() => routeLink.route.value) : routeLink.route;
	isActive = computed(() => routeLink.isActive.value);
}
catch (e) {
	route.value = {fullPath: linkTo.value};
	isActive.value = false;
}
const currentRoute = useRoute();
// 重新计算路由命中状态
const isPathMatched = ref(false);
const isRouteActive = computed(() => isActive.value || isPathMatched.value);
watchEffect(() => {
	// 组件不是以子组件存在于父级路由下面，但是路由地址存在从属关系的将在此匹配（排除根路径，否则所有的都会被匹配）
	isPathMatched.value = currentRoute.fullPath.startsWith(route.value.fullPath + '/') && route.value.fullPath !== '/';
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
	<a
			v-if="isExternalLink" v-bind="$attrs" :href="props.to" :class="{'is-less': props.noExternalIcon}" target="_blank"
			rel="nofollow noreferrer noopener">
		<slot/>
	</a>
	<router-link v-else v-bind="$props" custom :to="route.fullPath" v-slot="{isExactActive, href, navigate}">
		<a
				:href="href"
				:title="($attrs as any).title"
				:class="[{[props.exactClass]: isExactActive}, $attrs.class]"
				@click="navigate"
		>
			<slot/>
		</a>
	</router-link>
</template>

<style scoped lang="scss">
a:not(.is-less)[target=_blank] {
	justify-content: flex-start !important;

	&::after {
		content: '↗';
		display: inline-block;
		margin-left: 0.5em;
		border: 1px solid;
		border-radius: 2px;
		line-height: 1;
		font-family: "system-ui", -apple-system, "Helvetica Neue", Arial, sans-serif;
		font-size: smaller;
		width: 1em;
		height: 1em;
	}
}
</style>