declare namespace TVO {
	type Value = string | number | boolean | symbol;
	type Item = {
		title: string;
		value: Value;
		icon?: string;
		head?: boolean;
		selected?: boolean;
		disabled?: boolean;
	};
	type List = Item[];

	type CascadeItem = Item & {
		children?: TVO.List;
	}

	type DropdownItem = Item | null;
}

declare namespace Tree {
	interface Leaf {
		text: string;
		value: string;
		link?: string;
		children?: Leaf[];
		checked?: boolean;
		folded?: boolean;
		flags?: string;
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

declare namespace Normal {
	type AnyObj<T = any> = { [key: string]: T };
	type PhotoObj = { name?: string; small?: string; origin?: string; };
	type DeepPartial<T> = {
		[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
	};
}

declare namespace VBTable {
	type Column = {
		field: string;
		label: string;
		sort?: boolean | 'asc' | 'desc' | 'none';
		sticky?: boolean;
		style?: Normal.AnyObj | string;
		slot?: string;
		formatter?: (value: T) => string | T;
	}

	interface Config {
		uniqueKey?: string;
		showSelectColumn?: boolean;
		isReadonly?: boolean | ((item: T) => boolean);
		isChecked?: boolean | ((item: T) => boolean);
		columns: Column[];
	}
}

declare namespace VBForm {
	type Btn = {
		text: string;
		type: 'submit' | 'reset' | 'button',
		fulled?: boolean;
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
		min?: number;
		max?: number;
		value: string | number;
	}

	type PasswordItem = {
		type: 'password';
		value: string;
	}

	type SlotItem = {
		slot: string;
	}

	type FormItem = ListItem | TagItem | DateItem | SwitchItem | InputItem | PasswordItem | SlotItem;

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
		rowSplits?: number;
		isSmall?: boolean;
		items: Item[];
		buttons: Btn[];
	}
}

declare namespace VBMenu {
	type TitleLang = {
		[propName: string]: string;
	}

	type ExtLink = {
		url: string;
		external: true;
	};

	type innerRoute = {
		name: string;
		external?: false;
	};

	type ItemType = ExtLink | innerRoute;

	type Item = ItemType & {
		title: string | TitleLang;
		icon?: any;
		children?: Item[];
		folded?: boolean;
	}
}

declare namespace Tracker {
	interface MoveEventData {
		dir: string;
		detail: {
			multiple: boolean;
			offset: number;
		}
	}
}

declare namespace VBGuide {
	type GuideStyle = {
		top?: string;
		left?: string;
		bottom?: string;
		right?: string;
		offsetX?: string;
		offsetY?: string;
		maskX?: [string, string];
		maskY?: [string, string];
	};
	type GuideItem = {
		title?: string;
		content: string;
		target: string | HTMLElement;
		buttonText?: string;
		before?: (target?: HTMLElement) => Promise<void | GuideStyle>;
		after?: (action: string, target?: HTMLElement) => Promise<void>;
	} & GuideStyle;
}

declare namespace VBBreadcrumb {
	type Item = {
		url: string;
		text: string | Normal.AnyObj<string>;
		icon?: string;
		children?: Item[];
	}
}

declare namespace VBSkeleton {
	type Base = {
		span?: number;
		active?: never;
	}

	type TextSkeleton = {
		type: 'text';
		line?: number;
		shape?: never;
		size?: never;
		width?: never;
		height?: never;
	}

	type AvatarAndButtonSkeleton = {
		type: 'avatar' | 'button';
		line?: never;
		shape?: 'round' | 'none';
		size?: 'none' | 'large';
		width?: never;
		height?: never;
	}

	type ImageSkeleton = {
		type: 'image';
		line?: never;
		shape?: never;
		size?: never;
		width?: string;
		height?: string;
	}

	type Item = Base & (TextSkeleton | AvatarAndButtonSkeleton | ImageSkeleton);

	type Grid = Item[][] | Item[];

	type GraphicsGrid = Item[][];
}