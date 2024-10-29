/**
 * 检验属性是否为真，兼容字符串值的设置
 * @param property
 */
export function isTruthy(property: any) {
	if (typeof property === 'boolean') {
		return property;
	}
	if (typeof property === 'string') {
		return !(property.toLowerCase() === 'false' || property.toLowerCase() === 'off' || property.toLowerCase() === '0');
	}
	if (typeof property === 'number') {
		return !!property;
	}
	return false;
}

/**
 * 检测目标元素是否超出容器的边距
 * @param target
 * @param offset 附加偏移数值
 * @param box 容器元素，默认是页面根元素
 */
export function isOverBoxSize(target: HTMLElement, offset: number, box?: HTMLElement) {
	box ??= document.documentElement;
	return (direction: 'top' | 'bottom' | 'left' | 'right') => {
		const boxRect = box.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const targetPos = targetRect?.[direction];
		if (!targetPos) {
			return false;
		}
		const boxRectSide = boxRect[direction];
		const checkPosition = targetPos + offset;

		return ['top', 'left'].includes(direction) ? (checkPosition < boxRectSide) : (checkPosition > boxRectSide);
	}
}

/**
 * 判断目标是否为 Promise 对象
 * @param fn
 */
export function isPromise(fn: any) {
	if (typeof fn === 'function') {
		fn = fn();
	}
	return typeof fn?.then === 'function';
}