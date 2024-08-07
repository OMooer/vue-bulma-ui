import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
	faAngleDown,
	faCheck,
	faChevronLeft, faCircleExclamation, faCircleQuestion,
	faEye,
	faEyeSlash, faFileArrowDown, faSort, faSortAsc, faSortDesc, faTrashCan, faUpload,
	faAngleRight, faAngleLeft, faSpinner, faRotate, faAngleUp
} from '@fortawesome/free-solid-svg-icons';
import type { App } from 'vue';
import { useDialog } from './actions/dialog';
import * as components from './components';

export const {$dialog, $alert, $confirm} = useDialog();

export default {
	install(Vue: App, opt: any) {
		// UI 使用图标
		library.add(
				faAngleDown,
				faAngleLeft,
				faAngleRight,
				faAngleUp,
				faCheck,
				faChevronLeft,
				faCircleExclamation,
				faCircleQuestion,
				faEye,
				faEyeSlash,
				faFileArrowDown,
				faRotate,
				faSort,
				faSortAsc,
				faSortDesc,
				faSpinner,
				faTrashCan,
				faUpload,
		);
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
