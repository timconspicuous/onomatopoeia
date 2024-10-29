import tex from "npm:tex-linebreak";
import {
	Canvas,
	CanvasRenderingContext2D,
	createCanvas,
	Fonts,
	SvgCanvas,
	SvgRenderingContext2D,
} from "jsr:@gfx/canvas@0.5.7";

// Font registering
// Fetch both regular and italic Merriweather font URLs from Google Fonts
const fontUrls = [
	"https://fonts.googleapis.com/css2?family=Merriweather:wght@400&display=swap", // Regular
	"https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@1,400&display=swap", // Italic
];

const fontDataArray = await Promise.all(
	fontUrls.map(async (url) => {
		const fontResponse = await fetch(url);
		const cssText = await fontResponse.text();
		const fontMatch = cssText.match(/url\(([^)]+)\)/);
		if (!fontMatch) throw new Error("Failed to load font URL");
		const fontFileUrl = fontMatch[1];
		return fetch(fontFileUrl).then((res) => res.arrayBuffer());
	}),
);

const lineWidth = 620;
const fontSize = 20;
const fontFamily = "Merriweather";
const indentSize = 30;
const padding = 40;

const fontRegularBuffer = new Uint8Array(fontDataArray[0]);
const fontItalicBuffer = new Uint8Array(fontDataArray[0]);

// Register both regular and italic fonts, set common family name
Fonts.register(fontRegularBuffer, "Merriweather-Regular");
Fonts.register(fontItalicBuffer, "Merriweather-Italic");
Fonts.setAlias("Merriweather", "Merriweather-Regular");
Fonts.setAlias("Merriweather", "Merriweather-Italic");

function generateCanvas(
	createLocalCanvas: Function,
	quote: string,
) {
	const paragraphs = quote.split("\\n");
	const rawTotalItems: tex.TextInputItem[][] = [];
	const rawTotalPositionedItems: tex.PositionedItem[][] = [];

	let lineOffset = 0;
	let itemOffset = 0;

	for (const paragraph of paragraphs) {
		const items = tex.layoutItemsFromString(
			paragraph.trim(),
			measureText,
		);
		rawTotalItems.push(items);

		// Create an array of line widths where the first line is indented
		const lineWidths = items.map((_, index) =>
			index === 0 ? lineWidth - indentSize : lineWidth
		);

		// Find where to insert line-breaks using the varying line widths
		const breakpoints = tex.breakLines(items, lineWidths);

		// Compute positions with indentation for the first line
		const positionedItems = tex.positionItems(
			items,
			lineWidths,
			breakpoints,
		);

		// Add the indent to the first line's xOffset
		const adjustedPositionedItems = positionedItems.map((
			element,
			_idx,
		) => ({
			...element,
			item: element.item + itemOffset,
			line: element.line + lineOffset,
			xOffset: element.line === 0
				? element.xOffset + indentSize
				: element.xOffset,
		}));

		rawTotalPositionedItems.push(adjustedPositionedItems);

		lineOffset += positionedItems[positionedItems.length - 1].line + 1;
		itemOffset += items.length;
	}

	const totalItems = rawTotalItems.flat();
	const totalPositionedItems = rawTotalPositionedItems.flat();

	const nLines = totalPositionedItems[totalPositionedItems.length - 1].line;
	const width = lineWidth + padding * 2;
	const height = nLines * fontSize * 1.5 + padding * 2.5;

	const { canvas, ctx } = createLocalCanvas(width, height);

	ctx.fillStyle = "ivory";
	ctx.fillRect(0, 0, width, height);

	let isItalic = false;
	for (const positionedItem of totalPositionedItems) {
		const { item, line, xOffset } = positionedItem;
		const currentItem = totalItems[item];

		if (!("text" in currentItem)) {
			console.error(
				`Error: totalItems[${item}] does not have a 'text' property.`,
			);
			continue; // Skip this item if it doesn't have 'text'
		}
		renderText(
			ctx,
			currentItem.text,
			xOffset + 40,
			fontSize * 1.5 * line + 40,
			fontSize,
			fontFamily,
		);
	}

	return canvas;

	function measureText(
		textToMeasure: string,
	): number {
		const tempCanvas = new SvgCanvas(1, 1);
		const ctx = tempCanvas.getContext();
		ctx.font = `${fontSize}px ${fontFamily}`;
		return ctx.measureText(textToMeasure.replace(/\*/g, "")).width;
	}

	function drawText(
		ctx: CanvasRenderingContext2D | SvgRenderingContext2D,
		text: string,
		x: number,
		y: number,
		fontSize: number,
		fontFamily: string,
	) {
		const fontStyle = isItalic ? "italic" : "normal";
		ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
		ctx.fillStyle = "black";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText(text, x, y);
	}

	// Helper function to handle italicization
	function renderText(
		ctx: CanvasRenderingContext2D | SvgRenderingContext2D,
		substring: string,
		x: number,
		y: number,
		fontSize: number,
		fontFamily: string,
	) {
		// Split the substring by asterisks
		const parts = substring.split("*");
		let currentX = x;

		// Loop through parts and render each separately
		parts.forEach((part, index) => {
			if (part.length > 0) {
				// Draw the current part
				drawText(ctx, part, currentX, y, fontSize, fontFamily);
				// Increment x-coordinate for the next segment
				const partWidth = ctx.measureText(part).width;
				currentX += partWidth;
			}

			// Toggle italics if we're at an asterisk boundary
			if (index < parts.length - 1) {
				isItalic = !isItalic;
			}
		});
	}
}

// SVG wrapper
export function generateSvg(quote: string, path: string | null = null) {
	const createLocalCanvas = (width: number, height: number) => {
		const canvas = new SvgCanvas(width, height);
		const ctx = canvas.getContext();

		return { canvas, ctx };
	};

	const svgCanvas: SvgCanvas = generateCanvas(createLocalCanvas, quote);
	svgCanvas.complete();
	if (path) {
		svgCanvas.save(path);
	}
	return svgCanvas.encode();
}

// PNG wrapper
export function generatePng(quote: string, path: string | null = null) {
	const createLocalCanvas = (width: number, height: number) => {
		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext("2d");

		return { canvas, ctx };
	};

	const pngCanvas: Canvas = generateCanvas(createLocalCanvas, quote);
	const aspectRatio = { width: pngCanvas.width, height: pngCanvas.height };
	if (path) {
		pngCanvas.save(path);
	}
	return { image: pngCanvas.encode("png"), aspectRatio};
}
