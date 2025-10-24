import { EVENT_TO_BOTTOM, EVENT_TO_LEFT, EVENT_TO_RIGHT, EVENT_TO_TOP } from '@/utils';
import { defineComponent, h, PropType, ref } from 'vue';

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

		x: {
			type   : Number,
			default: 0,
		},
		y: {
			type   : Number,
			default: 0,
		},

		triggerItem: String,

		eventTrigger: {
			type   : Array as PropType<string[]>,
			default: () => ['wheel', 'touch', 'drag']
		}
	},
	emits    : [
		'update:x',
		'update:y',
		'update:scale',
		'click',
		'start',
		'end',
		'ing',
		'xSlide',
		'ySlide',
		'xWheel',
		'yWheel'
	],
	setup(props, {emit, slots, expose}) {
		const trackerRef = ref(null);
		let isMoveable = false;
		let isClickEvent: MouseEvent | null = null;
		let startX = 0;
		let startY = 0;
		let oldX = 0;
		let oldY = 0;
		let oldScale = 1;
		let multiple = false;
		let initialDistance = 0;
		let initialTouches: { x: number; y: number; }[] = [];
		const inertialX: number[] = [];
		const inertialY: number[] = [];
		let wheelEnding = false;
		let wheelTimer = 0;
		let wheelX = 0;
		let wheelY = 0;

		const getXDir = (x: number) => x > 0 ? EVENT_TO_RIGHT : EVENT_TO_LEFT;
		const getYDir = (y: number) => y > 0 ? EVENT_TO_BOTTOM : EVENT_TO_TOP;

		function startHandler(x: number, y: number) {
			isMoveable = true;
			startX = x;
			startY = y;
			oldX = props.x ?? 0;
			oldY = props.y ?? 0;
			emit('start');
		}

		function endHandler(x: number, y: number) {
			if (!isMoveable) {
				return;
			}
			isMoveable = false;
			const moveX = x - startX;
			const moveY = y - startY;
			if (moveX) {
				emit('xSlide', {
					dir   : getXDir(moveX),
					detail: {multiple, offset: moveX}
				});
			}
			if (moveY) {
				emit('ySlide', {
					dir   : getYDir(moveY),
					detail: {multiple, offset: moveY}
				});
			}
			startX = 0;
			startY = 0;
			emit('end');
		}

		function ingHandler(x: number, y: number) {
			if (!isMoveable) {
				return;
			}
			const moveX = x - startX;
			const moveY = y - startY;
			const newX = oldX + moveX / props.scale;
			const newY = oldY + moveY / props.scale;
			emit('update:x', newX);
			emit('update:y', newY);
			emit('ing', {
				client   : {x: x, y: y},
				direction: {x: getXDir(moveX), y: getYDir(moveY)},
				offset   : {x: newX, y: newY},
			});
		}

		function scaleStartHandler(touches: TouchList) {
			if (touches.length === 2) {
				initialTouches = [
					{x: touches[0].clientX, y: touches[0].clientY},
					{x: touches[1].clientX, y: touches[1].clientY}
				];
				initialDistance = Math.sqrt(
						Math.pow(initialTouches[0].x - initialTouches[1].x, 2) +
						Math.pow(initialTouches[0].y - initialTouches[1].y, 2)
				);
				oldScale = props.scale;
			}
		}

		function scalingHandler(touches: TouchList) {
			if (touches.length === 2 && initialTouches) {
				const currentTouches = [
					{x: touches[0].clientX, y: touches[0].clientY},
					{x: touches[1].clientX, y: touches[1].clientY}
				];
				const currentDistance = Math.sqrt(
						Math.pow(currentTouches[0].x - currentTouches[1].x, 2) +
						Math.pow(currentTouches[0].y - currentTouches[1].y, 2)
				);
				const scale = currentDistance / initialDistance;
				if (isFinite(scale)) {
					emit('update:scale', Math.max(0.1, oldScale * scale));
				}
			}
		}

		function checkEvent(event: string, e?: Event) {
			const item = props.triggerItem;
			const triggerDom = item ? (trackerRef.value as unknown as HTMLElement)?.querySelector(item) : null;
			let result = true;
			// 存在触发元素设置，检查事件的触发对象是否是触发元素
			if (triggerDom) {
				result = result && triggerDom === e?.target;
			}
			return result && props.eventTrigger.includes(event);
		}

		function moving(e: MouseEvent) {
			isClickEvent = null;
			if (checkEvent('drag', e)) {
				ingHandler(e.clientX, e.clientY);
			}
		}

		function touchStart(e: TouchEvent) {
			if (checkEvent('touch', e)) {
				scaleStartHandler(e.touches);
				startHandler(e.touches[0].clientX, e.touches[0].clientY);
				multiple = e.touches.length > 1;
			}
		}

		function touchEnd(e: TouchEvent) {
			if (checkEvent('touch', e)) {
				initialTouches = [];
				initialDistance = 0;
				endHandler(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
			}
		}

		function touchMoving(e: TouchEvent) {
			if (checkEvent('touch', e)) {
				// 双指缩放
				scalingHandler(e.touches);
				// 移动
				ingHandler(e.touches[0].clientX, e.touches[0].clientY);
			}
		}

		function beginSlide(e: PointerEvent) {
			isClickEvent = e;
			if (checkEvent('drag', e)) {
				(trackerRef.value as any)?.setPointerCapture(e.pointerId);
				startHandler(e.clientX, e.clientY);
			}
		}

		function stopSlide(e: PointerEvent) {
			if (isClickEvent) {
				emit('click', isClickEvent);
			}
			(trackerRef.value as any)?.releasePointerCapture(e.pointerId);
			if (checkEvent('drag', e)) {
				endHandler(e.clientX, e.clientY);
			}
		}

		function wheelEnd() {
			endHandler(wheelX, wheelY);
			wheelX = 0;
			wheelY = 0;
		}

		function checkInertial(delta: number, record: number[]) {
			let inertialCount = 0;
			if (record.length > 8) {
				record.shift();
			}
			record.push(delta);
			// 检查记录里的值是不是顺序递减的，如果有3次以上则认为是惯性滚动
			for (let i = 1; i < record.length; i++) {
				if (record[i] === record[i - 1]) {
					continue;
				}
				const front = Math.abs(record[i - 1]);
				const back = Math.abs(record[i]);
				if (front - back === 1 && front > back) {
					inertialCount++;
				}
				else {
					inertialCount = 0;
				}
			}
			return inertialCount >= 3;
		}

		function wheeling(e: WheelEvent) {
			if (checkEvent('wheel')) {
				// 定时器，假定一段时间内滚动结束了则重置计算的数据
				wheelTimer && window.clearTimeout(wheelTimer);
				wheelTimer = window.setTimeout(() => {
					if (!wheelEnding) {
						wheelEnd();
					}
					wheelEnding = false;
					inertialX.splice(0);
					inertialY.splice(0);
				}, 200);
				// 如果在结束中就不再执行直到完全结束
				if (wheelEnding) {
					return;
				}
				// 检查是否是惯性滚动
				wheelEnding = checkInertial(e.deltaX, inertialX) || checkInertial(e.deltaY, inertialY);
				if (wheelEnding) {
					wheelEnd();
					return;
				}

				// 累计滚动距离
				wheelX -= e.deltaX;
				wheelY -= e.deltaY;
				emit('xWheel', {
					dir   : getXDir(wheelX),
					detail: {multiple: false, offset: wheelX}
				});
				emit('yWheel', {
					dir   : getYDir(wheelY),
					detail: {multiple: false, offset: wheelY}
				});
				// 滚动是移动还是缩放
				startHandler(0, 0);
				if (e.ctrlKey || e.metaKey) {
					if (Math.abs(wheelY)) {
						emit('update:scale', Math.max(0.1, props.scale - (wheelY > 0 ? 0.1 : -0.1)));
					}
				}
				else {
					ingHandler(-e.deltaX, -e.deltaY);
				}
			}
		}

		expose({
			$el: trackerRef
		});

		return () => {
			return h(props.tag, {
				ref          : trackerRef,
				onPointerdown: beginSlide,
				onPointerup  : stopSlide,
				onPointermove: moving,
				onTouchstart: touchStart,
				onTouchend  : touchEnd,
				onTouchmove : touchMoving,
				onWheel: wheeling
			}, slots?.default?.())
		}
	}
});