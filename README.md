# 前端效能調校作業



## Table of Contents | 目錄
- [Accessibility Improvements | 無障礙改進](#accessibility-improvements)
- [Performance Optimizations | 效能優化](#performance-optimizations)
  - [Cumulative Layout Shift (CLS) Fixes | 累積版面配置轉移修復](#cumulative-layout-shift-cls-fixes)
  - [Largest Contentful Paint (LCP) Optimizations | 最大內容繪製優化](#largest-contentful-paint-lcp-optimizations)
  - [Lazy Loading Implementation | 延遲載入實現](#lazy-loading-implementation)
- [Back-Forward Cache (BFCache) Compatibility | 前進後退快取兼容性](#back-forward-cache-bfcache-compatibility)
- [SEO Enhancements | SEO 增強](#seo-enhancements)

## Accessibility Improvements | 無障礙改進

The following accessibility enhancements were implemented to ensure the website is usable by all visitors:

以下無障礙增強功能已實施，以確保所有訪問者都能使用該網站：

- **Color Contrast Improvements | 顏色對比度改進**:
  - Darkened primary color from `#4294E3` to `#0A6ECF` for better contrast
  - Darkened secondary color from `#8F12FD` to `#7209D4` for better contrast
  - Added text shadow to improve readability of white text on colored backgrounds

- **Screen Reader Support | 螢幕閱讀器支援**:
  - Added proper `alt` attributes to all images
  - Added `aria-label`, `role`, and `title` attributes to interactive elements
  - Improved semantic HTML structure

- **Text Readability | 文字可讀性**:
  - Set explicit line heights and font sizes
  - Added high contrast mode styles for better accessibility
  - Ensured all text on white backgrounds has sufficient contrast

## Performance Optimizations | 效能優化

### Cumulative Layout Shift (CLS) Fixes | 累積版面配置轉移修復

CLS issues were addressed to prevent unexpected layout shifts during page load:

解決了 CLS 問題，以防止頁面載入期間出現意外的版面配置轉移：

- **Font Loading Strategy | 字型載入策略**:
  - Implemented a two-stage font loading approach with system fonts first
  - Added font-display: swap to prevent invisible text during font loading
  - Set explicit dimensions to prevent layout shifts when fonts load

- **Container Dimensions | 容器尺寸**:
  - Added explicit min-height and min-width to carousel containers
  - Applied CSS containment properties to prevent layout shifts
  - Set aspect ratios for images to maintain space during loading

- **Animation Rendering | 動畫渲染**:
  - Added hardware acceleration hints (`will-change`, `transform: translateZ(0)`)
  - Applied `backface-visibility: hidden` and `perspective` for rendering stability
  - Used `contain: layout style paint` to isolate rendering impact

- **Pre-Calculation of Dynamic Content | 動態內容預計算**:
  - Added script to calculate and set dimensions for dynamic content before rendering
  - Forced layout calculation before animations start
  - Applied to all elements with animation classes

### Largest Contentful Paint (LCP) Optimizations | 最大內容繪製優化

The main heading (h1) was optimized to reduce rendering delay:

優化了主標題 (h1) 以減少渲染延遲：

- **Critical Rendering Path | 關鍵渲染路徑**:
  - Added `fetchpriority="high"` to the h1 heading
  - Inlined critical CSS styles directly in the HTML
  - Deprioritized non-critical resources with `fetchpriority="low"`

- **Rendering Optimization | 渲染優化**:
  - Applied `content-visibility: auto` with explicit size hints
  - Used `contain-intrinsic-size` to reserve space without waiting for content
  - Added `will-change: contents` for rendering preparation

- **Font Rendering | 字型渲染**:
  - Preloaded critical font styles at the beginning of the document
  - Ensured system fonts are used first before web fonts load
  - Added explicit font-weight and line-height to prevent shifts

- **Performance Monitoring**:
  - Implemented PerformanceObserver to track LCP completion
  - Applied post-LCP optimizations for subsequent interactions
  - Added performance marks for monitoring

### Lazy Loading Implementation | 延遲載入實現

Off-screen images are now lazy-loaded to reduce initial page load size:

現在對畫面外圖片進行延遲載入，以減少初始頁面載入大小：

- **Native Lazy Loading | 原生延遲載入**:
  - Added `loading="lazy"` attribute to all off-screen images
  - Used `fetchpriority="high"` for critical above-the-fold images

- **Enhanced Fallback Support | 增強的後備支援**:
  - Implemented Intersection Observer for browsers without native lazy loading
  - Added SVG placeholders to maintain layout stability
  - Set 200px margin to start loading images before they enter viewport

- **Optimized Loading Thresholds | 優化的載入閾值**:
  - Created a smoother experience by preloading images just before they're needed
  - Reduced data usage for users who don't scroll to the bottom

## Back-Forward Cache (BFCache) Compatibility | 前進後退快取兼容性

Implemented changes to ensure the page works correctly with browser back-forward cache:

實施了變更以確保頁面與瀏覽器的前進後退快取正確配合：

- **Page Lifecycle Handling | 頁面生命週期處理**:
  - Added `pageshow` event listener for page restoration from cache
  - Implemented `visibilitychange` event handler to reconnect services
  - Used `pagehide` instead of `beforeunload` to avoid blocking bfcache

- **Dynamic Content Refresh | 動態內容刷新**:
  - Added code to refresh carousels when restored from bfcache
  - Ensured spinner is properly removed when restoring from cache

- **Performance Monitoring**:
  - Added performance marks to track bfcache restoration
  - Implemented debugging helpers for bfcache behavior

## SEO Enhancements | SEO 增強

The following SEO improvements were implemented:

實施了以下 SEO 改進：

- **Meta Description | 元描述**:
  - Added comprehensive meta description for better search engine visibility
  - Included relevant keywords for the fitness app

- **Social Media Sharing | 社交媒體分享**:
  - Added Open Graph and Twitter Card meta tags
  - Included proper image and description for social sharing

- **Structured Data | 結構化數據**:
  - Improved semantic HTML structure
  - Added proper heading hierarchy


