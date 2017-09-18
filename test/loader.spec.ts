/* tslint:disable:no-unused-expression */
import {expect} from 'chai';
import {resolve} from 'path';
import {Stats} from 'webpack';
import webpackRunner from './webpackRunner';

interface IStatsJson {
  assets: string[];
  chunks: string[];
  warnings: string[];
  errors: string[];
}

describe('TslintLoader', () => {
  it('should lint typescript files and output warning', () =>
    webpackRunner().then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.true;

      const result: IStatsJson = <IStatsJson> stats.toJson();
      expect(result.assets.length).to.eql(1);
      expect(result.chunks.length).to.eql(1);
      expect(result.warnings).to.eql([
        './test/fixtures/app/DieselEngine.ts\n[7, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    }));

  it('should overwrite configuration in tslint json', () =>
    webpackRunner({
      configuration: {
        rules: {
          'no-console': [false]
        }
      }
    }).then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
    }));

  it('should use custom tslint file when option given', () =>
    webpackRunner({
      configFile: resolve(__dirname, 'fixtures', 'tslint-custom.json')
    }).then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.false;
      expect(stats.hasWarnings()).to.be.false;
    }));

  it('should emit linting failure as error when forced to', () =>
    webpackRunner({
      emitErrors: true
    }).then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      const result: IStatsJson = <IStatsJson> stats.toJson();
      expect(result.errors).to.eql([
        './test/fixtures/app/DieselEngine.ts\n[7, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    }));

  it('should accept options from query string also', () =>
    webpackRunner(null, {
      module: {
        loaders: [
          {
            test: /\.ts$/,
            enforce: 'pre',
            loader: './index?emitErrors=true'
          },
          {
            test: /\.ts$/,
            loader: 'awesome-typescript-loader',
            query: { silent: true }
          }
        ]
      }
    }).then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.false;

      const result: IStatsJson = <IStatsJson> stats.toJson();
      expect(result.errors).to.eql([
        './test/fixtures/app/DieselEngine.ts\n[7, 1]: Calls to \'console.log\' are not allowed.\n'
      ]);
    }));

  it('should fail on linting failure when forced to', () =>
    webpackRunner({
      failOnHint: true
    }).then((stats: Stats) => {
      expect(stats.hasErrors()).to.be.true;
      expect(stats.hasWarnings()).to.be.true;

      const result: IStatsJson = <IStatsJson> stats.toJson();
      expect(result.errors[0]).to.contain('Module build failed: Error: Compilation failed due to tslint errors.');
    }));

  it('should use type checked rules when forced to', () =>
    webpackRunner(
      {
        typeCheck: true,
        configuration: {
          rules: {
            'no-for-in-array': true
          }
        }
      },
      {
        entry: {
          engine: resolve(__dirname, 'fixtures', 'app', 'forInArray.ts')
        }
      }).then((stats: Stats) => {
        expect(stats.hasErrors()).to.be.false;
        expect(stats.hasWarnings()).to.be.true;

        const result: IStatsJson = <IStatsJson> stats.toJson();

        expect(result.warnings).to.eql([
          './test/fixtures/app/forInArray.ts\n[3, 1]: for-in loops over arrays are forbidden. Use for-of or array.forEach instead.\n'
        ]);
      }));

  it('should use type checked rules also with custom tsconfig file', () =>
    webpackRunner(
      {
        typeCheck: true,
        tsConfigFile: resolve(__dirname, 'fixtures', 'tsconfig-custom.json'),
        configuration: {
          rules: {
            'no-for-in-array': true
          }
        }
      },
      {
        entry: {
          engine: resolve(__dirname, 'fixtures', 'app', 'forInArray.ts')
        }
      }).then((stats: Stats) => {
        expect(stats.hasErrors()).to.be.false;
        expect(stats.hasWarnings()).to.be.true;

        const result: IStatsJson = <IStatsJson> stats.toJson();

        expect(result.warnings).to.eql([
          './test/fixtures/app/forInArray.ts\n[3, 1]: for-in loops over arrays are forbidden. Use for-of or array.forEach instead.\n'
        ]);
      }));

  it('should use custom formatter with custom directory', () =>
    webpackRunner({
      formattersDirectory: resolve(__dirname, 'fixtures', 'formatters'),
      formatter: 'Simple'
    }).then((stats: Stats) => {
      const result: IStatsJson = <IStatsJson> stats.toJson();
      expect(result.warnings).to.eql([
        './test/fixtures/app/DieselEngine.ts\nCalls to \'console.log\' are not allowed.\n'
      ]);
    }));
});
