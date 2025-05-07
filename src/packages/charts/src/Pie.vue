<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue';

const props = defineProps({
	topOffset: {
		type   : Number,
		default: 90
	},
	data     : {
		type    : Object,
		required: true
	},
	colors   : Array,
	dark     : Boolean
});
const parentChartTitle = inject('parentChartTitle', '');
const echarts = inject('echarts');
const pieRef = ref();
const eChartsInstance = ref<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'macarons';
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
const position = ['28%', '55%'];
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
			trigger  : 'item',
			formatter: "{a} <br/>{b}: {c} ({d}%)"
		},
		title  : {
			left     : 0,
			top      : 0,
			text     : props.data.xData[0],
			textStyle: {
				fontWeight: 'normal',
				fontSize  : 13
			}
		},
		legend : {
			type     : 'scroll',
			orient   : 'vertical',
			right    : 0,
			top      : props.topOffset,
			itemWidth: 14,
			data     : []
		},
		series : [
			{
				name             : parentChartTitle,
				type             : 'pie',
				center           : position,
				radius           : ['25%', '50%'],
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
		updateData();
	});
}

function updateData() {
	eChartsInstance.value?.setOption({
		legend: {data: legendData.value},
		series: [
			{
				data: seriesData.value
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