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
const barRef = ref();
const eChartsInstance = ref<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'macarons';
});
const seriesData = computed(() => {
	return props.data.series.map((item: any) => {
		const _type = item.type ?? 'bar';
		const _label = item.label ? getLabelOption(_type) : null
		return {
			name : item.name,
			type : _type,
			data : item.data,
			stack: item.stack,
			label: _label
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

function getLabelOption(type: string) {
	const labelOption = {
		show    : true,
		distance: 5,
		fontSize: 14
	};
	if (type === 'bar') {
		Object.assign(labelOption, {
			position     : 'insideBottom',
			verticalAlign: 'middle',
			align        : 'left',
			rotate       : 90,
			formatter    : '{c}  {name|{a}}',
			rich         : {
				name: {
					textBorderColor: '#FFF'
				}
			}
		});
	}
	return labelOption;
}

function drawChart() {
	const chartOption: any = {
		color  : props.colors,
		tooltip: {
			trigger    : 'axis',
			axisPointer: {
				type: 'shadow'
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
				type: 'category',
				data: []
			}
		],
		yAxis  : [
			{type: 'value'}
		],
		series : []
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(barRef.value, theme.value);
		eChartsInstance.value.setOption(chartOption);
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
	<div ref="barRef" class="bar-chart">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.bar-chart {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>