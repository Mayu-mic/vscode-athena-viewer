import { ViewColumn, window, workspace } from 'vscode';
import { localeString } from '../i18n';
import { SQLLog } from '../sqlLog/sqlLog';
import { QueryRunner } from './queryRunner';

export class QueryCommandProvider {
  private DEFAULT_PREVIEW_LIMIT = 10;

  constructor(private queryRunner: QueryRunner) {}

  async runQueryCommand() {
    const editor = window.activeTextEditor;
    if (!editor) {
      window.showErrorMessage(localeString('editor-not-found'));
      return;
    }
    const editorText = editor.document.getText();
    await this.queryRunner.runQuery(editorText, true);
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

    await this.queryRunner.runQuery(sql);
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

    await this.queryRunner.runQuery(sql);
  }
}
