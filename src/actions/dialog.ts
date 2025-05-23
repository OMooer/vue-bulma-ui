import { DIALOG_APP_ID } from '@/utils';
import { createApp, defineComponent, h, ref } from 'vue';
import { useUILocale } from './locale';
import Modal from '../packages/modal';

// 创建 dialog vnode 组件
const dialogVNode = defineComponent(
		(props, {slots, emit, expose}) => {
			const modalEntity = ref(null);
			// 反向触发 Modal 关闭，因为要呈现 Modal 的关闭动画
			// 所以在这里暴露出实例事件给到 dialog 的实例组件
			// 而在 Modal 的内部也同样是暴露出来了 dismiss 事件
			// 注意这个事件与 dialog 的 dismiss 事件不是同一个
			function modalClose() {
				(modalEntity.value as any)?.dismiss();
			}

			expose({
				modalClose
			});

			return () => h(Modal, {
						ref     : modalEntity,
						hasClose: false,
						style   : {
							width      : props.width,
							'min-width': '20rem'
						},
						onClose() {
							emit('dismiss');
						}
					},
					{
						default: () => [
							props.title ? h('h2', {class: 'title is-6 has-text-centered mb-3'}, props.title) : null,
							h('p', {class: 'has-text-centered is-size-6'}, props.content)
						],
						footer : () => slots?.footer ? slots.footer() : null
					}
			);
		},
		{
			props: {
				title  : String,
				content: String,
				width  : {
					type   : String,
					default: 'auto'
				}
			}
		}
);

/**
 * useDialog
 */
export function useDialog(optionLanguage?: OP.DialogText) {
	optionLanguage = Object.assign({}, optionLanguage ?? {});

	// 创建 dialog 页面根容器
	function getDialogRoot() {
		let dialogEl = document.querySelector(`#${ DIALOG_APP_ID }`);
		if (!dialogEl) {
			dialogEl = document.createElement('div');
			dialogEl.id = DIALOG_APP_ID;
			document.body.appendChild(dialogEl);
		}
		return dialogEl;
	}

	// dialog 实现
	const $dialog = (options: OP.DialogOption) => {
		const {raw} = useUILocale();
		const language = Object.assign({}, raw.value.dialog ?? {}, optionLanguage);
		const dialogEl = getDialogRoot();
		// 返回一个 Promise 用来回调 confirm 的选择
		return new Promise((resolve, reject) => {
			options.doneText ??= language.doneText;
			options.cancelText ??= language.cancelText;
			const dialogEntity = ref(null);
			const dismissDialog = () => {
				dialog.unmount();
			}
			let footOpera = [];
			switch (options.type) {
				case 'confirm':
					footOpera = [
						h('a', {
							class: 'card-footer-item has-text-weight-bold',
							onClick() {
								(dialogEntity.value as any)?.modalClose();
								resolve(true);
							}
						}, options.doneText),
						h('a', {
							class: 'card-footer-item',
							onClick() {
								(dialogEntity.value as any)?.modalClose();
								reject();
							}
						}, options.cancelText)
					]
					break;
				default:
					footOpera = [
						h('a', {
							class: 'card-footer-item has-text-weight-bold',
							onClick() {
								(dialogEntity.value as any)?.modalClose();
								resolve(true);
							}
						}, options.doneText)
					]
			}
			const footer = h('footer', {class: 'card-footer'}, footOpera);
			const dialog = createApp({
				render: () => h(dialogVNode as any, {
							ref      : dialogEntity,
							title    : options.title,
							content  : options.content,
							width    : options.width,
							onDismiss: dismissDialog
						},
						{footer: () => footer}
				)
			});
			dialog.mount(dialogEl as Element);
		});
	};
	const $alert = (content: string, opt?: OP.FastDialogOpt) => {
		const {title, width, doneText} = opt || {};
		return $dialog({type: 'alert', title, content, width, doneText});
	};
	const $confirm = (content: string, opt?: OP.FastDialogOpt) => {
		const {title, width, doneText, cancelText} = opt || {};
		return $dialog({type: 'confirm', title, content, width, doneText, cancelText});
	};


	return {$alert, $confirm, $dialog};
}
