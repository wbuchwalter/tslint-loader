import {Formatters, RuleFailure} from 'tslint';

export class Formatter extends Formatters.AbstractFormatter {
  public format(failures: RuleFailure[]): string {
    return failures.map((failure: RuleFailure) =>
      `${failure.getFailure()}\n`).join('');
  }
}
