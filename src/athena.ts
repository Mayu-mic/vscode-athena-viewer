import {
  Athena,
  AthenaClient,
  Column,
  Database,
  DataCatalogSummary,
  GetQueryExecutionCommand,
  GetQueryExecutionCommandOutput,
  GetQueryResultsCommand,
  GetQueryResultsInput,
  GetQueryResultsOutput,
  GetTableMetadataCommand,
  ListDatabasesCommand,
  ListDatabasesCommandInput,
  ListDataCatalogsCommand,
  ListDataCatalogsCommandInput,
  ListTableMetadataCommand,
  ListTableMetadataInput,
  QueryExecutionStatistics,
  StartQueryExecutionCommand,
  StopQueryExecutionCommand,
  TableMetadata,
} from '@aws-sdk/client-athena';
import * as AWS from '@aws-sdk/types';
import { Event } from 'vscode';
import { filled } from './util';

export interface QueryResult {
  columns: string[];
  rows: (string | undefined)[][];
  statistics?: QueryExecutionStatistics;
}

export class AthenaClientWrapper {
  public onQueryCancelEvent: Event<any> | undefined = undefined;
  private client: AthenaClient;
  private DEFAULT_SLEEP_TIME = 200;

  constructor(region: string, credentials: AWS.Credentials) {
    this.client = new AthenaClient({ region, credentials });
  }

  async getDataCatalogs(): Promise<DataCatalogSummary[] | undefined> {
    let nextToken: string | undefined = undefined;
    const results = [];

    do {
      const payload: ListDataCatalogsCommandInput = {};
      if (nextToken) {
        payload.NextToken = nextToken;
        this.sleep(this.DEFAULT_SLEEP_TIME);
      }
      const result = await this.client.send(
        new ListDataCatalogsCommand(payload)
      );
      results.push(result);
      nextToken = result.NextToken;
    } while (nextToken);

    return results
      .filter((result) => result.DataCatalogsSummary)
      .flatMap((result) => result.DataCatalogsSummary!);
  }

  async getDatabases(catalogName: string): Promise<Database[]> {
    let nextToken: string | undefined = undefined;
    const results = [];

    do {
      const payload: ListDatabasesCommandInput = {
        CatalogName: catalogName,
      };
      if (nextToken) {
        payload.NextToken = nextToken;
        this.sleep(this.DEFAULT_SLEEP_TIME);
      }
      const result = await this.client.send(new ListDatabasesCommand(payload));
      results.push(result);
      nextToken = result.NextToken;
    } while (nextToken);

    return results
      .filter((result) => result.DatabaseList)
      .flatMap((result) => result.DatabaseList!);
  }

  async getTables(
    catalogName: string,
    database: string
  ): Promise<TableMetadata[] | undefined> {
    let nextToken: string | undefined = undefined;
    const results = [];

    do {
      const payload: ListTableMetadataInput = {
        CatalogName: catalogName,
        DatabaseName: database,
      };
      if (nextToken) {
        payload.NextToken = nextToken;
        this.sleep(this.DEFAULT_SLEEP_TIME);
      }
      const result = await this.client.send(
        new ListTableMetadataCommand(payload)
      );
      results.push(result);
      nextToken = result.NextToken;
    } while (nextToken);

    return results
      .filter((result) => result.TableMetadataList)
      .flatMap((result) => result.TableMetadataList!);
  }

  async getColumns(
    catalogName: string,
    database: string,
    table: string
  ): Promise<Column[] | undefined> {
    const result = await this.client.send(
      new GetTableMetadataCommand({
        CatalogName: catalogName,
        DatabaseName: database,
        TableName: table,
      })
    );

    return result.TableMetadata?.Columns;
  }

  async runQuery(
    sql: string,
    workgroup: string,
    executionParameters: string[]
  ): Promise<QueryResult | undefined> {
    const response = await this.getQueryData(
      sql,
      workgroup,
      executionParameters
    );
    if (!response) {
      return;
    }

    const [results, execution] = response;
    const columnInfo = results[0].ResultSet?.ResultSetMetadata?.ColumnInfo;
    if (!columnInfo) {
      throw new Error('ColumnInfo is empty.');
    }
    const columns = columnInfo.map((info) => info.Name).filter(filled);
    const rows: QueryResult['rows'] = [];

    results.forEach((result, i) => {
      const rowValues = result.ResultSet?.Rows;
      if (!rowValues) {
        return;
      }
      if (i === 0) {
        rowValues.shift();
      }
      rowValues.forEach(({ Data }) => {
        if (!Data) {
          return;
        }
        rows.push(Data.map((column) => column.VarCharValue));
      });
    });

    return { columns, rows, statistics: execution.QueryExecution?.Statistics };
  }

  private async getQueryData(
    sql: string,
    workgroup: string,
    executionParameters: string[]
  ): Promise<
    [GetQueryResultsOutput[], GetQueryExecutionCommandOutput] | undefined
  > {
    const startQueryExecution = new StartQueryExecutionCommand({
      QueryString: sql,
      WorkGroup: workgroup,
    });
    if (executionParameters.length > 0) {
      startQueryExecution.input.ExecutionParameters = executionParameters;
    }

    const { QueryExecutionId } = await this.client.send(startQueryExecution);
    if (QueryExecutionId && this.onQueryCancelEvent) {
      this.onQueryCancelEvent(() => {
        this.stopQuery(QueryExecutionId);
        return;
      });
    }

    const endStatuses = new Set(['FAILED', 'SUCCEEDED', 'CANCELLED']);
    let queryExecutionResult;

    do {
      const getQueryExecution = new GetQueryExecutionCommand({
        QueryExecutionId,
      });
      queryExecutionResult = await this.client.send(getQueryExecution);
      await this.sleep(this.DEFAULT_SLEEP_TIME);
    } while (
      !endStatuses.has(
        queryExecutionResult.QueryExecution?.Status?.State ?? 'UNDEFINED'
      )
    );

    if (queryExecutionResult.QueryExecution?.Status?.State === 'CANCELLED') {
      return;
    }

    if (queryExecutionResult.QueryExecution?.Status?.State === 'FAILED') {
      throw new Error(
        queryExecutionResult.QueryExecution.Status.StateChangeReason
      );
    }

    const results: GetQueryResultsOutput[] = [];
    let nextToken: string | undefined = undefined;

    do {
      const payload: GetQueryResultsInput = {
        QueryExecutionId,
      };
      if (nextToken) {
        payload.NextToken = nextToken;
        await this.sleep(this.DEFAULT_SLEEP_TIME);
      }
      const result = await this.client.send(
        new GetQueryResultsCommand(payload)
      );
      nextToken = result.NextToken;
      results.push(result);
    } while (nextToken);

    return [results, queryExecutionResult];
  }

  private async stopQuery(queryExecutionId: string): Promise<void> {
    const stopQueryExecution = new StopQueryExecutionCommand({
      QueryExecutionId: queryExecutionId,
    });
    await this.client.send(stopQueryExecution);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
