import {Compiler, Plugin} from 'webpack';
import {clearProgram} from './programInstance';

class TslintPlugin implements Plugin {
  public apply(compiler: Compiler): void {
    // Clear the program on each iteration of done
    compiler.plugin('done', clearProgram);
  }
}

export default TslintPlugin;
