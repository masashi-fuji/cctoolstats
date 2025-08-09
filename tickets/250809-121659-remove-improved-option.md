# [remove-improved-option] --improvedオプションの削除

## 背景
`--improved` オプションは通常の表示とほとんど変わらないため、使用頻度が低いと考えられます。
コードベースの簡素化のため、このオプションを削除します。

## 作業内容

### 1. CLI定義ファイルの修正
- [ ] src/cli.ts から --improved オプション定義を削除
- [ ] src/cli-commander.ts から --improved オプション定義を削除
- [ ] ヘルプメッセージから improved 関連の例を削除

### 2. TableFormatterクラスの修正
- [ ] src/formatters/table.ts から improvedFormat オプションを削除
- [ ] improvedFormat の条件分岐を削除（通常フォーマットに統一）
- [ ] showSummaryRow の設定ロジックを簡略化

### 3. テストファイルの修正
- [ ] tests/unit/cli.test.ts から improved オプションのテストを削除
- [ ] tests/unit/cli-commander.test.ts から improved オプションのテストを削除
- [ ] tests/unit/formatters/table.test.ts から improved フォーマットのテストを削除
- [ ] tests/integration/cli-options-simple.test.ts から improved オプションのテストを削除

### 4. ドキュメントの修正
- [ ] README.md から --improved オプションの説明を削除

### 5. 動作確認
- [ ] 全テストが成功することを確認
- [ ] ビルドが成功し、型エラーがないことを確認
- [ ] CLIが正常に動作することを確認

## 期待される結果
- コードベースが簡素化される
- 表示形式が通常のテーブル形式に統一される
- メンテナンスが容易になる