// Static build: src/*.pug -> docs/*.html, src/sass/*.sass -> docs/style/*.css
// Replaces the gulp 3 pipeline, which no longer runs on current Node.
//   npm run build    once
//   npm run watch    rebuild on change
const fs = require('fs');
const path = require('path');
const pug = require('pug');
const sass = require('sass');

const SRC = './src';
const OUT = './docs';
const HOME = 'TANUKI GAMES';

function build() {
  const pages = JSON.parse(fs.readFileSync(SRC + '/pages.json', 'utf8'));
  const common = {pretty: true, home: HOME};

  write('index.html', pug.renderFile(SRC + '/index.pug', {...common, title: HOME, pages}));
  for (const page of pages) {
    write(page.name + '.html', pug.renderFile(SRC + '/template.pug', {...common, title: page.title, page}));
  }

  for (const f of fs.readdirSync(SRC + '/sass').filter((f) => f.endsWith('.sass') && !f.startsWith('_'))) {
    const css = sass.compile(SRC + '/sass/' + f).css;
    fs.writeFileSync(path.join(OUT, 'style', f.replace(/\.sass$/, '.css')), css);
  }

  console.log('built ' + (pages.length + 1) + ' pages');
}

function write(name, html) {
  fs.writeFileSync(path.join(OUT, name), html);
}

build();

if (process.argv.includes('--watch')) {
  console.log('watching ' + SRC);
  fs.watch(SRC, {recursive: true}, () => {
    try {
      build();
    } catch (e) {
      console.error(e.message);
    }
  });
}
