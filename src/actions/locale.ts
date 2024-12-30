import { deepMerge } from '@/utils';
import { ref } from 'vue';
import type ZhCn from '@/locales/zh-cn';

type LangData = string[] | { [propName: string]: string };
type UseOption = {
	extensions?: Normal.DeepPartial<typeof ZhCn>;
};

const localeFiles = import.meta.glob('../locales/*.ts', {
	eager : true,
	import: 'default'
});
const langRaw = ref<typeof ZhCn>({} as typeof ZhCn);
let globalOptions: UseOption;

export const useUILocale = (option?: UseOption) => {
	const _locale = ref('zh-cn');
	// 在安装插件的时候会首次设置选项，之后都不再接受更改
	globalOptions ??= option;

	// 加载语言包
	function loadLanguage(name: string, langPackage: typeof ZhCn) {
		const localeName = name.toLowerCase();
		// 如果没有传入对应语言包，则尝试加载内置语言包
		if (!langPackage) {
			return;
		}
		// 将导入的语言包合并到内置语言包
		localeFiles[localeName] = langPackage;
		langRaw.value = langPackage;
		_locale.value = localeName;
	}

	// 切换语言
	function switchLanguage(locale: string) {
		if (!locale) {
			throw Error('Need locale name to load language');
		}
		// console.log('Load language: ' + locale);
		const localeName = locale.toLowerCase();
		let innerLang = localeFiles[localeName];
		innerLang ??= localeFiles[`../locales/${ localeName }.ts`];
		if (innerLang) {
			langRaw.value = innerLang as unknown as typeof ZhCn;
			_locale.value = localeName;
			// 合并选项扩展的语言设置
			mergeOptionLanguageContent();
		}
		else {
			throw Error('Load locale messages failed\nCannot find locale: ' + locale);
		}
	}

	function mergeOptionLanguageContent() {
		if (globalOptions.extensions) {
			// 深度合并
			deepMerge(langRaw.value, globalOptions.extensions);
		}
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
		const msg = getLocaleMessage(resolvePath, langRaw.value);
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
		raw   : langRaw,
		locale: _locale,
		$vbt
	}
}