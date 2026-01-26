declare namespace Normal {
	type AnyObj<T = any> = { [key: string]: T };
	type PhotoObj = { name?: string; small?: string; origin?: string; };
	type DeepPartial<T> = {
		[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
	};
}
