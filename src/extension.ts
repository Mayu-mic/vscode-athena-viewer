// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { QueryCommandProvider } from './commands/queryCommandProvider';
import { PREVIEW_DOCUMENT_SCHEME } from './constants';
import { WorkspaceStateCredentialsRepository } from './domain/credentials/credentialsRepository';
import { WorkspaceStateSQLLogRepository } from './domain/sqlLog/sqlLogRepository';
import { SQLLogItem, SQLLogsViewProvider } from './ui/view/sqlLogsView';
import { AthenaTableViewer } from './ui/tableViewer';
import { ProfileStatusView } from './ui/view/profileStatusView';
import { ConnectionsViewProvider, TableItem } from './ui/view/connectionsView';
import { WorkspaceStateConnectionRepository } from './domain/connection/connectionRepository';
import { RegionQuickPick } from './ui/regionQuickPick';
import { SwitchRegionCommandProvider } from './commands/switchRegion';
import { SwitchProfileCommandProvider } from './commands/switchProfile';
import { WorkspaceStateProfileRepository } from './domain/profile/profileRepository';
import { ProfileInputBox } from './ui/profileInputBox';
import { WorkgroupInputBox as WorkgroupInputBox } from './ui/workgroupInputBox';
import { InputWorkgroupCommandProvider as InputWorkgroupCommandProvider } from './commands/inputWorkgroup';
import { VSCodeStatisticsOutputChannel } from './domain/statistics/statisticsOutputChannel';
import { QueryParameterSelector } from './ui/queryParameterSelector';
import { WorkspaceStateQueryParameterRepository } from './domain/queryParameter/queryParameterRepository';
import { DefaultQueryRunner, QueryRunner } from './commands/queryRunner';
import { AWSCredentialsInputBox } from './ui/awsCredentialsInputBox';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  const connectionRepository =
    WorkspaceStateConnectionRepository.createDefault(context);
  const profileRepository =
    WorkspaceStateProfileRepository.craeteDefault(context);
  const credentialsRepository =
    WorkspaceStateCredentialsRepository.createDefault(context);
  const credentialsProvider = new AWSCredentialsInputBox();
  const connectionView = new ConnectionsViewProvider(
    connectionRepository,
    profileRepository,
    credentialsRepository,
    credentialsProvider
  );

  const sqlLogsRepository =
    WorkspaceStateSQLLogRepository.createDefault(context);
  const sqlLogsView = new SQLLogsViewProvider(sqlLogsRepository);

  const outputChannel = new VSCodeStatisticsOutputChannel();
  const queryParameterRepository =
    WorkspaceStateQueryParameterRepository.createDefault(context);
  const queryParameterSelector = new QueryParameterSelector(
    queryParameterRepository
  );
  const queryRunner: QueryRunner = new DefaultQueryRunner(
    connectionRepository,
    profileRepository,
    credentialsRepository,
    credentialsProvider,
    outputChannel,
    queryParameterSelector,
    sqlLogsRepository
  );
  const queryCommandProvider = new QueryCommandProvider(queryRunner);

  const profileProvider = new ProfileInputBox();
  const switchProfileCommandProvider = new SwitchProfileCommandProvider(
    profileRepository,
    profileProvider
  );
  const profileStatusViewProvider = new ProfileStatusView(profileRepository);
  switchProfileCommandProvider.onChangeProfileStatus(() => {
    profileStatusViewProvider.refresh();
  });
  const regionsProvider = new RegionQuickPick();
  const switchRegionCommandProvider = new SwitchRegionCommandProvider(
    connectionRepository,
    regionsProvider
  );

  const workgroupProvider = new WorkgroupInputBox(connectionRepository);
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
