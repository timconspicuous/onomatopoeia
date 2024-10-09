import * as esbuild from "https://deno.land/x/esbuild@v0.24.0/mod.js";

await esbuild.build({
	entryPoints: ["./src/app.ts"],
	bundle: true,
	outfile: "./public/bundle.js",
	format: "esm",
	target: "es2020",
});

esbuild.stop();
