'use strict';

var path = require('path');
var expect = require('chai').expect;
var webpack = require('webpack');
var assign = require('object-assign');
var webpackConfig = require('./webpack.config');
var rootDir = path.resolve(__dirname, '..');

describe('TslintLoader', function() {
  it('should lint typescript files and output warning', function(done) {
    webpack(webpackConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(1);
      expect(result.chunks.length).to.eql(1);
      expect(result.warnings).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
      done();
    });
  });

  it('should overwrite configuration in tslint json', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        configuration: {
          rules: {
            'no-console': [false]
          }
        }
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
      done();
    });
  });

  it('should emit linting failure as error when forced to', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        emitErrors: true
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      var result = stats.toJson();
      expect(result.errors).to.eql([
        './test/app/engine.ts\n[8, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
      done();
    });
  });

  it('should fail on linting failure when forced to', function(done) {
    var localConfig = assign({}, webpackConfig, {
      tslint: {
        failOnHint: true
      }
    });

    webpack(localConfig, function(err, stats) {
      if (err) return done(err);

      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.true;

      var result = stats.toJson();
      expect(result.assets.length).to.eql(0);
      expect(result.chunks.length).to.eql(0);
      expect(result.errors).to.eql([
        './test/app/engine.ts\nModule build failed: Error: Compilation failed due to tslint errors.\n    at report ('+rootDir+'/index.js:59:11)\n    at Object.lint ('+rootDir+'/index.js:43:3)\n    at Object.module.exports ('+rootDir+'/index.js:102:8)'
      ]);
      done();
    });
  });
});
