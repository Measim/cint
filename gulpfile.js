var gulp = require('gulp'),
    connect = require('gulp-connect'),
    minifyCss = require('gulp-minify-css'),
    inject = require('gulp-inject');

var filesToMove = [
        'owo-poller.js',
        'data/*',
        'fonts/*',
        'img/*'
    ];

gulp.task('minify-css', function() {
    return gulp.src('css/*.css')
        .pipe(minifyCss({ compatibility: 'ie8' }))
        .pipe(gulp.dest('build/css'));
});

gulp.task('injectCss', ['minify-css'], function () {
    gulp.src('templates/widget-content.tpl')
        .pipe(inject(gulp.src(['build/css/style.css']), {
            starttag: '<!-- inject:cssFile -->',
            removeTags: true,
            transform: function (filePath, file) {
                return file.contents.toString('utf8');
            }
        })
    ).pipe(gulp.dest('./build/templates'));
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

gulp.task('prod', [ 'minify-css', 'injectCss', 'move', 'connect', 'watch']);
gulp.task('dev', [ 'connect', 'watch']);