import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
} from 'vscode';
import { AthenaClientWrapper } from '../athena';
import { IConfigurationRepository } from '../config/config-repository';
import {
  ICredentialsProvider,
  ICredentialsRepository,
} from '../credentials/credentials';

export class DatabasesViewProvider
  implements TreeDataProvider<DependencyElement>
{
  constructor(
    private configRepository: IConfigurationRepository,
    private credentialsRepository: ICredentialsRepository,
    private credentialsProvider: ICredentialsProvider
  ) {}

  private _onDidChangeTreeData: EventEmitter<
    DependencyElement | undefined | null | void
  > = new EventEmitter();
  readonly onDidChangeTreeData: Event<
    DependencyElement | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: DependencyElement): TreeItem | Thenable<TreeItem> {
    return element;
  }

  getChildren(
    element?: DependencyElement | undefined
  ): ProviderResult<DependencyElement[]> {
    if (element && element instanceof DataCatalogItem) {
      return this.getDatabases(element.name);
    } else if (element && element instanceof DatabaseItem) {
      return this.getTables(element.parentDataCatalog, element.name);
    } else {
      return this.getDataCatalogs();
    }
  }

  private async getDataCatalogs(): Promise<DataCatalogItem[]> {
    const client = await this.getClient();
    const dataCatalogs = await client.getDataCatalogs();
    if (dataCatalogs) {
      return dataCatalogs
        .filter((d) => d.CatalogName)
        .map(
          (dataCatalog) =>
            new DataCatalogItem(
              dataCatalog.CatalogName!,
              TreeItemCollapsibleState.Expanded
            )
        );
    } else {
      return [];
    }
  }

  private async getDatabases(dataCatalog: string): Promise<DatabaseItem[]> {
    const client = await this.getClient();
    const databases = await client.getDatabases(dataCatalog);
    return databases
      .filter((d) => d.Name)
      .map(
        (database) =>
          new DatabaseItem(
            database.Name!,
            dataCatalog,
            TreeItemCollapsibleState.Collapsed
          )
      );
  }

  private async getTables(
    dataCatalog: string,
    database: string
  ): Promise<TableItem[]> {
    const client = await this.getClient();
    const tables = await client.getTables(dataCatalog, database);
    if (tables) {
      return tables
        .filter((t) => t.Name)
        .map(
          (table) =>
            new TableItem(
              table.Name!,
              dataCatalog,
              database,
              TreeItemCollapsibleState.None
            )
        );
    } else {
      return [];
    }
  }

  private async getClient(): Promise<AthenaClientWrapper> {
    const profile = this.configRepository.getProfile();
    if (!profile) {
      throw new Error('profile is not set.');
    }
    const region = this.configRepository.getRegion();
    if (!region) {
      throw new Error('region is not set.');
    }
    let credentials = this.credentialsRepository.getCredentials(profile);
    if (!credentials) {
      credentials = await this.credentialsProvider.provideCredentials(profile);
      this.credentialsRepository.setCredentials(profile, credentials);
    }
    return new AthenaClientWrapper(region, credentials);
  }
}

abstract class DependencyElement extends TreeItem {}

class DataCatalogItem extends DependencyElement {
  constructor(
    public readonly name: string,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.tooltip = this.name;
  }
}

class DatabaseItem extends DependencyElement {
  constructor(
    public readonly name: string,
    public readonly parentDataCatalog: string,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.tooltip = this.name;
  }
}

export class TableItem extends DependencyElement {
  constructor(
    public readonly name: string,
    public readonly parentDataCatalog: string,
    public readonly parentDatabase: string,
    public readonly collapsibleState: TreeItemCollapsibleState
  ) {
    super(name, collapsibleState);
    this.contextValue = 'table';
    this.tooltip = this.name;
  }
}
