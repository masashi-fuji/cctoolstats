---
priority: 2
tags: [refactoring, code-quality, duplication]
description: "cli.tsとcli-commander.ts間の重複コードをリファクタリングする"
created_at: "2025-08-10T13:05:02Z"
started_at: null  # Do not modify manually
closed_at: null   # Do not modify manually
---

# Ticket Overview

similarity-tsツールによって検出された、cli.tsとcli-commander.ts間の重複コードをリファクタリングし、コードの保守性と可読性を向上させる。

## 検出された重複コード

### 1. `run` 関数 (93.98% 類似度, 128.3ポイント)
- **cli-commander.ts**: 55-174行目
- **cli.ts**: 57-209行目
- **影響度**: 高 - メイン実行ロジックの大部分が重複

### 2. `parseArgs` 関数 (88.43% 類似度, 54.8ポイント)
- **cli-commander.ts**: 225-279行目
- **cli.ts**: 260-328行目
- **影響度**: 中 - 引数解析ロジックが重複

### 3. `formatCsv` 関数 (100% 類似度, 26.0ポイント)
- **cli-commander.ts**: 183-208行目
- **cli.ts**: 218-243行目
- **影響度**: 低 - CSV形式化ロジックが完全に重複

## Tasks

### 準備フェーズ
- [ ] 現在のテストカバレッジを確認し、リファクタリング前の動作を保証
- [ ] cli.tsとcli-commander.tsの役割と依存関係を分析

### リファクタリングフェーズ
- [ ] 共通ユーティリティモジュール（例: `src/cli-common.ts`）を作成
- [ ] `formatCsv`関数を共通モジュールに移動（100%重複のため最優先）
- [ ] `parseArgs`関数の共通部分を抽出し、差異部分を戦略パターンで対応
- [ ] `run`関数の共通ロジックを基底クラスまたは共通関数として抽出
- [ ] 各ファイルから重複コードを削除し、共通モジュールをインポート

### テスト・検証フェーズ
- [ ] 単体テストを更新し、新しい共通モジュールをテスト
- [ ] 統合テストで両CLIの動作が変わっていないことを確認
- [ ] similarity-tsを再実行し、重複が解消されたことを確認
- [ ] Run tests before closing and pass all tests (No exceptions)
- [ ] Get developer approval before closing

## リファクタリング戦略

### アプローチ案
1. **共通基底クラス方式**
   - `BaseCliHandler`クラスを作成
   - cli.tsとcli-commander.tsが継承
   - 共通メソッドを基底クラスに配置

2. **ユーティリティモジュール方式**
   - `cli-utils.ts`または`cli-common.ts`を作成
   - 共通関数をエクスポート
   - 各CLIファイルからインポートして使用

3. **コンポジション方式**
   - 機能別に小さなモジュールに分割
   - 各CLIで必要な機能を組み合わせて使用

### 推奨アプローチ
ユーティリティモジュール方式を推奨。理由：
- 実装が簡潔で理解しやすい
- テストが書きやすい
- 段階的なリファクタリングが可能
- 依存関係がシンプル

## Notes

- **優先度**: 中程度 - コードの保守性に直接影響するが、機能には影響しない
- **リスク**: 低 - 既存のテストがあるため、リファクタリングによる退行は検出可能
- **期待効果**: 
  - コード行数の削減（推定: 約200行）
  - 保守性の向上
  - バグ修正時の一貫性確保
- **注意事項**:
  - cli.tsとcli-commander.tsの微妙な差異を保持する必要がある
  - 型安全性を維持することが重要
  - 後方互換性を保つこと
EOF < /dev/null
