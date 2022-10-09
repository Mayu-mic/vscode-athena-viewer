import { ExtensionContext, Memento } from 'vscode';

export abstract class WorkspaceStateRepository {
  private state: Memento;

  constructor(ctx: ExtensionContext) {
    this.state = ctx.workspaceState;
  }

  protected getConfig<T>(key: string): T | undefined {
    return this.state.get<T>(key);
  }

  protected setConfig<T>(key: string, value: T): void {
    this.state.update(key, value);
  }
}
