import { window } from 'vscode';
import { QueryParameter } from './queryParameter';
import { QueryParameterRepository } from './queryParameterRepository';

export class QueryParameterSelectorProvider {
  constructor(private repository: QueryParameterRepository) {}

  async provide(): Promise<QueryParameter | undefined> {
    const input = await window.showInputBox({
      title: 'Are you perhaps using parameters?',
      placeHolder: "ex) 'param1','param2','param3'",
    });

    if (input === undefined) {
      return undefined;
    }

    const parameters = this.inputToParameterItems(input);
    this.repository.addParameter(parameters);
    return parameters;
  }

  private inputToParameterItems(input: string): QueryParameter {
    const texts = (input || undefined)?.split(',') || [];
    const parameters: QueryParameter = {
      items: texts.map((row) => ({
        text: row,
      })),
    };
    return parameters;
  }
}
