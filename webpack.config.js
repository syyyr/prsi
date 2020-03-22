const path = require('path');

module.exports = {
    mode: "development",
    entry: './build/frontend.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};

