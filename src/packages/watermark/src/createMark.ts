import type { TextMark } from './types/watermark';

function textToBase64(texts: string[], options = {}) {
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
	const sizes = texts.map(item => {
		const {width, height} = getSize(context, item, mergedOptions);
		return [width, height];
	});
	let textWidth = sizes[0][0];
	let textHeight = sizes[0][1];
	if (sizes.length > 1) {
		const maxWidth = Math.max(...sizes.map(item => item[0]));
		const maxHeight = Math.max(...sizes.map(item => item[1]));
		textWidth = maxWidth;
		textHeight = maxHeight;
	}

	setStage(canvas, context, {...mergedOptions, textWidth, textHeight});

	texts.forEach((item, index) => {
		context.fillText(item, 0, index * textHeight - Math.floor(sizes.length / 2) * textHeight);
	});

	return canvas.toDataURL('image/png');
}

function setStage(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, options: any) {

	const rotationRadian = options.rotate * Math.PI / 180;
	const cosRotation = Math.cos(rotationRadian);
	const sinRotation = Math.sin(rotationRadian);

	// 计算旋转后文字的边界框
	const rotatedWidth = Math.abs(options.textWidth * cosRotation) + Math.abs(options.textHeight * sinRotation);
	const rotatedHeight = Math.abs(options.textWidth * sinRotation) + Math.abs(options.textHeight * cosRotation);

	// 计算画布大小，加上边距，使用旋转后的尺寸
	const canvasWidth = rotatedWidth + 2 * options.padding;
	const canvasHeight = rotatedHeight + 2 * options.padding;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	// 设置背景色
	ctx.fillStyle = options.bgColor;
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);

	// 重新设置文字样式
	ctx.font = `${ options.fontSize }px ${ options.fontFamily }`;
	ctx.fillStyle = options.color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// 设置文字旋转
	ctx.translate(canvasWidth / 2, canvasHeight / 2); // 移动原点到画布中心
	ctx.rotate(rotationRadian); // 旋转
}

function getSize(ctx: CanvasRenderingContext2D, text: string, options: any) {
	const textMetrics = ctx.measureText(text);
	const width = textMetrics.width;
	const height = options.fontSize; // 简单使用字体大小作为高度
	return {
		width,
		height
	}
}

export const useWatermark = (props: TextMark) => {
	const texts = props.text instanceof Array ? props.text : [props.text];
	return textToBase64(texts, {
		rotate  : -45,
		padding : props.padding,
		fontSize: props.size,
		color   : props.color,
		bgColor : props.bgColor
	});
}
