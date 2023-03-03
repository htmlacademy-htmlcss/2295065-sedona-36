import gulp from "gulp";
import plumber from "gulp-plumber";
import postcss from "gulp-postcss";
import csso from "postcss-csso";
import rename from "gulp-rename";
import svgSprite from "gulp-svg-sprite";
import svgo from "gulp-svgmin";
import { htmlValidator } from "gulp-w3c-html-validator";
import browser from "browser-sync";
import presetENV from "postcss-preset-env";
import atImport from "postcss-import";
import calc from "postcss-calc";

const server = browser.create();
const { src, dest, watch, series, parallel } = gulp;

const Path = {
	STYLES: ["styles/**/*.css", "!styles/**/*.min.css"],
	ICONS: "icons/**/*.svg",
};

export function processStyles() {
	return src("./styles/styles.css", { sourcemaps: true })
		.pipe(plumber())
		.pipe(
			postcss([
				atImport(),
				presetENV(),
				csso(),
				calc({
					precision: 3,
				}),
			]).on("error", console.error)
		)
		.pipe(
			rename({
				extname: ".min.css",
			})
		)
		.pipe(dest("./styles/", { sourcemaps: "." }))
		.pipe(server.stream());
}

export function createStack() {
	return src(Path.ICONS)
	.pipe(svgo({
		floatPrecision: 2,
	}))
	.pipe(svgSprite({
		mode: {
			view: true,
			symbol: true
		}
	}))
	.pipe(rename("stack.svg"))
	.pipe(dest("images/"));
}

export function validateMarkup() {
	return src("./*.html")
		.pipe(htmlValidator.analyzer())
		.pipe(htmlValidator.reporter({ throwErrors: true }));
}

export function startServer(done) {
	server.init({
		server: {
			baseDir: "./",
		},
		cors: true,
		notify: false,
		ui: false,
		watch: true,
	});
	done();
}

function reloadServer() {
	return server.reload();
}

function watchFiles() {
	watch(Path.STYLES, processStyles);
	watch(Path.ICONS, series(createStack, reloadServer));
	watch("./**/*.{html,js,jpg,png,svg,ico,webmanifest}", reloadServer);
}

export const compileProject = parallel(processStyles, createStack);
export const runDev = series(compileProject, startServer, watchFiles);
