import { defineComponent, h } from 'vue';

export default defineComponent({
	name     : 'Tracker',
	inherited: true,
	props    : {
		tag  : {
			type   : String,
			default: 'div',
		},
		scale: {
			type   : Number,
			default: 1,
		},
		x    : {
			type   : Number,
			default: 0,
		},
		y    : {
			type   : Number,
			default: 0,
		}
	},
	emits    : ['update:x', 'update:y', 'update:scale', 'start', 'end'],
	setup(props, {emit, slots}) {
		let isMoveable = false;
		let startX = 0;
		let startY = 0;
		let oldX = 0;
		let oldY = 0;
		let oldScale = 1;
		let initialDistance = 0;
		let initialTouches = [];

		function moveStart(e: MouseEvent) {
			isMoveable = true;
			startX = e.clientX;
			startY = e.clientY;
			oldX = props.x ?? 0;
			oldY = props.y ?? 0;
			emit('start');
		}

		function moveEnd() {
			if (!isMoveable) {
				return;
			}
			isMoveable = false;
			startX = 0;
			startY = 0;
			emit('end');
		}

		function moving(e: MouseEvent) {
			if (!isMoveable) {
				return;
			}
			const moveX = e.clientX - startX;
			const moveY = e.clientY - startY;
			const x = oldX + moveX / props.scale;
			const y = oldY + moveY / props.scale;
			emit('update:x', x);
			emit('update:y', y);
		}

		function touchStart(e: TouchEvent) {
			if (e.touches.length === 2) {
				initialTouches = [
					{x: e.touches[0].clientX, y: e.touches[0].clientY},
					{x: e.touches[1].clientX, y: e.touches[1].clientY}
				];
				initialDistance = Math.sqrt(
						Math.pow(initialTouches[0].x - initialTouches[1].x, 2) +
						Math.pow(initialTouches[0].y - initialTouches[1].y, 2)
				);
				oldScale = props.scale;
			}

			isMoveable = true;
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
			oldX = props.x ?? 0;
			oldY = props.y ?? 0;
			emit('start');
		}

		function touchEnd() {
			initialTouches = [];
			initialDistance = 0;
			moveEnd();
		}

		function touchMoving(e: TouchEvent) {
			e.preventDefault();

			// 双指缩放
			if (e.touches.length === 2 && initialTouches) {
				const currentTouches = [
					{x: e.touches[0].clientX, y: e.touches[0].clientY},
					{x: e.touches[1].clientX, y: e.touches[1].clientY}
				];
				const currentDistance = Math.sqrt(
						Math.pow(currentTouches[0].x - currentTouches[1].x, 2) +
						Math.pow(currentTouches[0].y - currentTouches[1].y, 2)
				);
				const scale = currentDistance / initialDistance;
				emit('update:scale', Math.max(0.1, oldScale * scale));
			}

			// 移动
			if (!isMoveable) {
				return;
			}
			const moveX = e.touches[0].clientX - startX;
			const moveY = e.touches[0].clientY - startY;
			const x = oldX + moveX / props.scale;
			const y = oldY + moveY / props.scale;
			emit('update:x', x);
			emit('update:y', y);
		}

		return () => {
			return h(props.tag, {
				onMousedown : moveStart,
				onMouseup   : moveEnd,
				onMousemove : moving,
				onMouseleave: moveEnd,
				onTouchstart: touchStart,
				onTouchend  : touchEnd,
				onTouchmove : touchMoving,
			}, slots?.default?.())
		}
	}
});