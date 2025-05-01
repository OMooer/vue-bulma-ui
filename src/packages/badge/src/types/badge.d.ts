type BaseProps = {
	type?: 'none' | 'ribbon' | 'corner';
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
	active?: boolean;
	effect?: boolean;
	less?: boolean;
}

type StyleGroup =
		| { color: string; preset?: never; state?: never; }
		| { state: 'success' | 'process' | 'error' | 'default'; preset?: never; color?: never; }
		| {
	preset: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light';
	state?: never;
	color?: never;
}
		| { state?: never; preset?: never; color?: never };

type ContentGroup =
		| { text: string; number?: never; max?: never; }
		| { number: number; text?: never; max?: number; };

export type Props = BaseProps & StyleGroup & ContentGroup;