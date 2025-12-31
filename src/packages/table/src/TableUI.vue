<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import Dropdown from '@/packages/dropdown';
import { SYMBOL_SELECT_ALL } from '@/utils';
import { computed, ref, watch, watchEffect } from 'vue';
import Empty from '../../empty';
import SortUI from '../../sort';

const emit = defineEmits(['sort', 'select']);
const props = defineProps<{
	tableConfig: VBTable.Config;
	tableData: Normal.AnyObj[];
	emptyText?: string;
	custom?: boolean;
}>();
const {$vbt} = useUILocale();
const innerTableData = computed(() => {
	return props.tableData?.map((item: any) => {
		return {
			...item,
			readonly: isReadonly(item)
		}
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
	return !innerTableData.value?.some((item: any) => !item.readonly);
});
watch(() => selectedIndex.value, (selectedArrays) => {
	selectedAll.value = selectedArrays.length > 0 && selectedArrays.length >= innerTableData.value?.filter((item: any) => !item.readonly).length;
	emit('select', selectedArrays);
});
watch([() => props.tableData, () => props.tableData.length], ([list]) => {
	selectedIndex.value = [];
	list.forEach((item: any, index: number) => {
		// 检查是否预勾选
		if (isChecked(item)) {
			selectedIndex.value.push(index);
		}
	});
}, {immediate: true});
// 显示的表头值
const showHeadList = ref<string[]>([]);
watchEffect(() => {
	if (props.tableConfig?.columns) {
		showHeadList.value = props.tableConfig?.columns.map((item: any) => {
			return item.field;
		});
	}
});
// 表头列表
const tableHeads = computed(() => {
	const heads: TVO.DropdownItem[] = props.tableConfig?.columns.map((item) => {
		return {
			title   : item.label,
			value   : item.field,
			selected: showHeadList.value.includes(item.field),
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
				selected: showHeadList.value.length === props.tableConfig.columns.length
			},
			null
	);

	return heads;
});
// 显示的表列数据
const renderColumns = computed(() => {
	return props.tableConfig?.columns.filter(item => showHeadList.value.includes(item.field)) ?? [];
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
	if (!selected) {
		if (value === SYMBOL_SELECT_ALL) {
			showHeadList.value.splice(0);
			return;
		}
		const index = showHeadList.value.indexOf(value);
		if (index > -1) {
			showHeadList.value.splice(index, 1);
		}
	}
	else {
		if (value === SYMBOL_SELECT_ALL) {
			showHeadList.value = props.tableConfig?.columns.map((item: any) => {
				return item.field;
			});
			return;
		}
		if (showHeadList.value.indexOf(value) === -1) {
			showHeadList.value.push(value);
		}
	}
}

function toggleSelectAll() {
	const allSelect = selectedAll.value;
	if (allSelect) {
		selectedIndex.value = innerTableData.value?.map((item: any, index: number) => {
			return item.readonly ? -1 : index;
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
		<table class="table is-bordered is-hoverable is-striped">
			<thead>
			<tr>
				<!-- 如果有勾选列 -->
				<th class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input type="checkbox" :disabled="unselectable" @change="toggleSelectAll" v-model="selectedAll">
					</label>
				</th>
				<th
						:class="[`col-${idx}`, {[`col-${item.slot}`]: item.slot, 'is-sticky': item.sticky}]"
						:style="item.style ?? null"
						:key="item.field"
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
					:class="{'is-checked': selectedIndex.includes(index), 'is-readonly': data.readonly}"
					:key="data[tableConfig?.uniqueKey ?? ''] ?? Object.values(data)?.[0] ?? index"
					v-for="(data, index) in innerTableData">
				<!-- 如果有勾选列 -->
				<td class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input type="checkbox" :disabled="data.readonly" :value="index" v-model="selectedIndex">
					</label>
				</td>
				<td
						:class="[`col-${idx}`, {[`col-${item.slot}`]: item.slot, 'is-sticky': item.sticky}]"
						:style="item.style ?? null"
						:key="item.field"
						v-for="(item, idx) in renderColumns">
					<!-- 如果有插槽则显示插槽的内容，否则显示纯数据值 -->
					<template v-if="item.slot">
						<slot :name="item.slot" :row="data" :val="data[item.field]" :index="index">
							{{ $vbt('table.unknownSlot') }}
						</slot>
					</template>
					<template v-else>{{ item.formatter?.(data[item.field]) ?? data[item.field] }}</template>
				</td>
			</tr>
			<tr v-if="!tableData?.length || !columnCount">
				<td :colspan="columnCount">
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
	border: solid va.$split-color 2px;
	border-radius: va.$radius;
	min-width: 100%;

	@include va.scrollbar(false);

	.head-dropdown {
		position: absolute;
		z-index: 20;
		margin-top: -1em;
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

		tr.is-checked {
			td {
				background-color: hsl(var(--bulma-info-h), var(--bulma-info-s), var(--bulma-scheme-main-ter-l));
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

				&:not(:last-child) {
					border-right-width: 1px;
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

		&.is-striped {
			tr:nth-child(even):not(.is-checked) {
				td {
					&.is-sticky {
						background-color: var(--bulma-table-striped-row-even-background-color);
					}
				}
			}
		}

		&.is-hoverable {
			tr:hover:not(.is-checked) {
				&:nth-child(odd) {
					td {
						&.is-sticky {
							background-color: var(--bulma-table-striped-row-even-background-color);
						}
					}
				}

				&:nth-child(even) {
					td {
						&.is-sticky {
							background-color: var(--bulma-table-striped-row-even-hover-background-color);
						}
					}
				}
			}
		}
	}
}
</style>