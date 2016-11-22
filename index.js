/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author William Buchwalter
  based on jshint-loader by Tobias Koppers
*/
var Lint = require('tslint');
var loaderUtils = require('loader-utils');
var fs = require('fs');
var path = require('path');
var typescript = require('typescript');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var objectAssign = require('object-assign');

function resolveOptions(webpackInstance) {
  var tslintOptions = webpackInstance.options.tslint ? webpackInstance.options.tslint : {};
  var configFile = tslintOptions.configFile
    ? path.resolve(process.cwd(), tslintOptions.configFile)
    : null;

  var options = {
     formatter: 'custom',
     formattersDirectory: __dirname + '/formatters/',
     configuration: Lint.Linter.findConfiguration(configFile, webpackInstance.resourcePath).results
  };

  objectAssign(options, tslintOptions);

  // Override options in tslint.json by those passed to the loader as a query string
  var query = loaderUtils.parseQuery(webpackInstance.query);
  objectAssign(options, query);

  return options;
}

function lint(webpackInstance, input, options) {
  var newLintOptions = { fix: false, formatter: 'custom', formattersDirectory: __dirname + '/formatters/', rulesDirectory: '' };
  var bailEnabled = (webpackInstance.options.bail === true);

  var program;
  if (options.typeCheck) {
    var tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    program = Lint.Linter.createProgram(tsconfigPath);
  }

  var linter = new Lint.Linter(newLintOptions, program);
  linter.lint(webpackInstance.resourcePath, input, options.configuration);
  var result = linter.getResult();
  var emitter = options.emitErrors ? webpackInstance.emitError : webpackInstance.emitWarning;

  report(result, emitter, options.failOnHint, options.fileOutput, webpackInstance.resourcePath,  bailEnabled);
}

function report(result, emitter, failOnHint, fileOutputOpts, filename, bailEnabled) {
  if (result.failureCount === 0) return;
  emitter(result.output);

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

module.exports = function(input, map) {
  this.cacheable && this.cacheable();
  var callback = this.async();

  var options = resolveOptions(this);
  lint(this, input, options);
  callback(null, input, map);
};

