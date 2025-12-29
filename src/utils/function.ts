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
export function deepMerge(target: Normal.AnyObj, source: Normal.AnyObj, ignoreNull: boolean = true) {
	if (!target || !source || typeof target !== 'object' || typeof source !== 'object') {
		return;
	}
	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			const targetValue = target[key];
			const sourceValue = source[key];

			if (sourceValue === null || sourceValue === undefined) {
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

/**
 * 将指定子元素滚动到中间
 * @param child 要显示的子元素
 * @param parent 要滚动的父元素
 * @param behavior 滚动行为
 */
export function scroll2Middle(child: HTMLElement, parent: HTMLElement, behavior: ScrollBehavior = 'smooth') {
	if (!child || !parent) {
		return;
	}
	const top = child.offsetTop - parent.offsetHeight / 2;
	parent.scrollTo({top: Math.max(top, 0), behavior});
}

/**
 * 数组里在指定位置上从右往左查找 fn 函数返回为 true 的该元素索引
 * @param arr 要查找的数组
 * @param fn 查找函数，返回是否匹配的布尔值
 * @param position 指定的查找位置
 */
export function lastFindIndex(arr: any[], fn: (item: any, index: number, ...args: any[]) => boolean, position?: number) {
	if (typeof position === 'undefined') {
		return arr.findLastIndex(fn);
	}
	return skipFindIndex(arr, fn, 0, position, true);
}

/**
 * 数组里在指定位置上从左往右查找 fn 函数返回为 true 的该元素索引
 * @param arr 要查找的数组
 * @param fn 查找函数，返回是否匹配的布尔值
 * @param position 指定的查找位置
 */
export function findIndex(arr: any[], fn: (item: any, index: number, ...args: any[]) => boolean, position?: number) {
	if (typeof position === 'undefined') {
		return arr.findIndex(fn);
	}
	return skipFindIndex(arr, fn, position, arr.length, false);
}

/**
 * 在指定的数组范围里按照正向或反向查找 fn 函数返回为 true 的索引
 * @param arr 原始查找数组
 * @param fn 查找函数，返回是否匹配的布尔值
 * @param start 起始位置
 * @param end 结束位置
 * @param reverse 是否从后往前查找
 */
function skipFindIndex(arr: any[], fn: (item: any, index: number, ...args: any[]) => boolean, start: number, end: number, reverse: boolean) {
	const newArr = arr.slice(start, end);
	if (start < 0) {
		start = arr.length - start;
	}
	let index = -1;
	if (reverse) {
		index = newArr.findLastIndex(fn);
	}
	else {
		index = newArr.findIndex(fn);
	}
	if (index > -1) {
		index += start;
	}
	return index;
}

/**
 * 带超时的执行器
 * @param {Function} taskFn - 你想要执行的主要异步任务 (必须返回 Promise)
 * @param {Function} fallbackFn - 超时后执行的备用任务
 * @param {number} timeoutMs - 超时时间 (毫秒)
 */
export async function runWithTimeout(taskFn: Function, fallbackFn: Function, timeoutMs: number) {
	let timerId: any;

	// 1. 创建一个在指定时间后 resolve 的 Promise (代表超时)
	const timeoutPromise = new Promise((resolve) => {
		timerId = setTimeout(() => {
			// 执行备用方法并返回其结果
			resolve(fallbackFn());
		}, timeoutMs);
	});

	// 2. 包装主任务，为了在完成后清除定时器 (防止内存泄漏或意外执行)
	const taskPromise = new Promise((resolve) => {
		resolve(taskFn());
	}).then((result: any) => {
		clearTimeout(timerId); // 如果主任务先完成，清除定时器
		return result;
	});

	// 3. 让它们赛跑
	return Promise.any([taskPromise, timeoutPromise]);
}