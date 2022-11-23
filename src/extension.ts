// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueryCommandProvider } from './commands/query';
import { PREVIEW_DOCUMENT_SCHEME } from './constants';
import { WorkspaceStateCredentialsRepository } from './credentials/credentialsRepository';
import { AWSCredentialsProvider } from './credentials/credentialsProvider';
import { SQLLogWorkspaceRepository } from './sqlLog/sqlLogRepository';
import { SQLLogItem, SQLLogsViewProvider } from './sqlLog/sqlLogsView';
import { AthenaTableViewer } from './ui/tableViewer';
import { ProfileStatusViewProvider } from './profile/profileStatusView';
import {
  ConnectionsViewProvider,
  TableItem,
} from './connection/connectionView';
import { WorkspaceStateConnectionRepository } from './connection/connectionRepository';
import { QuickPickRegionProvider } from './connection/regionProvider';
import { SwitchRegionCommandProvider } from './commands/switchRegion';
import { SwitchProfileCommandProvider } from './commands/switchProfile';
import { WorkspaceStateProfileRepository } from './profile/profileRepository';
import { InputBoxProfileProvider } from './profile/profileProvider';
import { InputBoxWorkgroupProvider as InputBoxWorkgroupProvider } from './connection/workgroupProvider';
import { InputWorkgroupCommandProvider as InputWorkgroupCommandProvider } from './commands/inputWorkgroup';
import { VSCodeStatisticsOutputChannel } from './output/statisticsOutputChannel';
import { QueryParameterSelectorProvider } from './queryParameter/queryParameterSelectorProvider';
import { WorkspaceStateQueryParameterRepository } from './queryParameter/queryParameterRepository';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const connectionRepository = new WorkspaceStateConnectionRepository(context);
  const profileRepository = new WorkspaceStateProfileRepository(context);
  const credentialsRepository = new WorkspaceStateCredentialsRepository(
    context
  );
  const credentialsProvider = new AWSCredentialsProvider();
  const connectionView = new ConnectionsViewProvider(
    connectionRepository,
    profileRepository,
    credentialsRepository,
    credentialsProvider
  );

  const sqlLogsRepository = new SQLLogWorkspaceRepository(context);
  const sqlLogsView = new SQLLogsViewProvider(sqlLogsRepository);

  const outputChannel = new VSCodeStatisticsOutputChannel();
  const queryParameterRepository = new WorkspaceStateQueryParameterRepository(
    context
  );
  const queryParameterSelectorProvider = new QueryParameterSelectorProvider(
    queryParameterRepository
  );
  const queryCommandProvider = new QueryCommandProvider(
    connectionRepository,
    profileRepository,
    credentialsRepository,
    credentialsProvider,
    sqlLogsRepository,
    outputChannel,
    queryParameterSelectorProvider
  );

  const profileProvider = new InputBoxProfileProvider();
  const switchProfileCommandProvider = new SwitchProfileCommandProvider(
    profileRepository,
    profileProvider
  );
  const profileStatusViewProvider = new ProfileStatusViewProvider(
    profileRepository
  );
  switchProfileCommandProvider.onChangeProfileStatus(() => {
    profileStatusViewProvider.refresh();
  });
  const regionsProvider = new QuickPickRegionProvider();
  const switchRegionCommandProvider = new SwitchRegionCommandProvider(
    connectionRepository,
    regionsProvider
  );

  const workgroupProvider = new InputBoxWorkgroupProvider(connectionRepository);
  const inputWorkgroupCommandProvider = new InputWorkgroupCommandProvider(
    workgroupProvider,
    connectionRepository
  );

  const disposables = [
    vscode.commands.registerCommand('vscode-athena-viewer.runQuery', () =>
      queryCommandProvider.runQueryCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.showTable',
      (item: TableItem) =>
        queryCommandProvider.showTablesCommand(
          item.parent.database.Name!,
          item.table.Name!
        )
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.switchProfile', () =>
      switchProfileCommandProvider.switchProfileCommand()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.switchRegion', () =>
      switchRegionCommandProvider.switchRegionCommand()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.inputWorkgroup', () =>
      inputWorkgroupCommandProvider.inputWorkgroupCommand()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.refreshConnection',
      () => connectionView.refresh()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.refreshSQLLogs', () =>
      sqlLogsView.refresh()
    ),
    vscode.commands.registerCommand('vscode-athena-viewer.clearSQLLogs', () =>
      sqlLogsView.clear()
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.copyTableName',
      (item: TableItem) => {
        const text = `"${item.parent.database.Name}"."${item.table.Name}"`;
        vscode.env.clipboard.writeText(text);
      }
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.runSQLLog',
      (item: SQLLogItem) => queryCommandProvider.queryLogCommand(item.sqlLog)
    ),
    vscode.commands.registerCommand(
      'vscode-athena-viewer.deleteSQLLog',
      (item: SQLLogItem) => sqlLogsView.deleteLog(item.sqlLog)
    ),
    vscode.window.registerTreeDataProvider('view-connection', connectionView),
    vscode.window.registerTreeDataProvider('view-sql-logs', sqlLogsView),
    vscode.workspace.registerTextDocumentContentProvider(
      PREVIEW_DOCUMENT_SCHEME,
      new AthenaTableViewer()
    ),
    profileStatusViewProvider.provide(),
    outputChannel,
  ];

  disposables.forEach((disposable) => context.subscriptions.push(disposable));
}

// this method is called when your extension is deactivated
export function deactivate() {}
