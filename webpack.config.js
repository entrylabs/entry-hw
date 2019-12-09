const path = require('path');

const reactDirPath = path.resolve(__dirname, 'app', 'src', 'renderer', 'react');
const mainPagePath = path.join(reactDirPath, 'main');
const aboutPagePath = path.join(reactDirPath, 'about');

module.exports = {
    target: 'web',
    mode: 'development',
    entry: {
        main: path.resolve(mainPagePath, 'App.tsx'),
        about: path.resolve(aboutPagePath, 'App.tsx'),
    },
    output: {
        path: path.resolve(reactDirPath, 'dist'),
        filename: '[name].build.js',
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
