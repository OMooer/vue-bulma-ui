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