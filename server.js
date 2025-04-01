const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const serveStatic = require('serve-static');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 8000;

// Enhanced Compression middleware
app.use(compression({
  // Compression level (1-9, where 9 is maximum compression)
  level: 9, // Maximum compression for best results
  memLevel: 9, // Use maximum memory for compression
  strategy: 0, // Default strategy
  chunkSize: 16 * 1024, // Larger chunk size for better compression
  windowBits: 15, // Maximum window bits
  // Only compress text-based files
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Always compress these file types
    const ext = path.extname(req.url).toLowerCase();
    if (['.html', '.css', '.js', '.json', '.xml', '.txt', '.svg', '.map', '.md', '.woff', '.woff2'].includes(ext)) {
      return true;
    }
    
    // Compress all text-based content types
    const contentType = res.getHeader('Content-Type');
    if (contentType) {
      return /text|javascript|json|xml|css|html|font|application\/pdf|application\/x-font|application\/font/i.test(contentType);
    }
    
    return true; // Default to compression for most content
  },
  threshold: 0 // Compress all sizes
}));

// Add compression header to verify it's working
app.use((req, res, next) => {
  res.setHeader('X-Compression-Enabled', 'true');
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

// Cache control middleware
app.use((req, res, next) => {
  // Set caching headers for static assets
  const ext = path.extname(req.url).toLowerCase();
  
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Text compression enabled with maximum settings (level 9)`);
  console.log(`CSS minification enabled - serving .min.css files when available`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}/`);
  console.log(`\nCompression test: To verify compression is working, check for:`);
  console.log(`1. 'Content-Encoding: gzip' in response headers`);
  console.log(`2. 'X-Compression-Enabled: true' in response headers`);
  console.log(`3. Significantly reduced file sizes in Network tab`);
});
