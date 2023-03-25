import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode';
import { truncate } from '../../util';
import { SQLLog } from '../../domain/sqlLog/sqlLog';
import { SQLLogRepository } from '../../domain/sqlLog/sqlLogRepository';

export class SQLLogsViewProvider implements TreeDataProvider<SQLLogItem> {
  constructor(private sqlLogsRepository: SQLLogRepository) {}

  private _onDidChangeTreeData: EventEmitter<void> = new EventEmitter();
  readonly onDidChangeTreeData: Event<void> = this._onDidChangeTreeData.event;

  getTreeItem(element: SQLLogItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(): ProviderResult<SQLLogItem[]> {
    const logs = this.sqlLogsRepository.list();
    return logs.map((log) => new SQLLogItem(log));
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  clear() {
    this.sqlLogsRepository.clear();
    this.refresh();
  }

  deleteLog(sqlLog: SQLLog) {
    const id = sqlLog.id;
    this.sqlLogsRepository.delete(id);
    this.refresh();
  }
}

export class SQLLogItem extends TreeItem {
  constructor(public readonly sqlLog: SQLLog) {
    super(SQLLogItem.toLabel(sqlLog), TreeItemCollapsibleState.None);
    this.tooltip = sqlLog.statement;
    this.description = sqlLog.loggedDate.toLocaleString();
    this.id = sqlLog.id;
    this.contextValue = 'sql-log';
  }

  private static SQL_LABEL_LENGTH = 40;

  private static toLabel(sqlLog: SQLLog): string {
    return truncate(
      sqlLog.statement.trim().replace('\n', ' '),
      this.SQL_LABEL_LENGTH
    );
  }
}
