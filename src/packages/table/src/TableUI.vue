<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import Dropdown from '@/packages/dropdown';
import type { VBTable } from '@/types/shim';
import { SYMBOL_SELECT_ALL } from '@/utils';
import { computed, ref, watch } from 'vue';
import Empty from '../../empty';
import SortUI from '../../sort';

const emit = defineEmits(['sort', 'select']);
const props = withDefaults(defineProps<{
	tableConfig: VBTable.Config;
	tableData: Normal.AnyObj[];
	emptyText?: string;
	custom?: boolean;
	mode?: 'grid', // grid 模式是为了达到内容长列完整展示其余列均分空间的目的
	hoverable?: boolean;
	striped?: boolean;
	bordered?: boolean;
	narrow?: boolean;
}>(), {
	hoverable: true,
	bordered : true
});
// 行数据快照：来自 computed 派生，修改不会回写到源数据 tableData
type TableRow = Readonly<Normal.AnyObj & { _$readonly: boolean }>;
// 具名插槽作用域声明：row 为只读，使用者无法（也不应）通过它反向修改源数据
defineSlots<{
	[name: string]: (props: { row: TableRow; val: any; index: number }) => any;
}>();
const {$vbt} = useUILocale();
// 表格样式
const tableStyle = computed(() => {
	return {
		'is-bordered' : props.bordered,
		'is-hoverable': props.hoverable,
		'is-striped'  : props.striped,
		'is-narrow'   : props.narrow,
		'grid-style'  : props.mode === 'grid'
	}
});
const innerTableData = computed<TableRow[]>(() => {
	return props.tableData?.map((item: any) => {
		return {
			...item,
			_$readonly: isReadonly(item)
		} as TableRow;
	}) ?? [];
});
// 是否显示可勾选
const showCheck = computed(() => {
	return props.tableConfig?.showSelectColumn;
});
// 勾选结果
const selectedIndex = ref<number[]>([]);
// 是否全选
const selectedAll = ref(false);
const unselectable = computed(() => {
	return !innerTableData.value?.some((item: any) => !item._$readonly);
});
watch(() => selectedIndex.value, (selectedArrays) => {
	selectedAll.value = selectedArrays.length > 0 && selectedArrays.length >= innerTableData.value?.filter((item: any) => !item._$readonly).length;
	emit('select', selectedArrays);
});
watch(() => [...props.tableData], (list) => {
	selectedIndex.value = [];
	list.forEach((item: any, index: number) => {
		// 检查是否预勾选
		if (isChecked(item)) {
			selectedIndex.value.push(index);
		}
	});
}, {immediate: true});
// 显示的表头值
const hiddenHeadList = ref<string[]>([]);
// 表头列表
const tableHeads = computed(() => {
	const heads: TVO.DropdownItem[] = props.tableConfig?.columns.map((item) => {
		return {
			title   : item.label,
			value   : item.field,
			selected: !hiddenHeadList.value.includes(item.field),
		}
	});
	heads?.unshift(
			{
				title: $vbt('table.columnDisplay'),
				value: '',
				head : true
			},
			{
				title   : $vbt('table.selectAll'),
				value   : SYMBOL_SELECT_ALL,
				selected: hiddenHeadList.value.length === 0
			},
			null
	);

	return heads;
});
// 显示的表列数据
const renderColumns = computed(() => {
	return props.tableConfig?.columns.filter(item => !hiddenHeadList.value.includes(item.field)) ?? [];
});
// 计算列数
const columnCount = computed(() => {
	return renderColumns.value.length + (showCheck.value ? 1 : 0);
});
// 排序
const sorts = ref<Normal.AnyObj>({});

function sortTable(key: string, by: string, exclusive?: boolean) {
	if (exclusive) {
		for (const item in sorts.value) {
			sorts.value[item as keyof typeof sorts.value] = 'none';
		}
	}
	sorts.value[key as keyof typeof sorts.value] = by;
	// 排除掉 none 的数据
	const sortCond = Object.entries(sorts.value)
			.filter(([_, value]) => value !== 'none')
			.reduce((acc: Normal.AnyObj, [key, value]) => {
				acc[key] = value;
				return acc;
			}, {});
	emit('sort', sortCond);
}

function changeSelectTableHead(value: any, selected: boolean) {
	// 勾选
	if (selected) {
		// 全选清空隐藏列表
		if (value === SYMBOL_SELECT_ALL) {
			hiddenHeadList.value.splice(0);
			return;
		}
		const index = hiddenHeadList.value.indexOf(value);
		if (index > -1) {
			hiddenHeadList.value.splice(index, 1);
		}
	}
	// 取消勾选
	else {
		if (value === SYMBOL_SELECT_ALL) {
			hiddenHeadList.value = props.tableConfig?.columns.map((item: any) => {
				return item.field;
			});
			return;
		}
		if (hiddenHeadList.value.indexOf(value) === -1) {
			hiddenHeadList.value.push(value);
		}
	}
}

function toggleSelectAll() {
	const allSelect = selectedAll.value;
	if (allSelect) {
		selectedIndex.value = innerTableData.value?.map((item: any, index: number) => {
			return item._$readonly ? -1 : index;
		}).filter(i => i > -1) ?? [];
	}
	else {
		selectedIndex.value = [];
	}
}

function isReadonly(data: any) {
	const readonly = props.tableConfig?.isReadonly;
	return !!(typeof readonly === 'function' ? readonly(data) : readonly);
}

function isChecked(data: any) {
	const checked = props.tableConfig?.isChecked;
	return !!(typeof checked === 'function' ? checked(data) : checked);
}
</script>

