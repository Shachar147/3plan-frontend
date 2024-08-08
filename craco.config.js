const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [
            ...(process.env.NODE_ENV === 'development' ? [new ReactRefreshWebpackPlugin()] : []),
        ],
    },
};
