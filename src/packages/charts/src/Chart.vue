<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import * as eCharts from 'echarts';
import { computed, onMounted, provide, ref, shallowRef, watchEffect } from 'vue';
import { chartColors } from './colors';
import DatetimePicker from '../../datetimePicker';
import Loading from '../../loading';
import Bar from './Bar.vue';
import Gauge from './Gauge.vue';
import Line from './Line.vue';
import Pie from './Pie.vue';
import Radar from './Radar.vue';

const emit = defineEmits(['fetch']);
const slots = defineSlots();
const props = defineProps({
	theme     : String,
	title     : String,
	type      : {
		type    : String,
		required: true
	},
	dateFilter: {
		type: Boolean,
		default() {
			return false;
		}
	},
	dateText  : Array,
	width     : {
		type   : [String, Number],
		default: '100%'
	},
	height    : {
		type   : [String, Number],
		default: 360
	},
	stack     : String,
	data      : {
		type    : Array,
		required: true
	},
	// 作用在柱形图中，将其中某项的展示方式转换为折线图
	barOverLine: {
		type: Array,
		default() {
			return [];
		}
	},
	// 排除指定的数据项，不参与图形展示
	excludes: {
		type: Array,
		default() {
			return [];
		}
	}
});
const {$vbt} = useUILocale();
const toolbar = computed(() => {
	return props.dateFilter || slots.toolbar;
});
const echartsReady = ref(false);

// 图表子组件列表
const chartChildren = shallowRef<any>({
	pieChart  : Pie,
	lineChart : Line,
	barChart  : Bar,
	radarChart: Radar,
	gaugeChart: Gauge
});
// 根据图表类型获取对应的子组件
const childChart = computed(() => {
	return chartChildren.value[props.type.toLowerCase() + 'Chart'];
});
// 是否暗黑主题
const isDarkTheme = computed(() => {
	return props.theme === 'dark';
});
// 获取图表的宽高尺寸
const chartSize = computed(() => {
	function resolve(value: string | number | undefined) {
		if (typeof value === 'number') {
			return value + 'px';
		}
		else if (typeof value === 'string') {
			if (parseInt(value, 10) && Number(value)) {
				return value + 'px';
			}
			else {
				return value;
			}
		}
		return 'auto';
	}

	return {
		width : resolve(props.width),
		height: resolve(props.height)
	}
});

// 封装图表序列数据
const seriesData = computed(() => {
	if (!props.data.length) {
		return [];
	}
	const data = props.data.map((item: any) => item.data);
	const result: Normal.AnyObj = {};
	const series = [];
	for (let item of data) {
		for (let [name, value] of Object.entries(item)) {
			if (result[name]) {
				result[name].push(value);
			}
			else {
				result[name] = [value];
			}
		}
	}
	const allKeys = Object.keys(result).filter(
			key => props.excludes
					.map((exclude: any) => exclude.toLowerCase())
					.indexOf(key.toLowerCase()) === -1
	);
	for (let item of allKeys) {
		series.push({
			name: item,
			data: result[item]
		});
	}
	return series.map(item => {
		const _type = props.barOverLine
				.map((item: any) => item.toLowerCase())
				.indexOf(item.name.toLowerCase()) > -1 ? 'line' : null;
		return {
			name : item.name,
			data : item.data,
			label: props.type?.toLowerCase() === 'bar',
			type : _type,
			stack: props.stack
		}
	});
});
// 获取展示的图例数据
const chartLegend = computed(() => {
	if (!props.data.length) {
		return [];
	}
	return Object.keys((props.data[0] as any).data).filter((legend: string) => {
		return !(props.excludes as string[]).some((ex: string) => ex.toLowerCase() === legend.toLowerCase());
	});
});
// 封装图表数据
const chartData = computed(() => {
	return {
		legend: chartLegend.value,
		xData : props.data.map((item: any) => item.group),
		yData : [],
		series: seriesData.value
	};
});

const dateRange = ref([]);
watchEffect(() => {
	if (dateRange.value.length) {
		refresh();
	}
});
const messages = computed(() => {
	const message = props.dateText || [$vbt('chart.startText'), $vbt('chart.endText')];
	return {
		'zh-cn': {
			calendar: {
				rangeStart: message[0],
				rangeEnd  : message[1],
			}
		}
	}
});

// 加载
onMounted(() => {
	echartsReady.value = true;
	if (!props.data.length) {
		refresh();
	}
});

// 刷新数据
function refresh() {
	// console.log('fetch', props.type);
	const toolbarForm = {};
	const [start = '', end = ''] = dateRange.value;
	emit('fetch', Object.assign({}, toolbarForm, {start, end}));
}

provide('echarts', eCharts);
provide('parentChartTitle', props.title);
</script>

<template>
	<div class="vb-chart">
		<h3 class="title is-5 mt-5" v-if="title">{{ title }}</h3>
		<div class="toolbar" v-if="toolbar">
			<div class="tool-date" v-if="dateFilter">
				<DatetimePicker class="is-small" :messages is-range v-model="dateRange"/>
			</div>
			<slot name="toolbar" :start="dateRange[0]" :end="dateRange[1]"/>
		</div>
		<Component
				:dark="isDarkTheme" :colors="chartColors" :data="chartData"
				:style="chartSize" :is="childChart"
				v-if="echartsReady">
			<slot>
				<Loading timeout-state="keep" style="position: relative"/>
			</slot>
		</Component>
	</div>
</template>

<style scoped lang="scss">
.vb-chart {
	.toolbar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: .5em;
		margin: .25em 0;
		font-size: 0.75rem;

		.tool-date {
			width: 12rem;
		}
	}
}
</style>