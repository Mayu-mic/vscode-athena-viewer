import {
  Database,
  DataCatalogSummary,
  TableMetadata,
  Column,
} from '@aws-sdk/client-athena';
import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  window,
} from 'vscode';
import {
  AthenaClientWrapper,
  DefaultAthenaClientWrapper,
} from '../../clients/athenaClientWrapper';
import { AWSCredentialsProvider } from '../../domain/credentials/credentialsProvider';
import { CredentialsRepository } from '../../domain/credentials/credentialsRepository';
import { localeString } from '../../i18n';
import { ProfileRepository } from '../../domain/profile/profileRepository';
import { Connection } from '../../domain/connection/connection';
import { ConnectionRepository } from '../../domain/connection/connectionRepository';
import { Region } from '../../domain/connection/region';

export class ConnectionsViewProvider
  implements TreeDataProvider<DependencyElement>
{
  private _onDidChangeTreeData: EventEmitter<void> = new EventEmitter();
  readonly onDidChangeTreeData?: Event<void> = this._onDidChangeTreeData.event;

  constructor(
    private connectionRepository: ConnectionRepository,
    private profileRepository: ProfileRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: AWSCredentialsProvider
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DependencyElement): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(
    element?: DependencyElement | undefined
  ): ProviderResult<DependencyElement[]> {
    if (element && element instanceof ConnectionItem) {
      // DataCatalog
      return this.getDataCatalogs(element);
    } else if (element && element instanceof DataCatalogItem) {
      // Database
      return this.getDatabases(element);
    } else if (element && element instanceof DatabaseItem) {
      // Table
      return this.getTables(element);
    } else if (element && element instanceof TableItem) {
      // Column
      return this.getColumns(element);
    } else {
      // Connection
      return this.getConnection();
    }
  }

  private async getConnection(): Promise<ConnectionItem[]> {
    const connection = this.connectionRepository.getConnection();
    if (connection) {
      return [
        new ConnectionItem(connection, TreeItemCollapsibleState.Expanded),
      ];
    } else {
      return [];
    }
  }

  private async getDataCatalogs(
    connection: ConnectionItem
  ): Promise<DataCatalogItem[]> {
    const region = connection.connection.region;
    const client = await this.getClient(region);
    const dataCatalogs = await client?.getDataCatalogs();
    if (dataCatalogs) {
      return dataCatalogs
        .filter((d) => d.CatalogName)
        .map(
          (dataCatalog) =>
            new DataCatalogItem(
              dataCatalog,
              TreeItemCollapsibleState.Expanded,
              connection
            )
        );
    } else {
      return [];
    }
  }

  private async getDatabases(
    dataCatalog: DataCatalogItem
  ): Promise<DatabaseItem[]> {
    const region = dataCatalog.parent.connection.region;
    const dataCatalogName = dataCatalog.dataCatalog.CatalogName!;
    const client = await this.getClient(region);
    const databases = await client?.getDatabases(dataCatalogName);
    if (databases) {
      return databases
        .filter((d) => d.Name)
        .map(
          (database) =>
            new DatabaseItem(
              database,
              TreeItemCollapsibleState.Collapsed,
              dataCatalog
            )
        );
    } else {
      return [];
    }
  }

  private async getTables(database: DatabaseItem): Promise<TableItem[]> {
    const region = database.parent.parent.connection.region;
    const dataCatalogName = database.parent.dataCatalog.CatalogName!;
    const databaseName = database.database.Name!;
    const client = await this.getClient(region);
    const tables = await client?.getTables(dataCatalogName, databaseName);
    if (tables) {
      return tables
        .filter((t) => t.Name)
        .map(
          (table) =>
            new TableItem(table, TreeItemCollapsibleState.Collapsed, database)
        );
    } else {
      return [];
    }
  }

  private async getColumns(table: TableItem): Promise<ColumnItem[]> {
    const region = table.parent.parent.parent.connection.region;
    const dataCatalogName = table.parent.parent.dataCatalog.CatalogName!;
    const databaseName = table.parent.database.Name!;
    const tableName = table.table.Name!;
    const client = await this.getClient(region);
    const columns = await client?.getColumns(
      dataCatalogName,
      databaseName,
      tableName
    );
    if (columns) {
      return columns.map(
        (column) => new ColumnItem(column, TreeItemCollapsibleState.None, table)
      );
    } else {
      return [];
    }
  }

  private async getClient(
    region: Region
  ): Promise<AthenaClientWrapper | undefined> {
    const profile = this.profileRepository.getProfile();
    if (!profile) {
      window.showErrorMessage(localeString('profile-not-found'));
      return;
    }
    let credentials = this.credentialsRepository.getCredentials(profile.id);
    if (!credentials) {
      credentials = await this.credentialsProvider.provideCredentials(
        profile.id,
        region
      );
      if (!credentials) {
        return;
      }
      this.credentialsRepository.setCredentials(profile.id, credentials);
    }
    return new DefaultAthenaClientWrapper(region.id, credentials);
  }
}

abstract class DependencyElement extends TreeItem {}

class ConnectionItem extends DependencyElement {
  constructor(
    public readonly connection: Connection,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(connection.region.label, collapsibleState);
    this.contextValue = 'connection';
    this.description = `workgroup: ${connection.workgroup}`;
    this.label = connection.region.label;
  }
}

class DataCatalogItem extends DependencyElement {
  constructor(
    public readonly dataCatalog: DataCatalogSummary,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly parent: ConnectionItem
  ) {
    super(dataCatalog.CatalogName!, collapsibleState);
    this.contextValue = 'dataCatalog';
  }
}

class DatabaseItem extends DependencyElement {
  constructor(
    public readonly database: Database,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly parent: DataCatalogItem
  ) {
    super(database.Name!, collapsibleState);
    this.contextValue = 'database';
  }
}

export class TableItem extends DependencyElement {
  constructor(
    public readonly table: TableMetadata,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly parent: DatabaseItem
  ) {
    super(table.Name!, collapsibleState);
    this.contextValue = 'table';
  }
}

export class ColumnItem extends DependencyElement {
  constructor(
    public readonly column: Column,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly parent: TableItem
  ) {
    super(column.Name!, collapsibleState);
    this.contextValue = 'column';
    this.label = column.Name;
    this.description = column.Type;
  }
}
