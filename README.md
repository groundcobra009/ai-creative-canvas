# AI Creative Canvas

AI Creative Canvasは、画像・テキスト・図形を配置しながら、生成AIと一緒にnote見出し画像などを制作する個人向けWebアプリです。

現在はPhase 1として、AIなしでも1280×670pxのnote見出し画像を作成・保存・書き出しできるキャンバス基盤を提供しています。

## 現在利用できる機能

- note推奨サイズ（1280×670px）のアートボード
- テキスト、四角形、円、画像の追加
- 移動、拡大縮小、回転、複製、削除
- レイヤーの表示、ロック、前後移動
- Undo / Redoとキーボードショートカット
- SQLiteへの自動保存
- アップロード画像のローカル保存
- PNG / JPEG書き出し

## 必要環境

- Node.js 20以降
- npm
- macOS、Linux、またはWindows

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

ブラウザで表示されたローカルURLを開きます。データは初期設定では `data/` 以下へ保存されます。

Phase 1はAI APIキーなしで利用できます。画像生成機能を実装するPhase 2以降では、`.env.local` に必要なAPIキーを設定します。

```env
GEMINI_API_KEY=
SEEDANCE_API_KEY=
```

APIキーには `NEXT_PUBLIC_` を付けないでください。キーはサーバー側だけで読み込み、ブラウザへ送信しません。

## 品質チェック

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## キーボード操作

| 操作 | macOS | Windows / Linux |
| --- | --- | --- |
| 元に戻す | `⌘ Z` | `Ctrl Z` |
| やり直す | `⌘ Shift Z` | `Ctrl Shift Z` |
| 複製 | `⌘ D` | `Ctrl D` |
| 削除 | `Delete` / `Backspace` | `Delete` / `Backspace` |

## データ保存

```text
data/
├── ai-creative-canvas.db
└── uploads/
```

`data/` と `.env.local` はGit管理されません。バックアップする場合は、アプリを停止してから `data/` ディレクトリ全体をコピーしてください。

## 開発ロードマップ

開発はGitHub Issue駆動で進めています。

1. アプリ基盤・キャンバス編集
2. Nano Banana画像生成・編集
3. note見出し画像スキル
4. AIエージェントによる自然言語操作
5. Seedance動画生成
6. X・YouTube制作スキル
7. 品質強化・運用ドキュメント

全体計画は [GitHub Issue #1](https://github.com/groundcobra009/ai-creative-canvas/issues/1) を参照してください。

## ライセンス

Private project.
