const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/firebase',
    createProxyMiddleware({
      target: 'https://firebasestorage.googleapis.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/firebase': '', // Rewrites the URL path
      },
    })
  );
};