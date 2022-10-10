import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode';
import { truncate } from '../util';
import { SQLLog } from './sql-log';
import { ISQLLogRepository } from './sql-log-repository';

export class SQLLogsViewProvider implements TreeDataProvider<SQLLogItem> {
  constructor(private sqlLogsRepository: ISQLLogRepository) {}

  private _onDidChangeTreeData: EventEmitter<
    SQLLogItem | undefined | null | void
  > = new EventEmitter();
  readonly onDidChangeTreeData: Event<SQLLogItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

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

  deleteLog(item: SQLLogItem) {
    const id = item.sqlLog.id;
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
