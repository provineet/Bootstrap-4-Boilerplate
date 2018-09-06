// loading config file
var config = require( './gulpconfig.json' );
var paths = config.paths;

// Defining dependencies
var gulp = require( 'gulp' );
var plumber = require( 'gulp-plumber' );
var sass = require( 'gulp-sass' );
var watch = require( 'gulp-watch' );
var rename = require( 'gulp-rename' );
var concat = require( 'gulp-concat' );
var uglify = require( 'gulp-uglify' );
var imagemin = require( 'gulp-imagemin' );
var ignore = require( 'gulp-ignore' );
var rimraf = require( 'gulp-rimraf' );
var clone = require( 'gulp-clone' );
var sourcemaps = require( 'gulp-sourcemaps' );
var browserSync = require( 'browser-sync' ).create();
var del = require( 'del' );
var cleanCSS = require( 'gulp-clean-css' );
var gulpSequence = require( 'gulp-sequence' );
var replace = require( 'gulp-replace' );
var autoprefixer = require( 'gulp-autoprefixer' );
var babel = require( 'gulp-babel' );

gulp.task( 'watch-scss', ['browser-sync'], function() {
    gulp.watch( paths.scss + '/**/*.scss', ['scss-for-dev'] );
});

// Run: gulp sass
// Compiles SCSS files in CSS
gulp.task( 'sass', function() {
    var stream = gulp.src( paths.scss + '/*.scss' )
        .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err );
                this.emit( 'end' );
            }
        } ) )
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe( sass( { errLogToConsole: true } ) )
        .pipe( autoprefixer( 'last 2 versions' ) )
        .pipe(sourcemaps.write(undefined, { sourceRoot: null }))
        .pipe( gulp.dest( paths.css ) )
    return stream;
});

// Run: gulp watch-assets
// Watches for changes in ./src/scss, ./src/js, ./js/ & ./src/images folders and run tasks to compile & Minify
gulp.task( 'watch-assets', function() {
    gulp.watch( paths.scss + '/**/*.scss', ['styles'] );
    gulp.watch( [paths.dev + '/js/**/*.js', 'js/**/*.js', '!js/style.js', '!js/style.min.js'], ['scripts'] );

    //running imgmin-complete task on ./src/images folder contents change. imgmin-complete task makes sure that browserSync reloads only after all ./src/images folder contents are optimized
    gulp.watch( paths.imgsrc + '/**', ['imgmin-complete'] );
});

//makes sure imagemin task completes before firing browserSync
gulp.task( 'imgmin-complete', ['imagemin'], function( ) {
  browserSync.reload();
});

// Run: gulp imagemin
// Running image optimizing task
gulp.task( 'imagemin', function() {
    gulp.src( paths.imgsrc + '/**' )
    .pipe( imagemin() )
    .pipe( gulp.dest( paths.img ) );
});

// Minifies CSS files within ./assets/css folder
gulp.task( 'minifycss', function() {
  return gulp.src( [ paths.css + '/*.css', '!' + paths.css + '/*.min.css'] )
  .pipe( sourcemaps.init( { loadMaps: true } ) )
    .pipe( cleanCSS( { compatibility: '*' } ) )
    .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err ) ;
                this.emit( 'end' );
            }
        } ) )
    .pipe( rename( { suffix: '.min' } ) )
     .pipe( sourcemaps.write( './' ) )
    .pipe( gulp.dest( paths.css ) );
});

// Minifies JS files within ./assets/js folder
gulp.task( 'minifyjs', function() {
  return gulp.src( [ paths.js + '/*.js', '!' + paths.js + '/*.min.js'] )
    .pipe( plumber( {
            errorHandler: function( err ) {
                console.log( err ) ;
                this.emit( 'end' );
            }
        } ) )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( uglify( { output: { comments: 'some' } } ) )
    .pipe( gulp.dest( paths.js ) );
});

// runs sass and minifycss tasks in sequence
gulp.task( 'styles', function( callback ) {
    gulpSequence( 'sass', 'minifycss' )( callback );
} );

// Run: gulp browser-sync
// Starts browser-sync task for starting the server.
gulp.task( 'browser-sync', function() {
    browserSync.init( config.browserSyncWatchFiles, config.browserSyncOptions );
} );

