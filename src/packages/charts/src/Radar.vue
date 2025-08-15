<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { ChildProps } from './types/charts';
import { useResize } from '@/actions/resize';

const props = defineProps<ChildProps>();
const emit = defineEmits(['updateTheme']);
const echarts = inject('echarts') as any;
const radarRef = ref();
const eChartsInstance = shallowRef<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'default';
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
		emit('updateTheme', eChartsInstance.value, skin);
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
			indicator: indicatorData.value,
			radius   : '75%'
		},
		series : []
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(radarRef.value, theme.value);
		eChartsInstance.value?.setOption(chartOption);
		useResize(radarRef.value, () => eChartsInstance.value?.resize());
		updateData();
		emit('updateTheme', eChartsInstance.value, theme.value);
	});
}

function updateData() {
	eChartsInstance.value?.setOption({
		legend: {
			right: 0,
			top  : 0,
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