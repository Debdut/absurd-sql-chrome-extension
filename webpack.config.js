const CopyPlugin = require('copy-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const TerserPlugin = require('terser-webpack-plugin');
const { DefinePlugin, optimize } = require('webpack');
const GenerateJsonFromJsPlugin = require('generate-json-from-js-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { join } = require('path');
const dotenv = require('dotenv');

const prodPlugins = [],
  isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  prodPlugins.push(new optimize.AggressiveMergingPlugin(), new optimize.OccurrenceOrderPlugin());
}

const Root = join(__dirname);
const Source = join(Root, 'src');
const Dist = join(Root, 'dist');

const Assets = join(Source, 'assets');
const Background = join(Source, 'background');
const Worker = join(Source, 'worker');

const config = {
  mode: process.env.NODE_ENV,
  target: 'web',
  devtool: isProd ? 'none' : 'cheap-source-map',
  entry: {
    background: join(Background, 'index.ts'),
    worker: join(Worker, 'index.ts'),
  },
  output: {
    path: join(__dirname, '../', 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              ["@babel/plugin-transform-react-jsx", { "pragma":"h" }]
            ]
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|wasm)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.(gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.pcss$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader'
        ],
      },
    ],
  },
  plugins: [
    new CheckerPlugin(),
    new DefinePlugin({
      'process.env': JSON.stringify(
        dotenv.config({
          path: join(Root, `.env.${process.env.TARGET_ENV || process.env.NODE_ENV}`),
        }).parsed,
      ),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: join(Assets, 'images'),
          to: 'assets/images',
        }
      ]
    }),
    ...(process.env.STATS ? [new BundleAnalyzerPlugin()] : []),
    ...prodPlugins,
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.png', '.svg', '.gql', '.wasm'],
    alias: {
      background: Background,
      assets: Assets,
      worker: Worker,
    },
    fallback: {
      crypto: false,
      path: false,
      fs: false
    }
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  }
};

const buildConfig = (browser) => ({
  ...config,
  name: browser,
  output: {
    path: join(Dist, browser),
    filename: '[name].js',
  },
  plugins: [
    ...config.plugins,
    new GenerateJsonFromJsPlugin({
      path: join(Source, 'manifest', `${browser}.js`),
      filename: 'manifest.json',
    }),
  ],
});

module.exports = buildConfig('chrome');