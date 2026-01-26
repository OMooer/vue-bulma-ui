declare namespace OP {
	type MsgObj = {
		id: symbol;
		type: string;
		image?: string;
		message: string;
		autoClose?: number;
		showClose?: boolean;
	}

	type DialogText = {
		doneText?: string;
		cancelText?: string;
	}

	type DialogOption = {
		id?: symbol;
		type?: 'alert' | 'confirm';
		title?: string;
		content: string;
		width?: string;
	} & DialogText;

	type FastDialogOpt = Omit<DialogOption, 'id' | 'type' | 'content'>;

	type Toast = { (msg: string | MsgObj): void };
	type Notification = { (msg: string | MsgObj): void };
	type Dialog = { (opt: DialogOption): Promise<unknown> };
	type Alert = { (content: string, options?: FastDialogOpt): Promise<unknown> };
	type Confirm = { (content: string, options?: FastDialogOpt): Promise<unknown> };
}