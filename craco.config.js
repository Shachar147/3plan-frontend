const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = {
    webpack: {
        plugins: [
            ...(process.env.NODE_ENV === 'development' ? [new ReactRefreshWebpackPlugin({
                overlay: false, // Disable the default overlay to avoid issues
            })] : []),
        ],
    },
};
