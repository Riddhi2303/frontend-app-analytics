const baseConfig = require('@openedx/frontend-build/config/webpack.dev.config');

baseConfig.devServer.proxy = [
  {
    context: ['/student-analytics'],
    target: 'https://mash.makersasylum.com',
    changeOrigin: true,
    secure: true,
  },
];

module.exports = baseConfig;
