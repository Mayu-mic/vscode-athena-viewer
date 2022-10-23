import {
  AthenaClient,
  Database,
  DataCatalogSummary,
  GetQueryExecutionCommand,
  GetQueryExecutionCommandOutput,
  GetQueryResultsCommand,
  GetQueryResultsInput,
  GetQueryResultsOutput,
  ListDatabasesCommand,
  ListDatabasesCommandInput,
  ListDataCatalogsCommand,
  ListDataCatalogsCommandInput,
  ListTableMetadataCommand,
  ListTableMetadataInput,
  QueryExecutionStatistics,
  StartQueryExecutionCommand,
  TableMetadata,
} from '@aws-sdk/client-athena';
import * as AWS from '@aws-sdk/types';
import { filled } from './util';

export interface QueryResult {
  columns: string[];
  rows: (string | undefined)[][];
  statistics?: QueryExecutionStatistics;
}

export class AthenaClientWrapper {
  private DEFAULT_SLEEP_TIME = 200;

  constructor(private region: string, private credentials: AWS.Credentials) {}

  async getDataCatalogs(): Promise<DataCatalogSummary[] | undefined> {
    const client = await this.getClient();

    let nextToken: string | undefined = undefined;
    const results = [];

    do {
      const payload: ListDataCatalogsCommandInput = {};
      if (nextToken) {
        payload.NextToken = nextToken;
        this.sleep(this.DEFAULT_SLEEP_TIME);
      }
      const result = await client.send(new ListDataCatalogsCommand(payload));
      results.push(result);
      nextToken = result.NextToken;
    } while (nextToken);

    return results
      .filter((result) => result.DataCatalogsSummary)
      .flatMap((result) => result.DataCatalogsSummary!);
  }

  async getDatabases(catalogName: string): Promise<Database[]> {
    const client = await this.getClient();

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
      const result = await client.send(new ListDatabasesCommand(payload));
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
    const client = await this.getClient();

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
      const result = await client.send(new ListTableMetadataCommand(payload));
      results.push(result);
      nextToken = result.NextToken;
    } while (nextToken);

    return results
      .filter((result) => result.TableMetadataList)
      .flatMap((result) => result.TableMetadataList!);
  }

  async runQuery(sql: string, workgroup: string): Promise<QueryResult> {
    const [results, execution] = await this.getQueryData(sql, workgroup);
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
    workgroup: string
  ): Promise<[GetQueryResultsOutput[], GetQueryExecutionCommandOutput]> {
    const client = await this.getClient();
    const startQueryExecution = new StartQueryExecutionCommand({
      QueryString: sql,
      WorkGroup: workgroup,
    });
    const { QueryExecutionId } = await client.send(startQueryExecution);
    const endStatuses = new Set(['FAILED', 'SUCCEEDED', 'CANCELLED']);
    let queryExecutionResult;

    do {
      const getQueryExecution = new GetQueryExecutionCommand({
        QueryExecutionId,
      });
      queryExecutionResult = await client.send(getQueryExecution);
      await this.sleep(this.DEFAULT_SLEEP_TIME);
    } while (
      !endStatuses.has(
        queryExecutionResult.QueryExecution?.Status?.State ?? 'UNDEFINED'
      )
    );

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
      const result = await client.send(new GetQueryResultsCommand(payload));
      nextToken = result.NextToken;
      results.push(result);
    } while (nextToken);

    return [results, queryExecutionResult];
  }

  private async getClient(): Promise<AthenaClient> {
    return new AthenaClient({
      region: this.region,
      credentials: this.credentials,
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
