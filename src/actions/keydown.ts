import { findIndex, lastFindIndex } from '@/utils';
import { ref } from 'vue';

export const useKeydown = () => {
	const keyIndex = ref(-1);
	const handler = (e: KeyboardEvent, filterList: any[], prevent?: boolean) => {
		const action = e.code;
		if (prevent && !['Enter', 'Space', 'Tab'].includes(action)) {
			return;
		}
		let _index = -1;
		switch (action) {
			case 'Tab':
				if (keyIndex.value === -1 && !prevent) {
					keyIndex.value = 0;
				}
				break;
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
			case 'Space':
			case 'Enter':
				if (keyIndex.value === -1) {
					return 'Toggle';
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