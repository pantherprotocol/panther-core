import path from 'path';
import webpack, {Configuration, DefinePlugin} from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import WebpackPwaManifest from 'webpack-pwa-manifest';
import Dotenv from 'dotenv-webpack';

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const webpackConfig = (): Configuration | any => ({
    entry: './src/index.tsx',
    ...(process.env.production || !process.env.development
        ? {}
        : {devtool: 'eval-cheap-source-map'}),

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        // @ts-ignore
        plugins: [new TsconfigPathsPlugin({configFile: './tsconfig.json'})],
    },
    output: {
        path: path.join(__dirname, './build'),
        filename: 'build.js',
    },
    module: {
        rules: [
            {
                test: /\.ts|\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
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
            short_name: 'Panther wallet',
            name: 'Panther wallet',
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
