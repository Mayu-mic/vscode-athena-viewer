// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueryCommandProvider } from './commands/query';
import { SetupConfigsCommandProvider } from './commands/setup-configs';
import { WorkspaceStateConfigRepository } from './config/config-repository';
import { PREVIEW_DOCUMENT_SCHEME } from './constants';
import {
  CredentialsProvider,
  WorkspaceStateCredentialsRepository,
} from './credentials/credentials';
import { SQLLogWorkspaceRepository } from './sql-log/sql-log-repository';
import { SQLLogItem, SQLLogsViewProvider } from './sql-log/sql-logs-view';
import { InputBoxConfigurationProvider } from './ui/input-box';
import { AthenaTableViewer } from './ui/table-viewer';
import { DatabasesViewProvider, TableItem } from './view/databases-view';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const configRepository = new WorkspaceStateConfigRepository(context);
  const configProvider = new InputBoxConfigurationProvider();
  const credentialsRepository = new WorkspaceStateCredentialsRepository(
    context
  );
  const credentialsProvider = new CredentialsProvider();
  const databasesView = new DatabasesViewProvider(
    configRepository,
    credentialsRepository,
    credentialsProvider
  );

  const sqlLogsRepository = new SQLLogWorkspaceRepository(context);
  const sqlLogsView = new SQLLogsViewProvider(sqlLogsRepository);

  const queryCommandProvider = new QueryCommandProvider(
    configRepository,
    configProvider,
    credentialsRepository,
    credentialsProvider,
    sqlLogsRepository
  );
  const setupConfigsCommandProvider = new SetupConfigsCommandProvider(
    configRepository,
    configProvider
  );

  const disposables = [
    vscode.commands.registerCommand('vscode-athena-viewer.runQuery', () =>
      queryCommandProvider.runQueryCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.showTable',
      (item: TableItem) => queryCommandProvider.showTablesCommand(item)
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.setupConfigs', () =>
      setupConfigsCommandProvider.setupConfigsCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.refreshDatabases',
      () => databasesView.refresh()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.refreshSQLLogs', () =>
      sqlLogsView.refresh()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.clearSQLLogs', () =>
      sqlLogsView.clear()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.runSQLLog',
      (item: SQLLogItem) => queryCommandProvider.queryLogCommand(item)
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.deleteSQLLog',
      (item: SQLLogItem) => sqlLogsView.deleteLog(item)
    ),
    vscode.window.registerTreeDataProvider('view-databases', databasesView),
    vscode.window.registerTreeDataProvider('view-sql-logs', sqlLogsView),
    vscode.workspace.registerTextDocumentContentProvider(
      PREVIEW_DOCUMENT_SCHEME,
      new AthenaTableViewer()
    ),
  ];

  disposables.forEach((disposable) => context.subscriptions.push(disposable));
}

// this method is called when your extension is deactivated
export function deactivate() {}
