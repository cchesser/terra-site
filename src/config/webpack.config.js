// By default eslint assumes packages imported are supposed to be dependencies,
// not devDependencies. Disabling this rule in webpack.conig.js
/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const Autoprefixer = require('autoprefixer');
const PostCSSAssetsPlugin = require('postcss-assets-webpack-plugin');
const PostCSSCustomProperties = require('postcss-custom-properties');
const path = require('path');
const rtl = require('postcss-rtl');
const ThemingPlugin = require('../theming-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const I18nAggregatorPlugin = require('terra-i18n-plugin');
const i18nSupportedLocales = require('terra-i18n/lib/i18nSupportedLocales');
const fs = require('fs');

const isFile = filePath => (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory());

/* Get the site configuration to define as SITE_CONFIG in the DefinePlugin */
const siteConfigPath = path.resolve(path.join(process.cwd(), 'site.config.js'));
// eslint-disable-next-line import/no-dynamic-require
const siteConfig = isFile(siteConfigPath) ? require(siteConfigPath) : require('./site.config');

/* Get the component configuration to define the COMPONENT_CONFIG_PATH in the DefinePlugin */
let componentConfigPath = path.resolve(path.join(process.cwd(), siteConfig.componentConfigPath));
if (!isFile(componentConfigPath)) {
  componentConfigPath = undefined;
}

const defaultWebpackConfig = {
  entry: {
    'babel-polyfill': 'babel-polyfill',
    'terra-site': path.resolve(path.join(__dirname, '..', 'Index')),
  },
  module: {
    rules: [{
      test: /\.(jsx|js)$/,
      exclude: /node_modules(?!\/terra-site\/src)/,
      use: 'babel-loader',
    },
    {
      test: /\.(scss|css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [{
          loader: 'css-loader',
          options: {
            sourceMap: true,
            importLoaders: 2,
            localIdentName: '[name]__[local]___[hash:base64:5]',
          },
        }, {
          loader: 'postcss-loader',
          options: {
            plugins() {
              return [
                Autoprefixer({
                  browsers: [
                    'ie >= 10',
                    'last 2 versions',
                    'last 2 android versions',
                    'last 2 and_chr versions',
                    'iOS >= 10',
                  ],
                }),
                ThemingPlugin,
                rtl(),
              ];
            },
          },
        },
        {
          loader: 'sass-loader',
          options: {
            data: '$bundled-themes: mock, consumer;',
          },
        }],
      }),
    },
    {
      test: /\.md$/,
      use: 'raw-loader',
    },
    {
      test: /\.(png|svg|jpg|gif)$/,
      use: 'file-loader',
    },
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name]-[hash].css'),
    new HtmlWebpackPlugin({
      title: 'Site',
      template: path.join(__dirname, '..', 'index.html'),
      chunks: ['babel-polyfill', 'terra-site'],
    }),
    new I18nAggregatorPlugin({
      baseDirectory: process.cwd(),
      supportedLocales: i18nSupportedLocales,
    }),
    new webpack.DefinePlugin({
      SITE_CONFIG: JSON.stringify(siteConfig),
      COMPONENT_CONFIG_PATH: JSON.stringify(componentConfigPath),
    }),
    new PostCSSAssetsPlugin({
      test: /\.css$/,
      log: false,
      plugins: [
        PostCSSCustomProperties({ preserve: true }),
      ],
    }),
    new webpack.NamedChunksPlugin(),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.resolve(process.cwd(), 'aggregated-translations'), 'node_modules'],

    // See https://github.com/facebook/react/issues/8026
    alias: {
      react: path.resolve(process.cwd(), 'node_modules', 'react'),
      'react-intl': path.resolve(process.cwd(), 'node_modules', 'react-intl'),
      'react-dom': path.resolve(process.cwd(), 'node_modules', 'react-dom'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.join(process.cwd(), 'dist'),
  },
  devtool: 'cheap-source-map',
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    stats: {
      assets: true,
      children: false,
      chunks: false,
      hash: false,
      modules: false,
      publicPath: false,
      timings: true,
      version: true,
      warnings: true,
    },
    overlay: {
      warnings: true,
      errors: true,
    },
  },
  resolveLoader: {
    modules: [path.resolve(path.join(process.cwd(), 'node_modules'))],
  },
};

module.exports = defaultWebpackConfig;
