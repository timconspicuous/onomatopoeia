# A Bluesky quote bot built on Deno

This bot will fetch a list of JSON-ified quotes from an endpoint or file (in my case a Google Sheet) and run a Cron job in which it will generate the stylized HTML of a quote with some typesetting and then screenshot it using Puppeteer so the screenshot can be uploaded to Bluesky with alt-text.
