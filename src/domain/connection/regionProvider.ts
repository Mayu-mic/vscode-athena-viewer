import { Region } from './region';

export interface RegionProvider {
  provideRegion(): Promise<Region | undefined>;
}
