'use strict';

var webpack = require('webpack');
var assign = require('object-assign');
var promisify = require('es6-promisify');
var webpackConfig = require('./webpack.config');

module.exports = function(additionalConfig) {
  additionalConfig = additionalConfig || {};

  return promisify(webpack)(
    assign({}, webpackConfig, additionalConfig)
  );
};
