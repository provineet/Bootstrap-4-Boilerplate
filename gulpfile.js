// loading config file
const config = require( './gulpconfig.json' );
const paths = config.paths;

// Defining dependencies
const gulp = require( 'gulp' );
const plumber = require( 'gulp-plumber' );
const sass = require( 'gulp-sass' );
const watch = require( 'gulp-watch' );
const rename = require( 'gulp-rename' );
const concat = require( 'gulp-concat' );
const uglify = require( 'gulp-uglify' );
const imagemin = require( 'gulp-imagemin' );
const ignore = require( 'gulp-ignore' );
const rimraf = require( 'gulp-rimraf' );
const clone = require( 'gulp-clone' );
const sourcemaps = require( 'gulp-sourcemaps' );
const browserSync = require( 'browser-sync' ).create();
const del = require( 'del' );
const cleanCSS = require( 'gulp-clean-css' );
const gulpSequence = require( 'gulp-sequence' );
const replace = require( 'gulp-replace' );
const autoprefixer = require( 'gulp-autoprefixer' );
const babel = require( 'gulp-babel' );
const gulpif = require( 'gulp-if' );
const argv = require( 'yargs' ).argv;
const zip = require('gulp-vinyl-zip').zip;

// function to check if the supplied file is "theme.js"
const customjs_filter = function( file ){
                                var fileName = new RegExp("theme.js");
                                if( fileName.test(file.path) ){
                                  return true;
                                }
                                  return false;
                              };


// Run: gulp browser-sync
// Starts browser-sync task for starting the server.
gulp.task( 'browser-sync', function() {
    browserSync.init( config.browserSyncWatchFiles, config.browserSyncOptions );
} );

// Run: gulp watch
// Starts watcher with browser-sync
gulp.task( 'watch', ['browser-sync', 'watch-assets'], function() {
} );

// Run: gulp minify
// runs gulp tasks minifyjs, minifycss and imgmin-complete to minify assets
gulp.task( 'minify', ['minifyjs', 'minifycss', 'imgmin-complete'], function() {
} );

// Run: gulp init
// Creates the initial files
gulp.task( 'init', gulpSequence( 'copy-assets', 'sass', 'scripts', 'minify' ) );

// Run: gulp watch-assets
// Watches for changes in style.scss, _template_variables.scss, *js files and images within src folder
gulp.task( 'watch-assets', function() {

    gulp.watch( paths.scss + '/**/*.scss', [ 'styles' ] );
    gulp.watch( [ paths.dev + '/js/**/*.js', 'js/**/*.js', '!js/theme.js', '!js/theme.min.js' ], [ 'scripts' ] );
    gulp.watch( paths.imgsrc + '/**', ['imgmin-complete'] );

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

// Run:  gulp jscripts.
// Copies file from src to assets & transpiles theme.js via Babel
gulp.task( 'jscripts', function() {

  var scripts = [
      // Entire Bootstrap4 JS bundle
      paths.dev + '/js/bootstrap4/bootstrap.bundle.js',
      // Custom JS file
      paths.dev + '/js/*.js'
  ];

  gulp.src( scripts )
    .pipe( gulpif( customjs_filter, babel( {
            presets: [ [ '@babel/env' ] ]
        }) ) )
    .pipe( gulp.dest( paths.js ) );

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

// Run: gulp styles
// run gulp tasks sass and minifycss in sequence
gulp.task( 'styles', function( callback ) {
    gulpSequence( 'sass', 'minifycss' )( callback );
});

// Run: gulp scripts
// run gulp tasks jscripts and minifyjs in sequence
gulp.task( 'scripts', function( callback ) {
    gulpSequence( 'jscripts', 'minifyjs' )( callback );
});

// Run: gulp minifycss
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

// Run: gulp minifyjs
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

// Run:  gulp copy-assets.
// Copy all needed dependency assets files from node_modules folder to src/js, src/scss folders
gulp.task( 'copy-assets', function() {

// Copy Slim Minified version of Jquery 3.*.* from node_modules
    var stream = gulp.src( paths.node + 'jquery/dist/jquery.slim.min.js' )
        .pipe( gulp.dest( paths.js ) );

// Copy BS4 JS files
    gulp.src( paths.node + 'bootstrap/dist/js/**/*.js' )
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

// Run: gulp dist
// runs gulp tasks create-dist and zip in sequence
gulp.task( 'dist', gulpSequence( 'create-dist', 'zip' ) );

// Run: gulp create-dist
// Copies the files to the /dist folder for distribution of end product
gulp.task( 'create-dist', ['clean-dist'], function() {
  return gulp.src( ['**/*', '!' + paths.node, '!' + paths.node + '/**', '!' + paths.dev, '!' + paths.dev + '/**', '!' + paths.dist, '!' + paths.dist + '/**', '!' + paths.devdist, '!' + paths.devdist + '/**', '!' + paths.scss, '!' + paths.scss + '/**', '!readme.txt', '!readme.md', '!package.json', '!package-lock.json', '!gulpfile.js', '!gulpconfig.json', '!CHANGELOG.md', '!.travis.yml', '!jshintignore',  '!codesniffer.ruleset.xml',  '*'], { 'buffer': false } )
  .pipe( gulp.dest( paths.dist ) );
});

// Run: gulp zip --theme your-theme-name
// Creates a zip file with the contents of dist folder and name it as per the --theme (optional) var supplied with the command.
gulp.task( 'zip', function(){

  const theme = ( argv.theme !== '' ) ? argv.theme : "theme";

  return gulp.src( 'dist/**/*' )
        .pipe( zip( theme + '.zip' ) )
        .pipe( gulp.dest( './' ) );

});

// Deleting any file inside the /dist folder
gulp.task( 'clean-dist', function() {
  return del( [paths.dist + '/**'] );
});

// Run: gulp dev-dist
// Copies the files to the /dev-dist folder for distribution of template for development
gulp.task( 'dev-dist', ['clean-dev-dist'], function() {
  return gulp.src( ['**/*', '!' + paths.node, '!' + paths.node + '/**', '!' + paths.dist, '!' + paths.dist +'/**', '!' + paths.devdist, '!' + paths.devdist + '/**', '*'] )
    .pipe( gulp.dest( paths.devdist ) );
} );

// Deleting any file inside the /dev-dist folder
gulp.task( 'clean-dev-dist', function() {
  return del( [paths.devdist + '/**'] );
} );
