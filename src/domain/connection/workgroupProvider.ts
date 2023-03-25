export interface WorkgroupProvider {
  provideWorkgroup(): Promise<string | undefined>;
}
