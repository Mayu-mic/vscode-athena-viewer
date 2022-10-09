import { ProgressLocation, ViewColumn, window, workspace } from 'vscode';
import { AthenaClientWrapper, QueryResult } from '../athena';
import {
  IConfigurationProvider,
  IConfigurationRepository,
} from '../config/config-repository';
import {
  ICredentialsProvider,
  ICredentialsRepository,
} from '../credentials/credentials';
import { getCredentialProfiles } from '../credentials/get-profiles';
import { localeString } from '../i18n';
import { ExtensionConfig } from '../types';
import { TableItem } from '../view/databases-view';
import { stringify } from 'csv-stringify/sync';

export class QueryCommandProvider {
  private DEFAULT_PREVIEW_LIMIT = 10;

  constructor(
    private configRepository: IConfigurationRepository,
    private configProvider: IConfigurationProvider,
    private credentialsRepository: ICredentialsRepository,
    private credentialsProvider: ICredentialsProvider
  ) {}

  async runQueryCommand() {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage(localeString('editor-not-found'));
      return;
    }
    const editorText = editor.document.getText();
    await this.runQuery(editorText);
  }

  async showTablesCommand(item: TableItem) {
    const sql = `select * from "${item.parentDatabase}"."${item.name}" limit ${this.DEFAULT_PREVIEW_LIMIT};`;
    const doc = await workspace.openTextDocument({
      language: 'sql',
      content: sql,
    });
    await window.showTextDocument(doc, {
      viewColumn: ViewColumn.One,
    });

    await this.runQuery(sql);
  }

  private async runQuery(query: string) {
    const configs = await this.getConfigs();
    if (!configs) {
      window.showErrorMessage(localeString('config-not-found'));
      return;
    }
    const { profile, region, workgroup } = configs;
    const credentials =
      this.credentialsRepository.getCredentials(profile) ??
      (await this.credentialsProvider.provideCredentials(profile));

    let result: QueryResult;
    await window
      .withProgress(
        {
          title: 'Run Query',
          location: ProgressLocation.Notification,
        },
        async () => {
          const client = new AthenaClientWrapper(region, credentials);
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

          const doc = await workspace.openTextDocument({
            language: 'csv',
            content: csv,
          });

          await window.showTextDocument(doc, {
            viewColumn: ViewColumn.Two,
            preview: true,
            preserveFocus: true,
          });
        },
        (e: any) => {
          window.showErrorMessage(e.message);
          return;
        }
      );
  }

  private async getConfigs(): Promise<ExtensionConfig | undefined> {
    const profiles = await getCredentialProfiles();
    let profile = this.configRepository.getProfile();
    if (!profile) {
      profile = await this.configProvider.provideProfile(profiles);
      if (!profile) {
        return;
      }
      this.configRepository.setProfile(profile);
    }

    let region = this.configRepository.getRegion();
    if (!region) {
      region = await this.configProvider.provideRegion();
      if (!region) {
        return;
      }
      this.configRepository.setRegion(region);
    }

    let workgroup = this.configRepository.getWorkgroup();
    if (!workgroup) {
      workgroup = await this.configProvider.provideWorkgroup();
      if (!workgroup) {
        return;
      }
      this.configRepository.setWorkgroup(workgroup);
    }

    return { profile, region, workgroup };
  }
}
