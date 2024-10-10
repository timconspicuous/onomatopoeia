declare global {
    // Declare your global `env` variable
    // deno-lint-ignore no-var
    var env: {
        SHEET_ENDPOINT: string;
    };

    // Declare the global Quote interface
    interface Quote {
        quote: string;
        book: string;
        chapter: string;
        link: string;
    }
}

export {};