import { launch } from "jsr:@astral/astral";
import { decode, Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { generateStyledHTML } from "./textUtils.ts";

interface AspectRatio {
	width: number;
	height: number;
}
interface ResponseData {
	image: Uint8Array;
	aspectRatio: AspectRatio;
}

async function addPaddingToImage(
	imageData: Uint8Array,
	padding: number,
): Promise<{ paddedImage: Uint8Array; newAspectRatio: AspectRatio }> {
	// Decode the original image
	const decodedImage = await decode(imageData);
	if (!(decodedImage instanceof Image)) {
		throw new Error("Decoded image is not a static image");
	}
	const originalImage = decodedImage;

	// Create a new image with padding
	const paddedWidth = originalImage.width + (padding * 2);
	const paddedHeight = originalImage.height + (padding * 2);
	const newImage = new Image(paddedWidth, paddedHeight);

	// Fill with ivory color (255, 255, 240)
	newImage.fill(0xFFFFF0FF);

	// Composite the original image onto the new one with padding offset
	newImage.composite(originalImage, padding, padding);

	// Encode the result back to PNG
	const paddedImage = await newImage.encode();

	return {
		paddedImage,
		newAspectRatio: {
			width: paddedWidth,
			height: paddedHeight,
		},
	};
}

export async function generateScreenshot(
	string: string,
	outputPath: string | undefined = undefined,
): Promise<ResponseData> {
	const browser = await launch({
		args: ["--no-sandbox"],
	});

	const page = await browser.newPage();

	const styledHTML = generateStyledHTML(string)
		.replace(/padding:\s*40px;/g, "padding: 0;")
		.replace(
			/font-size:\s*clamp\(14px,\s*12px\s*\+\s*0.75vw,\s*20px\);/,
			"font-size: 20px;",
		);

	await page.setContent(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HTML Screenshot</title>
            <link href="https://fonts.googleapis.com/css2?family=Merriweather&display=swap" rel="stylesheet" />
            <style>
                body {
                    margin: 0;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            ${styledHTML}
        </body>
        </html>
    `);

	await page.waitForSelector(".styled-container");

	// Select the element
	const element = await page.$(".styled-container");
	if (!element) {
		throw new Error("Element not found!");
	}

	const screenshot = await element.screenshot();

	await browser.close();

	// Add padding in post-processing using ImageScript
	const { paddedImage, newAspectRatio } = await addPaddingToImage(
		screenshot,
		40,
	);
	if (outputPath) Deno.writeFileSync(outputPath, paddedImage);

	return { image: paddedImage, aspectRatio: newAspectRatio };
}
