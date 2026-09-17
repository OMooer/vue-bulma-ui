import { EMPTY_IMG } from './statement';

/**
 * 自动获取焦点
 */
export const vFocus = {
	mounted(el: HTMLElement, binding: any) {
		const isFocus = binding.value ?? true;
		if (isFocus) {
			setTimeout(() => {
				el.focus()
			});
		}
	}
}

/**
 * 图片懒加载
 */
const instObserver = new IntersectionObserver((entries) => {
	for (const entry of entries) {
		if (entry.isIntersecting) {
			const img = entry.target as HTMLImageElement;
			if (img.dataset.src) {
				img.src = img.dataset.src;
			}
			img.removeAttribute('data-src');
			instObserver.unobserve(img);
		}
	}
}, {
	root      : null,
	rootMargin: '0px',
	threshold : 0
});
export const vLazy = {
	beforeMount(el: HTMLImageElement, binding: any) {
		const place = binding.value || EMPTY_IMG;
		// 将图片的原地址改为占位符
		el.dataset.src = el.src;
		el.src = place;
		// 设置监听
		instObserver.observe(el);
	},
	beforeUnmount(el: HTMLImageElement) {
		instObserver.unobserve(el);
	}
}

/**
 * 滚动条定制
 * @description 自动根据出现的滚动条添加指定的样式
 */

function checkHasScrollbar(el: HTMLElement) {
	return {
		horizontal: el.scrollWidth > el.clientWidth,
		vertical  : el.scrollHeight > el.clientHeight
	}
}

function setScrollClass(el: HTMLElement, scrollbarDir: 'x' | 'y', cls?: false | string[]) {
	// 没有提供正确的样式类名
	if (!cls) {
		// 如果另一个方向的滚动条也不存在，则移除掉 has-scrollbar 类
		if (el.classList.contains('has-scrollbar') && !checkHasScrollbar(el)[
				scrollbarDir === 'x' ? 'vertical' : 'horizontal'
				]) {
			el.classList.remove('has-scrollbar');
		}
		return;
	}
	// 判断是否应该存在滚动条
	const has = checkHasScrollbar(el);
	const hasHorizontal = has.horizontal && scrollbarDir === 'x';
	const hasVertical = has.vertical && scrollbarDir === 'y';
	// 如果完全不存在滚动条，则移除类名
	if (!has.horizontal && !has.vertical) {
		el.classList.remove('has-scrollbar');
		el.classList.remove(...cls);
		return;
	}

	// 设置拥有滚动条的类名
	const addClass = [];
	if (hasHorizontal || hasVertical) {
		addClass.push(...cls);
		addClass.push('has-scrollbar');
	}

	if (addClass.length) {
		el.classList.add(...addClass);
	}
}

let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
export const vScrollbar = {
	beforeMount  : (el: HTMLElement, binding: any) => {
		const scrollbarDir = binding.arg ?? 'x';
		const value = binding.value ?? [];
		// 创建监听
		resizeObserver = new ResizeObserver(entries => {
			for (let item of entries) {
				if (item.target === el) {
					setScrollClass(el, scrollbarDir, value);
				}
			}
		});
		resizeObserver.observe(el);
		// 创建内部节点变更的监听
		mutationObserver = new MutationObserver(mutations => {
			for (const item of mutations) {
				if (item.type === 'childList' || item.type === 'characterData') {
					setScrollClass(el, scrollbarDir, value);
				}
			}
		});
		mutationObserver.observe(el, {
			childList: true,
			subtree  : true,
		});
	},
	beforeUnmount: (el: HTMLElement) => {
		resizeObserver?.unobserve(el);
	}
}

/**
 * 限制键盘 Tab 切换范围
 */

// Tab 圈住：焦点只许在弹窗内轮转
function trapFocus(el: HTMLElement) {
	return (e: KeyboardEvent) => {
		if (e.key !== 'Tab' || !el) {
			return;
		}
		const items = Array.from(
				el.querySelectorAll<HTMLElement>(
						'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
				)
		);
		if (!items.length) {
			return;
		}
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		}
		else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
}

export const vTrapTab = {
	mounted(el: HTMLElement, binding: any) {
		const event = trapFocus(el);
		(el as any)._trapTabHandler = event;
		el.addEventListener('keydown', event);
	},
	beforeUnmount(el: HTMLElement) {
		const event = (el as any)._trapTabHandler;
		if (event) {
			el.removeEventListener('keydown', event);
			delete (el as any)._trapTabHandler;
		}
	}
}