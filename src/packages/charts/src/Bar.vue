<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { ChildProps } from './types/charts';
import { useResize } from '@/actions/resize';

const props = defineProps<ChildProps>();
const emit = defineEmits(['updateTheme']);
const echarts = inject('echarts') as any;
const barRef = ref();
const eChartsInstance = shallowRef<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'default';
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
		eChartsInstance.value?.setOption(chartOption);
		useResize(barRef.value, () => eChartsInstance.value?.resize());
		updateData();
		emit('updateTheme', eChartsInstance.value, theme.value);
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