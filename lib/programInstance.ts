import {isNil} from 'lodash';
import {Linter} from 'tslint';
import {Program} from 'typescript';

let program: Program;

export function getProgram (configFile: string,
                            projectDirectory?: string): Program {
  if (isNil(program)) {
    program = Linter.createProgram(configFile, projectDirectory);
  }
  return program;
}

export function clearProgram (): void {
  program = null;
}
