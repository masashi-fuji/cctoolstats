---
priority: 2
tags: []
description: ""
created_at: "2025-08-09T13:11:39Z"
started_at: 2025-08-09T13:14:13Z # Do not modify manually
closed_at: 2025-08-09T14:13:19Z # Do not modify manually
---

# Ticket: CLI Directory Arguments Support

## 概要
コマンドライン構文を `cctoolstats [オプション] [ファイル...]` から `cctoolstats [オプション] [ディレクトリ...]` に変更し、より自然なプロジェクト単位での実行を可能にする。

## 背景
現在のユースケースでは、プロジェクトに対して実行することが殆どであり、ファイルを直接指定するケースは少ない。ディレクトリを指定した時には、自動的にトランスクリプトファイルを探して解析するようにすることで、より直感的な使用感を提供できる。

## 実装タスク
- [x] CLI引数処理の変更 (src/cli.ts)
  - [x] argument定義を [paths...] に変更
  - [x] ディレクトリ判定ロジックの追加
  - [x] ディレクトリからトランスクリプトファイルを自動検索する処理
  - [x] ヘルプテキストの更新
- [x] README.mdの更新
  - [x] 使用例をディレクトリベースに更新
  - [x] ファイル直接指定を特殊ケースとして記載
- [x] テストの追加・更新 (tests/unit/cli.test.ts)
  - [x] ディレクトリ指定のテストケース追加
  - [x] 複数ディレクトリ指定のテスト
  - [x] ディレクトリとファイル混在のテスト
- [x] Run tests before closing and pass all tests (No exceptions)
- [x] Get developer approval before closing

## 仕様詳細

### 引数処理ロジック
- ディレクトリが指定された場合: そのディレクトリのトランスクリプトファイルを自動検索
- .jsonlファイルが指定された場合: 直接そのファイルを使用（後方互換性維持）
- 引数なしの場合: 現在のディレクトリを解析（現在のデフォルト動作を維持）

### 新しいコマンドライン構文
```bash
# 基本構文
cctoolstats [オプション] [ディレクトリ...]

# 使用例
cctoolstats                              # 現在のディレクトリ（デフォルト）
cctoolstats ~/project1 ~/project2        # 複数のプロジェクトディレクトリ
cctoolstats --format json ~/myproject    # JSON形式で特定プロジェクト
cctoolstats file.jsonl                   # 特定ファイル（後方互換性）
```

## 受け入れ基準
- [x] ディレクトリを指定した場合、そのプロジェクトのトランスクリプトファイルが自動的に解析される
- [x] 複数のディレクトリを指定できる
- [x] .jsonlファイルの直接指定も引き続き動作する（後方互換性）
- [x] ヘルプメッセージが新しい構文を反映している
- [x] すべての既存テストが通る
- [x] 新規テストが追加され、通る
