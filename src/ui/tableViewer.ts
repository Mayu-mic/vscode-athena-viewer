import {
  CancellationToken,
  ProviderResult,
  TextDocumentContentProvider,
  Uri,
} from 'vscode';

export class AthenaTableViewer implements TextDocumentContentProvider {
  provideTextDocumentContent(
    uri: Uri,
    token: CancellationToken
  ): ProviderResult<string> {
    return uri.path;
  }
}
