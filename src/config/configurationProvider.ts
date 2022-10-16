export interface ConfigurationProvider {
  provideProfile(candidates: string[]): Promise<string | undefined>;
  provideRegion(): Promise<string | undefined>;
  provideWorkgroup(): Promise<string | undefined>;
}
