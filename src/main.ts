/// <reference lib="dom" />

import { generateLatexElement } from "./latexUtils.ts";

const endpoint = globalThis.env.SHEET_ENDPOINT;
console.log(endpoint);

async function fetchData() {
	try {
		const response = await fetch(endpoint);
		const data = await response.json();
		return data.data;
	} catch (error) {
		console.error("Error fetching data:", error);
		throw error;
	}
}

function updateGradient(chapter: string): void {
	switch (chapter) {
		case "A Game of Thrones":
			document.body.className = "gradient-agot";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#606dbc";
			break;
		case "A Clash of Kings":
			document.body.className = "gradient-acok";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#ffd300";
			break;
		case "A Storm of Swords":
			document.body.className = "gradient-asos";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#028a0f";
			break;
		case "A Feast for Crows":
			document.body.className = "gradient-affc";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#990f02";
			break;
		case "A Dance with Dragons":
			document.body.className = "gradient-adwd";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#f2eddc";
			break;
		default:
			document.body.className = "gradient-agot";
			(document.querySelector(".footer") as HTMLElement).style
				.background = "#606dbc";
			break;
	}
}

async function updatePageContent(data: any[], idx: number): Promise<void> {
	try {
		const hostElement = document.getElementById("latex-content")
			?.shadowRoot as ShadowRoot;
		if (hostElement && hostElement.hasChildNodes()) {
			hostElement.removeChild(hostElement.lastChild!);
		}
		//hostElement.appendChild(await generateLatexElement(data[idx].quote));
		generateLatexElement(data[idx].quote);
	} catch (error) {
		console.error("Error generating LaTeX: ", error);
	}

	chapterField!.firstChild!.nodeValue = `${data[idx].book}, `;
	chapterLink!.textContent = data[idx].chapter;
	chapterLink!.href = data[idx].link;
	updateGradient(data[idx].book);
}

const buttonsContainer = document.querySelector(
	".buttons-container",
) as HTMLElement;
const chapterField = document.getElementById(
	"chapterField",
) as HTMLElement;
const chapterLink = document.getElementById(
	"chapterLink",
) as HTMLAnchorElement;

globalThis.addEventListener("load", async function () {
	const idxOtd = 37;

	const hash = globalThis.location.hash.substring(1);
	let currIdx = parseInt(hash, 10) - 1 || idxOtd;

	try {
		const data = await fetchData();
		const numQuotes = data.length;
		await updatePageContent(data, currIdx);

		buttonsContainer.addEventListener("click", async (event: Event) => {
			const target = event.target as HTMLElement;
			if (target.tagName === "BUTTON") {
				switch (target.id) {
					case "decrementButton":
						currIdx = (currIdx + numQuotes - 1) % numQuotes;
						break;
					case "otdButton":
						currIdx = idxOtd;
						break;
					case "incrementButton":
						currIdx = (currIdx + 1) % numQuotes;
						break;
					default:
						return;
				}
				await updatePageContent(data, currIdx);
				globalThis.location.hash = (currIdx + 1).toString();
			}
		});
	} catch (error) {
		console.error("Error initializing page:", error);
	}
});
