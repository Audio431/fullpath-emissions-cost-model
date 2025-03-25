const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    panel: './src/devtools/panel/panelRoot.tsx',
    devtools: './src/devtools/devtools.ts',
    background: './src/background/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  resolve: {
    modules : ['node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
        {
          test: /\.tsx$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                  presets: ['@babel/preset-env'],
                  presets: ['@babel/preset-react'],
              }
              }, 
            {
              loader: 'ts-loader'
            }
          ]
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                  presets: ['@babel/preset-env'],
              }
              }, 
            {
              loader: 'ts-loader'
            }
          ]
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        }
    ]
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: path.resolve('src/manifest.json'), to: path.resolve(__dirname, 'dist')
        },
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.template.html'),// Using the template file
      chunks: ['devtools'],
      inject: 'body' // Inject scripts at the end of the body
    }),
    new HtmlWebpackPlugin({
      filename: 'panel.html',
      template: path.resolve(__dirname, 'src', 'panel.template.html'),// Using the template file
      chunks: ['panel'],
      inject: 'body' // Inject scripts at the end of the body
    })
  ],
};
