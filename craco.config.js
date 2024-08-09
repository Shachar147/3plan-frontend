const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    webpack: {
        configure: (webpackConfig, { env }) => {
            if (env === 'production') {
                // Filter out ReactRefreshWebpackPlugin
                webpackConfig.plugins = webpackConfig.plugins.filter(
                    (plugin) => plugin.constructor.name !== 'ReactRefreshWebpackPlugin'
                );

                // Remove any instances of react-refresh runtime
                webpackConfig.module.rules.forEach((rule) => {
                    if (rule.oneOf) {
                        rule.oneOf.forEach((subRule) => {
                            if (
                                subRule.loader &&
                                subRule.loader.includes('babel-loader') &&
                                subRule.options &&
                                subRule.options.plugins
                            ) {
                                subRule.options.plugins = subRule.options.plugins.filter(
                                    (plugin) =>
                                        typeof plugin !== 'string' ||
                                        !plugin.includes('react-refresh/babel')
                                );
                            }
                        });
                    }
                });
            }
            return webpackConfig;
        },
    },
};
