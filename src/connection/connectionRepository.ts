import { WorkspaceStateRepository } from '../baseRepository';
import { Connection } from './connection';

export interface ConnectionRepository {
  getConnection(): Connection | undefined;
  setConnection(connection: Connection): void;
}

export class WorkspaceStateConnectionRepository
  extends WorkspaceStateRepository
  implements ConnectionRepository
{
  private KEY = 'connection';

  getConnection(): Connection | undefined {
    return this.get<Connection>(this.KEY);
  }

  setConnection(connection: Connection): void {
    this.set(this.KEY, connection);
  }
}
