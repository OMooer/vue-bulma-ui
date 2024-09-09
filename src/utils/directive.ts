export const vFocus = {
	updated: (el: HTMLElement, binding: any) => {
		const isFocus = binding.value ?? true;
		if (isFocus) {
			setTimeout(() => {
				el.focus()
			});
		}
	}
}