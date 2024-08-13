<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Empty from '../../empty';
import SortUI from '../../sort';

const emit = defineEmits(['sort', 'select']);
const props = withDefaults(defineProps<{
	tableConfig: VBTable.Config;
	tableData: Normal.AnyObj[];
	emptyText?: string;
}>(), {emptyText: '无数据'});
// 是否显示可勾选
const showCheck = computed(() => {
	return props.tableConfig?.showSelectColumn;
});
// 勾选结果
const selectedIndex = ref<number[]>([]);
// 是否全选
const selectedAll = ref(false);
watch(() => selectedAll.value, () => {
	if (selectedAll.value) {
		selectedIndex.value = props.tableData?.map((_: any, index: number) => index) ?? [];
	}
	else if (selectedIndex.value.length === props.tableData?.length) {
		selectedIndex.value = [];
	}
});
watch(() => selectedIndex.value, () => {
	if (selectedIndex.value.length !== props.tableData?.length) {
		selectedAll.value = false;
	}
	emit('select', selectedIndex.value);
});
watch(() => props.tableData, () => {
	selectedIndex.value = [];
});
// 计算列数
const columnCount = computed(() => {
	return props.tableConfig?.columns.length + (showCheck.value ? 1 : 0);
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
</script>

<template>
	<div class="vb-table">
		<table class="table is-bordered is-hoverable is-striped">
			<thead>
			<tr>
				<!-- 如果有勾选列 -->
				<th class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input type="checkbox" v-model="selectedAll">
					</label>
				</th>
				<th
						:class="[item.slot?`col-${item.slot}`:`col-${idx}`, {'is-sticky' : item.sticky}]"
						:style="item.style ?? null"
						v-for="(item, idx) in tableConfig?.columns">
					{{ item.label }}
					<!-- 如果有排序 -->
					<SortUI :state="sorts[item.field]" @sort="sortTable(item.field, $event, true)" v-if="item.sort"/>
				</th>
			</tr>
			</thead>
			<tbody>
			<tr :class="{'is-checked': selectedIndex.includes(index)}" v-for="(data, index) in tableData">
				<!-- 如果有勾选列 -->
				<td class="col-check is-sticky" v-if="tableConfig?.showSelectColumn">
					<label class="checkbox">
						<input type="checkbox" :value="index" v-model="selectedIndex">
					</label>
				</td>
				<td
						:class="[item.slot?`col-${item.slot}`:`col-${idx}`, {'is-sticky' : item.sticky}]"
						:style="item.style ?? null"
						v-for="(item, idx) in tableConfig?.columns">
					<!-- 如果有插槽则显示插槽的内容，否则显示纯数据值 -->
					<template v-if="item.slot">
						<slot :name="item.slot" :col="data" :val="data[item.field]">未设置插槽内容</slot>
					</template>
					<template v-else>{{ data[item.field] }}</template>
				</td>
			</tr>
			<tr v-if="!tableData?.length">
				<td :colspan="columnCount">
					<Empty :text="emptyText"/>
				</td>
			</tr>
			</tbody>
		</table>
	</div>
</template>

<style scoped lang="scss">
.vb-table {
	margin: 2em 0;
	overflow-x: auto;
	border: solid $grey-lighter;
	border-width: 0 1px;
	min-width: 100%;

	.table {
		table-layout: fixed;
		width: fit-content;
		min-width: 100%;

		thead {
			position: sticky;
			top: 0;

			tr th {
				border-bottom-width: 2px;
				border-bottom-color: $grey-light;
				font-weight: bold;
			}
		}

		tr.is-checked {
			td {
				background-color: $info;
				color: $white;
			}
		}

		th, td {
			word-break: break-all;

			&.is-sticky {
				position: sticky;
				z-index: 10;
				background-color: $white;
				box-shadow: -1px 0 0 0 $grey-lighter inset, 1px 0 0 0 $grey-lighter inset;
				border-right: 0;

				& + th, & + td {
					border-left: 0;
				}

				&:first-child {
					box-shadow: -1px 0 0 0 $grey-lighter inset;
				}

				&:last-child {
					box-shadow: 1px 0 0 0 $grey-lighter inset;
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

		&.is-striped {
			tr:nth-child(even):not(.is-checked) {
				td {
					&.is-sticky {
						background-color: $white-bis;
					}
				}
			}
		}

		&.is-hoverable {
			tr:hover:not(.is-checked) {
				&:nth-child(odd) {
					td {
						&.is-sticky {
							background-color: $white-bis;
						}
					}
				}

				&:nth-child(even) {
					td {
						&.is-sticky {
							background-color: $white-ter;
						}
					}
				}
			}
		}
	}
}
</style>