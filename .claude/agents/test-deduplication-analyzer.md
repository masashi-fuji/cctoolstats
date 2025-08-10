---
name: test-deduplication-analyzer
description: 重複テストを検出・統合し、テストコードの保守性を向上させるサブエージェント
version: 1.0.0
author: Claude Code
tags: ["testing", "deduplication", "refactoring", "tdd", "dry"]
dependencies: []
created: 2025-08-10
updated: 2025-08-10
---

# Test Deduplication Analyzer

## 概要

重複テストの削減により保守性を向上させるサブエージェントです。t_wada式TDD哲学に基づき、DRY原則をテストコードに適用しながら、可読性を損なわない最適なバランスを実現します。

## TDD哲学

t_wadaだったら、DRY原則はプロダクションコードだけでなくテストコードにも適用する。ただし、テストの可読性を損なう抽象化は避ける。明確性が最優先。

## 主要機能

### 1. 重複検出
- 完全一致の重複テスト検出
- 類似パターンの識別
- 重複するセットアップの発見
- 同一アサーションの検出

### 2. 類似度分析
- 構造的類似度の計算
- 意味的類似度の評価
- テストケースのクラスタリング
- 重複度スコアリング

### 3. 統合提案
- パラメータ化テストへの変換
- 共通セットアップの抽出
- テストヘルパーの作成提案
- テストケースの統合案

### 4. リファクタリング実行
- 安全な重複除去
- テストの統合と分割
- 共通化の自動実行
- 品質チェック

## 実装原則

### DRYと可読性のバランス
```typescript
// ❌ 過度な重複：保守性が低い
test('should calculate price for 1 item', () => {
  const cart = new Cart();
  cart.addItem({ id: '1', price: 100, quantity: 1 });
  expect(cart.total()).toBe(100);
});

test('should calculate price for 2 items', () => {
  const cart = new Cart();
  cart.addItem({ id: '1', price: 100, quantity: 2 });
  expect(cart.total()).toBe(200);
});

test('should calculate price for 3 items', () => {
  const cart = new Cart();
  cart.addItem({ id: '1', price: 100, quantity: 3 });
  expect(cart.total()).toBe(300);
});

// ✅ パラメータ化テスト：DRYかつ可読性高い
describe('Cart price calculation', () => {
  test.each([
    { quantity: 1, expected: 100 },
    { quantity: 2, expected: 200 },
    { quantity: 3, expected: 300 },
  ])('should calculate price for $quantity item(s)', ({ quantity, expected }) => {
    const cart = new Cart();
    cart.addItem({ id: '1', price: 100, quantity });
    expect(cart.total()).toBe(expected);
  });
});

// ⚠️ 過度な抽象化：可読性が低い
const testCartTotal = (q, e) => {
  const c = makeCart();
  addItems(c, q);
  assertTotal(c, e);
};
```

### 明確性優先の原則
```typescript
// ✅ 適切な共通化：セットアップの抽出
describe('UserService', () => {
  let service: UserService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new UserService(mockDb);
  });

  test('should create user', async () => {
    const user = await service.createUser({ name: 'Alice' });
    expect(user.id).toBeDefined();
  });

  test('should update user', async () => {
    const user = await service.createUser({ name: 'Alice' });
    const updated = await service.updateUser(user.id, { name: 'Bob' });
    expect(updated.name).toBe('Bob');
  });
});
```

## 使用方法

### 基本的な呼び出し
```bash
# プロジェクト全体の重複分析
analyze-test-duplication

# 特定ディレクトリの分析
find-duplicate-tests tests/unit/

# 重複の自動統合（安全なもののみ）
deduplicate-tests --auto-fix

# 詳細レポートの生成
generate-duplication-report --format=html
```

### プログラマティック使用
```typescript
const analyzer = new TestDeduplicationAnalyzer();

// 重複分析の実行
const duplicates = await analyzer.analyze('tests/');

// 統合提案の生成
const suggestions = analyzer.generateSuggestions(duplicates);

// 自動リファクタリング
for (const suggestion of suggestions) {
  if (suggestion.confidence > 0.9) {
    await analyzer.applyRefactoring(suggestion);
  }
}
```

## 分析レポート

### 重複分析サマリー
```markdown
## テスト重複分析レポート

### 統計情報
- 総テスト数: 342
- 重複テスト: 87 (25.4%)
- 類似テスト: 45 (13.2%)
- 削減可能行数: 1,250行

### 重複パターン Top 5
| パターン | 出現回数 | 影響ファイル数 | 削減可能行数 |
|---------|---------|---------------|-------------|
| DB接続セットアップ | 45 | 12 | 450 |
| API認証テスト | 23 | 8 | 230 |
| エラーハンドリング | 18 | 6 | 180 |
| 日付フォーマット | 15 | 5 | 150 |
| ユーザー作成 | 12 | 4 | 120 |

### 重複度ヒートマップ
```
     test1 test2 test3 test4 test5
test1  1.0   0.9   0.3   0.1   0.2
test2  0.9   1.0   0.4   0.2   0.1
test3  0.3   0.4   1.0   0.8   0.3
test4  0.1   0.2   0.8   1.0   0.7
test5  0.2   0.1   0.3   0.7   1.0
```
```

