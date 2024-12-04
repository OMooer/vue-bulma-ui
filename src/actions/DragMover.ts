import { defineComponent, h } from 'vue';

export default defineComponent({
	name     : 'dragMover',
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
	emits    : ['update:x', 'update:y', 'start', 'end'],
	setup(props, {emit, slots}) {
		let isMoveable = false;
		let startX = 0;
		let startY = 0;
		let oldX = 0;
		let oldY = 0;

		function moveStart(e: MouseEvent) {
			isMoveable = true;
			startX = e.clientX;
			startY = e.clientY;
			oldX = props.x ?? 0;
			oldY = props.y ?? 0;
			emit('start');
		}

		function moveEnd() {
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


		return () => {
			return h(props.tag, {
				onMousedown: moveStart,
				onMouseup  : moveEnd,
				onMousemove: moving,
			}, slots?.default?.())
		}
	}
});