// Run: gulp watch
// Starts watcher with browser-sync
gulp.task( 'watch', ['browser-sync', 'watch-assets', 'scripts'], function() {
} );

// Run:  gulp scripts.
// Uglifies and concat all JS files into one
gulp.task( 'scripts', function() {

  var scripts = [
      // Entire Bootstrap4 JS bundle
      paths.dev + '/js/bootstrap4/bootstrap.bundle.js',
      // Custom JS file
      paths.dev + '/js/custom-javascript.js'
  ];

  gulp.src( scripts )
    .pipe( concat( 'scripts.min.js' ) )
    .pipe( babel({
            presets: ['@babel/env']
        }) )
    .pipe( uglify( { output: { comments: 'some' } } ) )
    .pipe( gulp.dest( paths.js ) );

  gulp.src( scripts )
    .pipe( concat( 'scripts.js' ) )
    .pipe( babel({
            presets: ['@babel/env']
        }) )
    .pipe( gulp.dest( paths.js ) );
});

// Run:  gulp copy-assets.
// Copy all needed dependency assets files from node_modules folder to src/js, src/scss folders
gulp.task( 'copy-assets', function() {

// Copy BS4 JS files
    var stream = gulp.src( paths.node + 'bootstrap/dist/js/**/*.js' )
        .pipe( gulp.dest( paths.dev + '/js/bootstrap4' ) );

// Copy BS4 SCSS files
    gulp.src( paths.node + 'bootstrap/scss/**/*.scss' )
        .pipe( gulp.dest( paths.scss + '/bootstrap4' ) );

// Copy all Font Awesome Fonts
    gulp.src( paths.node + '@fortawesome/fontawesome-free/webfonts/*.{ttf,woff,woff2,eot,svg}' )
        .pipe( gulp.dest( './assets/webfonts' ) );

// Copy all FontAwesome5 Free SCSS files
    gulp.src( paths.node + '@fortawesome/fontawesome-free/scss/*.scss' )
        .pipe( gulp.dest( paths.scss + '/fontawesome' ) );

    return stream;
});

// Deleting the files distributed by the copy-assets task
gulp.task( 'clean-vendor-assets', function() {
  return del( [paths.dev + '/js/bootstrap4/**', paths.scss + '/bootstrap4/**', './assets/webfonts/fa-**-**.{ttf,woff,woff2,eot,svg}', paths.scss + '/fontawesome/**'] );
});

// Run gulp dist
// Copies the files to the /dist folder for distribution of end product
gulp.task( 'dist', ['clean-dist'], function() {
  return gulp.src( ['**/*', '!' + paths.node, '!' + paths.node + '/**', '!' + paths.dev, '!' + paths.dev + '/**', '!' + paths.dist, '!' + paths.dist + '/**', '!' + paths.devdist, '!' + paths.devdist + '/**', '!' + paths.scss, '!' + paths.scss + '/**', '!readme.txt', '!readme.md', '!package.json', '!package-lock.json', '!gulpfile.js', '!gulpconfig.json', '!CHANGELOG.md', '!.travis.yml', '!jshintignore',  '!codesniffer.ruleset.xml',  '*'], { 'buffer': false } )
  .pipe( replace( '/js/jquery.slim.min.js', '/js' + paths.vendor + '/jquery.slim.min.js', { 'skipBinary': true } ) )
    .pipe( gulp.dest( paths.dist ) );
});

// Deleting any file inside the /dist folder
gulp.task( 'clean-dist', function() {
  return del( [paths.dist + '/**'] );
});

// Run
// gulp dev-dist
// Copies the files to the /dev-dist folder for distribution of template for development
gulp.task( 'dev-dist', ['clean-dev-dist'], function() {
  return gulp.src( ['**/*', '!' + paths.node, '!' + paths.node + '/**', '!' + paths.dist, '!' + paths.dist +'/**', '!' + paths.devdist, '!' + paths.devdist + '/**', '*'] )
    .pipe( gulp.dest( paths.devdist ) );
} );

// Deleting any file inside the /dev-dist folder
gulp.task( 'clean-dev-dist', function() {
  return del( [paths.devdist + '/**'] );
} );
