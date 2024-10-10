import puppeteer, {
	ScreenshotOptions,
} from "https://deno.land/x/puppeteer_plus@0.24.0/mod.ts";
import { generateStyledHTML } from "./textUtils.ts";

interface AspectRatio {
	width: number;
	height: number;
}
interface ResponseData {
	image: Uint8Array;
	aspectRatio: AspectRatio;
}

export async function generateScreenshot(
	string: string,
	outputPath: string | undefined = undefined,
): Promise<ResponseData> {
	const browser = await puppeteer.launch({
		args: ["--no-sandbox"],
		timeout: 10000,
	});
	const page = await browser.newPage();

	const styledHTML = generateStyledHTML(string).replace(
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

	// Get the element's bounding box to retrieve width and height
	const boundingBox = await element.boundingBox();
	if (!boundingBox) {
		throw new Error("Could not determine bounding box for the element!");
	}
	const aspectRatio = {
		width: boundingBox.width,
		height: boundingBox.height,
	};

	// Capture the screenshot of the element and return the buffer
	const screenshotOptions: ScreenshotOptions = {
		type: "png",
		encoding: "binary",
	};
	if (outputPath) screenshotOptions.path = outputPath;

	const buffer = await element.screenshot(screenshotOptions);
	const image = new Uint8Array(buffer);

	await browser.close();

	return { image, aspectRatio };
}
