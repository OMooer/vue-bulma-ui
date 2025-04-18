import { findIndex, lastFindIndex } from '@/utils';
import { ref } from 'vue';

export const useKeydown = () => {
	const keyIndex = ref(-1);
	const handler = (e: KeyboardEvent, filterList: any[]) => {
		const action = e.code;
		let _index = -1;
		switch (action) {
			case 'ArrowUp':
				if (keyIndex.value <= 0) {
					return;
				}
				_index = lastFindIndex(filterList, (item) => !item.disabled, keyIndex.value);
				if (_index > -1) {
					keyIndex.value = _index;
				}
				break;
			case 'ArrowDown':
				if (keyIndex.value >= filterList.length - 1) {
					return;
				}
				_index = findIndex(filterList, (item) => !item.disabled, ++keyIndex.value);
				if (_index > -1) {
					keyIndex.value = _index;
				}
				break;
		}
		return action;
	}

	return {
		keyIndex,
		handler
	}
}