const gulp = require('gulp');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
const plumber = require('gulp-plumber');

const pages = require('./src/pages.json');


gulp.task('index', () => {
    gulp.src('./src/index.pug')
    .pipe(plumber())
    .pipe(pug({
        'pretty': true,
        'home': 'TANUKI GAMES',
        'title': 'TANUKI GAMES',
        'pages': pages,
    }))
    .pipe(gulp.dest('./docs'));
});

gulp.task('pages', () => {
    for (const page of pages) {
        gulp.src('./src/template.pug')
        .pipe(plumber())
        .pipe(pug({
            'pretty': true,
            'home': 'TANUKI GAMES',
            'title': page.title,
            'page': page,
        }))
        .pipe(rename(page.name + '.html'))
        .pipe(gulp.dest('./docs'));
    }
});


gulp.task('windex', ['index'], () => {
    gulp.watch(['./src/frame.pug', './src/index.pug'], ['index']);
});

gulp.task('wpages', ['pages'], () => {
    gulp.watch(['./src/frame.pug', './src/template.pug', './src/pages.json'], ['pages']);
});

gulp.task('default', ['windex', 'wpages']);
