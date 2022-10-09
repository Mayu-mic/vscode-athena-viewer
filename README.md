# Amazon Athena Viewer for VSCode

## Description

エディタの内容をもとに、Amazon Athena にクエリを投げ、結果を CSV で取得するアドオンです。  
`.aws/config` に基づいたスイッチロールと MFA 認証にも対応しています。

## Usage

### Install

- [Releases](https://github.com/Mayu-mic/vscode-athena-viewer/releases) より、.vsix ファイルのダウンロードを行なってください。
- 拡張機能右上のメニューより、VSIX からのインストールを選択し、上記ファイルを選択してください。

### Configuration (初回のみ)

- コマンドパレット(Ctrl+p)より、Amazon Athena: Setup Configurations を実行してください。
- ダイアログに従って、Profile, Region, Workgroup を設定してください。

### Run

- SQL ファイルを開くか、もしくはエディタの言語モードを SQL にしてください。
- コマンドパレットより、Amazon Athena: Run SQL を実行してください。

## Author

Ryo Koizumi `<koizumiryo@gmail.ne.jp>`
