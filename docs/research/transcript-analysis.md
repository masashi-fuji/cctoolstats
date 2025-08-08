# Claude Code トランスクリプト解析リサーチ

## 概要

Claude Codeのトランスクリプトファイル（`~/.claude/projects/*.jsonl`）には、1行=1イベントのJSONが時系列で記録されており、メッセージ内容、ツール呼び出し、サブエージェント（Task）実行、トークン使用量などを詳細に復元できます。

## ファイル配置とプロジェクト名の規則

### 保存場所
- **既定パス（旧）**: `~/.claude/projects/`
- **既定パス（新）**: `~/.config/claude/projects/` (v1.0.30以降)
- 両方のパスに対応する必要がある

### ディレクトリ名の規則
- プロジェクトは作業ディレクトリの絶対パスを `/` → `-` に置換したディレクトリ名で保存
- 例: `/home/user/projects/myapp` → `home-user-projects-myapp`
- セッションは `*.jsonl` の行指向ログとして保存

## JSONLファイルの構造

### 基本的なイベントフィールド

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "version": "1.0.0",
  "message": {
    "usage": {
      "input_tokens": 1234,
      "output_tokens": 567,
      "cache_creation_input_tokens": 100,  // optional
      "cache_read_input_tokens": 50        // optional
    },
    "model": "claude-3-opus-20240229",
    "id": "msg_xxx",
    "content": [/* ... */]
  },
  "costUSD": 0.0123,              // optional
  "requestId": "req_xxx",          // optional
  "isApiErrorMessage": false       // optional
}
```

## メッセージ種別

トランスクリプトに記録される主なメッセージタイプ：

1. **user/assistant**: 通常の会話メッセージ
2. **tool use/tool result**: ツール実行とその結果
3. **system**: initなどのシステムコマンド
4. **thinking**: 拡張思考モードの内容
5. **image**: 画像の参照
6. **summary**: 要約メッセージ

## ツール呼び出しの詳細

### Claude Code公式ツール一覧

- **ファイル操作**: Read, Write, Edit, MultiEdit
- **検索**: Glob, Grep, LS
- **実行**: Bash
- **Notebook**: NotebookRead, NotebookEdit
- **Web**: WebFetch, WebSearch
- **タスク管理**: TodoWrite
- **サブエージェント**: Task

### ツール使用の記録形式

ツール呼び出しは `tool use` イベントとして記録：

```json
{
  "type": "tool_use",
  "tool": "Read",
  "input": {
    "file_path": "/path/to/file.ts"
  }
}
```

結果は `tool result` イベントとして記録：

```json
{
  "type": "tool_result",
  "tool": "Read",
  "output": "file contents..."
}
```

## サブエージェント（Subagents）の解析

### 実装詳細
- **実体**: `Task` ツールの実行として記録
- **独立コンテキスト**: サブエージェントは独立したコンテキストで実行
- **完了検出**: `SubagentStop` フックイベントで完了を検出可能

### サブエージェント定義の配置
- プロジェクト固有: `.claude/agents/`
- グローバル: `~/.claude/agents/`

### Task実行の記録例

```json
{
  "type": "tool_use",
  "tool": "Task",
  "input": {
    "subagent_type": "research-specialist",
    "prompt": "Research authentication APIs",
    "description": "API research"
  }
}
```

## コストとトークンの追跡

### トークン使用量の分類
- `input_tokens`: 入力トークン数
- `output_tokens`: 出力トークン数
- `cache_creation_input_tokens`: キャッシュ作成トークン
- `cache_read_input_tokens`: キャッシュ読み取りトークン

### モデル別の集計
- モデル名は `message.model` フィールドに記録
- Opus, Sonnet, Haikuなどのモデル別に集計可能

### コスト算定
- `costUSD` フィールドが存在する場合は直接利用
- 存在しない場合はトークン数とモデルの料金表から推定

## CLIのJSON出力との連携

`--output-format json` または `--output-format stream-json` オプションで以下の情報を取得可能：

- コスト情報
- 所要時間
- メタデータ

これらをローカルの転記と突合することで、日別・セッション別のコスト推定が可能。

## データの保存期間と欠損対策

### 自動削除の考慮
- `cleanupPeriodDays` 設定により古いトランスクリプトが自動削除される可能性
- データ欠損を前提とした耐性のある実装が必要

### プロジェクト移動時の対応
- パスエンコード規則に従って履歴を追跡
- プロジェクトのリネームや移動時も履歴を引き継ぐ

## 実装上の注意事項

### 1. パスの自動検出
```typescript
const transcriptPaths = [
  '~/.claude/projects/',
  '~/.config/claude/projects/'
];
```

### 2. 欠損データへの対応
- `costUSD` は任意フィールド
- `thinking` や画像データも存在する場合のみ処理
- エラー耐性を持たせた実装

### 3. 正規化されたツール名での集計
- 正規のツール名（Bash, Write, Read等）で統一
- `Task` = サブエージェントとして特別扱い

### 4. フック連携の可能性
- `Pre/PostToolUse` フックでより詳細な情報取得
- `SubagentStop` でサブエージェント完了を確実に検出

## 拡張可能性

### 近い将来の拡張
1. **サブエージェント粒度の分析**
   - 実行時間（開始〜SubagentStop）
   - 同時実行数
   - エージェント別の権限と実行内容

2. **ツール利用プロファイル**
   - ツール名ごとの頻度・失敗率
   - 平均実行時間
   - ファイルパス（Write/Edit）の分析
   - Bashコマンドの内容分析

3. **コスト/トークンの相関分析**
   - モデル別の使用量
   - キャッシュトークンの分離集計
   - ツール/サブエージェントとの相関

### 長期的な拡張
1. **セッション再構成とタイムライン**
   - セッションID別の可視化
   - 要約・画像・thinkingの時系列表示
   - インタラクティブなダッシュボード

2. **データ完全性チェック**
   - プロジェクト同定の自動化
   - 移動・リネーム時の履歴マージ

3. **リアルタイム監視**
   - フック連携による即時データ取得
   - ライブダッシュボード

## 参考リンク

### 一次情報・公式ドキュメント
- [ccusage 公式ドキュメント](https://ccusage.com/guide/) - データ場所・スキーマ
- [ccusage usageDataSchema](https://ccusage.com/api/data-loader/variables/usageDataSchema) - 抽出スキーマ
- [Claude Code Settings](https://docs.anthropic.com/en/docs/claude-code/settings) - ツール一覧、保存期間
- [Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks) - イベント種別・SubagentStop
- [Hooks ガイド](https://docs.anthropic.com/en/docs/claude-code/hooks-guide) - Pre/PostToolUse例
- [Subagents](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - 設計と配置場所
- [Common Workflows](https://docs.anthropic.com/en/docs/claude-code/common-workflows) - output-formatオプション

### 実装例・コミュニティリソース
- [claude-code-log](https://github.com/daaain/claude-code-log) - 変換/ビューワ実装
- [パスエンコードと履歴の構造](https://gist.github.com/gwpl/e0b78a711b4a6b2fc4b594c9b9fa2c4c) - 実地ガイド

## データサンプル（最小構成）

実際のJSONLファイルの最小サンプル：

```jsonl
{"timestamp":"2024-01-01T00:00:00.000Z","type":"user","message":{"content":[{"type":"text","text":"Hello"}]}}
{"timestamp":"2024-01-01T00:00:01.000Z","type":"assistant","message":{"content":[{"type":"text","text":"Hi!"}],"usage":{"input_tokens":10,"output_tokens":5},"model":"claude-3-opus-20240229"}}
{"timestamp":"2024-01-01T00:00:02.000Z","type":"tool_use","tool":"Read","input":{"file_path":"README.md"}}
{"timestamp":"2024-01-01T00:00:03.000Z","type":"tool_result","tool":"Read","output":"# Project\n..."}
{"timestamp":"2024-01-01T00:00:04.000Z","type":"tool_use","tool":"Task","input":{"subagent_type":"code-reviewer","prompt":"Review this code"}}
{"timestamp":"2024-01-01T00:00:10.000Z","type":"SubagentStop","subagent":"code-reviewer"}
```

## まとめ

Claude Codeのトランスクリプトは豊富な情報を含んでおり、以下の分析が可能：

1. **確実に取得可能な情報**
   - ツール呼び出し回数と種類
   - サブエージェント実行履歴
   - トークン使用量とコスト
   - タイムスタンプと実行順序

2. **実装上の考慮事項**
   - 新旧パスの両対応
   - データ欠損への耐性
   - 正規化されたツール名での集計
   - プロジェクト移動への対応

3. **拡張の可能性**
   - フック連携による詳細データ
   - リアルタイム監視
   - 高度な分析と可視化