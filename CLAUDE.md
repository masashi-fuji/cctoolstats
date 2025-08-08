# Ticket Management Instructions

Use `./ticket.sh` for ticket management.

## Working with current-ticket.md

### If current-ticket.md exists in project root
- This file is your work instruction - follow its contents
- When receiving additional instructions from users, document them in this file before proceeding
- Continue working on the active ticket

### If current-ticket.md does not exist in project root
- When receiving user requests, first ask whether to create a new ticket
- Do not start work without confirming ticket creation
- Even small requests should be tracked through the ticket system

## Create New Ticket

1. Create ticket: `./ticket.sh new feature-name`
2. Edit ticket content and description in the generated file

## Start Working on Ticket

1. Check available tickets: `./ticket.sh` list or browse tickets directory
2. Start work: `./ticket.sh start 241225-143502-feature-name`
3. Develop on feature branch (`current-ticket.md` shows active ticket)

## Closing Tickets

1. Before closing:
   - Review `current-ticket.md` content and description
   - Check all tasks in checklist are completed (mark with `[x]`)
   - Get user approval before proceeding
2. Complete: `./ticket.sh close`

---

# cctoolstats プロジェクト

## プロジェクト概要

**cctoolstats** - Claude Codeのツール呼び出し／サブエージェント実行履歴の統計を分かりやすく表示するCLIツール

このプロジェクトは [ccusage](https://github.com/ryoppippi/ccusage) のリスペクトです。

## 技術仕様

- **使用言語**: TypeScript
- **実行方法**: 
  - `npx cctoolstats@latest` (インストール不要)
  - `npm install -g cctoolstats` (グローバルインストール)

## 主要機能

1. **サブエージェント統計**: Claude Codeの各サブエージェントの使用回数を集計
2. **ツール使用分析**: Bash, Read, Write, Edit等の各ツールの使用頻度を可視化
3. **タイムライン表示**: セッション毎の実行履歴を時系列で表示

## 参考実装

Fish関数版の実装が以下にあります（起動オプションの設計参考用）:
- `~/ghq/github.com/masashi-fuji/dotfiles/.config/fish/functions/claude-subagent-stats.fish`

## データソース

Claude Codeのトランスクリプトログ (JSONL形式):
- `~/.claude/projects/*.jsonl`
- `~/.config/claude/projects/*.jsonl` (v1.0.30以降)

## 開発時の注意事項

1. トランスクリプト解析の詳細は `docs/research/transcript-analysis.md` を参照
2. アーキテクチャ設計は `docs/design/architecture.md` を参照
3. 新旧両方のパス (`~/.claude/` と `~/.config/claude/`) に対応すること
4. エラー処理とデータ欠損への耐性を考慮すること
