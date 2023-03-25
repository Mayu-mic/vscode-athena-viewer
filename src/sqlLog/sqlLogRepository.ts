import { ExtensionContext } from 'vscode';
import {
  MementoStateAccessor,
  StateAccessor,
} from '../infrastracture/stateAccessor';
import { SQLLog, SQLLogJson } from './sqlLog';

export interface SQLLogRepository {
  add(sqlLog: SQLLog): void;
  delete(id: string): void;
  list(): SQLLog[];
  clear(): void;
}

export class WorkspaceStateSQLLogRepository implements SQLLogRepository {
  private KEY = 'sql-logs';

  constructor(private accessor: StateAccessor<SQLLogJson[]>) {}

  add(sqlLog: SQLLog): void {
    const logs = this.getSQLLogs();
    logs.unshift(sqlLog);
    this.setSQLLogs(logs);
  }

  list(): SQLLog[] {
    return this.getSQLLogs();
  }

  delete(id: string): void {
    let logs = this.getSQLLogs();
    logs = logs.filter((log) => log.id !== id);
    this.setSQLLogs(logs);
  }

  clear(): void {
    this.setSQLLogs([]);
  }

  private getSQLLogs(): SQLLog[] {
    const logs = this.accessor.get(this.KEY) ?? [];
    return logs.map((log) => ({
      ...log,
      loggedDate: new Date(log.loggedDate),
    }));
  }

  private setSQLLogs(sqlLogs: SQLLog[]): void {
    const json = sqlLogs.map((log) => ({
      ...log,
      loggedDate: log.loggedDate.getTime(),
    }));
    this.accessor.set(this.KEY, json);
  }

  static createDefault(ctx: ExtensionContext): WorkspaceStateSQLLogRepository {
    const accessor = new MementoStateAccessor<SQLLogJson[]>(ctx);
    return new WorkspaceStateSQLLogRepository(accessor);
  }
}
