/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author William Buchwalter
  based on jshint-loader by Tobias Koppers
*/

var loaderUtils = require("loader-utils");
var pool = require("process-pool-singleton");

function tslintTask(__dirname) {
  var Linter = require("tslint");
  var tslintConfig = require("tslint/lib/configuration");
  var typescript = require("typescript");
  var mkdirp = require("mkdirp");
  var rimraf = require("rimraf");
  var stripJsonComments = require("strip-json-comments");
  var fs = require("fs");
  var path = require("path");

  return function doLint(options) {
    var input = options.input;
    var resourcePath = options.resourcePath;
    var tslintOptions = options.tslintOptions;
    var bail = options.bail;
    var query = options.query;
    var output = {
      addDependency: [],
      emitError: [],
      emitWarning: []
    };
    function emitError(error) {
      output.emitError.push(error);
    }
    function emitWarning(warning) {
      output.emitWarning.push(warning);
    }
    function loadRelativeConfig() {
      var options = {
         formatter: "custom",
         formattersDirectory: path.resolve(__dirname, 'formatters') + path.sep,
         configuration: {}
      };

      var configPath = locateConfigFile("tslint.json", path.dirname(resourcePath));
      if(typeof configPath == "string") {
        output.addDependency.push(configPath);
        var file = fs.readFileSync(configPath, "utf8");
        var config = JSON.parse(stripJsonComments(file));
        options.configuration = config;
        if(config.rulesDirectory) {
          var resolvedDirectories = tslintConfig.getRulesDirectories(config.rulesDirectory, path.dirname(configPath));
          options.rulesDirectory = resolvedDirectories;
        }
      }

      return options;
    }

    function locateConfigFile(filename, startingPath) {
      var filePath = path.join(startingPath, filename);
      if(typescript.sys.fileExists(filePath)){
        return filePath;
      }
      var parentPath = path.dirname(startingPath);
      if(parentPath === startingPath)
        return undefined;
      return locateConfigFile(filename,parentPath);
    }

    function lint(input, options) {
      //Override options in tslint.json by those passed to the compiler
      if(tslintOptions) {
        merge(options, tslintOptions);
      }

      var bailEnabled = (bail === true);

      //Override options in tslint.json by those passed to the loader as a query string
      merge(options, query);

      var linter = new Linter(resourcePath, input, options);
      var result = linter.lint();
      var emitter = options.emitErrors ? emitError : emitWarning;

      report(result, emitter, options.failOnHint, options.fileOutput, resourcePath,  bailEnabled);
    }

    function report(result, emitter, failOnHint, fileOutputOpts, filename, bailEnabled) {
      if(result.failureCount === 0) return;
      emitter(result.output);

      if(fileOutputOpts && fileOutputOpts.dir) {
        writeToFile(fileOutputOpts, result);
      }

      if(failOnHint) {
        var messages = "";
        if (bailEnabled){
          messages = "\n\n" + filename + "\n" + result.output;
        }
        throw new Error("Compilation failed due to tslint errors." +  messages);
      }
    }

    var cleaned = false;

    function writeToFile(fileOutputOpts, result) {
      if(fileOutputOpts.clean === true && cleaned === false) {
        rimraf.sync(fileOutputOpts.dir);
        cleaned = true;
      }

      if(result.failures.length) {
        mkdirp.sync(fileOutputOpts.dir);

        var relativePath = path.relative("./", result.failures[0].fileName);

        var targetPath = path.join(fileOutputOpts.dir, path.dirname(relativePath));
        mkdirp.sync(targetPath);

        var extension = fileOutputOpts.ext || "txt";

        var targetFilePath = path.join(fileOutputOpts.dir, relativePath + "." + extension);

        var contents = result.output;

        if(fileOutputOpts.header) {
          contents = fileOutputOpts.header + contents;
        }

        if(fileOutputOpts.footer) {
          contents = contents + fileOutputOpts.footer;
        }

        fs.writeFileSync(targetFilePath, contents);
      }
    }

    /* Merges two (or more) objects,
       giving the last one precedence */
    function merge(target, source) {
      if ( typeof target !== 'object' ) {
        target = {};
      }

      for (var property in source) {
        if ( source.hasOwnProperty(property) ) {
          var sourceProperty = source[ property ];
          if ( typeof sourceProperty === 'object' ) {
            target[ property ] = merge( target[ property ], sourceProperty );
            continue;
          }
          target[ property ] = sourceProperty;
        }
      }

      for (var a = 2, l = arguments.length; a < l; a++) {
        merge(target, arguments[a]);
      }

      return target;
    }

    lint(input, loadRelativeConfig());
    return output;
  }
}

var pooledLint = pool.prepare(tslintTask, __dirname);

module.exports = function(input, map) {
  this.cacheable && this.cacheable();
  var callback = this.async();
  var self = this;

  pooledLint({
    input: input,
    resourcePath: this.resourcePath,
    tslintOptions: this.options.tslint,
    query: loaderUtils.parseQuery(this.query),
    bail: this.options.bail
  }).then(
    function(output) {
      output.addDependency.forEach(self.addDependency.bind(self));
      output.emitError.forEach(self.emitError.bind(self));
      output.emitWarning.forEach(self.emitWarning.bind(self));
      callback(null, input, map);
    },
    callback
  );
};
