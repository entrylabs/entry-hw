const path = require('path');

const reactDirPath = path.resolve(__dirname, 'app', 'src', 'renderer', 'react');
const mainPagePath = path.join(reactDirPath, 'main');
const aboutPagePath = path.join(reactDirPath, 'about');

module.exports = {
    target: 'electron-renderer',
    mode: 'development',
    entry: {
        main: path.join(mainPagePath, 'App.tsx'),
        about: path.join(aboutPagePath, 'App.tsx'),
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
