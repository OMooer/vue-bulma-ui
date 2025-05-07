import { library, type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
	faAngleDown,
	faCheck,
	faChevronLeft,
	faCircleExclamation,
	faCircleQuestion,
	faEye,
	faEyeSlash,
	faFileArrowDown,
	faSort,
	faSortAsc,
	faSortDesc,
	faTrashCan,
	faUpload,
	faAngleRight,
	faAngleLeft,
	faSpinner,
	faRotate,
	faAngleUp,
	faPlus,
	faMinus,
	faGlobe,
	faChevronRight,
	faExpand,
	faCompress,
	faDownload,
	faMagnifyingGlass,
	faMagnifyingGlassMinus,
	faMagnifyingGlassPlus,
	faCircleInfo,
	faCirclePlus,
	faArrowUp, faCircleDot, faRotateRight
} from '@fortawesome/free-solid-svg-icons';
import {
	faSquareMinus,
	faSquarePlus
} from '@fortawesome/free-regular-svg-icons';
import { type App, isRef, type Ref, toValue, watchEffect } from 'vue';
import { SYMBOL_ECHARTS_KEY, SYMBOL_EDITOR_KEY } from './utils';
import { useUILocale } from './actions/locale';
import { useDialog } from './actions/dialog';
import { vFocus, vScrollbar, vLazy } from './utils';
import * as components from './components';

type Plugin = {
	echarts?: object;
	editor?: object;
};
type Options = {
	locale?: string | Ref<string>;
	icon?: IconDefinition[];
	plugins?: Plugin;
	dialog?: OP.DialogText;
};
export default {
	install(Vue: App, opt?: Options) {
		// 设置内置语言包
		const {switchLanguage} = useUILocale({extensions: {dialog: opt?.dialog}});
		if (isRef(opt?.locale)) {
			// 监听这个数据的变化动态更新语言包
			watchEffect(() => {
				switchLanguage(toValue(opt?.locale) || 'zh-cn');
			});
		}
		else {
			switchLanguage(opt?.locale || 'zh-cn');
		}
		const {$dialog, $alert, $confirm} = useDialog(opt?.dialog);
		// UI 使用图标
		const iconSet = [
			...(opt?.icon ?? []),
			faAngleDown, faAngleLeft, faAngleRight, faAngleUp,
			faArrowUp,
			faCheck,
			faChevronLeft, faChevronRight,
			faCircleExclamation,
			faCircleQuestion,
			faCircleInfo,
			faCirclePlus,
			faCircleDot,
			faDownload,
			faEye, faEyeSlash, faExpand, faCompress,
			faFileArrowDown,
			faGlobe,
			faMinus, faPlus,
			faRotate,
			faRotateRight,
			faSort, faSortAsc, faSortDesc,
			faSpinner,
			faSquareMinus, faSquarePlus,
			faTrashCan,
			faUpload,
			faMagnifyingGlass, faMagnifyingGlassMinus, faMagnifyingGlassPlus
		];
		library.add(...iconSet);
		Vue.component('FasIcon', FontAwesomeIcon);
		// UI 组件注册
		Object.keys(components).forEach((key) => {
			Vue.component(key, components[key as keyof typeof components]);
		});
		// UI 方法注册
		Vue.config.globalProperties.$dialog = $dialog;
		Vue.config.globalProperties.$alert = $alert;
		Vue.config.globalProperties.$confirm = $confirm;
		// 导入插件
		const keySymbol: { [key in keyof Plugin]: symbol } = {
			echarts: SYMBOL_ECHARTS_KEY,
			editor: SYMBOL_EDITOR_KEY,
		};
		Object.keys(opt?.plugins ?? {}).forEach((key) => {
			Vue.provide(keySymbol[key as keyof typeof keySymbol], opt?.plugins?.[key as keyof typeof opt.plugins]);
		});
	}
}

export * from './components';
export { useDialog, useUILocale };
export { vFocus, vScrollbar, vLazy };
export const version = import.meta.env.VERSION;
