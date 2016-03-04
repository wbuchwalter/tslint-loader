/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author William Buchwalter
  based on jshint-loader by Tobias Koppers
*/
var Linter = require("tslint");
var tslintConfig = require("tslint/lib/configuration");
var stripJsonComments = require("strip-json-comments");
var loaderUtils = require("loader-utils");
var fs = require("fs");
var path = require("path");
var typescript = require("typescript");
var mkdirp = require("mkdirp");
var rimraf = require("rimraf");


function loadRelativeConfig() {
  var options = {
     formatter: "custom",
     formattersDirectory: 'node_modules/tslint-loader/formatters/',    
     configuration: {}
  };
  
  var configPath = locateConfigFile("tslint.json", path.dirname(this.resourcePath));
  if(typeof configPath == "string") {
    this.addDependency(configPath);
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
  if(this.options.tslint) {    
    merge(options, this.options.tslint);
  }

  var bailEnabled = (this.options.bail === true);

  //Override options in tslint.json by those passed to the loader as a query string
  var query = loaderUtils.parseQuery(this.query);
  merge(options, query);   
  
  var linter = new Linter(this.resourcePath, input, options);
  var result = linter.lint();
  var emitter = options.emitErrors ? this.emitError : this.emitWarning;

  report(result, emitter, options.failOnHint, options.fileOutput, this.resourcePath,  bailEnabled);
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


module.exports = function(input, map) {
  this.cacheable && this.cacheable();
  var callback = this.async();

  var config = loadRelativeConfig.call(this);
  lint.call(this, input, config);  
  callback(null, input, map);
};

