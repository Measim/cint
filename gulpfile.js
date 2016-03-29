var gulp = require('gulp'),
    connect = require('gulp-connect'),
    minifyCss = require('gulp-minify-css');

var filesToMove = [
        'owo-cint.js',
        'languages/*',
        'css/*',
        'scss/*',
        'templates/*',
        'img/*'
    ];

gulp.task('minify-css', function() {
    return gulp.src('css/*.css')
        .pipe(minifyCss({ compatibility: 'ie8' }))
        .pipe(gulp.dest('build/css'));
});

gulp.task('move', function(){
    gulp.src(filesToMove, { base: './' })
    .pipe(gulp.dest('build'));
});
 
gulp.task('connect', function() {
    connect.server({
        port: 8855,
        root: './',
        livereload: true
    });
});
 
gulp.task('html', function () {
    gulp.src('./*.html')
    .pipe(connect.reload());
});

gulp.task('tpl', function () {
    gulp.src('./build/templates/*.tpl')
    .pipe(connect.reload());
});

gulp.task('js', function () {
    gulp.src('./build/*.js')
    .pipe(connect.reload());
});
 
gulp.task('watch', function () {
    gulp.watch(['./*.html', './build/templates/*.tpl', './build/*.js'], ['html', 'tpl', 'js']);
});

gulp.task('prod', [ 'minify-css', 'move', 'connect', 'watch']);
gulp.task('dev', [ 'connect', 'watch']);