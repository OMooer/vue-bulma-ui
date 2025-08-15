<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { ChildProps } from './types/charts';
import { useResize } from '@/actions/resize';

const props = defineProps<ChildProps & { topOffset?: number }>();
const parentChartTitle = inject('parentChartTitle', '');
const echarts = inject('echarts') as any;
const pieRef = ref();
const eChartsInstance = shallowRef<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'default';
});
const seriesData = computed(() => {
	return props.data.series.map((item: any) => {
		return {
			name : item.name,
			value: item.data[0] || 0
		}
	});
});
const legendData = computed(() => props.data.legend);
// 主题更改的话，需要重新初始化
// 6.x + 可以直接使用 setTheme() 方法切换
watch(() => theme.value, (skin) => {
	if (eChartsInstance.value) {
		const ver = echarts.version.split('.');
		if (Number(ver[0]) >= 6) {
			eChartsInstance.value?.setTheme(skin);
			updateData();
		}
		else {
			eChartsInstance.value?.dispose();
			drawChart();
		}
	}
});
// 监听数据变化
watch(() => seriesData.value, () => {
	if (seriesData.value.length) {
		if (!eChartsInstance.value) {
			drawChart();
		}
		else {
			updateData();
		}
	}
}, {immediate: true});

function drawChart() {
	const chartOption: any = {
		backgroundColor: 'transparent',
		color          : props.colors,
		tooltip        : {
			trigger  : 'item',
			formatter: "{b}: {c} ({d}%)"
		},
		title          : {
			left     : 0,
			top      : 0,
			text     : props.data.xData[0],
			textStyle: {
				fontWeight: 'normal',
				fontSize  : 13
			}
		},
		legend         : {
			type     : 'scroll',
			orient   : 'vertical',
			right    : 0,
			top      : props.topOffset || 'center',
			itemWidth: 14,
			data     : []
		},
		series         : [
			{
				name             : parentChartTitle,
				type             : 'pie',
				radius           : ['40%', '90%'],
				avoidLabelOverlap: false,
				label            : {
					show: false
				},
				data             : []
			}
		]
	};
	chartOption.legend.formatter = (seriesName: string) => {
		let _value = seriesData.value.find((item: any) => {
			return item.name === seriesName;
		}).value;
		let _total = seriesData.value.reduce((count: number, item: any) => {
			return count + item.value;
		}, 0);
		return (_value / _total * 100).toFixed(1) + '%\t\t' + seriesName;
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(pieRef.value, theme.value);
		eChartsInstance.value?.setOption(chartOption);
		useResize(pieRef.value, () => eChartsInstance.value?.resize());
		updateData();
	});
}

function updateData() {
	let minLen = pieRef.value?.offsetHeight;
	let maxLen = pieRef.value?.offsetWidth;
	if (maxLen < minLen) {
		maxLen = minLen;
		minLen = pieRef.value?.offsetWidth;
	}
	const leftX = 90 / 2 * (minLen / maxLen) + 2;
	const legend = legendData.value?.length ? {data: legendData.value} : undefined;
	eChartsInstance.value?.setOption({
		legend,
		series: [
			{
				center: legend ? [`${ leftX }%`, 'center'] : 'center',
				data  : seriesData.value
			}
		]
	});
}
</script>

<template>
	<div ref="pieRef" class="pie-chart">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.pie-chart {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>