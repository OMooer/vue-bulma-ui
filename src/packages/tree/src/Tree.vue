<script lang="ts">
import { computed, defineComponent, h, ref, type VNode, watchEffect } from 'vue';
import { isTruthy } from '../../../utils';
import { FontAwesomeIcon as FontIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
	name : 'Tree',
	props: {
		selectable : [String, Boolean],
		selected   : {
			type: Array,
			default() {
				return [];
			}
		},
		sourceData : {
			type    : Array,
			required: true
		},
		status     : {
			type   : String,
			default: 'expand',
			validator(val: string) {
				return ['fold', 'expand'].includes(val);
			}
		},
		activeClass: {
			type   : String,
			default: 'current-active'
		},
		expandText : {
			type   : String,
			default: '展开'
		},
		foldText   : {
			type   : String,
			default: '折叠'
		}
	},
	setup(props, {emit}) {
		const selectValues = ref<string[]>([]);
		const activeNode = ref();
		const treeData = ref<Tree.Leaf[]>([]);
		const isSelectable = computed(() => {
			return isTruthy(props.selectable);
		});

		function getNode(tree: Tree.Leaf[]) {
			return tree.reduce((nodes: Tree.Leaf[], item: Tree.Leaf) => {
				const itemSub = item.children;
				let subNode: Tree.Leaf[] = [];
				if (itemSub && itemSub.length) {
					subNode = subNode.concat(getNode(itemSub));
				}
				const current = [item];
				if (subNode.length) {
					current.push(...subNode);
				}
				nodes = nodes.concat(...current);
				return nodes;
			}, []);
		}

		function findRelation(tr: Tree.Leaf[], key: string): Tree.RelationNodes | null {
			let findRes = null;
			for (let item of tr) {
				// 如果命中结果直接返回
				if (item.value == key) {
					findRes = {
						parentNode: [],
						self      : item,
						subNode   : item.children ? getNode(item.children) : []
					}
					break;
				}
				// 如果当前不匹配且有子级则进入子级查找
				if (item.children && item.children.length) {
					const findSub = findRelation(item.children, key);
					if (findSub) {
						const {parentNode, self, subNode} = findSub;
						findRes = {
							parentNode: [item].concat(parentNode),
							self,
							subNode
						}
						break;
					}
				}
			}
			return findRes;
		}

		function nodeClick(item: any) {
			activeNode.value = item;
			emit('click', item);
		}

		function updateSelect(val: string, isAdd: boolean) {
			if (isAdd) {
				selectValues.value.push(val);
			}
			else {
				const index = selectValues.value.indexOf(val);
				if (index >= 0) {
					selectValues.value.splice(index, 1);
				}
			}
			selectValues.value = Array.from(new Set(selectValues.value));
		}

		function changeSelect(val: string, isAdd: boolean) {
			// 找出当前值的上下级，并进行相应的操作
			const relation = findRelation(treeData.value, val) as Tree.RelationNodes;
			relation.self.checked = isAdd;
			// 将所有下级与当前状态设置一致
			relation.subNode.forEach((item: Tree.Leaf) => {
				item.checked = isAdd;
			});
			const updateParent: string[] = [];
			// 如果是新选的，所有上级都一并勾选上
			if (isAdd) {
				relation.parentNode.forEach((item: Tree.Leaf) => {
					item.checked = true;
				});
				updateParent.push(...relation.parentNode.map((item: Tree.Leaf) => item.value));
			}
			else {
				// 判断上级是否应该取消勾选
				for (let i = relation.parentNode.length; i > 0; i--) {
					const parent = relation.parentNode[i - 1];
					if (parent?.children?.some((item: Tree.Leaf) => item.checked)) {
						break;
					}
					else {
						parent.checked = false;
						updateParent.unshift(parent.value);
					}
				}
			}
			const updateIds = ([] as string[]).concat(updateParent, relation.self.value, relation.subNode.map((item: any) => item.value));
			updateIds.forEach(id => {
				updateSelect(id, isAdd);
			});

			emit('select', selectValues.value);
		}

		function checkActive(item: any) {
			return item === activeNode.value;
		}

		function reduceTree(data: Tree.Leaf[]): Tree.Leaf[] {
			return data.map((item: Tree.Leaf) => {
				const newItem = {
					checked: props.selected.includes(item.value)
				} as Tree.Leaf;
				if (item.children && item.children?.length) {
					newItem.children = reduceTree(item.children);
				}
				return Object.assign({}, item, newItem, {folded: props.status === 'fold'});
			});
		}

		watchEffect(() => {
			selectValues.value = ([] as string[]).concat(props.selected as string[]);
			treeData.value = reduceTree(props.sourceData as Tree.Leaf[]);
		});

		return () => {
			function buildTree(data: Tree.Leaf[]): VNode[] {
				return data.map(item => {
					return h('li', [
						h('label', {
									onClick(event: any) {
										nodeClick(item);
										event.stopPropagation();
									},
									onDblclick(event: any) {
										item.folded = !item.folded;
										// @ts-ignore
										window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
										event.stopPropagation();
									}
								},
								[
									isSelectable.value ? h('input', {
										type   : 'checkbox',
										value  : item.value,
										checked: item.checked,
										onInput(event: any) {
											changeSelect(event.target.value, event.target.checked);
										},
										onClick(event: any) {
											event.stopPropagation();
										}
									}) : null,

									item.link
											// 如果数据是带链接的
											? h('a', {
												class : {
													'node-name'        : true,
													[props.activeClass]: checkActive(item)
												},
												href  : item.link,
												target: '_blank'
											}, item.text)
											// 不带链接的
											: h('span', {
												class: {
													'node-name'        : true,
													[props.activeClass]: checkActive(item)
												}
											}, item.text),
								]),
						// 存在子级节点数据
						item.children && item.children.length
								? [
									h('ul', {
										class: {
											'sub-node' : true,
											'hide-node': item.folded
										}
									}, buildTree(item.children)),
									h('a', {
										class: 'opera-icon',
										title: item.folded ? props.expandText : props.foldText,
										onClick(event: any) {
											item.folded = !item.folded;
											event.preventDefault();
											event.stopPropagation();
										}
									}, [
										h(FontIcon, {
											icon: ['far', item.folded ? 'square-plus' : 'square-minus']
										})
									])
								]
								: null
					]);
				});
			}

			const tree = buildTree(treeData.value);
			return h('ul', {class: 'vb-tree'}, tree);
		}
	}
});
</script>

<style lang="scss">
@import "../../../scss/variables";

.vb-tree {
	li {
		position: relative;

		&:before {
			content: "├─";
			font-family: Monaco, serif;
		}

		&:last-of-type:before {
			content: "└─";
		}

		.node-name {
			display: inline-block;
			padding: 0 .3em;
		}

		.opera-icon {
			display: none;
			position: absolute;
			top: .25em;
			line-height: 1;
			background-color: var(--bulma-body-background-color);
			color: var(--bulma-text);
		}

		&:hover > .opera-icon {
			display: block;
		}
	}

	.sub-node {
		margin-left: .27em;
		padding-left: 1.5em;
		border-left: solid 1px var(--bulma-text);

		&.hide-node {
			display: none;
		}
	}

	li:last-of-type > .sub-node {
		border: 0 !important;
	}
}
</style>
