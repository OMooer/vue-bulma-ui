export {}

export declare namespace VBTree {
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

export declare namespace VBTable {
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

export declare namespace VBForm {
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

export declare namespace VBMenu {
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

export declare namespace VBGuide {
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

export declare namespace VBBreadcrumb {
	type Item = {
		url: string;
		text: string | Normal.AnyObj<string>;
		icon?: string;
		children?: Item[];
	}
}

export declare namespace VBSkeleton {
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

	type InputSkeleton = {
		type: 'input';
		line?: never;
		shape?: 'round' | 'square' | 'none';
		size?: never;
		width?: string;
		height?: string;
	}

	type ButtonSkeleton = {
		type: 'button';
		line?: never;
		shape?: 'round' | 'square' | 'none';
		size?: 'none' | 'small' | 'large';
		width?: string;
		height?: string;
		center?: boolean;
	}

	type AvatarSkeleton = {
		type: 'avatar';
		line?: never;
		shape?: 'round' | 'none';
		size?: 'none' | 'small' | 'large';
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

	type Item = Base & (TextSkeleton | InputSkeleton | AvatarSkeleton | ButtonSkeleton | ImageSkeleton);

	type Grid = Item[][] | Item[];

	type GraphicsGrid = Item[][];
}