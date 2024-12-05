/**
 * 防抖函数
 */
export function debounce<T extends any[], R>(func: (...args: T) => R, wait: number, immediate?: boolean) {
	let timeout: any;
	return function(this: any, ...args: T) {
		const context = this;
		const later = () => {
			timeout = null;
			if (!immediate) {
				func.apply(context, args);
			}
		};
		// 如果设置了immediate且未有等待中的执行任务，那么立即调用
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) {
			func.apply(context, args);
		}
	};
}

/**
 * 队列执行 Promise
 * @param promises
 * @param result
 */
export async function runPromiseSequence<T>(promises: Function[], result: T) {
	for (let i = 0; i < promises.length; i++) {
		try {
			result = await promises[i](result);
		}
		catch (e) {
			return Promise.reject(e);
		}
	}

	return Promise.resolve(result);
}