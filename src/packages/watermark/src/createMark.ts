import type { TextMark } from './types/watermark';

function textToBase64(text: string, options = {}) {
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d') as CanvasRenderingContext2D;

	// 默认选项
	const {
		      fontSize   = 20,
		      fontFamily = 'Arial',
		      color      = 'grey',
		      bgColor    = 'transparent',
		      padding    = 0,
		      rotate     = 0, // 角度，顺时针
	      } = options as any;

	// 合并选项
	const mergedOptions = {
		fontSize,
		fontFamily,
		color,
		bgColor,
		padding,
		rotate,
	};

	context.font = `${ mergedOptions.fontSize }px ${ mergedOptions.fontFamily }`;

	// 测量文字宽度和高度
	const textMetrics = context.measureText(text);
	const textWidth = textMetrics.width;
	const textHeight = mergedOptions.fontSize; // 简单使用字体大小作为高度

	const rotationRadian = mergedOptions.rotate * Math.PI / 180;
	const cosRotation = Math.cos(rotationRadian);
	const sinRotation = Math.sin(rotationRadian);

	// 计算旋转后文字的边界框
	const rotatedWidth = Math.abs(textWidth * cosRotation) + Math.abs(textHeight * sinRotation);
	const rotatedHeight = Math.abs(textWidth * sinRotation) + Math.abs(textHeight * cosRotation);

	// 计算画布大小，加上边距，使用旋转后的尺寸
	const canvasWidth = rotatedWidth + 2 * mergedOptions.padding;
	const canvasHeight = rotatedHeight + 2 * mergedOptions.padding;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	// 设置背景色
	context.fillStyle = mergedOptions.bgColor;
	context.fillRect(0, 0, canvasWidth, canvasHeight);

	// 重新设置文字样式
	context.font = `${ mergedOptions.fontSize }px ${ mergedOptions.fontFamily }`;
	context.fillStyle = mergedOptions.color;
	context.textAlign = 'center';
	context.textBaseline = 'middle';

	// 设置文字旋转
	context.translate(canvasWidth / 2, canvasHeight / 2); // 移动原点到画布中心
	context.rotate(rotationRadian); // 旋转
	context.fillText(text, 0, 0);

	return canvas.toDataURL('image/png');
}

export const useWatermark = (props: TextMark) => {
	return textToBase64(props.text, {
		rotate  : -45,
		padding : props.padding,
		fontSize: props.size,
		color   : props.color,
		bgColor : props.bgColor
	});
}
