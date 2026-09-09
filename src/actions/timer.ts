import { onBeforeUnmount } from 'vue';

export function useTimer() {
	const pool = new Set<ReturnType<typeof setTimeout>>();

	function timeout(fn: () => void, ms: number) {
		const id = setTimeout(() => { pool.delete(id); fn(); }, ms);
		pool.add(id);
		return id;
	}

	function interval(fn: () => void, ms: number) {
		const id = setInterval(fn, ms);
		pool.add(id);
		return id;
	}

	function clear(id?: ReturnType<typeof setTimeout>) {
		if (id === undefined) return;
		clearTimeout(id);   // clearTimeout/Interval 同一枚举值空间，互调安全
		clearInterval(id);
		pool.delete(id);
	}

	function clearAll() {
		pool.forEach(id => { clearTimeout(id); clearInterval(id); });
		pool.clear();
	}

	// setup 作用域内调用时自动注册；同组件多次 useTimer 各自独立
	onBeforeUnmount(clearAll);

	return { timeout, interval, clear, clearAll };
}
