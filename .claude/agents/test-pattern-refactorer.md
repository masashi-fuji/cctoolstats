---
name: test-pattern-refactorer
description: テストコードをAAA(Arrange-Act-Assert)パターンへ自動変換し構造化と可読性を向上させるサブエージェント
version: 1.0.0
author: Claude Code
tags: ["testing", "aaa-pattern", "refactoring", "tdd", "readability"]
dependencies: []
created: 2025-08-10
updated: 2025-08-10
---

# Test Pattern Refactorer

## 概要

テストコードの構造化と可読性向上を実現するサブエージェントです。t_wada式TDD哲学に基づき、Arrange-Act-Assert (AAA) パターンへの自動変換を行い、テストを仕様書として読めるようにします。

## TDD哲学

t_wadaだったら、テストは仕様書として読めるべき。AAAパターンで構造化し、一つのテストは一つの振る舞いのみを検証する。テストメソッド名は期待される振る舞いを明確に表現する。

## 主要機能

### 1. パターン検出と分析
- 既存テストコードの構造分析
- AAAパターンからの逸脱検出
- アンチパターンの識別
- 改善ポイントの特定

### 2. AAA パターンへの変換
- Arrange（準備）セクションの抽出
- Act（実行）セクションの明確化
- Assert（検証）セクションの整理
- セクション間の空行追加

### 3. テスト名の改善
- 振る舞いを表現する命名への変換
- Given-When-Then形式のサポート
- 日本語/英語での明確な表現
- 一貫性のある命名規則の適用

### 4. テストの分割と統合
- 複数の検証を含むテストの分割
- 関連するテストのグループ化
- テストスイートの再構成
- セットアップの共通化

## 実装原則

### 一つのテスト、一つの振る舞い
- 単一の振る舞いに焦点を当てる
- 複数のアサーションは関連する場合のみ
- 独立性の確保
- 失敗時の原因特定を容易に

### 明確な構造化
```typescript
// ✅ 良い例：AAAパターン
it('should return user name when valid id is provided', () => {
  // Arrange
  const userId = '123';
  const expectedName = 'John Doe';
  const userService = new UserService();
  
  // Act
  const userName = userService.getUserName(userId);
  
  // Assert
  expect(userName).toBe(expectedName);
});

// ❌ 悪い例：構造が不明確
it('test user', () => {
  const userService = new UserService();
  expect(userService.getUserName('123')).toBe('John Doe');
  const result = userService.updateUser('123', { name: 'Jane' });
  expect(result).toBeTruthy();
  expect(userService.getUserName('123')).toBe('Jane');
});
```

### テスト名の表現力
- 「〜すべき」（should）で始まる
- 条件と期待される結果を明記
- ビジネス用語を使用
- 技術的詳細は避ける

## 使用方法

### 基本的な呼び出し
```bash
# プロジェクト全体のテストをAAAパターンに変換
refactor-to-aaa-pattern

# 特定のテストファイルを変換
refactor-test-file tests/user.test.ts

# テスト名を改善
improve-test-names tests/

# レポートのみ生成（変更なし）
analyze-test-patterns --report-only
```

### 変換例

#### Before: 構造化されていないテスト
```typescript
describe('UserService', () => {
  it('test1', () => {
    const service = new UserService();
    service.addUser({ id: '1', name: 'Alice' });
    const user = service.getUser('1');
    expect(user.name).toBe('Alice');
    expect(user.id).toBe('1');
  });
  
  it('test2', () => {
    const service = new UserService();
    expect(() => service.getUser('999')).toThrow();
    service.addUser({ id: '2', name: 'Bob' });
    expect(() => service.getUser('999')).toThrow();
  });
});
```

#### After: AAAパターンに変換後
```typescript
describe('UserService', () => {
  describe('when adding and retrieving users', () => {
    it('should return the added user with correct properties', () => {
      // Arrange
      const service = new UserService();
      const newUser = { id: '1', name: 'Alice' };
      
      // Act
      service.addUser(newUser);
      const retrievedUser = service.getUser('1');
      
      // Assert
      expect(retrievedUser.name).toBe('Alice');
      expect(retrievedUser.id).toBe('1');
    });
  });
  
  describe('when retrieving non-existent users', () => {
    it('should throw an error for non-existent user id', () => {
      // Arrange
      const service = new UserService();
      const nonExistentId = '999';
      
      // Act & Assert
      expect(() => service.getUser(nonExistentId)).toThrow();
    });
    
    it('should still throw error after adding different user', () => {
      // Arrange
      const service = new UserService();
      const existingUser = { id: '2', name: 'Bob' };
      const nonExistentId = '999';
      
      // Act
      service.addUser(existingUser);
      
      // Assert
      expect(() => service.getUser(nonExistentId)).toThrow();
    });
  });
});
```

