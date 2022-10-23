import {
  commands,
  languages,
  ProgressLocation,
  TextDocumentShowOptions,
  Uri,
  ViewColumn,
  window,
  workspace,
} from 'vscode';
import { AthenaClientWrapper, QueryResult } from '../athena';
import { CredentialsRepository } from '../credentials/credentialsRepository';
import { CredentialsProvider } from '../credentials/credentialsProvider';
import { localeString } from '../i18n';
import { stringify } from 'csv-stringify/sync';
import { PREVIEW_DOCUMENT_SCHEME } from '../constants';
import { ISQLLogRepository } from '../sqlLog/sqlLogRepository';
import { SQLLog } from '../sqlLog/sqlLog';
import { randomUUID } from 'crypto';
import { ProfileRepository } from '../profile/profileRepository';
import { ConnectionRepository } from '../connection/connectionRepository';
import { StatisticsOutputChannel } from '../output/statistics';

export class QueryCommandProvider {
  private DEFAULT_PREVIEW_LIMIT = 10;

  constructor(
    private connectionsRepository: ConnectionRepository,
    private profileRespository: ProfileRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: CredentialsProvider,
    private sqlLogRepository: ISQLLogRepository,
    private statisticsOutputChannel: StatisticsOutputChannel
  ) {}

  async runQueryCommand() {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage(localeString('editor-not-found'));
      return;
    }
    const editorText = editor.document.getText();
    await this.runQuery(editorText, true);
  }

  async showTablesCommand(database: string, table: string) {
    const sql = `select * from "${database}"."${table}" limit ${this.DEFAULT_PREVIEW_LIMIT};`;
    const doc = await workspace.openTextDocument({
      language: 'sql',
      content: sql,
    });
    await window.showTextDocument(doc, {
      viewColumn: ViewColumn.One,
    });

    await this.runQuery(sql);
  }

  async queryLogCommand(sqlLog: SQLLog) {
    const sql = sqlLog.statement;
    const doc = await workspace.openTextDocument({
      language: 'sql',
      content: sql,
    });
    await window.showTextDocument(doc, {
      viewColumn: ViewColumn.One,
    });

    await this.runQuery(sql);
  }

  private async runQuery(query: string, addLog = false) {
    const profile = this.profileRespository.getProfile();
    if (!profile) {
      window.showErrorMessage(localeString('profile-not-found'));
      return;
    }
    const connection = this.connectionsRepository.getConnection();
    if (!connection) {
      window.showErrorMessage(localeString('connection-not-found'));
      return;
    }
    let credentials = this.credentialsRepository.getCredentials(profile.id);
    if (!credentials) {
      credentials = await this.credentialsProvider.provideCredentials(
        profile.id
      );
      if (!credentials) {
        return;
      }
      this.credentialsRepository.setCredentials(profile.id, credentials);
    }

    let result: QueryResult;
    await window
      .withProgress(
        {
          title: 'Run Query',
          location: ProgressLocation.Notification,
        },
        async () => {
          const client = new AthenaClientWrapper(
            connection.region.id,
            credentials!
          );
          result = await client.runQuery(query, connection.workgroup);
        }
      )
      .then(
        async () => {
          window.showInformationMessage(
            `Query ok with ${result.rows.length} results.`
          );

          const table = [result.columns, ...result.rows];
          const csv = stringify(table, { quoted_string: true });

          this.showStatistics(result);
          await this.showPreviewDocument(csv, 'csv', {
            viewColumn: ViewColumn.Two,
            preview: false,
            preserveFocus: true,
          });

          if (addLog) {
            this.addLog(query);
          }
        },
        (e: any) => {
          window.showErrorMessage(e.message);
          return;
        }
      );
  }

  private addLog(statement: string) {
    const log: SQLLog = {
      id: randomUUID(),
      statement,
      loggedDate: new Date(),
    };
    this.sqlLogRepository.add(log);
    commands.executeCommand('vscode-athena-viewer.refreshSQLLogs');
  }

  private showStatistics(result: QueryResult) {
    this.statisticsOutputChannel.clear();
    if (result.statistics) {
      this.statisticsOutputChannel.outputStatistics({
        outputLines: result.rows.length,
        dataScannedInBytes: result.statistics.DataScannedInBytes ?? 0,
        totalExecutionTime: result.statistics.TotalExecutionTimeInMillis ?? 0,
        queryQueueTime: result.statistics.QueryQueueTimeInMillis ?? 0,
      });
      this.statisticsOutputChannel.show();
    }
  }

  private async showPreviewDocument(
    text: string,
    languageId?: string,
    options?: TextDocumentShowOptions
  ) {
    const uri = Uri.parse(`${PREVIEW_DOCUMENT_SCHEME}:${text}`);
    const doc = await workspace.openTextDocument(uri);
    if (languageId) {
      languages.setTextDocumentLanguage(doc, languageId);
    }
    await window.showTextDocument(doc, options);
  }
}
