import { ref } from 'vue';
import type ZhCn from '@/locales/zh-cn';

type LangData = string[] | { [propName: string]: string };

const localeFiles = import.meta.glob('../locales/*.ts', {
	eager : true,
	import: 'default'
});
const lang = ref<typeof ZhCn>({} as typeof ZhCn);

export const useUILocale = () => {
	// 加载语言包
	function loadLanguage(locale: string | object = 'zh-cn') {
		console.log('Load language: ' + locale);
		if (typeof locale === 'string') {
			const l = localeFiles[`../locales/${ locale.toLowerCase() }.ts`];
			if (l) {
				lang.value = l as any;
			}
			else {
				throw Error('Load locale message failed\nCannot find locale: ' + locale);
			}
		}
		else {
			Object.assign(lang.value, locale);
		}
	}

	// 切换语言
	function switchLanguage(locale: string) {
		loadLanguage(locale.toLowerCase());
	}

	// 获取路径对应的语言信息
	function getLocaleMessage(node: string[], pack: object) {
		const current = node[0];
		const msg = pack[current as keyof typeof pack];
		if (!msg) {
			return null;
		}
		if (typeof msg !== 'object') {
			return msg;
		}
		return getLocaleMessage(node.slice(1), msg);
	}

	function format(text: string, data: LangData) {
		if (!data) {
			return text;
		}
		// 将数据统一化，都转为字典
		let dataDict: Map<string, string>;
		if (Array.isArray(data)) {
			dataDict = new Map(data.map((item, index) => [index.toString(), item]));
		}
		else {
			dataDict = new Map(Object.entries(data));
		}

		return text.replace(/\{([\d_A-Za-z]+?)}/g, (match, $1) => {
			return dataDict.get($1) || match;
		});
	}

	function $vbt(path: string, data?: LangData) {
		// 解析路径
		const resolvePath = path.split('.');
		// 取回信息
		const msg = getLocaleMessage(resolvePath, lang.value);
		if (!msg) {
			return path;
		}
		// 对信息存在格式的特殊处理
		if (/\{[\d_A-Za-z]+?}/g.test(msg)) {
			return format(msg, data);
		}
		return msg;
	}

	return {
		loadLanguage,
		switchLanguage,
		lang,
		$vbt
	}
}