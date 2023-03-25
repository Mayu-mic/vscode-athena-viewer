import { QuickPickItem, window } from 'vscode';
import { Region, regions } from '../domain/connection/region';

export interface RegionProvider {
  provideRegion(): Promise<Region | undefined>;
}

export class QuickPickRegionProvider implements RegionProvider {
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
