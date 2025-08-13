# npm パッケージ公開ガイド - cctoolstats

## 概要

このドキュメントは、cctoolstatsをnpmパッケージとして公開するために必要な情報をまとめたものです。
参考プロジェクト（ccusage、difit、ccresume）の分析結果と、npm公開のベストプラクティスを基に作成しています。

## 1. 参考プロジェクトの分析

### 1.1 ccusage (by ryoppippi)

**特徴:**
- 言語: TypeScript (99.9%)
- パッケージマネージャー: Bun推奨（npm/npx/denoも対応）
- バンドルサイズ: 超軽量を重視

**package.json の重要設定:**
```json
{
  "name": "ccusage",
  "type": "module",
  "bin": "./dist/index.js",
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "engines": {
    "node": ">=20.19.4"
  },
  "scripts": {
    "build": "tsdown",
    "release": "bun lint && bun typecheck && vitest run && bun run build && bumpp"
  }
}
```

**公開戦略:**
- distディレクトリのみを公開
- 複数のエクスポートをサポート（サブモジュール対応）
- tsdownを使用したビルド

### 1.2 difit (by yoshiko-pg)

**特徴:**
- Git diffをGitHub風に表示するCLIツール
- パッケージマネージャー: pnpm
- ビルドツール: TypeScript + Vite

**package.json の重要設定:**
```json
{
  "name": "difit",
  "type": "module",
  "bin": {
    "difit": "./dist/cli/index.js"
  },
  "files": ["dist", "README.md"],
  "main": "./dist/cli/index.js",
  "scripts": {
    "build": "tsc -b && vite build",
    "prepublishOnly": "NODE_ENV=production pnpm run build"
  }
}
```

**公開戦略:**
- prepublishOnlyで公開前の自動ビルド
- README.mdも含めて公開
- publicAccessを明示的に設定

### 1.3 ccresume (by sasazame)

**特徴:**
- スコープ付きパッケージ名: @sasazame/ccresume
- TUI（Terminal User Interface）実装
- defaultブランチ: develop

**package.json の重要設定:**
```json
{
  "name": "@sasazame/ccresume",
  "type": "module",
  "bin": {
    "ccresume": "./dist/cli.js"
  },
  "files": ["dist"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepare": "npm run build"
  }
}
```

**公開戦略:**
- prepareスクリプトでインストール時の自動ビルド
- スコープ付きパッケージとして公開
- Node.js 18以上を要求

### 1.4 共通パターン

全てのプロジェクトで採用されている共通パターン:

1. **ESModule使用**: `"type": "module"`
2. **TypeScript**: ソースコードはTypeScript、ビルド後のJavaScriptを公開
3. **distディレクトリ**: ビルド成果物はdistに出力
4. **binフィールド**: CLIコマンドの定義
5. **filesフィールド**: 公開ファイルの明示的な指定

## 2. npm公開の標準的な手法

### 2.1 package.json の必須フィールド

```json
{
  "name": "パッケージ名",           // 必須: 一意の名前
  "version": "0.1.0",              // 必須: セマンティックバージョニング
  "description": "説明",            // 推奨: パッケージの説明
  "main": "dist/index.js",         // エントリーポイント
  "bin": {                         // CLIコマンドの定義
    "コマンド名": "./bin/cli.js"
  },
  "type": "module",                // ESModule使用
  "files": ["dist", "bin"],        // 公開するファイル/ディレクトリ
  "keywords": [],                  // 検索用キーワード
  "author": "",                    // 作者情報
  "license": "MIT",                // ライセンス
  "repository": {},                // リポジトリ情報
  "engines": {                    // Node.jsバージョン要件
    "node": ">=18.0.0"
  }
}
```

### 2.2 binフィールドの設定

**基本形式:**
```json
"bin": {
  "command-name": "./path/to/executable.js"
}
```

**単一コマンドの簡略形式:**
```json
"bin": "./bin/cli.js"  // コマンド名はパッケージ名と同じになる
```

**重要な要件:**
- 実行ファイルにはシェバン（`#!/usr/bin/env node`）が必要
- ファイルには実行権限が必要（npm が自動処理）
- ESModuleの場合、動的importを使用する場合がある

### 2.3 公開ファイルの制御

**方法1: filesフィールド（推奨）**
```json
"files": [
  "dist",
  "bin",
  "README.md"
]
```

**方法2: .npmignore**
```
src/
tests/
*.ts
tsconfig.json
```

**自動的に含まれるファイル:**
- package.json
- README.md
- LICENSE
- CHANGELOG.md

**自動的に除外されるファイル:**
- .git
- node_modules
- .npmignore
- .gitignore（.npmignoreがない場合は使用される）

## 3. npxとグローバルインストールの仕組み

### 3.1 npxの動作原理

1. **ローカルチェック**: プロジェクト内にパッケージがあるか確認
2. **一時インストール**: なければnpmレジストリから一時的にダウンロード
3. **実行**: コマンドを実行
4. **クリーンアップ**: 実行後、一時ファイルを削除

### 3.2 npm 7以降の変更点

