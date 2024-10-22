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
 * 检测目标元素是否超出页面底部
 * @param target
 * @param offset 附加偏移数值
 */
export function isOverWindow(target: HTMLElement, offset: number) {
	const html = document.documentElement;
	const pageHeight = Math.max(html.clientHeight, html.scrollHeight);
	const bottom = html.scrollTop + target.getBoundingClientRect().top + target.offsetHeight + offset;
	return bottom > pageHeight;
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