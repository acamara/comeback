var gulp = require('gulp'),
fs = require('fs'), 
zip = require('gulp-zip'),
watch = require('gulp-watch'),
jshint = require('gulp-jshint'),
gp_concat = require('gulp-concat'),
gp_uglify = require('gulp-uglify'),
imageop = require('gulp-image-optimization'),
minifyHTML = require('gulp-minify-html'),
rename = require('gulp-rename'),
runSequence = require('run-sequence');

// All paths for JS, HTML and Image files
var zip_files = ['minify/game.js', 'minify/index.html','assets/*.png', 'style.css'], //Files to be added to the zip folder use "<directory goes here>/*" for all files inside the directory
    js_files = ['game.js'], //All JS files to be combined and minified
    img_files = ['assets/*.png','assets/*.jpg','assets/*.jpeg'];

// Zip up the JS/HTML required for the game
gulp.task('zip', () => {
	gulp.src(zip_files, {base: './'})
    .pipe(zip('game.zip'))
    .pipe(gulp.dest('./'));
});

// Minify the HTML
gulp.task('build-html', function() { 
  return gulp.src('./index.html')
    .pipe(minifyHTML())
    .pipe(rename('index.html'))
    .pipe(gulp.dest('./minify/'));
});

// Build the JS and minify
gulp.task('build-js', function() {
    return gulp.src(js_files)
        .pipe(jshint())
        .pipe(jshint.reporter('default')) //Report on errors found by jshint
        .pipe(gp_uglify()) //Minify JS
        .pipe(gp_concat('game.js')) //Merge all the JS files into one game.js file 
        .pipe(gulp.dest('./minify/'));
});

gulp.task('report', function() {
  var stat = fs.statSync('game.zip'),
      limit = 1024 * 13,
      size = stat.size,
      remaining = limit - size,
      percentage = (remaining / limit) * 100;

  percentage = Math.round(percentage * 100) / 100

  console.log('\n\n-------------');
  console.log('BYTES USED: ' + stat.size);
  console.log('BYTES REMAINING: ' + remaining);
  console.log(percentage +'%');
  console.log('-------------\n\n');
});