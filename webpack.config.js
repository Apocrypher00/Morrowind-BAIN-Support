const path = require('path');

module.exports = {
    mode: 'development',
    target: 'electron-renderer',
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: { type: 'commonjs2' }
    },
    devtool: false,
    module: {
        rules: [{ test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ }]
    },
    resolve: { extensions: ['.ts', '.js'] },
    externals: { 'vortex-api': 'commonjs vortex-api' }
};