<template>
	<div class="vb-table">
		<Dropdown
				class="head-dropdown is-small"
				showSelect :list="tableHeads" parentElement="body"
				@select="changeSelectTableHead" v-if="custom"/>
		<table
				class="table"
				:class="tableStyle"
				:style="`--columns: ${columnCount - 1};${showCheck ? ' --first-width: 2.7em;' : ''}`">
			<thead>
			<tr>
				<!-- 如果有勾选列 -->
				<th class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input
								type="checkbox"
								:disabled="unselectable"
								:aria-label="$vbt('table.selectAll')"
								@change="toggleSelectAll"
								v-model="selectedAll">
					</label>
				</th>
				<th
						:class="[`col-${idx}`, {[`col-${item.slot}`]: item.slot, 'is-sticky': item.sticky}]"
						:style="item.style ?? null"
						:key="item.field"
						:aria-sort="sorts[item.field] === 'asc' ? 'ascending' : sorts[item.field] === 'desc' ? 'descending' : undefined"
						v-for="(item, idx) in renderColumns">
					{{ item.label }}
					<!-- 如果有排序 -->
					<SortUI
							:state="sorts[item.field] ?? (typeof item.sort === 'boolean' ? 'none' : item.sort)"
							@sort="sortTable(item.field, $event, true)" v-if="item.sort"/>
				</th>
			</tr>
			</thead>
			<tbody>
			<tr
					:class="{'is-selected': selectedIndex.includes(index), 'is-readonly': data._$readonly}"
					:key="data[tableConfig?.uniqueKey as string] ?? index"
					v-for="(data, index) in innerTableData" v-if="columnCount">
				<!-- 如果有勾选列 -->
				<td class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input
								type="checkbox"
								:disabled="data._$readonly"
								:value="index"
								:aria-label="$vbt('table.selectRow')"
								v-model="selectedIndex">
					</label>
				</td>
				<td
						:class="[`col-${idx}`, {[`col-${columnConf.slot}`]: columnConf.slot, 'is-sticky': columnConf.sticky}]"
						:style="columnConf.style ?? null"
						:key="columnConf.field"
						v-for="(columnConf, idx) in renderColumns">
					<!-- 如果有插槽则显示插槽的内容，否则显示纯数据值 -->
					<template v-if="columnConf.slot">
						<slot :name="columnConf.slot" :row="data" :val="data[columnConf.field]" :index="index">
							{{ $vbt('table.unknownSlot') }}
						</slot>
					</template>
					<template v-else>{{ columnConf.formatter?.(data[columnConf.field]) ?? data[columnConf.field] }}</template>
				</td>
			</tr>
			<tr v-if="!tableData?.length || !columnCount">
				<td class="empty-column" :colspan="columnCount || undefined">
					<Empty :text="emptyText || $vbt('table.emptyText')"/>
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped lang="scss">
@use "@/scss/variables" as va;

.vb-table {
	margin: 2em 0;
	overflow: auto;
	min-width: 100%;

	@include va.scrollbar(false);

	.head-dropdown {
		position: absolute;
		z-index: 20;
		margin-top: -1em;
	}

	&:has(.table.is-bordered) {
		border: solid va.$split-color 2px;
		border-radius: va.$radius;
	}

	.table {
		table-layout: fixed;
		width: auto;
		min-width: 100%;
		min-height: 100%;
		border-collapse: separate;
		border-spacing: 0;

		thead {
			position: sticky;
			top: 0;
			z-index: 12;
			background: var(--bulma-table-background-color);

			tr th {
				border-bottom-width: 2px;
				font-weight: bold;
			}
		}

		tr.is-selected {
			background: none;

			td {
				background-color: hsl(var(--bulma-info-h), var(--bulma-info-s), var(--bulma-scheme-main-ter-l));
				border-color: var(--bulma-table-cell-border-color);
				border-bottom-color: var(--bulma-table-row-active-color);
			}
		}

		th, td {
			border-top-width: 0;
			border-right-width: 0;
			word-break: break-all;
			vertical-align: middle;
			white-space: nowrap;

			&.is-sticky {
				position: sticky;
				z-index: 10;
				background-color: var(--bulma-table-background-color);

				&:has(.dropdown.is-active) {
					z-index: 12;
				}

				& + th, & + td {
					border-left: 0;
				}
			}

			&.col-check {
				vertical-align: middle;
				text-align: center;
				left: 0;
				width: 2.7em;
				z-index: 11;
			}

			&:first-of-type {
				border-left: 0;
			}

			&:last-of-type {
				border-right: 0;
			}
		}

		tr:last-of-type {
			td {
				border-bottom: 0;
			}
		}

		&.is-bordered {
			th, td {
				&.is-sticky {
					&:not(:last-child) {
						border-right-width: 1px;
					}
				}
			}
		}

		&.is-striped {
			tr:nth-child(even):not(.is-selected) {
				td {
					background-color: var(--bulma-table-striped-row-even-background-color);
				}
			}
		}

		&.is-hoverable {
			tr:hover:not(.is-selected) {
				td {
					background-color: var(--bulma-table-row-hover-background-color);
				}
			}

			&.is-striped {
				tr:hover:not(.is-selected) {
					&:nth-child(odd) {
						td {
							background-color: var(--bulma-table-striped-row-even-background-color);
						}
					}

					&:nth-child(even) {
						td {
							background-color: var(--bulma-table-striped-row-even-hover-background-color);
						}
					}
				}
			}
		}

		&.is-narrow {
			font-size: 0.875rem;
		}

		&.grid-style {
			display: grid;
			grid-template-columns: var(--first-width, 1fr) repeat(var(--columns, 0), 1fr);

			thead, tbody, tr {
				display: contents;
			}

			th, td {
				display: flex;
				align-items: center;
			}

			td.empty-column {
				grid-column: 1/-1;
			}
		}
	}
}
</style>