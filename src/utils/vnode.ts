import { isVNode, Comment, Fragment, Text, type VNode } from 'vue';

export function isEmptyElement(c: any) {
	return (
			c &&
			(c.type === Comment ||
					(c.type === Fragment && c.children.length === 0) ||
					(c.type === Text && c.children.trim() === ''))
	);
}

// 打平节点
export function flattenVNode(children: any = [], filterEmpty: boolean = true) {
	const res: VNode[] = [];
	const slots = Array.isArray(children) ? children : [children];
	slots.forEach((node: any) => {
		if (Array.isArray(node)) {
			res.push(...flattenVNode(node, filterEmpty));
		}
		else if (node && node.type === Fragment) {
			res.push(...flattenVNode(node.children, filterEmpty));
		}
		else if (node && isVNode(node)) {
			if (filterEmpty && !isEmptyElement(node)) {
				res.push(node);
			}
			else if (!filterEmpty) {
				res.push(node);
			}
		}
	});
	return res;
}
