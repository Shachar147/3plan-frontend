const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@node_modules': path.resolve(__dirname, 'node_modules'),
        },
        configure: (webpackConfig) => {
            // Disable babel-loader
            webpackConfig.module.rules = webpackConfig.module.rules.filter(
                (rule) => !(rule.loader && rule.loader.includes('babel-loader'))
            );
            return webpackConfig;
        },
    },
};