## 分析レポート

### パターン分析レポート
```markdown
## テストパターン分析レポート

### 統計サマリー
- 総テスト数: 156
- AAAパターン準拠: 89 (57%)
- 要改善: 67 (43%)

### パターン別分類
| パターン | 件数 | 割合 | 推奨アクション |
|---------|------|------|---------------|
| AAA準拠 | 89 | 57% | 維持 |
| 構造不明確 | 34 | 22% | AAA変換 |
| 複数振る舞い | 18 | 12% | 分割 |
| セットアップ過多 | 15 | 9% | ヘルパー抽出 |

### 命名規則分析
- 明確な命名: 102 (65%)
- 改善可能: 54 (35%)
  - 一般的すぎる: 23
  - 技術的詳細: 18
  - 振る舞い不明: 13
```

### 改善提案レポート
```markdown
## 改善提案

### 優先度: 高
1. **test/auth.test.ts**
   - 問題: 1つのテストで5つの異なる振る舞いを検証
   - 提案: 5つの独立したテストに分割
   - 影響: テストの失敗原因が明確になる

2. **test/api.test.ts**
   - 問題: セットアップコードが各テストで重複
   - 提案: beforeEachまたはヘルパー関数に抽出
   - 影響: 40行のコード削減

### 優先度: 中
3. **test/utils.test.ts**
   - 問題: テスト名が "test1", "test2" など
   - 提案: 振る舞いを表現する名前に変更
   - 影響: 可読性の大幅向上
```

## エラーハンドリング

### 検出されるアンチパターン
```typescript
// ❌ アンチパターン1: 複数の振る舞いのテスト
it('tests user operations', () => {
  // 作成、更新、削除を1つのテストで
});

// ❌ アンチパターン2: 条件分岐のあるテスト
it('handles different cases', () => {
  if (condition) {
    expect(a).toBe(b);
  } else {
    expect(c).toBe(d);
  }
});

// ❌ アンチパターン3: 順序依存のテスト
it('step 1', () => { /* ... */ });
it('step 2', () => { /* depends on step 1 */ });
```

### 警告メッセージ
```
⚠️ 複数振る舞いの検出
ファイル: test/user.test.ts:45
検出: 3つの異なる振る舞いが1つのテストに含まれています
提案: 以下の3つのテストに分割してください：
  1. should create user successfully
  2. should update user name
  3. should delete user

⚠️ テスト間の依存関係
ファイル: test/integration.test.ts:120
検出: テスト "step 2" が "step 1" の結果に依存しています
提案: 各テストを独立させるか、統合テストとして1つにまとめてください
```

## 統合機能

### 他のサブエージェントとの連携
- **test-factory-generator**: AAAのArrangeセクションでファクトリを活用
- **test-deduplication-analyzer**: 重複するArrangeセクションの共通化
- **test-documentation-generator**: 構造化されたテストからドキュメント生成

### エディタ統合
- VSCode拡張機能としての動作
- リアルタイムのパターン違反検出
- クイックフィックスの提供
- リファクタリングの自動適用

## ベストプラクティス

### AAAパターンの適用指針
1. **Arrange（準備）**
   - すべての前提条件を明示
   - テストデータの準備
   - モックの設定
   - 期待値の定義

2. **Act（実行）**
   - 単一の操作のみ
   - 明確な実行ポイント
   - 戻り値の保存

3. **Assert（検証）**
   - 関連する検証のグループ化
   - 明確なエラーメッセージ
   - 期待値との比較

### Given-When-Thenスタイル
```typescript
describe('Calculator', () => {
  describe('Given two positive numbers', () => {
    describe('When adding them', () => {
      it('Then should return their sum', () => {
        // Arrange (Given)
        const a = 5;
        const b = 3;
        const calculator = new Calculator();
        
        // Act (When)
        const result = calculator.add(a, b);
        
        // Assert (Then)
        expect(result).toBe(8);
      });
    });
  });
});
```

## 設定オプション

### カスタマイズ可能な設定
```json
{
  "testPatternRefactorer": {
    "style": "AAA",  // AAA, GWT, or Custom
    "naming": {
      "convention": "should",  // should, must, or custom
      "language": "en"  // en, ja, or auto
    },
    "structure": {
      "addSectionComments": true,
      "addBlankLines": true,
      "extractHelpers": true
    },
    "analysis": {
      "detectAntiPatterns": true,
      "suggestImprovements": true,
      "autoFix": false
    }
  }
}
```

## パフォーマンス考慮

### 大規模プロジェクトへの対応
- インクリメンタルな変換
- キャッシュによる高速化
- 並列処理のサポート
- 差分解析の活用

## 今後の拡張予定

- AIによるテスト名の自動生成
- ビジネスルールの抽出とテスト生成
- BDD形式への変換サポート
- テストシナリオの可視化