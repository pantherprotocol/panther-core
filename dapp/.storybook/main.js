const path = require('path');
const webpack = require('webpack');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
    reactOptions: {
        fastRefresh: true,
    },
    webpackFinal: config => {
        config.plugins.push(
            new webpack.ProvidePlugin({
                process: path.resolve(
                    path.join(__dirname, '../node_modules', 'process'),
                ),
                Buffer: ['buffer', 'Buffer'],
            }),
        );
        config.resolve.plugins = [
            ...(config.resolve.plugins || []),
            new TsconfigPathsPlugin({
                extensions: config.resolve.extensions,
            }),
        ];
        return {
            ...config,
            resolve: {
                ...config.resolve,
                // alias: {

                // },
                fallback: {
                    stream: require.resolve('stream-browserify'),
                    crypto: require.resolve('crypto-browserify'),
                    os: require.resolve('os-browserify/browser'),
                    path: require.resolve('path-browserify'),
                    https: require.resolve('https-browserify'),
                    http: require.resolve('stream-http'),
                    process: require.resolve('process'),
                    buffer: require.resolve('buffer/'),
                    fs: false,
                },
            },
        };
    },
    stories: [
        '../src/**/*.stories.mdx',
        '../src/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/preset-scss',
        // '@storybook/preset-create-react-app',
    ],
    framework: '@storybook/react',
    core: {
        builder: 'webpack5',
    },
};
