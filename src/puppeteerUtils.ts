import puppeteer, {
    ScreenshotOptions,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { generateLatex } from "./latexUtils.ts";

export async function generateLatexImage(
    string: string,
    outputPath: string | undefined = undefined,
) {
    let doc = await generateLatex(string);
    let bodyIndex = doc.indexOf("<body>") + 6;
    doc = doc.slice(0, bodyIndex) +
        '<div id="latex-container" style="width: 700px">' +
        doc.slice(bodyIndex);
    bodyIndex = doc.indexOf("</body>");
    doc = doc.slice(0, bodyIndex) + "</div>" + doc.slice(bodyIndex);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(doc);
    await page.waitForSelector("#latex-container");
    const element = await page.$("#latex-container");
    const body = await page.$(".body");
    //await setTimeout(2000);
    const boundingBox = await body!.boundingBox();
    const aspectRatio = {
        width: Math.ceil(boundingBox!.width),
        height: Math.ceil(boundingBox!.height),
        x: 0,
        y: 0,
    };
    await page.setViewport(aspectRatio);
    const screenshotOptions: ScreenshotOptions = {
        clip: aspectRatio,
        type: "png",
        encoding: "binary",
        path: outputPath ?? "",
    };
    if (outputPath) {
        screenshotOptions.path = outputPath;
    }
    const uint8arr = await element!.screenshot(screenshotOptions);
    await browser.close();
    return { uint8arr, aspectRatio };
}

const quote = "“First lesson,” Jon said. “Stick them with the pointy end.” \n Arya gave him a *whap* on the arm with the flat of her blade. The blow stung, but Jon found himself grinning like an idiot. “I know which end to use,” Arya said.";
await generateLatexImage(quote, "image.png");