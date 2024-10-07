import { library, type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
	faAngleDown,
	faCheck,
	faChevronLeft, faCircleExclamation, faCircleQuestion,
	faEye,
	faEyeSlash, faFileArrowDown, faSort, faSortAsc, faSortDesc, faTrashCan, faUpload,
	faAngleRight, faAngleLeft, faSpinner, faRotate, faAngleUp, faPlus, faMinus, faGlobe, faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import {
	faSquareMinus,
	faSquarePlus
} from '@fortawesome/free-regular-svg-icons';
import type { App } from 'vue';
import { useDialog } from './actions/dialog';
import * as components from './components';

export default {
	install(Vue: App, opt?: { icon?: IconDefinition[]; dialog?: OP.DialogText }) {
		const {$dialog, $alert, $confirm} = useDialog(opt?.dialog);
		// UI 使用图标
		const iconSet = [
			...(opt?.icon ?? []),
			faAngleDown, faAngleLeft, faAngleRight, faAngleUp,
			faCheck,
			faChevronLeft, faChevronRight,
			faCircleExclamation,
			faCircleQuestion,
			faEye, faEyeSlash,
			faFileArrowDown,
			faGlobe,
			faMinus, faPlus,
			faRotate,
			faSort, faSortAsc, faSortDesc,
			faSpinner,
			faSquareMinus, faSquarePlus,
			faTrashCan,
			faUpload,
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

export { useDialog };
