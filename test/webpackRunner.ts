import * as es6Promisify from 'es6-promisify';
import {isNil} from 'lodash';
import * as webpack from 'webpack';
import {Configuration, NewLoader, NewModule, NewUseRule, Stats} from 'webpack';
import {ITslintLoaderOptions} from '../lib/typings';
import webpackConfig from './webpack.config';

export default function webpackRunner (tslintLoaderOptions?: ITslintLoaderOptions,
                                       additionalWebpackConfiguration?: Configuration): Promise<Stats> {
  const basicConfiguration: Configuration = webpackConfig();
  const tslintLoader: NewLoader = <NewLoader> (<NewUseRule> (<NewModule> basicConfiguration.module).rules[0]).use;
  if (!isNil(tslintLoaderOptions)) {
    Object.assign(tslintLoader.options, tslintLoaderOptions);
  }
  return es6Promisify(webpack)(Object.assign(basicConfiguration, additionalWebpackConfiguration));
}
