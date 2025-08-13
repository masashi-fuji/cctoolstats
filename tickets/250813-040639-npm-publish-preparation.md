---
priority: 2
tags: ["npm", "publishing", "deployment"]
description: "cctoolstats を npm パッケージとして公開するための準備作業"
created_at: "2025-08-13T04:06:39Z"
started_at: null  # Do not modify manually
closed_at: null   # Do not modify manually
---

# npm パッケージ公開準備

cctoolstats を npm パッケージとして公開するための準備作業。
docs/research/npm-publishing-guide.md のガイドラインに基づいて、package.json の最適化とローカルテストを実施する。


## Tasks

### Package.json の最適化
- [ ] files フィールドを追加（["dist", "bin"]）
- [ ] prepublishOnly スクリプトを追加（ビルド前の自動チェック）
- [ ] キーワードを拡充（"subagent", "transcript", "usage" を追加）

### ローカルテストの実施
- [ ] npm link でローカル環境でテスト
- [ ] npm pack --dry-run で公開内容を確認
- [ ] 別ディレクトリで npx 実行テスト

### 公開前の最終確認
- [ ] README.md の内容確認・充実
- [ ] npm アカウントの準備状況確認
- [ ] パッケージ名の重複チェック

### npm publish 実行
- [ ] npm login でログイン
- [ ] npm publish で初回公開
- [ ] 公開後の動作確認
- [ ] Run tests before closing and pass all tests (No exceptions)
- [ ] Get developer approval before closing


## Notes

### 参考資料
- ガイドライン: docs/research/npm-publishing-guide.md
- 参考プロジェクト: ccusage, difit, ccresume

### 現状
- 基本的な設定は整備済み
- 最適化と公開準備が必要

### 成功基準
- package.json が npm 公開のベストプラクティスに従っている
- ローカルテストがすべて成功する
- npm パッケージとして公開され、npx cctoolstats@latest が動作する
