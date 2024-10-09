// deno-lint-ignore no-explicit-any
declare const latexjs: any;

export async function generateLatex(string: string): Promise<string> {
	string = string.replace(/\*(.*?)\*/g, "\\textit{$1}");
	string = string.replace(/\\n/g, "\\par");

	const latexText = `
    \\documentclass{book}
    \\begin{document}
    ${string}
    \\end{document}
    `;

	// Import the latex.js library
	await import("https://cdn.jsdelivr.net/npm/latex.js/dist/latex.js");

	let generator = new latexjs.HtmlGenerator({ hyphenate: true });
	generator = latexjs.parse(latexText, { generator: generator });

	const doc =
		generator.htmlDocument("https://cdn.jsdelivr.net/npm/latex.js/dist/")
			.documentElement.outerHTML;

	return doc;
}

export async function generateLatexElement(string: string): Promise<HTMLElement> {
	let doc = await generateLatex(string);

	const styleTag = `
	<style>
	  #latex-container {
		--paperwidth: 700px;
		background: ivory;
		font-family: "Merriweather", serif;
		font-size: 20px;
		line-height: 1.5;
	  }
	  .body {
		padding: 40px;
	  }
	</style>
	`;

	const headIndex = doc.indexOf("<head>") + 6;
	doc = doc.slice(0, headIndex) + styleTag + doc.slice(headIndex);

	const container = document.createElement("div");
	container.id = "latex-container";
	container.classList.add("page");
	container.innerHTML = doc.trim();
	container.style.setProperty("--paperwidth", "min(90vw, 700px)");

	return container;
}
