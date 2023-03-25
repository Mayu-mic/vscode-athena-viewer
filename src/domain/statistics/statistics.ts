export interface Statistics {
  // 行数
  outputLines: number;
  // キュー内の時間
  queryQueueTime: number;
  // 実行時間
  totalExecutionTime: number;
  // スキャンしたデータ
  dataScannedInBytes: number;
}
