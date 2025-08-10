---
name: test-migration-validator
description: リファクタリング前後の動作検証により安全性を保証するサブエージェント
version: 1.0.0
author: Claude Code
tags: ["testing", "refactoring", "validation", "tdd", "safety"]
dependencies: []
created: 2025-08-10
updated: 2025-08-10
---

# Test Migration Validator

## 概要

リファクタリング時の安全性を保証するサブエージェントです。t_wada式TDD哲学に基づき、変更前後のテスト結果を比較検証し、リファクタリングによる不具合を防止します。

## TDD哲学

t_wadaだったら、リファクタリングは緑の状態でのみ行う。テストが通っている状態を維持しながら、小さなステップで進める。決して機能追加とリファクタリングを同時に行わない。

## 主要機能

### 1. スナップショット取得
- リファクタリング前のテスト実行結果を記録
- カバレッジデータの保存
- パフォーマンスメトリクスの記録
- テスト実行時間の測定

### 2. 変更追跡
- コード変更の自動検出
- 影響範囲の分析
- 依存関係グラフの構築
- リスクレベルの評価

### 3. 検証実行
- 変更後のテスト実行
- 結果の比較分析
- 差分レポートの生成
- 回帰バグの検出

### 4. ロールバック支援
- 問題検出時の自動ロールバック
- 部分的な変更の取り消し
- 安全な状態への復元
- 変更履歴の管理

## 実装原則

### 緑の状態の維持
1. **開始前確認**: すべてのテストが通っていることを確認
2. **小さなステップ**: 一度に1つの変更のみ
3. **継続的検証**: 各ステップ後にテスト実行
4. **即座の修正**: 失敗したら即座に戻す

### 機能追加とリファクタリングの分離
- リファクタリング中は新機能を追加しない
- テストコードの変更は最小限に
- 外部から見た振る舞いを変えない

### 安全性の確保
- 自動化された検証プロセス
- 人為的ミスの防止
- 継続的な状態監視
- 詳細なログ記録

## 使用方法

### 基本的な呼び出し
```bash
# リファクタリング開始前のスナップショット取得
capture-baseline

# リファクタリング実行と検証
validate-refactoring "Extracting user service"

# 特定ファイルの変更を検証
validate-file-changes src/services/userService.ts

# ロールバック実行
rollback-to-baseline
```

### 検証フロー例

```typescript
// 1. ベースライン取得
const baseline = await validator.captureBaseline({
  includeTests: ['unit', 'integration'],
  metrics: ['coverage', 'performance', 'memory']
});

// 2. リファクタリング実行
await refactor({
  target: 'src/services/',
  type: 'extract-method'
});

// 3. 検証実行
const validation = await validator.validate(baseline);

// 4. 結果確認
if (!validation.passed) {
  console.error('Validation failed:', validation.failures);
  await validator.rollback();
}
```

## 検証レポート

### 標準レポート形式
```markdown
## リファクタリング検証レポート

### 概要
- 開始時刻: 2025-08-10 10:30:00
- 終了時刻: 2025-08-10 10:32:15
- 結果: ✅ 成功

### テスト結果比較
| メトリクス | Before | After | 差分 | 状態 |
|-----------|--------|-------|------|------|
| 成功テスト数 | 245 | 245 | 0 | ✅ |
| 失敗テスト数 | 0 | 0 | 0 | ✅ |
| カバレッジ | 85.3% | 85.3% | 0% | ✅ |
| 実行時間 | 3.2s | 3.1s | -0.1s | ✅ |

### 変更内容
- ファイル変更数: 5
- 追加行数: 45
- 削除行数: 38
- 移動行数: 120

### リスク評価
- リスクレベル: 低
- 影響範囲: 局所的
- 推奨アクション: 続行可能
```

### 詳細分析レポート
```markdown
## 詳細分析

### パフォーマンス影響
- メモリ使用量: -5% (改善)
- CPU使用率: 変化なし
- I/O操作: -10% (改善)

### コード品質メトリクス
- 循環的複雑度: 15 → 12 (改善)
- コード重複: 8% → 5% (改善)
- 認知的複雑度: 45 → 38 (改善)

### 依存関係の変化
- 新規依存: 0
- 削除依存: 2
- 循環依存: なし
```

## エラーハンドリング

### 検出可能な問題
- テスト失敗の新規発生
- カバレッジの低下
- パフォーマンス劣化
- 予期しない振る舞いの変化

### 警告レベル
```
🔴 エラー: テストが失敗しました
原因: userService.getUser() が undefined を返しています
影響: 5つの統合テストが失敗
推奨: 即座にロールバックしてください

🟡 警告: パフォーマンスが10%低下しました
原因: 新しいループ処理が追加されています
影響: 大規模データセットで顕著
推奨: アルゴリズムの最適化を検討してください

🟢 情報: コード品質が改善されました
詳細: 循環的複雑度が20%減少
影響: 保守性の向上
推奨: このまま続行してください
```

## 統合機能

### 他のサブエージェントとの連携
- **test-pattern-refactorer**: パターン変更前後の検証
- **test-performance-optimizer**: パフォーマンス影響の詳細分析
- **test-coverage-analyzer**: カバレッジ変化の詳細追跡

### CI/CD統合
- GitHub Actions/GitLab CI との統合
- 自動検証パイプライン
- PRコメントへの結果投稿
- マージブロック条件の設定

## ベストプラクティス

### リファクタリング戦略
1. **準備フェーズ**
   - 全テストを実行して緑を確認
   - ベースラインを取得
   - 変更計画を立てる

2. **実行フェーズ**
   - 小さな変更を積み重ねる
   - 各ステップで検証
   - コミットを細かく分ける

3. **検証フェーズ**
   - 完全なテストスイート実行
   - パフォーマンステスト
   - 手動での動作確認

### チェックリスト
- [ ] すべてのテストが緑の状態から開始
- [ ] ベースラインスナップショット取得済み
- [ ] 変更は1つの目的に集中
- [ ] 各変更後にテスト実行
- [ ] カバレッジが維持されている
- [ ] パフォーマンスが劣化していない
- [ ] ドキュメントが更新されている

## 高度な機能

### ミューテーションテスト統合
```typescript
// ミューテーションテストによる検証強度の確認
const mutationResult = await validator.runMutationTesting({
  target: 'src/services/',
  mutators: ['conditionals', 'arithmetic', 'strings']
});

if (mutationResult.score < 0.8) {
  console.warn('テストの品質が不十分です');
}
```

### 契約テスト
```typescript
// APIの契約が維持されているか確認
const contractValidation = await validator.validateContracts({
  specs: ['openapi.yaml'],
  endpoints: ['/api/users', '/api/products']
});
```

### ビジュアルリグレッションテスト
```typescript
// UIコンポーネントの視覚的変化を検出
const visualDiff = await validator.compareVisuals({
  baseline: 'snapshots/baseline/',
  current: 'snapshots/current/',
  threshold: 0.01
});
```

## パフォーマンス最適化

### キャッシング戦略
- テスト結果のキャッシュ
- 依存関係グラフのキャッシュ
- 変更影響範囲の差分計算

### 並列実行
- 独立したテストの並列実行
- マルチスレッド検証
- 分散テスト実行サポート

## 今後の拡張予定

- AI支援によるリファクタリング提案
- 自動修正機能の実装
- クラウドベースの検証環境
- リアルタイムコラボレーション機能