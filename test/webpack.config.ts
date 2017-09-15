import {resolve} from 'path';
import {Configuration} from 'webpack';
import {TslintPlugin} from '../index';

export default function webpackConfig (): Configuration {
  return {
    entry: {
      engine: resolve(__dirname, 'fixtures', 'app', 'DieselEngine.ts')
    },
    resolve: {
      extensions: ['.ts']
    },
    plugins: [
      new TslintPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          enforce: 'pre',
          use: {
            loader: './index',
            options: {
              configFile: resolve(__dirname, 'fixtures', 'tslint.json'),
              tsConfigFile: resolve(__dirname, 'fixtures', 'tsconfig.json')
            }
          }
        },
        {
          test: /\.ts$/,
          loader: 'awesome-typescript-loader',
          query: { silent: true }
        }
      ]
    },
    output: {
      filename: '[name].bundle.js',
      path: resolve(__dirname, '.tmp')
    }
  };
}
