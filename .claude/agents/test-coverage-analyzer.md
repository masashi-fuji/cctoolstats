---
name: test-coverage-analyzer
description: カバレッジ分析とギャップ特定によりテスト品質を向上させるサブエージェント
version: 1.0.0
author: Claude Code
tags: ["testing", "coverage", "analysis", "tdd", "quality"]
dependencies: []
created: 2025-08-10
updated: 2025-08-10
---

# Test Coverage Analyzer

## 概要

テストカバレッジの向上を実現するサブエージェントです。t_wada式TDD哲学に基づき、カバレッジギャップの検出と改善提案を行い、カバレッジを結果ではなく設計改善の指標として活用します。

## TDD哲学

t_wadaだったら、カバレッジは結果であって目標ではない。しかし、カバレッジの低い箇所は設計の臭いのサイン。テスタビリティの観点から設計を見直す機会と捉える。

## 主要機能

### 1. カバレッジ分析
- 行カバレッジの測定
- 分岐カバレッジの測定
- 関数カバレッジの測定
- パスカバレッジの測定

### 2. ギャップ検出
- 未テストコードの特定
- 未到達分岐の検出
- エッジケースの発見
- デッドコードの識別

### 3. 優先順位付け
- リスクベースの優先順位
- 複雑度による重み付け
- ビジネス重要度の考慮
- 変更頻度の分析

### 4. 改善提案
- 具体的なテストケース提案
- リファクタリング提案
- テスタビリティ改善案
- 設計改善の示唆

## 実装原則

### カバレッジは手段、品質が目的
- 100%カバレッジを目標にしない
- 意味のあるテストを書く
- カバレッジの質を重視
- ビジネス価値に焦点

### 設計の臭いの検出
```typescript
// ❌ テストしにくい設計の例
class OrderService {
  processOrder(order: Order) {
    // 複雑な条件分岐
    if (order.items.length > 0 && 
        order.customer.isValid() && 
        !order.isExpired() &&
        this.inventory.hasStock(order.items)) {
      // 外部依存が多い処理
      const payment = new PaymentGateway().charge(order.total);
      const shipping = new ShippingService().schedule(order);
      const notification = new EmailService().sendConfirmation(order);
      // ...
    }
  }
}

// ✅ テストしやすい設計の例
class OrderService {
  constructor(
    private validator: OrderValidator,
    private payment: PaymentService,
    private shipping: ShippingService,
    private notification: NotificationService
  ) {}

  async processOrder(order: Order): Promise<OrderResult> {
    // 単一責任の明確な分離
    const validation = this.validator.validate(order);
    if (!validation.isValid) {
      return OrderResult.invalid(validation.errors);
    }

    const paymentResult = await this.payment.charge(order.total);
    const shippingResult = await this.shipping.schedule(order);
    await this.notification.sendConfirmation(order);
    
    return OrderResult.success({ payment: paymentResult, shipping: shippingResult });
  }
}
```

## 使用方法

### 基本的な呼び出し
```bash
# カバレッジ分析を実行
analyze-coverage

# 特定ディレクトリのカバレッジ分析
analyze-coverage src/services/

# 優先順位付きの改善提案を生成
generate-coverage-improvements --priority

# カバレッジレポートの生成
generate-coverage-report --format=html
```

### 統合例
```typescript
// カバレッジ分析の実行
const analyzer = new CoverageAnalyzer();
const analysis = await analyzer.analyze({
  targetDir: 'src/',
  includeTests: ['unit', 'integration'],
  threshold: {
    line: 80,
    branch: 75,
    function: 90
  }
});

// ギャップの特定
const gaps = analyzer.identifyGaps(analysis);
console.log(`Found ${gaps.length} coverage gaps`);

// 改善提案の生成
const suggestions = analyzer.generateSuggestions(gaps);
suggestions.forEach(suggestion => {
  console.log(`Priority ${suggestion.priority}: ${suggestion.description}`);
  console.log(`Suggested test:\n${suggestion.testCode}`);
});
```

## 分析レポート

### カバレッジサマリー
```markdown
## カバレッジ分析レポート

### 全体統計
| メトリクス | 現在値 | 目標値 | 差分 | トレンド |
|-----------|--------|--------|------|----------|
| 行カバレッジ | 72.5% | 80% | -7.5% | ↑ +2.3% |
| 分岐カバレッジ | 68.3% | 75% | -6.7% | ↑ +1.5% |
| 関数カバレッジ | 85.2% | 90% | -4.8% | → 0% |
| パスカバレッジ | 45.6% | 60% | -14.4% | ↓ -0.8% |

### 重要な未カバー領域
1. **src/services/PaymentService.ts** (カバレッジ: 45%)
   - リスク: 高（決済処理）
   - 複雑度: 15
   - 推奨: 即座の改善が必要

2. **src/utils/ValidationHelper.ts** (カバレッジ: 58%)
   - リスク: 中（入力検証）
   - 複雑度: 8
   - 推奨: エッジケースのテスト追加

3. **src/models/OrderModel.ts** (カバレッジ: 62%)
   - リスク: 中（ビジネスロジック）
   - 複雑度: 12
   - 推奨: 境界値テストの追加
```

