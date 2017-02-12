'use strict';

var webpack = require('webpack');
var assign = require('object-assign');
var promisify = require('es6-promisify');
var webpackConfig = require('./webpack.config');

module.exports = function(tslintConfig, additionalConfig) {
  var basicConfig = webpackConfig();
  if (tslintConfig) {
    basicConfig.module.rules[0].options = tslintConfig;
  }

  return promisify(webpack)(assign(basicConfig, additionalConfig));
};
