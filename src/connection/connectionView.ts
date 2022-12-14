import {
  Database,
  DataCatalogSummary,
  TableMetadata,
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
import { AthenaClientWrapper } from '../athena';
import { CredentialsProvider } from '../credentials/credentialsProvider';
import { CredentialsRepository } from '../credentials/credentialsRepository';
import { localeString } from '../i18n';
import { ProfileRepository } from '../profile/profileRepository';
import { Connection } from './connection';
import { ConnectionRepository } from './connectionRepository';
import { Region } from './region';

export class ConnectionsViewProvider
  implements TreeDataProvider<DependencyElement>
{
  private _onDidChangeTreeData: EventEmitter<void> = new EventEmitter();
  readonly onDidChangeTreeData?: Event<void> = this._onDidChangeTreeData.event;

  constructor(
    private connectionRepository: ConnectionRepository,
    private profileRepository: ProfileRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: CredentialsProvider
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
            new TableItem(table, TreeItemCollapsibleState.None, database)
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
    return new AthenaClientWrapper(region.id, credentials);
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
