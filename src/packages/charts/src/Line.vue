<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue';

const props = defineProps({
	data  : {
		type    : Object,
		required: true
	},
	colors: Array,
	dark  : Boolean
});
const echarts = inject('echarts');
const lineRef = ref();
const eChartsInstance = ref<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'macarons';
});
const seriesData = computed(() => {
	return props.data.series.map((item: any) => {
		return {
			name : item.name,
			type : 'line',
			data : item.data,
			label: {
				show: true
			}
		}
	});
});
const legendData = computed(() => props.data.legend.map((item: any) => {
	return {name: item, icon: 'roundRect'};
}));
// 主题更改的话，需要重新初始化
watch(() => theme.value, () => {
	if (eChartsInstance.value) {
		eChartsInstance.value?.dispose();
		drawChart();
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
			left      : '5%',
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
		updateData();
	});
}

function updateData() {
	eChartsInstance.value?.setOption({
		legend: {data: legendData.value},
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