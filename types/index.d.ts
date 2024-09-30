/// <reference path="global.d.ts" />
/// <reference path="sa-calendar.d.ts" />

declare module 'vue' {
	export interface GlobalComponents {
		VbAnimateNum: typeof import("../src/components")["VbAnimateNum"];
		VbAvatar: typeof import("../src/components")["VbAvatar"];
		VbBack: typeof import("../src/components")["VbBack"];
		VbTLBack: typeof import("../src/components")["VbTLBack"];
		VbCascade: typeof import("../src/components")["VbCascade"];
		VbCharts: typeof import("../src/components")["VbCharts"];
		VbChartsBar: typeof import("../src/components")["VbChartsBar"];
		VbChartsGauge: typeof import("../src/components")["VbChartsGauge"];
		VbChartsLine: typeof import("../src/components")["VbChartsLine"];
		VbChartsPie: typeof import("../src/components")["VbChartsPie"];
		VbChartsRadar: typeof import("../src/components")["VbChartsRadar"];
		VbChoose: typeof import("../src/components")["VbChoose"];
		VbCollapse: typeof import("../src/components")["VbCollapse"];
		VbCollapsePanel: typeof import("../src/components")["VbCollapsePanel"];
		VbCountdown: typeof import("../src/components")["VbCountdown"];
		VbCountdownBar: typeof import("../src/components")["VbCountdownBar"];
		VbDatetime: typeof import("../src/components")["VbDatetime"];
		VbDialog: typeof import("../src/components")["VbDialog"];
		VbDropdown: typeof import("../src/components")["VbDropdown"];
		VbDualInput: typeof import("../src/components")["VbDualInput"];
		VbEmpty: typeof import("../src/components")["VbEmpty"];
		VbForm: typeof import("../src/components")["VbForm"];
		VbFormItem: typeof import("../src/components")["VbFormItem"];
		VbIncrement: typeof import("../src/components")["VbIncrement"];
		VbInput: typeof import("../src/components")["VbInput"];
		VbLink: typeof import("../src/components")["VbLink"];
		VbLoading: typeof import("../src/components")["VbLoading"];
		VbLoadingBall: typeof import("../src/components")["VbLoadingBall"];
		VbLoadingBar: typeof import("../src/components")["VbLoadingBar"];
		VbLoadingDot: typeof import("../src/components")["VbLoadingDot"];
		VbMenu: typeof import("../src/components")["VbMenu"];
		VbModal: typeof import("../src/components")["VbModal"];
		VbNotify: typeof import("../src/components")["VbNotify"];
		VbPagination: typeof import("../src/components")["VbPagination"];
		VbPassword: typeof import("../src/components")["VbPassword"];
		VbPopup: typeof import("../src/components")["VbPopup"];
		VbPreview: typeof import("../src/components")["VbPreview"];
		VbRating: typeof import("../src/components")["VbRating"];
		VbSelect: typeof import("../src/components")["VbSelect"];
		VbSelectNative: typeof import("../src/components")["VbSelectNative"];
		VbSidePage: typeof import("../src/components")["VbSidePage"];
		VbSort: typeof import("../src/components")["VbSort"];
		VbSteps: typeof import("../src/components")["VbSteps"];
		VbSwitch: typeof import("../src/components")["VbSwitch"];
		VbTable: typeof import("../src/components")["VbTable"];
		VbTabs: typeof import("../src/components")["VbTabs"];
		VbTags: typeof import("../src/components")["VbTags"];
		VbTell: typeof import("../src/components")["VbTell"];
		VbTips: typeof import("../src/components")["VbTips"];
		VbToast: typeof import("../src/components")["VbToast"];
		VbTree: typeof import("../src/components")["VbTree"];
		VbUploader: typeof import("../src/components")["VbUploader"];
		VbUPluginSI: typeof import("../src/components")["VbUPluginSI"];
	}

	export interface ComponentCustomProperties {
		$dialog: OP.Dialog;
		$alert: OP.Alert;
		$confirm: OP.Confirm;
	}
}

declare module 'vue3-bulma-ui' {
	import type { Plugin } from "vue";
	const _default: Plugin<[]>;
	export default _default;
	export const {useDialog}: {
		useDialog: () => {
			$alert: OP.Alert;
			$confirm: OP.Confirm;
			$dialog: OP.Dialog;
		}
	};
}

export {};
