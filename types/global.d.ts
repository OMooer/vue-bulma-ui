import type { Component } from 'vue';

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

declare namespace Normal {
	type AnyObj = { [key: string]: any };
}

declare namespace VBTable {
	type Column = {
		field: string;
		label: string;
		sort?: boolean;
		sticky?: boolean;
		style?: Normal.AnyObj | string;
		slot?: string;
	}

	interface Config {
		showSelectColumn?: boolean;
		columns: Column[]
	}
}

declare namespace VBForm {
	type Btn = {
		text: string;
		type: 'submit' | 'reset' | 'button',
		class?: string;
		handler?: () => void;
	}

	type ListItem = {
		type: 'select';
		options: TVO.List;
		value: any;
	}

	type TagItem = {
		type: 'tags';
		options: TVO.List;
		collapse?: number;
		value: any[];
	}

	type Datetime = {
		type: 'datetime' | 'date';
		value: string;
	}
	type DateRange = {
		type: 'dateRange';
		rangeText?: [string, string];
		value: [string, string];
	}
	type DateItem = (Datetime | DateRange) & {
		min?: string;
		max?: string;
	}

	type SwitchItem = {
		type: 'switch';
		value: boolean;
	}

	type InputItem = {
		type: 'input' | 'number';
		value: string | number;
	}

	type SlotItem = {
		slot: string;
	}

	type FormItem = ListItem | TagItem | DateItem | SwitchItem | InputItem | SlotItem;

	type Item = FormItem & {
		label?: string;
		name: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		readonly?: boolean;
		colspan?: number;
	}

	interface Config {
		rowCols?: number;
		isSmall?: boolean;
		items: Item[];
		buttons: Btn[];
	}
}

declare namespace VBMenu {
	type TitleLang = {
		[propName: string]: string;
	}

	type Item = {
		name: string;
		title: string | TitleLang;
		icon?: string | Component;
		url: string;
		children?: Item[];
		folded?: boolean;
		external?: boolean;
	}
}