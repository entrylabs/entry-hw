const path = require('path');

const defaultPath = path.resolve(__dirname, 'app', 'src', 'renderer', 'react');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: path.resolve(defaultPath, 'App.tsx'),
    output: {
        path: path.resolve(defaultPath, 'dist'),
        filename: 'main.build.js',
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
        ],
    },
    // plugins
    plugins: [],
};
