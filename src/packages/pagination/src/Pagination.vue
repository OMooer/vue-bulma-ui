<script setup lang="ts">
import { useUILocale } from '@/actions/locale';
import { computed } from 'vue';
import { SelectorNative } from '../../select';

const props = defineProps({
	router         : null,
	page           : {
		type    : Number,
		required: true,
		default : 1
	},
	total          : {
		type    : Number,
		required: true,
		default : 0
	},
	pageSizes      : {
		type   : Array,
		default: [10, 20, 30, 50, 100]
	},
	prevText       : {
		type   : String,
		default: '\u2039'
	},
	nextText       : {
		type   : String,
		default: '\u203A'
	},
	showStepButtons: {
		type   : Boolean,
		default: true
	},
	showChangeSizes: Boolean,
	rangeSize      : {
		type     : Number,
		default  : 7,
		validator: (v: number) => v === 0 || (v >= 3 && v <= 19)
	}
});
const limit = defineModel<number>('limit', {default: 10});
const emit = defineEmits(['changePage']);
const {$vbt} = useUILocale();
const sizes = computed(() => {
	return props.pageSizes.map((item: any) => {
		return {
			title: $vbt('pagination.pageSize', [item]),
			value: item
		}
	});
});
const validRangeSize = computed(() => {
	let rs = props.rangeSize;
	rs = rs === 0 ? rs : Math.max(3, rs);
	return Math.min(19, rs);
});
const maxPage = computed(() => {
	return Math.max(1, Math.ceil(props.total / limit.value));
});
const currentPageSize = computed({
	get() {
		return sizes.value.some(item => item.value === limit.value) ? limit.value : '';
	},
	set(v: number) {
		limit.value = v;
	}
})
const currentRangePages = computed(() => {
	// 1 2 3 4 5 6 7 8 9 10 ...
	const arr = Array(maxPage.value).fill(0).map((_, i) => i + 1);
	// 如果最大页数小于等于分页按钮个数则显示全部分页
	if (maxPage.value <= validRangeSize.value) {
		return arr.slice(0, validRangeSize.value);
	}
	const start = Math.max(0, props.page - Math.ceil(validRangeSize.value / 2));
	const cut = arr.slice(start, start + validRangeSize.value);
	if (cut.length < validRangeSize.value) {
		// 如果 cut 的个数少于 rangeSize 则往前面获取 arr 的数据补齐
		const d = validRangeSize.value - cut.length;
		// 往前获取 d 个数据添加到 cut 里
		cut.splice(0, 0, ...arr.slice(start - d, start));
	}
	// 小于6个的无法显示省略，直接返回以当前页为参照的总个数
	if (validRangeSize.value <= 6) {
		return cut;
	}
	// 6个以上的可以在显示省略的情况下无缝跳转所以返回包括第一页和最后页的省略显示
	// 如果第一个不是1，那么将前两个更改为1和省略
	const firstRange = cut[0];
	if (firstRange > 1) {
		cut.splice(0, 2, 1, 0);
	}
	// 如果最后一个不是最大页，则将后两个更改为最大页和省略
	const lastRange = cut[cut.length - 1];
	if (lastRange < maxPage.value) {
		cut.splice(cut.length - 2, 2, 0, maxPage.value);
	}

	return cut;
});

function gotoPage(page: number) {
	if (page < 1) {
		page = 1;
	}
	else if (page > maxPage.value) {
		page = maxPage.value;
	}
	if (props.router) {
		const route = props.router.currentRoute;
		const params = Object.assign({}, route.params, {page});
		props.router.push({name: route.name, params, query: route.query});
	}
	emit('changePage', page);
}
</script>

<template>
	<nav class="pagination" role="navigation" aria-label="pagination">
		<div class="vb-pagination-sizes" v-if="showChangeSizes">
			<SelectorNative :allowNull="false" :list="sizes" v-model="currentPageSize" style="width: auto"/>
		</div>
		<template v-if="showStepButtons">
			<a class="pagination-previous" :class="{'is-disabled': page<=1}" @click="gotoPage(page-1)">{{ prevText }}</a>
			<a class="pagination-next" :class="{'is-disabled': page>=maxPage}" @click="gotoPage(page+1)">{{ nextText }}</a>
		</template>
		<ul class="pagination-list" v-if="maxPage>1">
			<li v-for="item in currentRangePages">
				<span class="pagination-ellipsis" v-if="item === 0">&hellip;</span>
				<a
						@click="gotoPage(item)"
						class="pagination-link"
						:class="{'is-current': page === item}"
						:aria-label="`Page ${item}`"
						aria-current="page"
						v-else>{{ item }}</a>
			</li>
		</ul>
	</nav>
</template>

<style scoped lang="scss">
.is-disabled {
	pointer-events: none;
}
</style>