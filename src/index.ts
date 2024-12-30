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
	faCompress, faDownload, faMagnifyingGlass, faMagnifyingGlassMinus, faMagnifyingGlassPlus, faCircleInfo, faCirclePlus
} from '@fortawesome/free-solid-svg-icons';
import {
	faSquareMinus,
	faSquarePlus
} from '@fortawesome/free-regular-svg-icons';
import { type App, isRef, type Ref, toValue, watchEffect } from 'vue';
import { useUILocale } from './actions/locale';
import { useDialog } from './actions/dialog';
import * as components from './components';

export default {
	install(Vue: App, opt?: { locale?: string | Ref<string>; icon?: IconDefinition[]; dialog?: OP.DialogText }) {
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
			faCheck,
			faChevronLeft, faChevronRight,
			faCircleExclamation,
			faCircleQuestion,
			faCircleInfo,
			faCirclePlus,
			faDownload,
			faEye, faEyeSlash, faExpand, faCompress,
			faFileArrowDown,
			faGlobe,
			faMinus, faPlus,
			faRotate,
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
	}
}

export * from './components';
export { useDialog, useUILocale };
export const version = import.meta.env.VERSION;
