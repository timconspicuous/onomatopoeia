import { CredentialManager, XRPC } from "npm:@atcute/client@^2.0.3";
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

    const record = { // Type?
        createdAt: new Date().toISOString(),
        langs: ["en-US"],
        text: `${quote.book}, ${quote.chapter}    #asoiaf`,
        facets: getFacets(quote),
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

function getFacets(quote: Quote) {
    let text = `${quote.book}, ${quote.chapter}`;

    const hashtag = "    #asoiaf";
    text += hashtag;

    const facets = [
        {
            index: {
                byteStart: text.length - quote.chapter.length - hashtag.length,
                byteEnd: text.length - hashtag.length,
            },
            features: [{
                $type: "app.bsky.richtext.facet#link",
                uri: quote.link,
            }],
        },
        {
            index: {
                byteStart: text.length - hashtag.length + 4, // Skipping the extra spaces before the tag
                byteEnd: text.length,
            },
            features: [{
                $type: "app.bsky.richtext.facet#tag",
                tag: "asoiaf",
            }],
        },
    ];

    return facets;
}
