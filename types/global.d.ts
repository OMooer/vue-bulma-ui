/// <reference path="shim.d.ts" />

declare module 'vue' {
	export interface GlobalComponents {
		VbAnimateNum: typeof import("vue3-bulma-ui/components")["VbAnimateNum"];
		VbAvatar: typeof import("vue3-bulma-ui/components")["VbAvatar"];
		VbBack: typeof import("vue3-bulma-ui/components")["VbBack"];
		VbTLBack: typeof import("vue3-bulma-ui/components")["VbTLBack"];
		VbCascade: typeof import("vue3-bulma-ui/components")["VbCascade"];
		VbCharts: typeof import("vue3-bulma-ui/components")["VbCharts"];
		VbChartsBar: typeof import("vue3-bulma-ui/components")["VbChartsBar"];
		VbChartsGauge: typeof import("vue3-bulma-ui/components")["VbChartsGauge"];
		VbChartsLine: typeof import("vue3-bulma-ui/components")["VbChartsLine"];
		VbChartsPie: typeof import("vue3-bulma-ui/components")["VbChartsPie"];
		VbChartsRadar: typeof import("vue3-bulma-ui/components")["VbChartsRadar"];
		VbChoose: typeof import("vue3-bulma-ui/components")["VbChoose"];
		VbCollapse: typeof import("vue3-bulma-ui/components")["VbCollapse"];
		VbCollapsePanel: typeof import("vue3-bulma-ui/components")["VbCollapsePanel"];
		VbCountdown: typeof import("vue3-bulma-ui/components")["VbCountdown"];
		VbCountdownBar: typeof import("vue3-bulma-ui/components")["VbCountdownBar"];
		VbDataView: typeof import("vue3-bulma-ui/components")["VbDataView"];
		VbDataViewItem: typeof import("vue3-bulma-ui/components")["VbDataViewItem"];
		VbDatetime: typeof import("vue3-bulma-ui/components")["VbDatetime"];
		VbDialog: typeof import("vue3-bulma-ui/components")["VbDialog"];
		VbDropdown: typeof import("vue3-bulma-ui/components")["VbDropdown"];
		VbDualInput: typeof import("vue3-bulma-ui/components")["VbDualInput"];
		VbEmpty: typeof import("vue3-bulma-ui/components")["VbEmpty"];
		VbForm: typeof import("vue3-bulma-ui/components")["VbForm"];
		VbFormItem: typeof import("vue3-bulma-ui/components")["VbFormItem"];
		VbGallery: typeof import("vue3-bulma-ui/components")["VbGallery"];
		VbIncrement: typeof import("vue3-bulma-ui/components")["VbIncrement"];
		VbInput: typeof import("vue3-bulma-ui/components")["VbInput"];
		VbInteractiveTracker: typeof import("vue3-bulma-ui/components")["VbInteractiveTracker"];
		VbLink: typeof import("vue3-bulma-ui/components")["VbLink"];
		VbLoading: typeof import("vue3-bulma-ui/components")["VbLoading"];
		VbLoadingBall: typeof import("vue3-bulma-ui/components")["VbLoadingBall"];
		VbLoadingBar: typeof import("vue3-bulma-ui/components")["VbLoadingBar"];
		VbLoadingDot: typeof import("vue3-bulma-ui/components")["VbLoadingDot"];
		VbLoadingWater: typeof import("vue3-bulma-ui/components")["VbLoadingWater"];
		VbMenu: typeof import("vue3-bulma-ui/components")["VbMenu"];
		VbModal: typeof import("vue3-bulma-ui/components")["VbModal"];
		VbNotify: typeof import("vue3-bulma-ui/components")["VbNotify"];
		VbPagination: typeof import("vue3-bulma-ui/components")["VbPagination"];
		VbPassword: typeof import("vue3-bulma-ui/components")["VbPassword"];
		VbPopup: typeof import("vue3-bulma-ui/components")["VbPopup"];
		VbPreview: typeof import("vue3-bulma-ui/components")["VbPreview"];
		VbRating: typeof import("vue3-bulma-ui/components")["VbRating"];
		VbSelect: typeof import("vue3-bulma-ui/components")["VbSelect"];
		VbSelectNative: typeof import("vue3-bulma-ui/components")["VbSelectNative"];
		VbSidePage: typeof import("vue3-bulma-ui/components")["VbSidePage"];
		VbSort: typeof import("vue3-bulma-ui/components")["VbSort"];
		VbSteps: typeof import("vue3-bulma-ui/components")["VbSteps"];
		VbSwiper: typeof import("vue3-bulma-ui/components")["VbSwiper"];
		VbSwitch: typeof import("vue3-bulma-ui/components")["VbSwitch"];
		VbTable: typeof import("vue3-bulma-ui/components")["VbTable"];
		VbTabs: typeof import("vue3-bulma-ui/components")["VbTabs"];
		VbTags: typeof import("vue3-bulma-ui/components")["VbTags"];
		VbTell: typeof import("vue3-bulma-ui/components")["VbTell"];
		VbTime: typeof import("vue3-bulma-ui/components")["VbTime"];
		VbTips: typeof import("vue3-bulma-ui/components")["VbTips"];
		VbToast: typeof import("vue3-bulma-ui/components")["VbToast"];
		VbTree: typeof import("vue3-bulma-ui/components")["VbTree"];
		VbUploader: typeof import("vue3-bulma-ui/components")["VbUploader"];
		VbUPluginCI: typeof import("vue3-bulma-ui/components")["VbUPluginCI"];
		VbUPluginSI: typeof import("vue3-bulma-ui/components")["VbUPluginSI"];
		VbWatermark: typeof import("vue3-bulma-ui/components")["VbWatermark"];
	}

	export interface ComponentCustomProperties {
		$dialog: OP.Dialog;
		$alert: OP.Alert;
		$confirm: OP.Confirm;
	}
}

declare module 'vue3-bulma-ui' {
	import type { Plugin, Ref } from "vue";
	const _default: Plugin;
	export default _default;
	const {useDialog, useUILocale}: {
		useDialog: (textOpt?: OP.DialogText) => {
			$alert: OP.Alert;
			$confirm: OP.Confirm;
			$dialog: OP.Dialog;
		},
		useUILocale: () => {
			loadLanguage: (name: string, langPackage: object) => void;
			switchLanguage: (locale: string) => void;
			locale: Ref<string>;
		}
	};
	export * from 'vue3-bulma-ui/components';
	export { useDialog, useUILocale };
	export const version: string;
}

export {};
