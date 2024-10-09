//import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
//import katex from "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
//import katexCSS from "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

// deno-lint-ignore no-explicit-any
declare const katex: any;

export function generateLatexElement(string: string) {
	string = string.replace(/\*(.*?)\*/g, "\\textit{$1}");
	string = string.replace(/\\n/g, "\\par");
	const latexText = `
    \\documentclass{book}
    \\begin{document}
    ${string}
    \\end{document}
    `;

	const htmlOutput = katex.renderToString(latexText, {
		throwOnError: false, // Prevent errors from breaking your app
	});

	console.log(htmlOutput);
	return htmlOutput;
}

export async function generateLatexImage(string: string) {
}
