<script lang="ts">
import { cloneVNode, computed, defineComponent, h, ref } from 'vue';
import { flattenVNode, isEmptyElement, isTruthy } from '@/utils';
import CollapsePanel from './CollapsePanel.vue';

export default defineComponent({
	props: {
		activeKeys: null,
		accordion : Boolean,
		gap       : {
			type   : Number,
			default: 0
		}
	},
	emits: ['update:activeKeys'],
	setup(props, ctx) {
		const activeKeys = computed(() => props.activeKeys);
		const panelConfig = ref<{
			key?: string | number | symbol;
			force?: boolean;
			folded: boolean;
			name: string;
		}[]>([]);

		function togglePanel(key: string | number | symbol): void {
			const currentPanel = panelConfig.value.find(item => item.key === key);
			if (currentPanel && !currentPanel.force) {
				// 如果是手风琴效果则关闭其它的面板
				if (props?.accordion) {
					panelConfig.value.forEach(item => {
						if (item.key !== key && !item.force) {
							item.folded = true;
						}
					});
				}
				currentPanel.folded = !currentPanel.folded;
			}
			const newActiveKeys = panelConfig.value.filter(item => !item.folded).map(item => item.key);
			ctx.emit('update:activeKeys', newActiveKeys);
		}

		function expandAll() {
			// 除非是强制不展开的，否则都展开
			const all = panelConfig.value.filter(item => !item.force || (item.force && !item.folded)).map(item => item.key);
			ctx.emit('update:activeKeys', all);
		}

		function foldAll() {
			// 只要所有强制展开的
			const all = panelConfig.value.filter(item => item.force && !item.folded).map(item => item.key);
			ctx.emit('update:activeKeys', all);
		}

		function getNewChild(node: any, index: number) {
			if (isEmptyElement(node)) {
				return;
			}
			const newProps = {};
			if (node.type === CollapsePanel) {
				const key = node.props?.key ?? index;
				const item = {
					key,
					folded: !activeKeys.value?.includes(key as string),
					force : isTruthy(node.props?.force),
					name  : node.props?.title ?? node.props?.header,
				};
				panelConfig.value.push(item);

				Object.assign(newProps, {
					panel   : panelConfig.value[index],
					gap     : props.gap,
					onToggle: togglePanel
				}, node.props);
			}
			else {
				panelConfig.value.push({} as any);
			}

			return cloneVNode(node, newProps);
		}

		const getItems = () => {
			panelConfig.value.splice(0);
			return flattenVNode(ctx.slots.default?.()).map(getNewChild);
		}

		ctx.expose({
			foldAll,
			expandAll
		});

		return () => h('div', {class: 'vb-collapse'}, getItems() as [])
	},
})
</script>