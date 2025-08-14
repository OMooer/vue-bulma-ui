<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { ChildProps } from './types/charts';
import { useResize } from '@/actions/resize';

const props = defineProps<ChildProps>();
const echarts = inject('echarts') as any;
const lineRef = ref();
const eChartsInstance = shallowRef<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'default';
});
const seriesData = computed(() => {
	return props.data.series.map((item: any) => {
		const series = {
			name : item.name,
			type : 'line',
			data : item.data,
			label: {
				show: true
			}
		}
		if (item.stack) {
			Object.assign(series, {
				stack    : item.stack,
				areaStyle: {},
				emphasis : {
					focus: 'series'
				}
			});
		}

		return series;
	});
});
const legendData = computed(() => props.data.legend.map((item: any) => {
	return {name: item, icon: 'roundRect'};
}));
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
		color  : props.colors,
		tooltip: {
			trigger    : 'axis',
			axisPointer: {
				type: 'cross'
			}
		},
		legend : {
			type      : 'scroll',
			top       : '3%',
			left      : 'center',
			itemWidth : 15,
			itemHeight: 15,
			itemGap   : 25,
			data      : []
		},
		grid   : {
			left        : '3%',
			right       : '4%',
			bottom      : '3%',
			containLabel: true
		},
		xAxis  : [
			{
				type       : 'category',
				boundaryGap: false,
				data       : []
			}
		],
		yAxis  : [
			{type: 'value'}
		],
		series : []
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(lineRef.value, theme.value);
		eChartsInstance.value?.setOption(chartOption);
		useResize(lineRef.value, () => eChartsInstance.value?.resize());
		updateData();
	});
}

function updateData() {
	const legend = legendData.value?.length ? {data: legendData.value} : undefined;
	eChartsInstance.value?.setOption({
		legend,
		series: seriesData.value,
		xAxis : [
			{
				data: props.data.xData
			}
		]
	});
}
</script>

<template>
	<div ref="lineRef" class="line-chart">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.line-chart {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>