import {OptionObject} from 'loader-utils';
import {Configuration} from 'tslint';

export interface ITslintLoaderFileOutputOptions {
  clean?: boolean;
  dir?: string;
  ext?: string;
  header?: string;
  footer?: string;
}

export interface ITslintLoaderOptions extends OptionObject {
  formatter?: string;
  formattersDirectory?: string;
  configFile?: string;
  configuration?: Configuration.IConfigurationFile | Configuration.RawConfigFile;
  tsConfigFile?: string;
  fix?: boolean;
  emitErrors?: boolean;
  failOnHint?: boolean;
  typeCheck?: boolean;
  fileOutput?: ITslintLoaderFileOutputOptions;
}

import * as webpack from 'webpack';
declare module 'webpack' {
  namespace loader {
    interface ITslintLoaderContext extends LoaderContext {
      options: {tslint?: ITslintLoaderOptions, bail?: boolean};
    }
  }
}
