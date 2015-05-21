/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author William Buchwalter
	based on jshint-loader by Tobias Koppers
*/
var Linter = require("tslint");
var stripJsonComments = require("strip-json-comments");
var loaderUtils = require("loader-utils");
var fs = require("fs");
var path = require("path");
var typescript = require("typescript");


function loadRelativeConfig() {
	var options = {
		 formatter: "custom",
		 formattersDirectory: 'node_modules/tslint-loader/formatters/',	  
		 configuration: {}
	};
	
	var configPath = locateConfigFile("tslint.json", path.dirname(this.resourcePath));
	if(typeof configPath !== "string") {		
		console.log('tslint.json not found');		
	} else {
		this.addDependency(configPath);
		var file = fs.readFileSync(configPath, "utf8");
		options.configuration = JSON.parse(stripJsonComments(file));
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

function lint(input, config) {
	
	//Override options in tslint.json by those passed to the compiler
	if(this.options.tslint) {
		for(var name in this.options.tslint) {
			config[name] = this.options.tslint[name];
		}
	}

	//Override options in tslint.json by those passed to the loader as a query string
	var query = loaderUtils.parseQuery(this.query);
	for(var name in query) {
		config[name] = query[name];
	}
	
	var linter = new Linter(this.resourcePath, input, config);
	var result = linter.lint();	
	report(this.resourcePath, result, this.emitWarning);
}

function report(filename, result, emitter) {
	if(result.failureCount === 0) return;		
	emitter(result.output);	
}


module.exports = function(input, map) {
	this.cacheable && this.cacheable();
	var callback = this.async();

	var config = loadRelativeConfig.call(this);
	lint.call(this, input, config);	
	callback(null, input, map);
}

