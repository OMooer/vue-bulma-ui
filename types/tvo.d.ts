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