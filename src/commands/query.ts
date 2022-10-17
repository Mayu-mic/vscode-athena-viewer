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
import { ConfigurationRepository } from '../config/configRepository';
import { CredentialsRepository } from '../credentials/credentialsRepository';
import { CredentialsProvider } from '../credentials/credentialsProvider';
import { localeString } from '../i18n';
import { stringify } from 'csv-stringify/sync';
import { PREVIEW_DOCUMENT_SCHEME } from '../constants';
import { ISQLLogRepository } from '../sqlLog/sqlLogRepository';
import { SQLLog } from '../sqlLog/sqlLog';
import { randomUUID } from 'crypto';

export class QueryCommandProvider {
  private DEFAULT_PREVIEW_LIMIT = 10;

  constructor(
    private configRepository: ConfigurationRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: CredentialsProvider,
    private sqlLogRepository: ISQLLogRepository
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
    const configs = this.configRepository.getConfig();
    if (!configs) {
      window.showErrorMessage(localeString('config-not-found'));
      return;
    }
    const { profile, region, workgroup } = configs;
    let credentials = this.credentialsRepository.getCredentials(profile);
    if (!credentials) {
      credentials = await this.credentialsProvider.provideCredentials(profile);
      if (!credentials) {
        return;
      }
      this.credentialsRepository.setCredentials(profile, credentials);
    }

    let result: QueryResult;
    await window
      .withProgress(
        {
          title: 'Run Query',
          location: ProgressLocation.Notification,
        },
        async () => {
          const client = new AthenaClientWrapper(region, credentials!);
          result = await client.runQuery(query, workgroup);
        }
      )
      .then(
        async () => {
          window.showInformationMessage(
            `Query ok with ${result.rows.length} results.`
          );

          const table = [result.columns, ...result.rows];
          const csv = stringify(table, { quoted_string: true });

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
