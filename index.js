/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author William Buchwalter
  based on jshint-loader by Tobias Koppers
*/
'use strict';

var Lint = require('tslint');
var loaderUtils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var objectAssign = require('object-assign');
var semver = require('semver');

var cachedProgram;
var isHooked = false;

function resolveFile(configPath) {
  return path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath)
}

function resolveOptions(webpackInstance) {
  var tslintOptions = webpackInstance.options && webpackInstance.options.tslint ? webpackInstance.options.tslint : {};
  var query = loaderUtils.getOptions(webpackInstance);

  var options = objectAssign({}, tslintOptions, query);

  var configFile = options.configFile
    ? resolveFile(options.configFile)
    : null;

  options.formatter = options.formatter || 'custom';
  options.formattersDirectory = options.formattersDirectory || __dirname + '/formatters/';
  options.configuration = parseConfigFile(webpackInstance, configFile, options);
  options.tsConfigFile = options.tsConfigFile || 'tsconfig.json';
  options.fix = options.fix || false;

  return options;
}

function parseConfigFile(webpackInstance, configFile, options) {
  if (!options.configuration) {
    return Lint.Linter.findConfiguration(configFile, webpackInstance.resourcePath).results;
  }

  if (semver.satisfies(Lint.Linter.VERSION, '>=5.0.0')) {
    return Lint.Configuration.parseConfigFile(options.configuration);
  }

  return options.configuration;
}

function lint(webpackInstance, input, options) {
  var lintOptions = {
    fix: options.fix,
    formatter: options.formatter,
    formattersDirectory: options.formattersDirectory,
    rulesDirectory: options.rulesDirectory
  };
  var bailEnabled = (webpackInstance.options && webpackInstance.options.bail === true);

  var tsProgram = options.typeCheck ? getCachedProgram() : undefined;
  var linter = new Lint.Linter(lintOptions, tsProgram);

  linter.lint(webpackInstance.resourcePath, input, options.configuration);
  var result = linter.getResult();
  var emitter = options.emitErrors ? webpackInstance.emitError : webpackInstance.emitWarning;

  report(result, emitter, options.failOnHint, options.fileOutput, webpackInstance.resourcePath,  bailEnabled);
}

function report(result, emitter, failOnHint, fileOutputOpts, filename, bailEnabled) {
  if (result.failureCount === 0) return;
  if (result.failures && result.failures.length === 0) return;
  var err = new Error(result.output);
  delete err.stack;
  emitter(err);

  if (fileOutputOpts && fileOutputOpts.dir) {
    writeToFile(fileOutputOpts, result);
  }

  if (failOnHint) {
    var messages = '';
    if (bailEnabled){
      messages = '\n\n' + filename + '\n' + result.output;
    }
    throw new Error('Compilation failed due to tslint errors.' +  messages);
  }
}

var cleaned = false;

function writeToFile(fileOutputOpts, result) {
  if (fileOutputOpts.clean === true && cleaned === false) {
    rimraf.sync(fileOutputOpts.dir);
    cleaned = true;
  }

  if (result.failures.length) {
    mkdirp.sync(fileOutputOpts.dir);

    var relativePath = path.relative('./', result.failures[0].fileName);

    var targetPath = path.join(fileOutputOpts.dir, path.dirname(relativePath));
    mkdirp.sync(targetPath);

    var extension = fileOutputOpts.ext || 'txt';

    var targetFilePath = path.join(fileOutputOpts.dir, relativePath + '.' + extension);

    var contents = result.output;

    if (fileOutputOpts.header) {
      contents = fileOutputOpts.header + contents;
    }

    if (fileOutputOpts.footer) {
      contents = contents + fileOutputOpts.footer;
    }

    fs.writeFileSync(targetFilePath, contents);
  }
}

function updateCachedProgram(tsConfigFile) {
  cachedProgram = Lint.Linter.createProgram(resolveFile(tsConfigFile));
}

function getCachedProgram() {
  return cachedProgram;
}

module.exports = function(input, map) {
  var webpackInstance = this;
  webpackInstance.cacheable && webpackInstance.cacheable();
  var callback = webpackInstance.async();

  if (!semver.satisfies(Lint.Linter.VERSION, '>=4.0.0')) {
    throw new Error('Tslint should be of version 4+');
  }

  var options = resolveOptions(webpackInstance);

  if (!isHooked && options.typeCheck) {
    var webpackCompiler = webpackInstance._compiler;
    updateCachedProgram(options.tsConfigFile);
    webpackCompiler && webpackCompiler.hooks && webpackCompiler.hooks.watchRun.tap('tslint-loader', function() {
      updateCachedProgram(options.tsConfigFile);
    });
    isHooked = true;
  }

  lint(webpackInstance, input, options);
  callback(null, input, map);
};
