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

/**
 * 深拷贝
 * @param target 要更新数据的目标
 * @param source 要复制数据的对象
 * @param ignoreNull 是否忽略空值不合并
 */
export function deepMerge(target: object, source: object, ignoreNull: boolean = true): object {
	if (!target || !source || typeof target !== 'object' || typeof source !== 'object') {
		return;
	}
	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			const targetValue = target[key];
			const sourceValue = source[key];

			if (sourceValue === null) {
				if (!ignoreNull) {
					target[key] = null;
				}
			}
			else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
				target[key] = sourceValue;
			}
			else if (typeof targetValue === 'object' && typeof sourceValue === 'object' && targetValue !== null) {
				deepMerge(targetValue, sourceValue);
			}
			else {
				target[key] = sourceValue;
			}
		}
	}
}