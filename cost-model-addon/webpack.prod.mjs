import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
 },
  entry: {
    panel: './src/sidebar/PanelRoot.tsx',
    background: './src/background/index.ts',
    content: './src/content/index.ts',
    devtools: './src/devtools/devtools.ts',
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
        {
          from: path.resolve('src/customAPI'), to: path.resolve(__dirname, 'dist/customAPI')
        },
        {
          from: path.resolve('src/devtools/devtools.html'), to: path.resolve(__dirname, 'dist')
        }
      ],
    }),
    new HtmlWebpackPlugin({
      filename: 'panel.html',
      template: path.resolve(__dirname, 'src','sidebar','templates','panel.template.html'),// Using the template file
      chunks: ['panel'],
      inject: 'body' // Inject scripts at the end of the body
    }),
  ],
};
