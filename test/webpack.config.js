'use strict';

var path = require('path');

module.exports = function() {
  return {
    entry: {
      engine: path.resolve(__dirname, 'app', 'engine.ts')
    },
    resolve: {
      extensions: ['.ts']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          enforce: 'pre',
          loader: './index'
        },
        {
          test: /\.ts$/,
          loader: 'awesome-typescript-loader',
          query: { silent: true }
        }
      ]
    },
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, 'dist')
    }
  }
};
