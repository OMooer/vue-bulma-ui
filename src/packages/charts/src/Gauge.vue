<script setup lang="ts">
import { computed, inject, nextTick, ref, shallowRef, watch } from 'vue';
import type { ChildProps } from './types/charts';
import { useResize } from '@/actions/resize';

const props = defineProps<ChildProps>();
const echarts = inject('echarts') as any;
const gaugeRef = ref();
const eChartsInstance = shallowRef<any>(null);
const theme = computed(() => {
	return props.dark ? 'dark' : 'default';
});
const seriesData = computed(() => {
	const _data: Normal.AnyObj[] = [];
	for (const item of props.data.series) {
		for (let i = 0; i < item.data.length; i++) {
			if (_data[i]) {
				_data[i][item.name] = item.data[i];
			}
			else {
				_data[i] = {[item.name]: item.data[i]};
			}
		}
	}
	return _data;
});
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
		color : props.colors,
		series: []
	};

	nextTick(() => {
		// @ts-ignore
		eChartsInstance.value = echarts?.init(gaugeRef.value, theme.value);
		eChartsInstance.value?.setOption(chartOption);
		useResize(gaugeRef.value, () => eChartsInstance.value?.resize());
		updateData();
	});
}

function updateData() {
	const canvasWidth = gaugeRef.value.offsetWidth, canvasHeight = gaugeRef.value.offsetHeight;
	const {unit, color, min, max, value} = seriesData.value[0];
	const minSize = Math.min(canvasWidth, canvasHeight);
	const textColor = '#999';
	eChartsInstance.value?.setOption({
		series: [
			{
				type       : 'gauge',
				startAngle : 200,
				endAngle   : -20,
				min        : min,
				max        : max,
				splitNumber: max * .05,
				itemStyle  : {
					color: color
				},
				progress   : {
					show    : true,
					roundCap: true,
					width   : minSize * .05
				},
				axisLine   : {
					lineStyle: {
						width: minSize * .05
					}
				},
				axisTick   : {
					splitNumber: 3,
					lineStyle  : {
						width: 2,
						color: '#999'
					}
				},
				splitLine  : {
					length   : minSize * .05,
					lineStyle: {
						width: 2,
						color: '#999'
					}
				},
				// 刻度文字大小
				axisLabel: {
					distance: minSize * .07,
					color   : textColor,
					fontSize: minSize * .06
				},
				anchor   : {
					show     : true,
					showAbove: true,
					size     : minSize * .05,
					itemStyle: {
						borderWidth: minSize * .025,
						borderColor: color
					}
				},
				title    : {
					show: false
				},
				detail   : {
					valueAnimation: true,
					fontSize      : minSize * .1,
					color         : color,
					offsetCenter  : [0, '40%'],
					formatter(value: number) {
						return value.toFixed() + `{unit|${ unit }}`;
					},
					rich: {
						unit: {
							fontSize: minSize * .05,
							padding : [0, 0, -minSize * .025, minSize * .025]
						}
					}
				},
				data     : [
					{
						value: value
					}
				]
			}
		]
	});
}
</script>

<template>
	<div ref="gaugeRef" class="gauge-chart">
		<slot/>
	</div>
</template>

<style scoped lang="scss">
.gauge-chart {
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>