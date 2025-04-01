const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Path to your HTML file
const htmlFilePath = path.join(__dirname, 'index.html');
const criticalCssOutputPath = path.join(__dirname, 'css', 'critical.css');

async function extractCriticalCSS() {
  console.log('Extracting critical CSS...');
  
  // Launch a headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to mobile size to prioritize mobile-first critical CSS
  await page.setViewport({
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true
  });
  
  // Load the HTML file
  await page.goto(`file://${htmlFilePath}`);
  
  // Extract critical CSS using Chrome's coverage API
  await page.coverage.startCSSCoverage();
  
  // Wait for LCP element to be visible
  await page.waitForSelector('h1.text-white.mb-4', { visible: true });
  
  // Force layout to ensure all critical styles are applied
  await page.evaluate(() => {
    document.querySelector('h1.text-white.mb-4').getBoundingClientRect();
  });
  
  const coverage = await page.coverage.stopCSSCoverage();
  
  // Extract used CSS
  let criticalCSS = '';
  for (const entry of coverage) {
    // Skip external CSS for now
    if (!entry.url.includes('file://')) continue;
    
    for (const range of entry.ranges) {
      criticalCSS += entry.text.slice(range.start, range.end) + '\n';
    }
  }
  
  // Add specific optimizations for LCP element
  criticalCSS += `
/* LCP Optimizations */
h1.text-white.mb-4 {
  content-visibility: visible;
  contain-intrinsic-size: auto 120px;
  font-display: swap;
}
.hero-header {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
`;
  
  // Write the critical CSS to a file
  fs.writeFileSync(criticalCssOutputPath, criticalCSS);
  
  console.log(`Critical CSS extracted and saved to ${criticalCssOutputPath}`);
  
  await browser.close();
}

// Run the function
extractCriticalCSS().catch(console.error);