- セキュリティ向上のため、初回実行時に確認プロンプトが表示される
- `--yes` または `-y` フラグで確認をスキップ可能
- 常に最新版が実行される（キャッシュされない）

### 3.3 使い分けの指針

**npx使用が適している場合:**
- 一度きりの実行（create-react-app等）
- 最新版を常に使用したい
- グローバル環境を汚したくない

**グローバルインストールが適している場合:**
- 頻繁に使用するツール
- オフライン環境での使用
- 特定バージョンの固定が必要

## 4. 公開手順チェックリスト

### 4.1 事前準備

- [ ] npmアカウントの作成（https://www.npmjs.com/signup）
- [ ] パッケージ名の一意性確認（npm searchまたはWebサイトで検索）
- [ ] README.mdの作成（使用方法、インストール手順を記載）
- [ ] LICENSEファイルの追加
- [ ] .gitignoreと.npmignoreの設定

### 4.2 ローカルテスト

```bash
# 1. ビルド実行
npm run build

# 2. ローカルリンク作成
npm link

# 3. 別ディレクトリでテスト
cd /tmp
npx cctoolstats  # または
npm install -g cctoolstats

# 4. 公開される内容の確認
npm pack --dry-run

# 5. パッケージサイズの確認
npm pack
tar -tzf cctoolstats-*.tgz
```

### 4.3 公開コマンド

```bash
# 1. npmにログイン
npm login

# 2. 初回公開
npm publish

# 3. バージョン更新後の公開
npm version patch  # または minor, major
npm publish
```

### 4.4 公開後の確認

- npmレジストリでの表示確認: https://www.npmjs.com/package/cctoolstats
- npxでの実行テスト: `npx cctoolstats@latest`
- グローバルインストールテスト: `npm install -g cctoolstats`

## 5. cctoolstatsの現状分析

### 5.1 既に整備されている項目 ✅

- **package.json基本設定**: name, version, description設定済み
- **binフィールド**: `"cctoolstats": "./bin/cctoolstats.js"` 設定済み
- **ESModule**: `"type": "module"` 設定済み
- **TypeScript環境**: ビルドスクリプト設定済み
- **.npmignore**: 公開除外ファイルの設定済み
- **エントリーポイント**: bin/cctoolstats.js作成済み
- **Node.js要件**: engines フィールド設定済み

### 5.2 追加検討項目 ⚠️

1. **filesフィールドの追加**
   - 現在は.npmignoreで制御
   - filesフィールドの方がより明示的で推奨される

2. **prepublishOnlyスクリプトの追加**
   - 公開前の自動ビルドとテスト実行
   - 例: `"prepublishOnly": "npm run lint && npm run typecheck && npm run test:run && npm run build"`

3. **キーワードの拡充**
   - 現在: ["claude", "code", "stats", "cli", "tools", "analysis"]
   - 追加候補: "subagent", "transcript", "usage", "anthropic"

4. **バージョン管理ツールの検討**
   - changesets（既にdevDependenciesに存在）
   - conventional commits
   - semantic-release

### 5.3 推奨される改善点

1. **package.jsonの最適化**
```json
{
  "files": [
    "dist",
    "bin"
  ],
  "scripts": {
    "prepublishOnly": "npm run lint && npm run typecheck && npm run test:run && npm run build",
    "prepare": "npm run build"
  }
}
```

2. **公開前のローカルテスト手順**
```bash
# クリーンビルド
rm -rf dist
npm run build

# ローカルテスト
npm link
cd /tmp && npx cctoolstats --help

# パッケージ内容確認
npm pack --dry-run
```

3. **CI/CDの設定**
- GitHub Actionsでの自動テスト
- リリース時の自動公開
- バージョンタグの自動作成

## 6. 次のステップ

1. **即座に実施可能**
   - filesフィールドの追加
   - prepublishOnlyスクリプトの設定
   - ローカルテストの実施

2. **公開前に必須**
   - npm アカウント作成
   - パッケージ名の最終確認
   - README.mdの充実

3. **公開後の運用**
   - バージョン管理戦略の確立
   - ユーザーフィードバックの収集
   - 定期的なアップデート

## 7. 参考リンク

- [npm Docs - Publishing packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [npm Docs - package.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [Best practices for creating a modern npm package](https://snyk.io/blog/best-practices-create-modern-npm-package/)
- [Semantic Versioning](https://semver.org/)

## 8. トラブルシューティング

### よくある問題と解決方法

**問題: npm publish で "npm ERR! 403" エラー**
- 原因: パッケージ名が既に使用されている
- 解決: パッケージ名を変更するか、スコープ付き名前を使用

**問題: binコマンドが見つからない**
- 原因: シェバンの不足または誤り
- 解決: ファイル先頭に `#!/usr/bin/env node` を追加

**問題: TypeScriptエラー**
- 原因: ビルド前のファイルを参照している
- 解決: distディレクトリのビルド済みファイルを参照

**問題: ESModuleエラー**
- 原因: require()とimportの混在
- 解決: 全てESModule形式に統一

---

*このドキュメントは2025年8月13日時点の調査結果に基づいています。*