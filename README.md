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
# 現在のプロジェクトの統計を表示
cctoolstats

# 特定期間の統計を表示
cctoolstats --days 7

# サブエージェントの統計のみ表示
cctoolstats --agents

# ツール使用統計のみ表示
cctoolstats --tools

# JSON形式で出力
cctoolstats --json
```

### 詳細オプション

```bash
# ヘルプを表示
cctoolstats --help

# バージョンを表示
cctoolstats --version

# 特定のプロジェクトを分析
cctoolstats --project /path/to/project

# 詳細モードで表示
cctoolstats --verbose
```

## 出力例

```
Claude Code Tool Statistics
===========================

📊 Subagent Usage (Last 7 days)
--------------------------------
research-specialist        15 calls  (25.0%)
code-reviewer             12 calls  (20.0%)
test-case-generator        8 calls  (13.3%)
documentation-writer       6 calls  (10.0%)
...

🔧 Tool Usage (Last 7 days)
---------------------------
Read                     245 calls  (30.2%)
Edit                     156 calls  (19.2%)
Bash                     134 calls  (16.5%)
Write                     89 calls  (11.0%)
Task                      60 calls  ( 7.4%)
...

📈 Session Summary
-----------------
Total Sessions:              42
Average Session Duration:    15m
Most Active Period:     14:00-16:00
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

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 謝辞

- [ccusage](https://github.com/ryoppippi/ccusage) - インスピレーションとなった素晴らしいプロジェクト
- [Claude Code](https://claude.ai/code) - 開発を支援してくれたAIペアプログラマー

## 関連リンク

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [ccusage](https://github.com/ryoppippi/ccusage)
- [Issue Tracker](https://github.com/masashi-fuji/cctoolstats/issues)