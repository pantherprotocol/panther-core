/* eslint-disable */
const path = require('path');
const webpack = require('webpack');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const TerserPlugin = require('terser-webpack-plugin');

const targetEnv = process.env.TARGET_ENV;
const isProd = targetEnv === 'production';
const isStaging = targetEnv === 'staging';
const isProdOrStaging = isProd || isStaging;
const babelOptions = {
    presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript',
    ],
    plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        [
            '@simbathesailor/babel-plugin-use-what-changed',
            {
                active: process.env.NODE_ENV !== 'production', // boolean
            },
        ],
    ],
};

const defaultOptimization = {
    splitChunks: {
        cacheGroups: {
            // Move reactjs packages into its own file `vendor-react.js`
            reactVendor: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                name: 'vendor-react',
                chunks: 'all',
            },
            // Move the `circomlibjs` package into its own file `circomlib.js` -> Will be cached
            circomlibjs: {
                test: /[\\/]node_modules[\\/]circomlibjs[\\/]/,
                name: 'circomlib',
                chunks: 'all',
            },
        },
    },
};

module.exports = {
    entry: ['babel-polyfill', path.resolve(__dirname, './src/index.tsx')],
    ...(isProdOrStaging
        ? {}
        : {
              devtool: 'source-map', // 'eval-cheap-source-map'
          }),

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
        // @ts-ignore
        plugins: [new TsconfigPathsPlugin({configFile: './tsconfig.json'})],
        // alias: {fs: false},
        // Doesn't work, despite https://webpack.js.org/configuration/resolve/#resolvealiasfields
        // aliasFields: ['browser'],
        fallback: {
            stream: require.resolve('stream-browserify'),
            crypto: require.resolve('crypto-browserify'),
            os: require.resolve('os-browserify/browser'),
            path: require.resolve('path-browserify'),
            https: require.resolve('https-browserify'),
            http: require.resolve('stream-http'),
            buffer: require.resolve('buffer/'),
            process: require.resolve('process'),
            fs: false,
        },
    },
    output: {
        // filename: 'build-[contenthash].js',
        filename: '[name].js',
        path: path.join(__dirname, './build'),
    },
    target: 'web',
    module: {
        rules: [
            {
                test: /\.ts|\.tsx?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions,
                    },
                ],
                include: [
                    path.resolve(__dirname, './src'),
                    path.resolve(__dirname, './tests'),
                ],
                exclude: [
                    path.resolve(__dirname, './build'),
                    path.resolve(__dirname, './node_modules/'),
                ],
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|jpeg|gif|ico)$/,
                exclude: /node_modules/,
                use: ['file-loader?name=[name].[ext]'], // ?name=[name].[ext] is only necessary to preserve the original file name
            },
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: 'svg-url-loader',
                        options: {
                            esModule: false,
                            limit: 10000,
                        },
                    },
                ],
            },
        ],
    },
    devServer: {
        port: 3000,
        // open: true,
        liveReload: true,
        hot: true,
        historyApiFallback: true,
        contentBase: path.resolve(__dirname, './public'),
    },
    plugins: [
        new NodePolyfillPlugin(),
        new HtmlWebpackPlugin({
            // HtmlWebpackPlugin simplifies creation of HTML files to serve your webpack bundles
            template: './public/index.html',
            filename: './index.html',
            favicon: './public/logo.png',
        }),
        // DefinePlugin allows you to create global constants which can be configured at compile time
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        // For some reason we are using webpack to serve in
        // development mode, bypassing create-react-app's method of
        // supporting environment variables via REACT_APP_* prefix.
        // So use dotenv-webpack instead.
        new Dotenv(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.optimize.AggressiveMergingPlugin(),
        new ForkTsCheckerWebpackPlugin({
            // Speeds up TypeScript type checking and ESLint linting (by moving each to a separate process)
            // @ts-ignore
            eslint: {
                files: './src/**/*.{ts,tsx,js,jsx}',
            },
        }),
        new WebpackPwaManifest({
            short_name: 'Panther Staking',
            name: 'Panther Protocol Staking dApp',
            icons: [
                {
                    src: path.resolve('./public/logo.png'),
                    sizes: [64, 32, 24, 16],
                },
                {
                    src: path.resolve('./public/logo.png'),
                    size: '192x192',
                },
                {
                    src: path.resolve('./public/logo.png'),
                    size: '512x512',
                },
            ],
            publicPath: '/',
            theme_color: '#000000',
            background_color: '#ffffff',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        ...(process.env.TARGET_ENV === 'production'
            ? [
                  new SentryCliPlugin({
                      include: '.',
                      ignoreFile: '.sentrycliignore',
                      ignore: ['node_modules', 'webpack.config.js'],
                      configFile: 'sentry.properties',
                      authToken: process.env.SENTRY_AUTH_TOKEN,
                      org: 'panther-protocol',
                      project: 'dapp',
                  }),
              ]
            : []),
    ],
    optimization: isProdOrStaging
        ? {
              minimize: true,
              minimizer: [new TerserPlugin()],
              ...defaultOptimization,
          }
        : defaultOptimization,
};
