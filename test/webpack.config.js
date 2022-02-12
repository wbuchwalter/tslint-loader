'use strict';

var path = require('path');
var TslintPlugin = require('../index').TslintPlugin;

module.exports = function() {
  return {
    entry: {
      engine: path.resolve(__dirname, 'app', 'engine.ts')
    },
    resolve: {
      extensions: ['.ts']
    },
    plugins: [
      new TslintPlugin()
    ],
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
