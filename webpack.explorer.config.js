var webpack = require('webpack');
var path = require("path");
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin;
var webpackConfig = require('./webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin')

var STANDALONE = process.env.BUILD_TARGET === 'standalone';

module.exports = {

    cache: true,

    entry: {
        index: [
            './src/explorer/entry.js'
        ]
    },

    externals: {
        // "react": "React",
        // "react-dom": "ReactDOM"
    },

    bail: false,

    devServer: {
        contentBase: "./dist"
    },

    output: {
        path: path.join(__dirname, 'dist/assets'),
        filename: '[name].js',
        publicPath: '/assets',
    },

    resolveLoader: {
        fallback: __dirname + "/node_modules"
    },

    resolve: {
        root: [
            path.join(__dirname, "node_modules"),
            path.join(__dirname, "bower_components"),
        ],
        extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js', '.styl'],
        alias: {

        }
    },

    node: {
        fs: "empty"
    },

    // Source maps support (or 'inline-source-map' also works)
    devtool: 'eval',

    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loaders: [
                    !STANDALONE ? "react-hot" : null,
                    "awesome-typescript-loader?compiler=typescript&+useBabel&+useCache&+forkChecker&tsconfig=./src/explorer/tsconfig.json"
                ].filter(Boolean)
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader!postcss-loader",
                include: [
                    path.join(__dirname, 'src'),
                    path.join(__dirname, 'demo')
                ]
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader",
                include: [
                    path.join(__dirname, 'node_modules'),
                    path.join(__dirname, 'components'),
                ]
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&minetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader",
                exclude: [
                    /csp-iconset/
                ]
            },
            {
                test: /\.(jpe?g|png|gif)(\?v=.*)?$/i,
                loaders: [
                    'file-loader?hash=sha512&digest=hex&name=[hash].[ext]'
                ]
            },
            {
                test: /\.svg$/,
                loader: 'svg-sprite-loader',
                include: [
                    /csp-iconset/
                ]
            },
            {
                test: /\.json?$/,
                loader: "json-loader"
            }
        ]
    },

    postcss: webpackConfig.postcss,

    plugins: [
        new HtmlWebpackPlugin({
            title: 'DocScript Explorer',
            filename: '../index.html'
        }),
        new ForkCheckerPlugin(),
        new webpack.ProvidePlugin({
            React: "react"
        }),
        new webpack.NoErrorsPlugin(),
        !STANDALONE && new webpack.HotModuleReplacementPlugin({
            hot: true
        }),
        // new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js"),
        new webpack.ResolverPlugin(
            new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
        ),
        new webpack.DefinePlugin({
            DEBUG: true,
        })
    ].filter(Boolean)
};
