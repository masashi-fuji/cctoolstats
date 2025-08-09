# 作業履歴: --improvedオプションの削除

## 実施日時
2025年8月9日

## 作業の背景と目的
`--improved` オプションは通常の表示とほとんど変わらないため、使用頻度が低いと考えられました。
コードベースの簡素化とメンテナンス性向上のため、このオプションを削除することになりました。

## 実施した変更内容

### 1. CLI定義ファイルの修正
- **src/cli.ts**: 
  - `--improved` オプション定義を削除
  - TableFormatterへのimprovedFormat設定を削除
  - CLIOptions型からimprovedプロパティを削除
- **src/cli-commander.ts**: 
  - 同様の変更を適用

### 2. 表示フォーマッタの簡素化
- **src/formatters/table.ts**:
  - TableFormatterOptionsからimprovedFormatプロパティを削除
  - improvedFormat条件分岐を削除し、通常フォーマットに統一
  - 126行の追加に対して削除が多く、コードが大幅に簡素化

### 3. テストケースの更新
- **tests/unit/cli.test.ts**: improvedオプションのパーステストを削除
- **tests/unit/cli-commander.test.ts**: 同様のテストを削除
- **tests/unit/formatters/table.test.ts**: 
  - improved formattingセクション全体を削除
  - thousand separator formattingに変更
- **tests/integration/cli-options-simple.test.ts**: improvedオプションのテストを削除

### 4. ドキュメントの更新
- **README.md**: `--improved` オプションの使用例を削除

## 成果・結果
- コードベースが177行削減され、73行の追加で済んだ（差し引き104行の削減）
- 全146テストがPASS
- TypeScript型チェック：エラー0件
- ビルド成功
- CLIヘルプから --improved オプションが削除されていることを確認

## 今後の課題
- 今回削除した機能に依存していたユーザーへの移行ガイドの検討
- 他の使用頻度の低いオプションの洗い出し