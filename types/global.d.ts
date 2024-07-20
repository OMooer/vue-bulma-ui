declare namespace TVO {
	type Value = string | number;
	type Item = {
		title: string;
		value: Value;
		icon?: string;
		selected?: boolean;
		disabled?: boolean;
	}
	type List = Item[];

	type CascadeItem = Item & {
		children?: TVO.List;
	}
}

declare namespace Tree {
	interface Leaf {
		text: string;
		value: string;
		link?: string;
		children?: Leaf[];
		checked?: boolean;
		folded?: boolean;
	}

	interface RelationNodes {
		parentNode: Leaf[];
		self: Leaf;
		subNode: Leaf[]
	}
}

declare namespace OP {
	type MsgObj = {
		id: symbol;
		type: string;
		image?: string;
		message: string;
		autoClose?: number;
		showClose?: boolean;
	}

	type DialogOption = {
		id?: symbol;
		type?: 'alert' | 'confirm';
		title?: string;
		msg: string;
		width?: string;
		doneText?: string;
		cancelText?: string;
	}

	type FastDialogOpt = {
		title?: string;
		width?: string;
		doneText?: string;
		cancelText?: string;
	}

	type Toast = (msg: string | MsgObj) => void
	type Notification = (msg: string | MsgObj) => void
	type Dialog = (opt: DialogOption) => Promise<unknown>
	type Alert = (msg: string, options?: FastDialogOpt) => Promise<unknown>
	type Confirm = (msg: string, options?: FastDialogOpt) => Promise<unknown>
}

