const { EnvironmentPlugin } = require('webpack');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    resolve: {
        extensions: ['.js', '.ts', '.tsx'],
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            onlyCompileBundledFiles: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        new EnvironmentPlugin({
            ASAR_UNPACKED: false,
        }),
    ],
};
