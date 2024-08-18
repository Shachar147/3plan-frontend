const path = require('path');

module.exports = {
    webpack: {
        alias: {
            '@src': path.resolve(__dirname, 'src'),
            '@node_modules': path.resolve(__dirname, 'node_modules'),
        },
    },
};