### 統合提案レポート
```markdown
## リファクタリング提案

### 提案1: パラメータ化テストへの変換
**対象ファイル**: `tests/validation.test.ts`
**重複テスト数**: 8
**削減行数**: 120行 → 25行 (79%削減)

**Before**:
```typescript
test('validates email format - valid', () => {
  expect(isValidEmail('user@example.com')).toBe(true);
});

test('validates email format - missing @', () => {
  expect(isValidEmail('userexample.com')).toBe(false);
});

// ... 6 more similar tests
```

**After**:
```typescript
describe('email validation', () => {
  test.each([
    ['user@example.com', true],
    ['userexample.com', false],
    ['@example.com', false],
    ['user@', false],
    ['user@example', false],
    ['user.name@example.co.uk', true],
    ['user+tag@example.com', true],
    ['', false],
  ])('isValidEmail("%s") should return %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});
```

### 提案2: 共通セットアップの抽出
**対象**: 12個のAPIテスト
**改善点**: beforeEachへの移動

```typescript
// 共通のテストヘルパー
function setupAuthenticatedRequest() {
  const token = generateTestToken();
  const headers = { Authorization: `Bearer ${token}` };
  return { token, headers };
}
```
```

## 重複パターン分析

### 検出された重複パターン
```typescript
// パターン1: 同一のセットアップコード（45箇所）
const db = new Database();
await db.connect();
await db.migrate();
await db.seed(testData);

// パターン2: 同一のエラーチェック（23箇所）
expect(() => service.method()).toThrow();
expect(() => service.method()).toThrow(SpecificError);
expect(() => service.method()).toThrow('Error message');

// パターン3: 同一の後処理（18箇所）
await cleanup();
await db.close();
jest.clearAllMocks();
```

### 推奨される共通化
```typescript
// tests/helpers/setup.ts
export function setupTestDatabase() {
  const db = new Database();
  
  beforeAll(async () => {
    await db.connect();
    await db.migrate();
  });
  
  beforeEach(async () => {
    await db.seed(testData);
  });
  
  afterEach(async () => {
    await db.clear();
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  return db;
}

// 使用例
describe('UserService', () => {
  const db = setupTestDatabase();
  // テストケース...
});
```

## エラーハンドリング

### 検出される問題
```
⚠️ 過度な共通化の警告
場所: tests/helpers/uber-helper.ts
問題: 1つのヘルパー関数が15個の引数を取っている
影響: 可読性の著しい低下
提案: 目的別に分割するか、オブジェクトパラメータを使用

⚠️ 意味的に異なるテストの誤検出
場所: tests/user.test.ts と tests/admin.test.ts
問題: 構造は似ているが、テスト対象が異なる
提案: 共通化せず、それぞれ独立したテストとして維持

🔴 テストの独立性違反
場所: tests/integration/flow.test.ts
問題: テスト間で状態を共有している
影響: テストの実行順序に依存
提案: 各テストを独立させる
```

## 統合機能

### 他のサブエージェントとの連携
- **test-factory-generator**: 重複データ生成の共通化
- **test-pattern-refactorer**: 統合後のAAA構造維持
- **test-coverage-analyzer**: 統合後のカバレッジ確認

### バージョン管理統合
```bash
# git pre-commitフック
#!/bin/bash
duplication_score=$(test-deduplication-analyzer --score-only)
if [ $duplication_score -gt 30 ]; then
  echo "Error: Test duplication score is too high: ${duplication_score}%"
  echo "Run 'npm run deduplicate-tests' to fix"
  exit 1
fi
```

## ベストプラクティス

### 重複判定の基準
1. **完全一致**: 即座に統合対象
2. **80%以上の類似**: 統合を推奨
3. **60-80%の類似**: ケースバイケース
4. **60%未満**: 独立したテストとして維持

### 共通化の指針
```typescript
// ✅ 共通化すべき: 純粋なセットアップ
function createTestUser(overrides = {}) {
  return {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}

// ❌ 共通化を避ける: テスト固有のロジック
function assertComplexBusinessRule() {
  // 特定のテストケースにのみ関連する複雑な検証
}

// ✅ 適切な抽象化レベル
class TestDataBuilder {
  static user() { return new UserBuilder(); }
  static order() { return new OrderBuilder(); }
}
```

## 高度な分析

### 意味的類似度の検出
```typescript
// ASTベースの構造分析
const ast1 = parseTestCode(test1);
const ast2 = parseTestCode(test2);
const similarity = calculateASTSimilarity(ast1, ast2);

// 自然言語処理による意図の分析
const intent1 = extractTestIntent(test1);
const intent2 = extractTestIntent(test2);
const semanticSimilarity = compareIntents(intent1, intent2);
```

### 機械学習による重複予測
```typescript
// 過去のリファクタリングパターンから学習
const model = await trainDuplicationModel(historicalData);
const predictions = model.predict(currentTests);
```

## パフォーマンス最適化

### 大規模プロジェクトへの対応
- インクリメンタル分析
- 差分ベースの検出
- 並列処理による高速化
- キャッシュの活用

## 今後の拡張予定

- AIによる自動リファクタリング
- クロスプロジェクト重複検出
- テストパターンライブラリの構築
- リアルタイム重複警告