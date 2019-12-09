const path = require('path');

const reactDirPath = path.resolve(__dirname, 'app', 'src', 'renderer', 'react');
const mainPagePath = path.join(reactDirPath, 'main');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: path.resolve(mainPagePath, 'App.tsx'),
    output: {
        path: path.resolve(reactDirPath, 'dist'),
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
