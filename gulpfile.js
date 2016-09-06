const gulp = require('gulp');
const pug = require('gulp-pug');
const rename = require('gulp-rename');

const pages = require('./src/pages.json');


gulp.task('index', () => {
    gulp.src('./src/index.pug')
    .pipe(pug({
        'pretty': true,
        'title': 'TANUKI GAMES',
        'pages': pages,
    }))
    .pipe(gulp.dest('./docs'));
});

gulp.task('pages', () => {
    for (const page of pages) {
        gulp.src('./src/_template.pug')
        .pipe(pug({
            'pretty': true,
            'title': page.title,
            'page': page,
        }))
        .pipe(rename(page.name + '.html'))
        .pipe(gulp.dest('./docs'));
    }
});


gulp.task('windex', () => {
    gulp.watch(['./src/_frame.pug', './src/index.pug'], ['index']);
});

gulp.task('wpages', () => {
    gulp.watch(['./src/_frame.pug', './src/_template.pug', './src/pages.json'], ['pages']);
});

gulp.task('default', ['windex', 'wpages']);
