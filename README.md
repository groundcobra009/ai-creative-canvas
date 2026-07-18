# AI Creative Canvas

AI Creative Canvasは、画像・テキスト・図形を配置しながら、生成AIと一緒にnote見出し画像などを制作する個人向けWebアプリです。

現在は、1280×670pxのnote見出し画像を手動編集できるキャンバスに加え、Gemini画像モデルによる画像生成・編集を利用できます。

## 現在利用できる機能

- note推奨サイズ（1280×670px）のアートボード
- テキスト、四角形、円、画像の追加
- 移動、拡大縮小、回転、複製、削除
- レイヤーの表示、ロック、前後移動
- Undo / Redoとキーボードショートカット
- SQLiteへの自動保存
- アップロード画像のローカル保存
- Gemini画像モデルによる1案・3案生成
- 選択中の画像をもとにしたAI画像編集
- 生成ジョブの進捗、履歴、キャンセル、再実行
- 記事タイトル・本文・想定読者からnote見出し画像を3案作成
- 写真中心・抽象イラスト・タイポグラフィの方向性と短縮コピー確認
- 3案の縮小プレビュー、切り替え、個別レイヤー編集
- 文字のセーフエリア表示と1280×670px・10MB以下の出力検査
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

Gemini APIキーが未設定の場合は、UIと保存フローを確認できるローカルのモック画像生成が自動的に使われます。実際のAI画像生成を利用する場合は、`.env.local` にGemini APIキーを設定してください。

```env
AI_IMAGE_PROVIDER=auto
GEMINI_API_KEY=your_api_key
SEEDANCE_API_KEY=
```

APIキーには `NEXT_PUBLIC_` を付けないでください。キーはサーバー側だけで読み込み、ブラウザへ送信しません。

`AI_IMAGE_PROVIDER` は `auto`、`gemini`、`mock` を指定できます。`auto` はAPIキーがあればGemini、なければモックを選択します。モデルIDは `.env.example` の各 `GEMINI_IMAGE_MODEL_*` で上書きできます。

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

## note見出し画像スキル

左サイドバーの「記事から3案をつくる」へ記事タイトル・本文・想定読者を入力します。分析後に、抽出された読者価値・キーワードと3案のデザイン方向・短縮コピーを確認できます。コピーと方向は生成前に修正できます。

「3案をキャンバスに生成」を押すと、写真中心・抽象イラスト・タイポグラフィの編集可能なアートボードを作成します。キャンバス上部の縮小プレビューから案を切り替え、文字・図形・画像を通常のレイヤーとして編集してください。紫色の破線は一覧表示で文字を守るためのセーフエリアで、書き出し画像には含まれません。

写真中心案は、キャンバスに保存済み画像があればそれを使用します。画像がない場合やAI画像生成に失敗した場合は編集可能なビジュアル枠を配置するため、レイアウト作業を継続できます。

note公式では画像のアップロード上限が20MBへ拡大されていますが、本アプリでは軽量な見出し画像を維持するため、より厳しい10MB以下を品質基準としています。

## データ保存

```text
data/
├── ai-creative-canvas.db
├── uploads/
└── generated/
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
