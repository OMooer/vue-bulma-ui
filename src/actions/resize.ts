export const useResize = (dom: HTMLElement, cb: Function) => {
	if (!dom) {
		return;
	}
	const resizeObserver = new ResizeObserver(entries => {
		for (let item of entries) {
			if (item.target === dom) {
				cb?.(resizeObserver);
			}
		}
	});
	resizeObserver.observe(dom);
	return resizeObserver;
}