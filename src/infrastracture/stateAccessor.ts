import { ExtensionContext, Memento } from 'vscode';

export interface StateAccessor<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
}

export class MementoStateAccessor<T> implements StateAccessor<T> {
  private state: Memento;

  constructor(ctx: ExtensionContext) {
    this.state = ctx.globalState;
  }

  get(key: string): T | undefined {
    return this.state.get<T>(key);
  }

  set(key: string, value: T): void {
    this.state.update(key, value);
  }

  delete(key: string): void {
    this.state.update(key, undefined);
  }
}
