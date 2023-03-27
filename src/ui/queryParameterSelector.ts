import { QuickPickItem, window } from 'vscode';
import { QueryParameter } from '../domain/queryParameter/queryParameter';
import { QueryParameterRepository } from '../domain/queryParameter/queryParameterRepository';

export class QueryParameterSelector {
  constructor(private repository: QueryParameterRepository) {}

  async show(): Promise<QueryParameter | undefined> {
    const parameters = this.repository.getParameters();
    const items: QuickPickItem[] = parameters.map((p) => ({
      label: p.items.map((i) => i.text).join(','),
    }));

    const input = await this.showQuickPickWithInput(items);

    if (input === undefined) {
      return undefined;
    }

    const parameter = this.inputToParameterItems(input);
    if (parameter.items.length > 0) {
      this.repository.addParameter(parameter);
    }
    return parameter;
  }

  private async showQuickPickWithInput(
    items: QuickPickItem[]
  ): Promise<QuickPickItem | undefined> {
    return new Promise((resolve) => {
      const quickPick = window.createQuickPick();
      quickPick.items = items;
      quickPick.title = 'Are you perhaps using parameters?';
      quickPick.placeholder = "ex) 'param1','param2','param3'";
      quickPick.onDidChangeValue(() => {
        if (!items.map((i) => i.label).includes(quickPick.value)) {
          quickPick.items = [
            { label: quickPick.value, description: 'Add new parameter' },
            ...items,
          ];
        }
      });
      quickPick.onDidAccept(() => {
        const selection = quickPick.activeItems[0];
        resolve(selection);
        quickPick.hide();
      });
      quickPick.onDidHide(() => {
        resolve(undefined);
      });
      quickPick.show();
    });
  }

  private inputToParameterItems(input: QuickPickItem): QueryParameter {
    const texts = (input.label || undefined)?.split(',') || [];
    const parameters: QueryParameter = {
      items: texts.map((row) => ({
        text: row,
      })),
    };
    return parameters;
  }
}