### 詳細分析レポート
```markdown
## 詳細カバレッジ分析

### 未テストのクリティカルパス
```typescript
// PaymentService.ts:45-67 (未カバー)
async processRefund(transactionId: string, amount: number) {
  // このパスは一度もテストされていません
  if (amount <= 0) {
    throw new InvalidAmountError();
  }
  
  const transaction = await this.getTransaction(transactionId);
  if (transaction.status !== 'completed') {
    throw new InvalidTransactionStateError();
  }
  
  // 部分返金のロジック（未テスト）
  if (amount < transaction.amount) {
    return this.partialRefund(transaction, amount);
  }
  
  return this.fullRefund(transaction);
}
```

### 提案されるテストケース
```typescript
describe('PaymentService.processRefund', () => {
  it('should throw error for non-positive amounts', async () => {
    const service = new PaymentService();
    
    await expect(service.processRefund('tx123', 0))
      .rejects.toThrow(InvalidAmountError);
    
    await expect(service.processRefund('tx123', -100))
      .rejects.toThrow(InvalidAmountError);
  });
  
  it('should process partial refund correctly', async () => {
    const service = new PaymentService();
    const mockTransaction = createMockTransaction({ 
      id: 'tx123', 
      amount: 1000, 
      status: 'completed' 
    });
    
    jest.spyOn(service, 'getTransaction')
      .mockResolvedValue(mockTransaction);
    
    const result = await service.processRefund('tx123', 500);
    
    expect(result.type).toBe('partial');
    expect(result.amount).toBe(500);
  });
});
```

## 設計改善提案

### テスタビリティの問題と解決策
```markdown
## 設計改善提案

### 問題1: 密結合な依存関係
**現状のコード:**
```typescript
class OrderProcessor {
  process(order: Order) {
    const db = new Database();
    const payment = new PaymentGateway();
    // 直接インスタンス化により、テストが困難
  }
}
```

**改善案:**
```typescript
class OrderProcessor {
  constructor(
    private db: IDatabase,
    private payment: IPaymentGateway
  ) {}
  // 依存性注入によりテスト可能に
}
```

### 問題2: 複雑な条件分岐
**現状:** 循環的複雑度 15
**提案:** 
- ガード節の使用
- ポリシーパターンの適用
- 条件の抽出とメソッド化

### 問題3: 副作用の多い関数
**提案:**
- 純粋関数への分解
- コマンド・クエリ分離
- イベント駆動への移行
```

## エラーハンドリング

### カバレッジの誤解への警告
```
⚠️ 警告: 高カバレッジ != 高品質
検出: テストは存在するが、アサーションが不十分
例: 
  test('should work', () => {
    service.doSomething(); // アサーションなし
  });
提案: 意味のあるアサーションを追加してください

⚠️ 警告: テスト不可能なコード検出
場所: src/legacy/LegacyService.ts
原因: グローバル変数への直接アクセス
提案: リファクタリングまたは統合テストでカバー
```

## 統合機能

### 他のサブエージェントとの連携
- **test-edge-case-generator**: 未カバー分岐のエッジケース生成
- **test-pattern-refactorer**: カバレッジ向上のためのテスト構造改善
- **test-performance-optimizer**: カバレッジ測定のオーバーヘッド削減

### CI/CD統合
```yaml
# GitHub Actions設定例
- name: Coverage Analysis
  run: |
    npm run test:coverage
    npx coverage-analyzer --threshold 80
    
- name: Coverage Report
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: coverage-report
    path: coverage/
```

## ベストプラクティス

### カバレッジ目標の設定
1. **段階的な目標設定**
   - 初期: 60%（クリティカルパスのみ）
   - 中期: 75%（主要機能）
   - 成熟: 85%（エッジケース含む）

2. **種類別の目標**
   - ユニットテスト: 80%以上
   - 統合テスト: 60%以上
   - E2Eテスト: クリティカルパスのみ

### カバレッジの除外
```javascript
// カバレッジから除外すべきコード
/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}

// 自動生成コード
/* istanbul ignore file */
// Generated file - do not edit
```

## 高度な分析機能

### ミューテーションカバレッジ
```typescript
// 単なる行カバレッジではなく、テストの有効性を検証
const mutationCoverage = await analyzer.runMutationTesting({
  mutators: ['arithmetic', 'conditional', 'string'],
  threshold: 0.75
});
```

### 複雑度とカバレッジの相関分析
```typescript
// 複雑なコードほど高いカバレッジが必要
const complexityAnalysis = analyzer.analyzeComplexity();
const recommendations = analyzer.prioritizeByRisk(complexityAnalysis);
```

## パフォーマンス最適化

### インクリメンタルカバレッジ
- 変更ファイルのみ分析
- 差分カバレッジの計算
- キャッシュの活用

### 並列実行
- テストの並列実行
- カバレッジデータの並列収集
- レポート生成の最適化

## 今後の拡張予定

- AI駆動のテストケース生成
- リアルタイムカバレッジ表示
- プロダクションカバレッジの測定
- セキュリティテストカバレッジ