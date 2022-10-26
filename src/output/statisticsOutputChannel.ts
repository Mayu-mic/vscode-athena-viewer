import { Disposable, OutputChannel, window } from 'vscode';
import { Statistics } from './statistics';

export interface StatisticsOutputChannel {
  outputStatistics(statistics: Statistics): void;
  show(): void;
  hide(): void;
  clear(): void;
}

export class VSCodeStatisticsOutputChannel
  implements StatisticsOutputChannel, Disposable
{
  private channel: OutputChannel;

  constructor() {
    this.channel = window.createOutputChannel('Athena Query Statistics');
  }

  outputStatistics(statistics: Statistics): void {
    this.channel.appendLine(`Query ok with ${statistics.outputLines} results.`);
    this.channel.appendLine(
      `Query Queue Time: ${statistics.queryQueueTime} ms`
    );
    this.channel.appendLine(
      `Total Execution Time: ${statistics.totalExecutionTime} ms`
    );
    this.channel.appendLine(
      `Data Scanned In Bytes: ${statistics.dataScannedInBytes} bytes`
    );
  }

  show(): void {
    this.channel.show();
  }

  hide(): void {
    this.channel.hide();
  }

  clear(): void {
    this.channel.clear();
  }

  dispose(): void {
    this.channel.dispose();
  }
}
