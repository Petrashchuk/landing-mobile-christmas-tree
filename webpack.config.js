// webpack.config.js
import path from 'path';
import nodeExternals from 'webpack-node-externals';

export default {
    entry: './server.js',
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve('./dist'),
        filename: 'bundle.js',
    },
    mode: 'production',
};
