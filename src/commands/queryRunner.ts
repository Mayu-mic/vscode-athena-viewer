import * as AWS from '@aws-sdk/types';
import { randomUUID } from 'crypto';
import { stringify } from 'csv-stringify/sync';
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
import { Connection } from '../connection/connection';
import { ConnectionRepository } from '../connection/connectionRepository';
import { PREVIEW_DOCUMENT_SCHEME } from '../constants';
import { CredentialsProvider } from '../credentials/credentialsProvider';
import { CredentialsRepository } from '../credentials/credentialsRepository';
import { localeString } from '../i18n';
import { StatisticsOutputChannel } from '../output/statisticsOutputChannel';
import { ProfileRepository } from '../profile/profileRepository';
import { QueryParameter } from '../queryParameter/queryParameter';
import { QueryParameterSelector } from '../queryParameter/queryParameterSelector';
import { SQLLog } from '../sqlLog/sqlLog';
import { ISQLLogRepository } from '../sqlLog/sqlLogRepository';
import { isParameterizedQuery } from '../util';

export interface QueryRunner {
  runQuery(query: string): Promise<void>;
  runQuery(query: string, addLog: boolean): Promise<void>;
}

export class DefaultQueryRunner implements QueryRunner {
  constructor(
    private connectionsRepository: ConnectionRepository,
    private profileRespository: ProfileRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: CredentialsProvider,
    private statisticsOutputChannel: StatisticsOutputChannel,
    private queryParameterSelector: QueryParameterSelector,
    private sqlLogRepository: ISQLLogRepository
  ) {}

  async runQuery(query: string, addLog = false): Promise<void> {
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
        profile.id,
        connection.region
      );
      if (!credentials) {
        return;
      }
      this.credentialsRepository.setCredentials(profile.id, credentials);
    }

    try {
      const result = await this.showProgress(query, connection, credentials);
      if (!result) {
        return;
      }
      await this.showResult(result);
      this.showStatisticsOutput(result);
      if (addLog) {
        await this.addLog(query);
      }
    } catch (e: any) {
      window.showErrorMessage(e.message);
      return;
    }
  }

  private async showProgress(
    query: string,
    connection: Connection,
    credentials: AWS.Credentials
  ): Promise<QueryResult | undefined> {
    const client = new AthenaClientWrapper(connection.region.id, credentials);

    return await window.withProgress(
      {
        title: 'Run Query',
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (_, token) => {
        client.onQueryCancelEvent = token.onCancellationRequested;

        let parameters: QueryParameter | undefined = undefined;
        if (isParameterizedQuery(query)) {
          parameters = await this.queryParameterSelector.show();
          if (!parameters) {
            return;
          }
        }

        const results = await client.runQuery(
          query,
          connection.workgroup,
          parameters?.items.map((p) => p.text) || []
        );

        if (!results) {
          await window.showInformationMessage(
            localeString('run-query-canceled')
          );
        }

        return results;
      }
    );
  }

  private async showResult(result: QueryResult) {
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

  private showStatisticsOutput(result: QueryResult) {
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

  private async addLog(statement: string) {
    const log: SQLLog = {
      id: randomUUID(),
      statement,
      loggedDate: new Date(),
    };
    this.sqlLogRepository.add(log);
    await commands.executeCommand('vscode-athena-viewer.refreshSQLLogs');
  }
}
