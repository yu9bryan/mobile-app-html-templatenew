const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');

// CSS files to minify
const cssFiles = [
  { input: 'css/style.css', output: 'css/style.min.css' },
  { input: 'css/optimized/bootstrap.min.css', output: 'css/optimized/bootstrap.min.css' },
  { input: 'css/optimized/animate.min.css', output: 'css/optimized/animate.min.css' },
  { input: 'lib/owlcarousel/assets/owl.carousel.min.css', output: 'lib/owlcarousel/assets/owl.carousel.min.css' }
];

// Options for CleanCSS
const options = {
  level: {
    1: {
      // Remove all comments
      specialComments: 0,
    },
    2: {
      // Advanced optimizations
      mergeMedia: true,
      mergeNonAdjacentRules: true,
      removeDuplicateFontRules: true,
      removeDuplicateMediaBlocks: true,
      removeDuplicateRules: true,
      removeEmpty: true
    }
  }
};

// Create directory if it doesn't exist
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// Minify CSS function
function minifyCSS(inputFile, outputFile) {
  try {
    // Read the CSS file
    const css = fs.readFileSync(inputFile, 'utf8');
    
    // Get file size before minification
    const beforeSize = Buffer.byteLength(css, 'utf8') / 1024;
    
    // Minify the CSS
    const minified = new CleanCSS(options).minify(css);
    
    // Ensure output directory exists
    ensureDirectoryExistence(outputFile);
    
    // Write the minified CSS to the output file
    fs.writeFileSync(outputFile, minified.styles);
    
    // Get file size after minification
    const afterSize = Buffer.byteLength(minified.styles, 'utf8') / 1024;
    
    // Calculate reduction percentage
    const reduction = ((beforeSize - afterSize) / beforeSize) * 100;
    
    console.log(`✅ Minified ${inputFile}`);
    console.log(`   Size: ${beforeSize.toFixed(2)} KB → ${afterSize.toFixed(2)} KB (${reduction.toFixed(2)}% reduction)`);
    
    return {
      file: inputFile,
      beforeSize,
      afterSize,
      reduction
    };
  } catch (error) {
    console.error(`❌ Error minifying ${inputFile}:`, error.message);
    return null;
  }
}

// Process all CSS files
console.log('🔄 Starting CSS minification...');
const results = cssFiles.map(file => minifyCSS(file.input, file.output));

// Calculate total savings
const validResults = results.filter(result => result !== null);
const totalBefore = validResults.reduce((sum, result) => sum + result.beforeSize, 0);
const totalAfter = validResults.reduce((sum, result) => sum + result.afterSize, 0);
const totalReduction = ((totalBefore - totalAfter) / totalBefore) * 100;

console.log('\n📊 Summary:');
console.log(`   Total size before: ${totalBefore.toFixed(2)} KB`);
console.log(`   Total size after: ${totalAfter.toFixed(2)} KB`);
console.log(`   Total reduction: ${(totalBefore - totalAfter).toFixed(2)} KB (${totalReduction.toFixed(2)}%)`);
console.log('✨ CSS minification complete!');
