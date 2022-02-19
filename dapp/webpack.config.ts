import path from 'path';
import webpack, {Configuration, DefinePlugin} from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import Dotenv from 'dotenv-webpack';

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

// Set BABEL_UWC to get easy access to use-what-changed React hook debugging.
// When enabled, this allows monitoring of when React hooks change simply by
// putting a comment line:
//
//     // uwc-debug
//
// in front of any hooks you want to debug, as per the instructions:
//
//     https://github.com/simbathesailor/use-what-changed#usage-with-babel-plugin-recommended
//
// However it's not enabled by default because for some reason this config
// breaks source maps, meaning that debugging in the browser results in having
// to wade through annoyingly transpiled Javascript, which makes it a lot harder
// to debug.
const babelConfig = process.env.BABEL_UWC
    ? [
          {
              loader: 'babel-loader',
              options: {
                  presets: ['@babel/preset-env'],
                  plugins: [
                      '@babel/plugin-proposal-object-rest-spread',
                      [
                          '@simbathesailor/babel-plugin-use-what-changed',
                          {
                              active: process.env.NODE_ENV !== 'production', // boolean
                          },
                      ],
                  ],
              },
          },
      ]
    : [];

const webpackConfig = (): Configuration | any => ({
    entry: ['babel-polyfill', './src/index.tsx'],
    ...(true || process.env.NODE_ENV === 'production'
        ? {}
        : {
              devtool: 'source-map', // 'eval-cheap-source-map'
          }),

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        // @ts-ignore
        plugins: [new TsconfigPathsPlugin({configFile: './tsconfig.json'})],
        alias: {fs: false, os: false},
        // Doesn't work, despite https://webpack.js.org/configuration/resolve/#resolvealiasfields
        // aliasFields: ['browser'],
    },
    output: {
        path: path.join(__dirname, './build'),
        filename: 'build.js',
    },
    module: {
        rules: [
            {
                test: /\.ts|\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        },
                    },
                    ...babelConfig,
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
                test: /\.s?css$/,
                use: [
                    {
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                    },
                    {
                        loader: 'sass-loader',
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
        hot: true,
        historyApiFallback: true,
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
    ],
});
export default webpackConfig;
