/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author William Buchwalter
	based on jshint-loader by Tobias Koppers
*/
var Linter = require("tslint");
var RcLoader = require("rcloader");
var stripJsonComments = require("strip-json-comments");
var loaderUtils = require("loader-utils");
var fs = require("fs");


var rcLoader = new RcLoader("tslint.json", null, {
	loader: function(path) {
		return path;
	}
});

function loadRelativeConfig(callback){
	var sync = typeof callback !== "function";

	if(sync){
		var path = rcLoader.for(this.resourcePath);
		if(typeof path !== "string") {
			// no tslint.json found
			return {};
		} else {
			this.addDependency(path);
			var file = fs.readFileSync(path, "utf8");
			return JSON.parse(stripJsonComments(file));
		}
	}
	else {
		rcLoader.for(this.resourcePath, function(err, path) {
			if(typeof path !== "string") {
				// no tslint.json found
				return callback(null, {});
			}

			this.addDependency(path);
			fs.readFile(path, "utf8", function(err, file) {
				var options;

				if(!err) {
					try {
						options = JSON.parse(stripJsonComments(file));
					}
					catch(e) {
						err = e;
					}
				}
				callback(err, options);
			});
		}.bind(this));
	}
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
	
	var source = input.split(/\r\n?|\n/g);
	var linter = new Linter(this.path, source, config);
	
	var result = linter.lint();	
	this.emitWarning('tslint: ' + result);
}


module.exports = function(input, map) {
	this.cacheable && this.cacheable();
	var callback = this.async();

	if(!callback) {
		// load tslint.json synchronously
		var config = loadRelativeConfig.call(this);
		lint.call(this, input, config);
		return input;
	}

	// load tslint.json asynchronously
	loadRelativeConfig.call(this, function(err, config) {
		if(err) return callback(err);

		try {
			lint.call(this, input, config);
		}
		catch(e) {
			return callback(e);
		}
		callback(null, input, map);

	}.bind(this));
}