import { generateScreenshot } from "./utils/puppeteerUtils.ts";
import { createBskyPost } from "./utils/blueskyUtils.ts";

import { load } from "jsr:@std/dotenv";

await load({ export: true });

const endpoint = Deno.env.get("SHEET_ENDPOINT");
if (!endpoint) {
	throw new Error("SHEET_ENDPOINT environment variable is not set");
}

const response = await fetch(endpoint);
const { data } = await response.json();

async function getLastIndex(): Promise<number> {
	try {
		const content = await Deno.readTextFile("lastIndex.txt");
		return parseInt(content.trim(), 10);
	} catch (error) {
		if (error instanceof Deno.errors.NotFound) {
			await Deno.writeTextFile("lastIndex.txt", "0");
			return 0;
		}
		throw error;
	}
}

async function updateLastIndex(index: number): Promise<void> {
	await Deno.writeTextFile("lastIndex.txt", index.toString());
}

const handler = async (req: Request): Promise<Response> => {
	const url = new URL(req.url);
	let filePath = "./public" + url.pathname;

	// If the path ends with '/', serve index.html
	if (filePath.endsWith("/")) {
		filePath += "index.html";
	}

	try {
		// Replace the placeholder with environment variable
		if (filePath.endsWith("index.html")) {
			let htmlContent = await Deno.readTextFile(filePath);

			htmlContent = htmlContent.replace("__SHEET_ENDPOINT__", endpoint);

			return new Response(htmlContent, {
				headers: { "content-type": "text/html" },
			});
		}

		// Serve static files (CSS, JS, etc.)
		const file = await Deno.readFile(filePath);
		const contentType = getContentType(filePath);
		return new Response(file, { headers: { "content-type": contentType } });
	} catch {
		return new Response("404 Not Found", { status: 404 });
	}
};

function getContentType(filePath: string): string {
	if (filePath.endsWith(".html")) return "text/html";
	if (filePath.endsWith(".css")) return "text/css";
	if (filePath.endsWith(".js")) return "text/javascript";
	return "application/octet-stream";
}

Deno.serve(handler);

// @ts-ignore Deno.cron is unstable, run with --unstable-cron flag
Deno.cron("Onomatopoeia", { hour: { every: 6 } }, async () => {
	const index = await getLastIndex();
	const { image, aspectRatio } = await generateScreenshot(
		data[index].quote,
		"test.png",
	);
	await createBskyPost(data[0], image, aspectRatio);
	await updateLastIndex(index + 1);

	console.log(`Cron: posted quote of index ${index} to Bluesky.`);
});
