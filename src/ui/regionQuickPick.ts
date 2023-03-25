import { QuickPickItem, window } from 'vscode';
import { Region, regions } from '../domain/connection/region';
import { RegionProvider } from '../domain/connection/regionProvider';

export class RegionQuickPick implements RegionProvider {
  async provideRegion(): Promise<Region | undefined> {
    const items: QuickPickItem[] = regions.map((region) => ({
      label: region.label,
      detail: region.id,
    }));
    const result = await window.showQuickPick(items, {
      title: 'Region?',
      matchOnDetail: true,
    });
    return result
      ? {
          label: result.label,
          id: result.detail!,
        }
      : undefined;
  }
}
