/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author William Buchwalter
  based on jshint-loader by Tobias Koppers
*/
import {writeFileSync} from 'fs';
import {getOptions} from 'loader-utils';
import {isEmpty, isNil, isString} from 'lodash';
import {sync as mkdirp} from 'mkdirp';
import {dirname, isAbsolute, join, relative, resolve} from 'path';
import {sync as rimraf} from 'rimraf';
import {Configuration, ILinterOptions, Linter, LintResult} from 'tslint';
import {Program} from 'typescript';
import {loader} from 'webpack';
import {getProgram} from './lib/programInstance';
import TslintPlugin from './lib/TslintPlugin';
import {ITslintLoaderFileOutputOptions, ITslintLoaderOptions} from './lib/typings';

const defaultTslintLoaderOptions: ITslintLoaderOptions = {
  formatter: 'Custom',
  formattersDirectory: `${__dirname}/formatters/`,
  tsConfigFile: 'tsconfig.json',
  fix: false
};

function resolveFile(configPath: string): string {
  return isAbsolute(configPath)
    ? configPath
    : resolve(process.cwd(), configPath);
}

function resolveOptions(loaderContext: loader.ITslintLoaderContext): ITslintLoaderOptions {
  const loaderOptions: ITslintLoaderOptions = !isNil(loaderContext.options.tslint)
    ? loaderContext.options.tslint
    : {};
  const queryOptions: ITslintLoaderOptions = getOptions(loaderContext);
  const tslintLoaderOptions: ITslintLoaderOptions = Object.assign(
    {},
    defaultTslintLoaderOptions,
    loaderOptions,
    queryOptions);
  tslintLoaderOptions.configuration = parseConfigFile(loaderContext, tslintLoaderOptions);
  return tslintLoaderOptions;
}

function parseConfigFile(loaderContext: loader.ITslintLoaderContext,
                         tslintLoaderOptions: ITslintLoaderOptions): Configuration.IConfigurationFile {
  if (isNil(tslintLoaderOptions.configuration)) {
    const configFile: string = isString(tslintLoaderOptions.configFile)
      ? resolveFile(tslintLoaderOptions.configFile)
      : null;
    return Linter.findConfiguration(configFile, loaderContext.resourcePath).results;
  }
  return Configuration.parseConfigFile(<Configuration.RawConfigFile> <{}> tslintLoaderOptions.configuration);
}

function lint(loaderContext: loader.ITslintLoaderContext,
              tslintLoaderOptions: ITslintLoaderOptions,
              source: string): void {
  const lintOptions: ILinterOptions = {
    fix: tslintLoaderOptions.fix,
    formatter: tslintLoaderOptions.formatter,
    formattersDirectory: tslintLoaderOptions.formattersDirectory,
    rulesDirectory: ''
  };
  let program: Program;
  if (tslintLoaderOptions.typeCheck) {
    const tsconfigPath: string = resolveFile(tslintLoaderOptions.tsConfigFile);
    program = getProgram(tsconfigPath);
  }
  const linter: Linter = new Linter(lintOptions, program);
  linter.lint(loaderContext.resourcePath, source, <Configuration.IConfigurationFile> tslintLoaderOptions.configuration);
  const result: LintResult = linter.getResult();
  report(loaderContext, tslintLoaderOptions, result);
}

function report(loaderContext: loader.ITslintLoaderContext,
                tslintLoaderOptions: ITslintLoaderOptions,
                result: LintResult): void {
  if (isEmpty(result.failures)) {
    return;
  }
  const err: Error = new Error(result.output);
  delete err.stack;
  const emitter: (message: Error | string) => void = tslintLoaderOptions.emitErrors ?
    loaderContext.emitError :
    loaderContext.emitWarning;
  emitter(err);

  if (!isNil(tslintLoaderOptions.fileOutput) && isString(tslintLoaderOptions.fileOutput.dir)) {
    writeToFile(tslintLoaderOptions.fileOutput, result);
  }

  if (tslintLoaderOptions.failOnHint) {
    let messages: string = '';
    if (loaderContext.options.bail === true) {
      messages = `\n\n${loaderContext.resourcePath}\n${result.output}`;
    }
    throw new Error(`Compilation failed due to tslint errors.${messages}`);
  }
}

function writeToFile(fileOutputOpts: ITslintLoaderFileOutputOptions,
                     result: LintResult): void {
  if (fileOutputOpts.clean === true) {
    rimraf(fileOutputOpts.dir);
  }
  if (!isEmpty(result.failures)) {
    mkdirp(fileOutputOpts.dir);
    const relativePath: string = relative('./', result.failures[0].getFileName());
    const targetPath: string = join(fileOutputOpts.dir, dirname(relativePath));
    mkdirp(targetPath);
    const extension: string = isString(fileOutputOpts.ext)
      ? fileOutputOpts.ext
      : 'txt';
    const targetFilePath: string = join(fileOutputOpts.dir, `${relativePath}.${extension}`);
    let contents: string = result.output;
    if (isString(fileOutputOpts.header)) {
      contents = fileOutputOpts.header + contents;
    }
    if (isString(fileOutputOpts.footer)) {
      contents = contents + fileOutputOpts.footer;
    }
    writeFileSync(targetFilePath, contents);
  }
}

export default function loader (this: loader.ITslintLoaderContext,
                                source: string | Buffer,
                                sourceMap: string | Buffer): void {
  this.cacheable();
  const callback: loader.loaderCallback = this.async();
  const tslintLoaderOptions: ITslintLoaderOptions = resolveOptions(this);
  lint(this, tslintLoaderOptions, source.toString());
  callback(null, source, sourceMap);
}

export {TslintPlugin};
export * from './lib/typings';
