module.exports = {
  content: ['*.html'],
  css: ['css/bootstrap.min.css', 'lib/animate/animate.min.css'],
  output: 'css/optimized/',
  safelist: [
    // Add classes that might be added dynamically via JavaScript
    'active',
    'show',
    'animated',
    'slideInDown',
    'slideInLeft',
    'slideInRight',
    'fadeInUp',
    'wow',
    /^owl-/,
    /^carousel-/,
    /^fade/,
    /^slide/,
    /^collapse/,
    /^modal/
  ]
};
