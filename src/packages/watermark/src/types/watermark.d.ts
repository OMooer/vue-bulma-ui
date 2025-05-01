type Base = {
	padding?: number;
	size?: number;
	color?: string;
	bgColor?: string;
};

export type TextMark = Base & {
	text: string | string[];
	image?: never;
};

type ImageMark = Base & {
	image: string;
	text?: never;
};

export type Config = TextMark | ImageMark;