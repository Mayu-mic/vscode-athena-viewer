import {
  MementoStateAccessor,
  StateAccessor,
} from '../../infrastracture/stateAccessor';
import { Connection } from './connection';
import { ExtensionContext } from 'vscode';

export interface ConnectionRepository {
  getConnection(): Connection | undefined;
  setConnection(connection: Connection): void;
}

export class WorkspaceStateConnectionRepository
  implements ConnectionRepository
{
  private KEY = 'connection';

  constructor(private accessor: StateAccessor<Connection>) {}

  getConnection(): Connection | undefined {
    return this.accessor.get(this.KEY);
  }

  setConnection(connection: Connection): void {
    this.accessor.set(this.KEY, connection);
  }

  static createDefault(
    ctx: ExtensionContext
  ): WorkspaceStateConnectionRepository {
    const accessor = new MementoStateAccessor<Connection>(ctx);
    return new WorkspaceStateConnectionRepository(accessor);
  }
}
