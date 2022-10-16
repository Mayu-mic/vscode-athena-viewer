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
import { ConfigurationRepository } from '../config/configRepository';
import { CredentialsRepository } from '../credentials/credentialsRepository';
import { CredentialsProvider } from '../credentials/CredentialsProvider';
import { localeString } from '../i18n';

export class DatabasesViewProvider
  implements TreeDataProvider<DependencyElement>
{
  constructor(
    private configRepository: ConfigurationRepository,
    private credentialsRepository: CredentialsRepository,
    private credentialsProvider: CredentialsProvider
  ) {}

  private _onDidChangeTreeData: EventEmitter<void> = new EventEmitter();
  readonly onDidChangeTreeData: Event<void> = this._onDidChangeTreeData.event;

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
    const dataCatalogs = await client?.getDataCatalogs();
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
    const databases = await client?.getDatabases(dataCatalog);
    if (databases) {
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
    } else {
      return [];
    }
  }

  private async getTables(
    dataCatalog: string,
    database: string
  ): Promise<TableItem[]> {
    const client = await this.getClient();
    const tables = await client?.getTables(dataCatalog, database);
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

  private async getClient(): Promise<AthenaClientWrapper | undefined> {
    const configs = await this.configRepository.getConfig();
    if (!configs) {
      window.showErrorMessage(localeString('config-not-found'));
      return;
    }
    const { profile, region } = configs;
    let credentials = this.credentialsRepository.getCredentials(profile);
    if (!credentials) {
      credentials = await this.credentialsProvider.provideCredentials(profile);
      if (!credentials) {
        return;
      }
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
