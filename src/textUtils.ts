export function generateStyledHTML(input: string): string {
	// First, replace the escaped newlines (\\n) with actual newlines (\n)
	input = input.replace(/\\n/g, "\n");

	// Split the input into paragraphs based on \n, and apply italics for *text*
	const paragraphs = input
		.split("\n") // Split by newline characters
		.map((paragraph) =>
			paragraph.replace(/\*(.*?)\*/g, '<span class="it">$1</span>') // Apply italics
		)
		.map((paragraph) => `<p>${paragraph}</p>`) // Wrap each in <p> tags
		.join(""); // Join the paragraphs into one string

	// Combine HTML and CSS into one string
	const combinedHTML = `
    <div class="styled-container">
        <style>
            .styled-container {
				font-size: clamp(14px, 12px + 0.75vw, 20px);
                padding: 40px;
                max-width: 620px;
                background: ivory;
                font-family: 'Merriweather', serif;
                line-height: 1.5;
                text-align: justify;
                hyphens: auto;
                text-indent: 1.5em;
            }

            .styled-container p {
                margin-block-start: 0;
                margin-block-end: 0;
            }

            .styled-container .it {
                font-style: italic;
            }
        </style>
        ${paragraphs}
    </div>`;

	return combinedHTML;
}
