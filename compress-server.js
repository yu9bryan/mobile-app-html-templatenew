const express = require('express');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const serveStatic = require('serve-static');
const url = require('url');

// LCP optimization constants
const CRITICAL_RESOURCES = [
  '/css/critical.css',
  '/img/bg-circle.webp',
  '/img/bg-triangle.webp',
  '/img/bg-bottom.webp',
  'https://fonts.gstatic.com/s/jost/v14/92zatBhPNqw73oDd4iYl.woff2',
  'https://fonts.gstatic.com/s/heebo/v21/NGS6v5_NC0k9P9H0TbFzsQ.woff2'
];

// Check if critical CSS exists, if not create a placeholder
const criticalCssPath = path.join(__dirname, 'css', 'critical.css');
if (!fs.existsSync(criticalCssPath)) {
  const cssDir = path.join(__dirname, 'css');
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }
  fs.writeFileSync(criticalCssPath, '/* Critical CSS placeholder */\n');
}

const app = express();
const PORT = process.env.PORT || 8000;

// Resource prioritization middleware for LCP optimization
app.use((req, res, next) => {
  // Set priority hints for critical resources
  const requestPath = url.parse(req.url).pathname;
  
  // Add priority hints for critical resources
  if (CRITICAL_RESOURCES.includes(requestPath) || requestPath === '/') {
    res.setHeader('Priority', 'u=1, i');
    res.setHeader('X-LCP-Resource', 'true');
  }
  
  // Add link preload headers for critical resources when serving HTML
  if (requestPath === '/' || requestPath.endsWith('.html')) {
    const preloadLinks = CRITICAL_RESOURCES.map(resource => {
      let as = 'style';
      if (resource.includes('.webp')) as = 'image';
      if (resource.includes('.woff2')) as = 'font';
      return `<${resource}>; rel=preload; as=${as}${as === 'font' ? '; crossorigin' : ''}`;
    }).join(', ');
    
    res.setHeader('Link', preloadLinks);
  }
  
  next();
});

// Custom compression middleware using zlib directly
app.use((req, res, next) => {
  // Original response methods
  const originalWrite = res.write;
  const originalEnd = res.end;
  
  // Skip compression for certain file types
  const ext = path.extname(req.url).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.ico', '.mp4', '.webm'].includes(ext)) {
    return next();
  }
  
  // Check if client accepts compression
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Compression options
  const options = { level: 9 }; // Maximum compression level
  
  let compress;
  
  // Choose compression method based on client support
  if (acceptEncoding.includes('br')) {
    res.setHeader('Content-Encoding', 'br');
    compress = zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Maximum quality (0-11)
        [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0
      }
    });
  } else if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    compress = zlib.createGzip(options);
  } else if (acceptEncoding.includes('deflate')) {
    res.setHeader('Content-Encoding', 'deflate');
    compress = zlib.createDeflate(options);
  } else {
    return next(); // No compression supported
  }
  
  // Add debugging header
  res.setHeader('X-Compression-Enabled', 'true');
  
  // Buffer to collect response data
  let chunks = [];
  
  // Override response methods to compress data
  res.write = function(chunk) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return true;
  };
  
  res.end = function(chunk) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    // If no content, just end the response
    if (chunks.length === 0) {
      originalEnd.call(res);
      return;
    }
    
    // Combine all chunks
    const buffer = Buffer.concat(chunks);
    
    // Compress the buffer
    compress.on('data', (data) => {
      originalWrite.call(res, data);
    });
    
    compress.on('end', () => {
      originalEnd.call(res);
    });
    
    compress.end(buffer);
  };
  
  next();
});

// Cache control middleware with LCP optimization
app.use((req, res, next) => {
  // Set caching headers for static assets
  const requestPath = url.parse(req.url).pathname;
  const ext = path.extname(requestPath).toLowerCase();
  
  // Special handling for LCP resources - shorter cache for critical resources to ensure freshness
  if (CRITICAL_RESOURCES.includes(requestPath)) {
    // Cache critical resources for 1 day with revalidation
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    return next();
  }
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
    // Cache images for 1 week
    res.setHeader('Cache-Control', 'public, max-age=604800');
  } else if (['.css', '.js'].includes(ext)) {
    // Cache CSS and JS for 1 day
    res.setHeader('Cache-Control', 'public, max-age=86400');
  } else if (ext === '.html') {
    // Don't cache HTML files
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  next();
});

// CSS rewrite middleware - redirect to minified versions if available
app.use((req, res, next) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;
  
  // Only process CSS files
  if (pathname.endsWith('.css') && !pathname.endsWith('.min.css')) {
    // Check if minified version exists
    const minifiedPath = pathname.replace('.css', '.min.css');
    const fullMinifiedPath = path.join(__dirname, minifiedPath);
    
    if (fs.existsSync(fullMinifiedPath)) {
      // Redirect to minified version
      req.url = minifiedPath;
      console.log(`Serving minified CSS: ${minifiedPath} instead of ${pathname}`);
    }
  }
  next();
});

// Serve static files with proper content types
app.use(serveStatic(path.join(__dirname), {
  setHeaders: (res, path) => {
    const ext = path.split('.').pop().toLowerCase();
    
    // Set proper content types
    if (ext === 'css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (ext === 'js') {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (ext === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (ext === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else if (['jpg', 'jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === 'png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === 'webp') {
      res.setHeader('Content-Type', 'image/webp');
    } else if (ext === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Inline critical CSS for index.html
app.use((req, res, next) => {
  if (req.url === '/' || req.url.endsWith('index.html')) {
    const originalSend = res.send;
    
    res.send = function(body) {
      if (typeof body === 'string' && body.includes('</head>')) {
        try {
          // Read critical CSS if it exists
          let criticalCSS = '';
          if (fs.existsSync(criticalCssPath)) {
            criticalCSS = fs.readFileSync(criticalCssPath, 'utf8');
          }
          
          // Insert critical CSS inline before </head>
          if (criticalCSS) {
            body = body.replace('</head>', `<style id="critical-css">${criticalCSS}</style></head>`);
          }
          
          // Add LCP monitoring script
          const lcpScript = `
<script>
// Monitor LCP performance
if ('PerformanceObserver' in window) {
  const lcpObserver = new PerformanceObserver((entryList) => {
    const entries = entryList.getEntries();
    const lcpEntry = entries[entries.length - 1];
    console.log('LCP:', lcpEntry.startTime, 'Element:', lcpEntry.element);
    // Send to analytics or performance monitoring
  });
  lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
}
</script>`;
          
          body = body.replace('</head>', `${lcpScript}</head>`);
        } catch (err) {
          console.error('Error processing HTML:', err);
        }
      }
      return originalSend.call(this, body);
    };
    
    next();
  } else {
    next();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`LCP optimization enabled for critical resources:`);
  CRITICAL_RESOURCES.forEach(resource => console.log(` - ${resource}`));
  console.log(`Advanced compression enabled (Brotli/Gzip/Deflate)`);
  console.log(`CSS minification enabled - serving .min.css files when available`);
  console.log(`\nCompression test: To verify compression is working, check for:`);
  console.log(`1. 'Content-Encoding: br' or 'Content-Encoding: gzip' in response headers`);
  console.log(`2. 'X-Compression-Enabled: true' in response headers`);
  console.log(`3. Significantly reduced file sizes in Network tab`);
  console.log(`\nOpen your browser and navigate to http://localhost:${PORT}/`);
});
