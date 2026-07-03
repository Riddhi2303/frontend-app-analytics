const { createConfig } = require('@openedx/frontend-build');

module.exports = createConfig('webpack-dev-server', {
  devServer: {
    allowedHosts: 'all',
    proxy: [
      {
        context: ['/student-analytics'],
        target: 'https://mash-staging.makersasylum.com',
        changeOrigin: true,
        secure: true,
      },
      {
        context: ['/mentoring/api'],
        target: 'https://mash-staging.makersasylum.com',
        changeOrigin: true,
        secure: true,
      },
      {
        context: ['/oauth2'],
        target: 'https://mash-staging.makersasylum.com',
        changeOrigin: true,
        secure: true,
      },
    ],
  },
});
