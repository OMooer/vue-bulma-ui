import { onBeforeUnmount, toValue, watch, type MaybeRefOrGetter } from 'vue';

const stack: {id: symbol, close: () => void}[] = [];

function onKeydown(e: KeyboardEvent) {
	if (e.key !== 'Escape' || !stack.length) {
		return;
	}
	stack[stack.length - 1].close();
}

/**
 * ESC 关闭栈：显示时入栈、隐藏/卸载时出栈；按 ESC 只关栈顶（最后打开的层）
 */
export function useEscClose(isShow: MaybeRefOrGetter<boolean>, close: () => void) {
	const id = Symbol();

	function remove() {
		const i = stack.findIndex((e) => e.id === id);
		if (i > -1) {
			stack.splice(i, 1);
			if (!stack.length) {
				document.removeEventListener('keydown', onKeydown);
			}
		}
	}

	watch(() => toValue(isShow), (show) => {
		if (show) {
			if (!stack.length) {
				document.addEventListener('keydown', onKeydown);
			}
			stack.push({id, close});
		}
		else {
			remove();
		}
	}, {immediate: true});

	onBeforeUnmount(remove);
}
