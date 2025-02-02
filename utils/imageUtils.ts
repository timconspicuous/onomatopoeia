import tex from "npm:tex-linebreak";
import enUsPatterns from "npm:hyphenation.en-us";
import * as fontkit from "npm:fontkit";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { Buffer } from "node:buffer";

const lineWidth = 620;
const defaultFontSize = 20;
const indentSize = 30;
const padding = 40;

interface Item {
	text: string;
	posX: number;
	line: number;
	isItalic?: boolean;
}

type Font = {
	url: string;
	family: string;
	weight: string;
	data?: ArrayBuffer;
};

const fonts: Record<string, Font> = {
	normal: {
		url: "https://github.com/google/fonts/raw/refs/heads/main/ofl/merriweather/Merriweather%5Bopsz,wdth,wght%5D.ttf",
		family: "Merriweather",
		weight: "400",
	},
	italic: {
		url: "https://github.com/google/fonts/raw/refs/heads/main/ofl/merriweather/Merriweather-Italic%5Bopsz,wdth,wght%5D.ttf",
		family: "Merriweather",
		weight: "400",
	},
};

await Promise.all(
	Object.entries(fonts).map(async ([_key, font]) => {
		const response = await fetch(font.url);
		const fontData = await response.arrayBuffer();
		font.data = fontData;
	}),
);

// Parse font
const fontData: ArrayBuffer = fonts.normal.data!;
const font = fontkit.create(Buffer.from(fontData));

function formatText(quote: string) {
	const paragraphs = quote.split("\\n");
	const totalItems: tex.TextInputItem[][] = [];
	const totalPositionedItems: tex.PositionedItem[][] = [];

	const _hyphenate = tex.createHyphenator(enUsPatterns);

	let lineOffset = 0;
	let itemOffset = 0;

	for (const paragraph of paragraphs) {
		const items = tex.layoutItemsFromString(
			paragraph.trim(),
			measureText,
			// hyphenate, // disabled for now
		);
		totalItems.push(items);

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

		totalPositionedItems.push(adjustedPositionedItems);

		lineOffset += positionedItems[positionedItems.length - 1].line + 1;
		itemOffset += items.length;
	}

	const items: Item[] = [];

	let noPenalty = false;
	for (const positionedItem of totalPositionedItems.flat()) {
		const { xOffset, line, item } = positionedItem;
		const box = totalItems.flat()[item];
		let text: string;
		let penalty = 0;

		// Penalty calculation, needs some work, unused for now
		if (!("text" in box)) {
			text = "-";
			penalty += 3;
			noPenalty = true;
		} else {
			text = box.text;
		}
		if (
			item > 0 && totalItems.flat()[item - 1].type === "penalty" &&
			noPenalty === false
		) {
			penalty += 3;
			noPenalty = false;
		}

		items.push({
			text: text,
			posX: xOffset, // + penalty,
			line: line,
		});
	}
	const styledItems = getItalics(items);

	return styledItems;
}

function measureText(
	text: string,
) {
	// Get width (scale based on fontSize)
	const scale = defaultFontSize / font.unitsPerEm;
	const width = font.layout(
		text.replace(/\*/g, "")
			.replace(" ", "  "), // hack, because single space made it look smushed
	).advanceWidth * scale;

	return width;
}

function getItalics(items: Item[]) {
	let isItalic = false;
	const styledItems: Item[] = [];

	for (const item of items) {
		const parts = item.text.split("*");
		let currentX = item.posX;
		parts.forEach((part, index) => {
			if (part.length > 0) {
				styledItems.push({
					text: part,
					posX: currentX,
					line: item.line,
					isItalic: isItalic,
				});
				currentX += measureText(part);
			}

			// Toggle italics if we're at an asterisk boundary
			if (index < parts.length - 1) {
				isItalic = !isItalic;
			}
		});
	}

	return styledItems;
}

export async function generateImage(quote: string) {
	const items = formatText(quote);

	const nLines = items[items.length - 1].line;
	const width = lineWidth + padding * 2;
	const height = nLines * defaultFontSize * 1.5 + padding * 2.5;

	const image = new Image(width, height);
	image.fill(0xFFFFF0FF);

	for (const item of items) {
		const { text, posX, line } = item;

		const font = item.isItalic
			? new Uint8Array(fonts.italic.data!)
			: new Uint8Array(fonts.normal.data!);

		const textImage = Image.renderText(
			font,
			defaultFontSize,
			text,
			0x000000FF,
		);

		image.composite(
			textImage,
			posX + 40,
			defaultFontSize * 1.5 * line + 40,
		);
	}

	return {
		image: await image.encode(),
		aspectRatio: { width: width, height: height },
	};
}
