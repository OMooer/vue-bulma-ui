<script setup lang="ts">
import { computed, CSSProperties, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const {target, offset, force, behavior = 'smooth', inside, crossover = 25} = defineProps<{
	target?: string | HTMLElement;
	offset?: string;
	force?: boolean;
	behavior?: ScrollBehavior;
	inside?: boolean;
	crossover?: number;
}>();

let targetElement: HTMLElement | null;
const scrollOver = ref(false);
const scrollTop = ref(0);
const showButton = computed(() => force || scrollOver.value);
const styleCss = computed(() => {
	const varOffset = () => {
		if (typeof offset === 'undefined') {
			return '1rem';
		}
		else {
			return offset === '0' ? '0px' : 'var(--bt-offset, 1rem)';
		}
	}
	return {
		'--bt-offset': offset,
		'position'   : inside ? 'absolute' : 'fixed',
		'bottom'     : inside ? `calc(${ -1 * scrollTop.value }px + ${ varOffset() })` : 'var(--bt-offset, 1rem)'
	}
});

const scrollHandler = () => {
	if (targetElement) {
		scrollTop.value = targetElement.scrollTop;
	}
}

onMounted(() => {
	if (target) {
		if (typeof target === 'string') {
			targetElement = document.querySelector(target);
		}
		else {
			targetElement = target;
		}
	}
	targetElement ??= document.documentElement;

	if (targetElement) {
		scrollTop.value = targetElement.scrollTop;
		window.addEventListener('scroll', scrollHandler, {capture: true});
	}
});

onBeforeUnmount(() => {
	window.removeEventListener('scroll', scrollHandler, {capture: true});
});

watch(scrollTop, () => {
	if (targetElement) {
		scrollOver.value = scrollTop.value > targetElement.scrollHeight * (crossover / 100);
	}
}, {immediate: true});

function scrollToTop() {
	targetElement?.scrollTo({
		top: 0,
		behavior
	});
}
</script>

<template>
	<Teleport to="body" :disabled="inside">
		<Transition name="animate-fade">
			<a
					class="button is-rounded" :class="scrollOver ? 'is-light' : 'is-static'"
					:style="styleCss as CSSProperties"
					@click="scrollToTop"
					v-show="showButton">
				<span class="icon"><FasIcon icon="arrow-up" size="lg"/></span>
			</a>
		</Transition>
	</Teleport>
</template>

<style scoped lang="scss">
@use "@/scss/animates";

.button {
	//position: fixed;
	//right: anchor(right);
	//bottom: anchor(bottom);
	right: var(--bt-offset, 1rem);
	z-index: 99;

	&.is-static {
		opacity: .3;
	}
}
</style>