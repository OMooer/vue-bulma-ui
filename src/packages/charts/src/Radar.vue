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
const radarRef = ref();
const eChartsInstance = ref<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'macarons';
});
const seriesData = computed(() => {
	const _data: Normal.AnyObj[] = [];
	props.data.xData.forEach((item: any, index: number) => {
		if (item !== 'Indicator') {
			_data.push({
				name : item,
				value: props.data.series.map((val: any) => val.data[index])
			});
		}
	});
	return _data;
});
const indicatorData = computed(() => props.data.series.map((item: any) => {
	const IndicatorIndex = props.data.xData.indexOf('Indicator');
	return {name: item.name, max: item.data[IndicatorIndex]};
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
			trigger: 'axis'
		},
		radar  : {
			indicator: indicatorData.value
		},
		series : []
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(radarRef.value, theme.value);
		eChartsInstance.value.setOption(chartOption);
		updateData();
	});
}

function updateData() {
	eChartsInstance.value?.setOption({
		legend: {
			right: 0,
			data : props.data.xData
		},
		series: [
			{
				type     : 'radar',
				tooltip  : {
					trigger: 'item'
				},
				areaStyle: {},
				data     : seriesData.value,
			}
		]
	});
}
</script>

<template>
	<div ref="radarRef" class="radar-chart">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.radar-chart {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>