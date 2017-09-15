import {Formatters, RuleFailure} from 'tslint';
import {LineAndCharacter} from 'typescript';

export class Formatter extends Formatters.AbstractFormatter {
  public format (failures: RuleFailure[]): string {
    return failures.map((failure: RuleFailure) => {
      const {line, character}: LineAndCharacter = failure.getStartPosition().getLineAndCharacter();
      return `[${line + 1}, ${character + 1}]: ${failure.getFailure()}\n`;
    }).join('');
  }
}
