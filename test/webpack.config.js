'use strict';

var path = require('path');

module.exports = {
  entry: {
    engine: path.resolve(__dirname, 'app', 'engine.ts')
  },
  resolve: {
    extensions: ['', '.ts']
  },
  module: {
    preLoaders: [
      {
        test: /\.ts$/,
        loader: './index'
      }
    ],
    loaders: [
      {
        test: /\.ts$/,
        loader: 'awesome-typescript-loader'
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
