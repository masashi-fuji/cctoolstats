# cctoolstats

Claude Codeのツール呼び出し／サブエージェント実行履歴の統計を分かりやすく表示するCLIツール

> このプロジェクトは [ccusage](https://github.com/ryoppippi/ccusage) のリスペクトです

## 特徴

- 📊 **サブエージェント統計**: 各サブエージェントの使用回数と成功率を集計
- 🔧 **ツール使用分析**: Bash, Read, Write, Edit等の使用頻度を可視化
- 📈 **タイムライン表示**: セッション毎の実行履歴を時系列で確認
- 🚀 **インストール不要**: npxで即座に実行可能

## インストール

### インストールなしで実行（推奨）

```bash
npx cctoolstats@latest
```

### グローバルインストール

```bash
npm install -g cctoolstats
```

## 使い方

### 基本的な使い方

```bash
# 現在のディレクトリの統計を表示（デフォルト）
cctoolstats

# 複数のプロジェクトディレクトリを分析
cctoolstats ~/project1 ~/project2

# 全プロジェクトの統計を表示
cctoolstats --all

# 特定のプロジェクトを分析
cctoolstats --project /path/to/project

# 特定のログファイルを分析（後方互換性）
cctoolstats file.jsonl
```

### 出力フォーマット

```bash
# テーブル形式で出力（デフォルト）
cctoolstats

# JSON形式で出力
cctoolstats --format json

# CSV形式で出力
cctoolstats --format csv

# ファイルに保存
cctoolstats --output results.json --format json
```

### 詳細オプション

```bash
# ヘルプを表示
cctoolstats --help

# バージョンを表示
cctoolstats --version

# 数値を千単位区切りで表示
cctoolstats --thousand-separator

# カラー出力を強制
cctoolstats --color

# 詳細モードで表示
cctoolstats --verbose
```

## 出力例

### デフォルトテーブル形式

```
Tool Usage Statistics
==================================================
┌───────┬───────┬────────────┐
│ Tool  │ Count │ Percentage │
├───────┼───────┼────────────┤
│ Bash  │ 3     │ 42.86%     │
├───────┼───────┼────────────┤
│ Read  │ 1     │ 14.29%     │
├───────┼───────┼────────────┤
│ Write │ 1     │ 14.29%     │
└───────┴───────┴────────────┘
Total: 7

Subagent Usage Statistics
==================================================
┌───────────────┬───────┬────────────┐
│ Subagent      │ Count │ Percentage │
├───────────────┼───────┼────────────┤
│ code-reviewer │ 2     │ 66.67%     │
├───────────────┼───────┼────────────┤
│ test-writer   │ 1     │ 33.33%     │
└───────────────┴───────┴────────────┘
Total: 3
```

### JSON形式出力

```json
{
  "tools": {
    "totalInvocations": 7,
    "uniqueTools": 5,
    "toolCounts": {
      "Bash": 3,
      "Read": 1,
      "Write": 1
    },
    "toolPercentages": {
      "Bash": 42.86,
      "Read": 14.29,
      "Write": 14.29
    }
  },
  "subagents": {
    "totalInvocations": 3,
    "uniqueAgents": 2,
    "agentCounts": {
      "code-reviewer": 2,
      "test-writer": 1
    }
  }
}
```

## データソース

Claude Codeのトランスクリプトログ（JSONL形式）を解析します：

- `~/.claude/projects/*.jsonl`
- `~/.config/claude/projects/*.jsonl` (v1.0.30以降)

各行には以下の情報が含まれます：
- タイムスタンプ
- メッセージ内容
- ツール呼び出し情報
- サブエージェント（Task）実行記録
- トークン使用量
- モデル情報

## 開発

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/masashi-fuji/cctoolstats.git
cd cctoolstats

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### ビルド

```bash
# TypeScriptをコンパイル
npm run build

# テストを実行
npm test

# リントを実行
npm run lint
```

### プロジェクト構造

```
cctoolstats/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── cli.ts             # CLIインターフェース
│   ├── analyzer/          # ログ解析ロジック
│   ├── parser/            # JSONLパーサー
│   ├── formatters/        # 出力フォーマッター
│   └── types/             # TypeScript型定義
├── docs/
│   ├── research/          # 調査・研究ドキュメント
│   └── design/            # 設計ドキュメント
├── tests/                 # テストファイル
└── package.json
```

## 貢献

プルリクエストを歓迎します！以下の手順でご協力ください：

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## サポート

- 🐛 **バグ報告**: [GitHub Issues](https://github.com/masashi-fuji/cctoolstats/issues)
- 💡 **機能要望**: [GitHub Issues](https://github.com/masashi-fuji/cctoolstats/issues)
- 💬 **質問・ディスカッション**: [GitHub Discussions](https://github.com/masashi-fuji/cctoolstats/discussions)

## 作者

- GitHub: [@masashi-fuji](https://github.com/masashi-fuji)

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 謝辞

- [ccusage](https://github.com/ryoppippi/ccusage) - インスピレーションとなった素晴らしいプロジェクト
- [Claude Code](https://claude.ai/code) - 開発を支援してくれたAIペアプログラマー

## 関連リンク

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [ccusage](https://github.com/ryoppippi/ccusage)
- [Issue Tracker](https://github.com/masashi-fuji/cctoolstats/issues)