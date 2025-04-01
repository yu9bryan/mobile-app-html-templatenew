const fs = require('fs');
const path = require('path');
const { PurgeCSS } = require('purgecss');

async function optimizeCSS() {
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, 'css', 'optimized');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Run PurgeCSS
  const result = await new PurgeCSS().purge({
    content: [path.join(__dirname, '*.html')],
    css: [
      path.join(__dirname, 'css', 'bootstrap.min.css'),
      path.join(__dirname, 'lib', 'animate', 'animate.min.css')
    ],
    safelist: {
      standard: ['active', 'show', 'collapse', 'collapsing'],
      deep: [
        /^carousel/, /^owl-/, /^animated/, /^fadeIn/, /^slideIn/,
        /^wow/, /^modal/, /^fade/, /^collapse/, /^show/
      ]
    }
  });

  // Write optimized CSS files
  result.forEach(({ css, file }) => {
    const filename = path.basename(file);
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, css);
    console.log(`Optimized ${filename} saved to ${outputPath}`);
    console.log(`Original size: ${fs.statSync(file).size / 1024} KB`);
    console.log(`Optimized size: ${css.length / 1024} KB`);
    console.log(`Reduction: ${(1 - css.length / fs.statSync(file).size) * 100}%`);
  });
}

optimizeCSS().catch(err => console.error(err));
