import { computed, ref, watchEffect } from 'vue';

export const useTellMe = () => {
	let timer: number;
	const listStore = ref<OP.MsgObj[]>([]);
	const list = computed(() => listStore.value.filter((item: any) => item.type));

	function add(msg: OP.MsgObj) {
		// 检测数据是否已经存在
		if (msg?.id) {
			const find = listStore.value.find(i => i.id === msg.id);
			if (find) {
				return Promise.reject();
			}
		}

		const msgObj = Object.assign({
			id       : Symbol('id'),
			type     : 'default',
			autoClose: 3000
		}, msg);

		listStore.value.push(msgObj);

		return Promise.resolve(msgObj);
	}

	function remove(id: symbol) {
		return new Promise<OP.MsgObj>((resolve, reject) => {
			const index = listStore.value.findIndex((item: any) => item.id === id);
			if (index > -1) {
				listStore.value[index].type = '';
				return resolve(listStore.value[index]);
			}
			reject();
		});
	}

	function gc() {
		if (!list.value.length) {
			listStore.value.splice(0);
		}
	}

	watchEffect((cl) => {
		if (list.value.length || listStore.value.length) {
			// 回收，30s没有新的通知将回收掉所有内存里的通知
			timer = window.setTimeout(() => {
				gc();
			}, 1000 * 30);
		}
		cl(() => {
			// 清除回收计时器
			if (timer) {
				window.clearTimeout(timer);
				timer = 0;
			}
		});
	});

	return {
		add,
		remove,
		list
	};
}