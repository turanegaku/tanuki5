var gulp = require('gulp');
var pug = require('gulp-pug');
var rename = require("gulp-rename");

var pages = require('./src/pages.json');

gulp.task('index', function() {
  gulp.src('./src/index.pug')
    .pipe(pug({
      pretty: true,
      title: 'TANUKI GAMES',
      pages: pages,
    }))
    .pipe(gulp.dest('dst/'));
});

gulp.task('pages', function() {
  for (var i = 0; i < pages.length; i++) {
    gulp.src('./src/_template.pug')
      .pipe(pug({
        pretty: true,
        title: pages[i].title,
        page: pages[i],
      }))
      .pipe(rename(pages[i].title + '.html'))
      .pipe(gulp.dest('dst'));
  }
});

// gulp.task('default', ['index', 'pages']);
