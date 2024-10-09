//import { generateLatexImage } from './public/latexUtils.ts';
import { load } from "jsr:@std/dotenv";

await load({ export: true });

const endpoint = Deno.env.get("SHEET_ENDPOINT");
if (!endpoint) {
	throw new Error("SHEET_ENDPOINT environment variable is not set");
}

const response = await fetch(endpoint);
const data = await response.json();

// Deno.cron("sample cron", { hour: { every: 6 } }, () => {
// 	console.log("cron job executed");
// });

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
