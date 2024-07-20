/// <reference path="global.d.ts" />
/// <reference path="sa-calendar.d.ts" />

import "@vue/runtime-core";

declare module "@vue/runtime-core" {
	export interface GlobalComponents {
		VbAvatar: typeof import("../src/components")["VbAvatar"];
		VbBack: typeof import("../src/components")["VbBack"];
		VbCascade: typeof import("../src/components")["VbCascade"];
		VbCollapse: typeof import("../src/components")["VbCollapse"];
		VbCollapsePanel: typeof import("../src/components")["VbCollapsePanel"];
		VbDatetime: typeof import("../src/components")["VbDatetime"];
		VbDialog: typeof import("../src/components")["VbDialog"];
		VbDropdown: typeof import("../src/components")["VbDropdown"];
		VbDualInput: typeof import("../src/components")["VbDualInput"];
		VbElement: typeof import("../src/components")["VbElement"];
		VbEmpty: typeof import("../src/components")["VbEmpty"];
		VbForm: typeof import("../src/components")["VbForm"];
		VbInput: typeof import("../src/components")["VbInput"];
		VbModal: typeof import("../src/components")["VbModal"];
		VbPagination: typeof import("../src/components")["VbPagination"];
		VbPassword: typeof import("../src/components")["VbPassword"];
		VbPreview: typeof import("../src/components")["VbPreview"];
		VbSelect: typeof import("../src/components")["VbSelect"];
		VbSelectNative: typeof import("../src/components")["VbSelectNative"];
		VbSidePage: typeof import("../src/components")["VbSidePage"];
		VbSort: typeof import("../src/components")["VbSort"];
		VbStepLine: typeof import("../src/components")["VbStepLine"];
		VbSwitch: typeof import("../src/components")["VbSwitch"];
		VbTabs: typeof import("../src/components")["VbTabs"];
		VbTable: typeof import("../src/components")["VbTable"];
		VbTags: typeof import("../src/components")["VbTags"];
		VbTell: typeof import("../src/components")["VbTell"];
		VbTips: typeof import("../src/components")["VbTips"];
		VbTree: typeof import("../src/components")["VbTree"];
		VbUploader: typeof import("../src/components")["VbUploader"];
		VbUPluginSI: typeof import("../src/components")["VbUPluginSI"];
	}

	interface ComponentCustomProperties {
		$dialog: OP.Dialog;
		$alert: OP.Alert;
		$confirm: OP.Confirm;
	}
}

declare module "vue3-bulma-ui" {
	import type { Plugin } from "vue";
	const _default: Plugin<[]>;
	export default _default;
	export const {
		$alert,
		$confirm,
		$dialog,
	}: { $alert: OP.Alert; $confirm: OP.Confirm; $dialog: OP.Dialog };
}

export {};
