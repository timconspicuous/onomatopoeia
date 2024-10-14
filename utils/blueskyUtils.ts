import { CredentialManager, XRPC } from "npm:@atcute/client@^2.0.3";
import RichtextBuilder from "npm:@atcute/bluesky-richtext-builder";
import { load } from "jsr:@std/dotenv";

await load({ export: true });

export async function createBskyPost(
    quote: Quote,
    image: Uint8Array,
    aspectRatio: { height: number; width: number },
) {
    const manager = new CredentialManager({ service: "https://bsky.social" });
    const rpc = new XRPC({ handler: manager });

    await manager.login({
        identifier: Deno.env.get("BLUESKY_USERNAME")!,
        password: Deno.env.get("BLUESKY_PASSWORD")!,
    });

    const { text, facets } = new RichtextBuilder()
        .addText(`${quote.book}, `)
        .addLink(`${quote.chapter}`, quote.link)
        .addText(`    `)
        .addTag(`asoiaf`);

    const record = { // Type?
        createdAt: new Date().toISOString(),
        langs: ["en-US"],
        text: text,
        facets: facets,
        embed: {
            $type: "app.bsky.embed.images",
            images: [
                {
                    alt: quote.quote.replace(/\\n/g, "\n"),
                    image,
                    aspectRatio: aspectRatio,
                },
            ],
        },
    };

    try {
        const { data } = await rpc.request(
            {
                type: "post",
                nsid: "com.atproto.repo.uploadBlob",
                data: image,
                headers: {
                    "Content-Type": "image/png",
                },
            },
        );
        record.embed.images[0].image = data.blob;
    } catch (error) {
        console.error("Error uploading file: ", error);
        throw error;
    }

    try {
        await rpc.call("com.atproto.repo.createRecord", {
            data: {
                repo: manager.session!.did,
                collection: "app.bsky.feed.post",
                record: record,
            },
        });
    } catch (error) {
        console.error("Error submitting post: ", error);
        throw error;
    }
}
