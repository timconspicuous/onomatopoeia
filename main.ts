import { generateScreenshot } from "./utils/astralUtils.ts";
import { createBskyPost } from "./utils/blueskyUtils.ts";
import { load } from "jsr:@std/dotenv";

await load({ export: true });

const endpoint = Deno.env.get("SHEET_ENDPOINT");
if (!endpoint) {
	throw new Error("SHEET_ENDPOINT environment variable is not set");
}

const response = await fetch(endpoint);
const { data } = await response.json();

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
	// Open KV and get last index
	// @ts-ignore Deno.openKv is unstable, run with --unstable-kv flag
	const kv = await Deno.openKv(
		// `https://api.deno.com/databases/${
		// 	Deno.env.get("DENO_KV_DATABASE_ID")
		// }/connect`,
	);
	const result = await kv.get<number>(["lastIndex"]);
	let index = result.value ?? 0;

	// Generate screenshot and upload it to Bluesky
	const { image, aspectRatio } = await generateScreenshot(
		data[index].quote, // "image.png"
	);
	await createBskyPost(data[0], image, aspectRatio);
	console.log(`Cron: posted quote of index ${index} to Bluesky.`);

	// Update last index in KV
	index = (index + 1) % data.length;
	await kv.set(["lastIndex"], index);
});
