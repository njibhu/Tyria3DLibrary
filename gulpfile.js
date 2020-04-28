//Load version from package.json
const version = require("./package.json").version;

const gulp = require("gulp");
const browserify = require("gulp-browserify");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");

function build(input, outputName, { minify = false } = {}) {
  const g = gulp.src(input).pipe(browserify());
  if (minify) {
    g.pipe(uglify());
  } else {
    g.pipe(sourcemaps.init({ loadMaps: true })).pipe(sourcemaps.write("./"));
  }
  return g.pipe(rename(outputName)).pipe(gulp.dest("./build"));
}

gulp.task("T3D", () =>
  Promise.all([
    build("./src/T3DLib.js", `T3D-${version}.js`),
    build("./src/T3DLib.js", `T3D-${version}.min.js`, { minify: true }),
  ])
);

const formatsPath = "./src/format/definition/AllFormats.js";

gulp.task("formats", () =>
  Promise.all([
    build(formatsPath, `T3D-${version}.Formats.js`),
    build(formatsPath, `T3D-${version}.Formats.min.js`, { minify: true }),
  ])
);

gulp.task("default", gulp.series(["T3D", "formats"]));
