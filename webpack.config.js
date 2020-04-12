const path = require('path');

module.exports = {
    mode: "development",
    entry: './build/client/frontend.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

