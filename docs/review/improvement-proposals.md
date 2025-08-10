# テスト改善提案リスト

## 優先度: 最高（即座に実施すべき）

### 1. テストヘルパー/ファクトリの導入
**対象**: 全テストファイル
**実装ファイル**: `tests/helpers/test-data-factory.ts`

```typescript
// 実装例
export const TestDataFactory = {
  // ログエントリー生成
  createLogEntry: (overrides = {}) => ({
    parentUuid: null,
    isSidechain: false,
    userType: 'external',
    cwd: '/test',
    sessionId: 'test-session',
    version: '1.0.60',
    gitBranch: '',
    type: 'assistant',
    timestamp: '2025-08-01T10:00:00Z',
    uuid: `test-uuid-${Date.now()}`,
    ...overrides
  }),
  
  // ツール使用エントリー生成
  createToolUseEntry: (toolName: string, input: any, overrides = {}) => ({
    ...TestDataFactory.createLogEntry(),
    message: {
      role: 'assistant',
      content: [{
        type: 'tool_use',
        id: `toolu_${Date.now()}`,
        name: toolName,
        input
      }]
    },
    ...overrides
  }),
  
  // サブエージェントエントリー生成
  createSubagentEntry: (agentType: string, overrides = {}) => ({
    ...TestDataFactory.createToolUseEntry('Task', {
      subagent_type: agentType,
      description: `Test ${agentType}`,
      prompt: 'Test prompt'
    }),
    ...overrides
  })
}

// ディレクトリ構造モックヘルパー
export function mockDirectoryStructure(structure: DirectoryStructure) {
  // 実装
}
```

**期待効果**:
- テストコード量 30-40% 削減
- 新規テスト作成時間 50% 短縮
- 保守性の大幅向上

### 2. parser.test.ts の充実
**対象**: `tests/unit/parser.test.ts`
**現状**: 18行のみ
**目標**: 200行以上の包括的テスト

```typescript
// 追加すべきテストケース
describe('parseToolLog', () => {
  describe('正常系', () => {
    it('parses single tool invocation')
    it('parses multiple tool invocations')
    it('parses nested tool calls')
    it('handles Task tool with subagent')
  })
  
  describe('エラー処理', () => {
    it('handles malformed JSON gracefully')
    it('handles missing required fields')
    it('handles unexpected data types')
  })
  
  describe('境界値', () => {
    it('handles empty input')
    it('handles very large input')
    it('handles deeply nested structures')
  })
})
```

**期待効果**:
- カバレッジ向上（現状 20% → 目標 80%）
- バグの早期発見
- リグレッション防止

## 優先度: 高（1週間以内に実施）

### 3. AAA パターンの明確化
**対象**: 全テストファイル
**実装方法**:
```typescript
it('should calculate tool percentages correctly', () => {
  // Arrange - テストデータの準備
  const entries = TestDataFactory.createToolEntries({
    'Bash': 3,
    'Read': 2,
    'Write': 1
  })
  
  // Act - テスト対象の実行
  const result = new ToolAnalyzer().analyze(entries)
  
  // Assert - 結果の検証
  expect(result.toolPercentages).toEqual({
    'Bash': 50.00,
    'Read': 33.33,
    'Write': 16.67
  })
})
```

### 4. 統合テストの高速化
**対象**: `tests/integration/cli.test.ts`
**実装方法**:
- プロセス起動をインプロセス実行に変更
- 並行実行の活用
- テストキャッシュの利用

```typescript
// Before
const command = `npx tsx ${cliPath} ${fixturePath}`
const { stdout } = await execAsync(command)

// After
import { run } from '../../src/cli'
const stdout = await captureOutput(() => 
  run(['node', 'cli', fixturePath])
)
```

**期待効果**:
- テスト実行時間 50% 短縮（15秒 → 7秒）
- CI/CD パイプライン高速化

### 5. エラーケース・エッジケースの追加
**対象**: 全テストファイル
**追加すべきケース**:
- ファイル読み込みエラー（権限、存在しない）
- 破損データ（不正な JSON、型不一致）
- 境界値（空、巨大、深いネスト）
- 並行処理（競合状態、デッドロック）

## 優先度: 中（2週間以内に実施）

### 6. テストの重複解消
**対象**: `cli.test.ts` と `cli-commander.test.ts`
**実装方法**:
- 責任範囲の明確化
- 共通部分を shared-cli-tests.ts に抽出
- 重複テストの削除

### 7. パラメータ化テストの導入
**対象**: CLI オプションテスト、フォーマッターテスト
**実装方法**:
```typescript
describe('CLI options', () => {
  it.each([
    ['--format json', { format: 'json' }],
    ['-f csv', { format: 'csv' }],
    ['--verbose', { verbose: true }],
    ['-v', { verbose: true }]
  ])('parses "%s" correctly', (input, expected) => {
    const args = parseArgs(input.split(' '))
    expect(args).toMatchObject(expected)
  })
})
```

### 8. スナップショットテストの導入
**対象**: フォーマッターテスト
**実装方法**:
```typescript
it('formats table output correctly', () => {
  const data = TestDataFactory.createStatsData()
  const output = formatter.formatToolStats(data)
  expect(output).toMatchSnapshot()
})
```

## 優先度: 低（継続的改善）

### 9. パフォーマンステストの追加
**対象**: 統合テスト
**測定項目**:
- 大量ファイル処理時間
- メモリ使用量
- CPU 使用率

### 10. 国際化対応テスト
**対象**: フォーマッター
**テスト項目**:
- 数値フォーマット
- 日付フォーマット
- 千位区切り

## 実装計画

### Phase 1（1週目）
- [ ] テストヘルパー/ファクトリの実装
- [ ] parser.test.ts の充実
- [ ] AAA パターンの適用（コアロジック系）

### Phase 2（2週目）
- [ ] 統合テストの高速化
- [ ] エラーケースの追加（優先度高の箇所）
- [ ] AAA パターンの適用（CLI・出力系）

### Phase 3（3週目）
- [ ] テスト重複の解消
- [ ] パラメータ化テストの導入
- [ ] AAA パターンの適用（ユーティリティ系）

### Phase 4（4週目）
- [ ] スナップショットテストの導入
- [ ] 残りのエラーケース追加
- [ ] ドキュメント更新

## 成功指標

### 定量指標
- テストカバレッジ: 70% → 85%
- テスト実行時間: 15秒 → 7秒
- テストコード行数: 2,800行 → 2,000行（重複削減）

### 定性指標
- 新規テスト追加時間の短縮
- テストの可読性向上
- バグ検出率の向上
- 開発者満足度の向上

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 既存テストの破壊 | 高 | 段階的移行、並行実行 |
| 実装工数の超過 | 中 | 優先度に基づく段階実装 |
| チーム理解不足 | 低 | ペアプロ、レビュー強化 |

## まとめ

この改善計画により、テストスイートは以下のように変化します：

**Before**: 機能テスト中心、重複多、実行遅い
**After**: TDD 実践、DRY 原則遵守、高速実行

継続的な改善により、より信頼性が高く保守しやすいテストスイートを実現し、開発効率と品質の両立を達成します。