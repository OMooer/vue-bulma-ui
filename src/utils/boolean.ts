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
 * 检测值是否是有效键入值，即合法的数字与字符串
 * @param value
 */
export function isValidInputValue(value: any) {
	return (typeof value === 'string' && value.trim() !== '') || (typeof value === 'number' && !isNaN(value));
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

/**
 * 判断目标元素是否部分被隐藏
 * @param element
 */
export function isElementPartiallyHidden(element: HTMLElement) {
	// 获取目标元素的边界矩形
	const rect = element.getBoundingClientRect();

	// 遍历所有祖先元素
	let parent = element.parentElement;
	while (parent) {
		// 获取祖先元素的边界矩形
		const parentRect = parent.getBoundingClientRect();

		// 检查祖先元素的 overflow 属性是否隐藏内容
		const overflowX = getComputedStyle(parent).overflowX;
		const overflowY = getComputedStyle(parent).overflowY;

		if ((overflowX === 'hidden' || overflowX === 'auto' || overflowX === 'scroll') &&
				(overflowY === 'hidden' || overflowY === 'auto' || overflowY === 'scroll')) {

			// 检查是否有部分内容被隐藏
			if (rect.right > parentRect.right || rect.left < parentRect.left ||
					rect.bottom > parentRect.bottom || rect.top < parentRect.top) {
				return true; // 有部分内容被隐藏
			}
		}

		// 继续检查下一个祖先元素
		parent = parent.parentElement;
	}

	return false; // 没有部分内容被隐藏
}