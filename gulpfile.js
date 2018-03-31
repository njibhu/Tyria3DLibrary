'use strict';

//Load version from package.json
var version = require('./package.json').version;

/* Gulp modules and requires */
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var log = require('gulplog');
var uglifyjs = require('uglify-es');
var composer = require('gulp-uglify/composer');
var uglify = composer(uglifyjs, console);
var watch = require('gulp-watch');

gulp.task('T3D', function(){
	// set up the browserify instance on a task basis
	var b = browserify({
		entries: './src/T3DLib.js',
		debug: true,
		standalone: 'T3D'
	});

	//Copy the t3dtools.js worker file
	gulp.src('tools/t3dtools.js/t3dworker.js').pipe(gulp.dest('build'));

	return b.bundle()
		.pipe(source(`T3D-${version}.js`))
		.pipe(buffer())
		.pipe(sourcemaps.init({loadMaps: true}))
			// Add transformation tasks to the pipeline here.
			.pipe(uglify())
			.on('error', log.error)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('build'))
		.pipe(gulp.dest('./examples/Tyria2D/lib'))
		.pipe(gulp.dest('./examples/ModelRenderer/lib'))
		.pipe(gulp.dest('./examples/MapRenderer/lib'))
        .pipe(gulp.dest('./examples/Archive/lib'));
});

gulp.task('watch', function() {
	gulp.watch(['src/**/*.js'], gulp.series('T3D'));
});
  
gulp.task('default', gulp.series('T3D'));
