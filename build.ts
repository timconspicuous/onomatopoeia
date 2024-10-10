import * as esbuild from "https://deno.land/x/esbuild@v0.20.0/mod.js";
import { denoLoaderPlugin, denoResolverPlugin } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";

await esbuild.build({
	plugins: [
		denoResolverPlugin(),  // First, resolve modules
		denoLoaderPlugin()     // Then, load them
	  ],
	entryPoints: ["./src/app.ts"],
	outfile: "./public/bundle.js",
	bundle: true,
	format: "esm",
});

esbuild.stop();
