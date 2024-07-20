
/**
 * 分割卡片有效期
 * @param value
 */
export function splitCardExp(value: string): string {
	return value.substring(0, 2) + '/' + value.substring(2);
}

/**
 * 数字分割（千分位逗号）
 * @param value
 */
export function numberSplit<T>(value: T): string {
	if (value) {
		if (isNaN(Number(value))) {
			return value.toString();
		}
		return Number(value).toLocaleString('nu', {minimumFractionDigits: 2, maximumFractionDigits: 2});
	}
	else {
		return '-';
	}
}

/**
 * 数字货币单位格式化
 * @param value
 * @param currency
 */
export function moneyFormat(value: number, currency: string = 'USD'): string {
	if (isNaN(Number(value))) {
		return '-';
	}
	// zh-Hans-CN
	const standard = Number(value).toLocaleString('nu', {style: 'currency', currency: currency.toUpperCase()});
	// 去掉货币单位的字母只保留符号（如果有的话）
	return standard.replace(/^(-)?[A-Z]*/, '$1');
}

/**
 * 数字单位转换
 * @param value
 * @param [format]
 */
export function abbrNumber(value: number, format?: string): string {
	const _iteration = function (num: number, unit: number, levelList: string[]) {
		let _diff = num;
		for (let i = 0; i < levelList.length; i++) {
			_diff = _diff / unit;
			if (_diff < unit) {
				return _diff.toFixed(1) + levelList[i];
			}
		}
		return _diff.toFixed(1) + levelList[levelList.length - 1];
	};

	switch (format) {
		case 'byte':
			return _iteration(value, 1024, ['KB', 'M', 'G', 'T']);
		default:
			return _iteration(value, 10, ['', '', 'k', 'w']);
	}
}

/**
 * 按照指定的长度用分隔符分隔字符串
 * @param {string} text 原文
 * @param {Object} opts 配置参数
 * @param {number} opts.long=4 分隔长度，默认4
 * @param {number} opts.sep=' ' 分隔符，默认为空格
 */
export function takeSeparate(text: string, opts?: { long?: number; sep?: string; }): string {
	const {long, sep}: { long: number; sep: string; } = Object.assign({long: 4, sep: ' '}, opts);
	const charArray: string[] = text.split('');
	charArray.forEach((char: string, index: number): void => {
		if ((index + 1) % long === 0) {
			charArray[index] += sep;
		}
	});
	return charArray.join('');
}
