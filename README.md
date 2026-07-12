# Anime Score Lab Ver2.2（開発環境対応版）

同じHTML・CSS・JavaScriptを、ローカル開発とGitHub Pages本番の両方で利用できます。

## 自動切替

- `http://localhost:...` / `http://127.0.0.1:...`
  - Googleログインなし
  - Firebase SDKを読み込まない
  - localStorageへ保存
  - 「ローカル開発モード」を表示
- GitHub Pagesなど上記以外
  - Googleログイン
  - Cloud Firestoreへ保存
  - PC・スマートフォンで同期

## ローカル起動（VS Code）

1. このフォルダーをVS Codeで開く
2. 拡張機能「Live Server」をインストール
3. `index.html`を右クリック
4. `Open with Live Server`

通常は `http://127.0.0.1:5500/` で開きます。

## ローカル起動（Python）

```bash
python3 -m http.server 5500
```

ブラウザで `http://localhost:5500/` を開きます。

`index.html`をダブルクリックする `file://` 起動は使用しないでください。

## 本番反映

ローカルで確認した以下のファイルを、そのままGitHubへ上書きします。

- `index.html`
- `style.css`
- `app.js`

`firebase-config.js`と`firestore.rules`は従来の本番設定を維持してください。

## データについて

ローカルデータとFirestoreデータは別です。ローカルで登録した作品は本番へ自動反映されません。必要な場合はJSON書き出し・読み込みで移行できます。
