# Anime Score Lab Ver2

GoogleログインとCloud Firestore同期に対応したアニメ評価サイトです。
GitHub Pagesで公開できます。

## 主な機能

- Googleアカウントでログイン
- ユーザーごとのFirestore保存
- PC・スマートフォン間のリアルタイム同期
- 10項目を0〜100点で評価
- 作品の登録・編集・削除
- 最大6作品のレーダーチャート比較
- JSONバックアップ・Firestoreへの移行

## 1. Firebase設定値を入れる

Firebase ConsoleでWebアプリを登録し、表示された `firebaseConfig` を
`firebase-config.js` へ貼り付けます。

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 2. Googleログインを有効化する

Firebase Consoleで以下を設定します。

1. Authentication
2. Sign-in method
3. Googleを有効化
4. Authentication > Settings > Authorized domains
5. `GitHubユーザー名.github.io` を追加

例：`utyuu4kyodai.github.io`

リポジトリ名や `https://` は付けません。

## 3. Firestoreを作成する

Firestore Databaseを本番環境モードで作成します。

その後、`firestore.rules` の内容をFirestoreの「ルール」へ貼り付けて公開します。

```text
users/{ログインユーザーのUID}/animeReviews/{作品ID}
```

の構造で保存され、各ユーザーは自分のデータだけ読み書きできます。

## 4. GitHubへアップロードする

次のファイルをリポジトリ直下へアップロードします。

- index.html
- style.css
- app.js
- firebase-config.js
- README.md

`firestore.rules` はGitHubに置いても問題ありませんが、Firebase Consoleにも同じ内容を設定してください。

## 5. GitHub Pagesを有効化する

GitHubリポジトリで以下を設定します。

1. Settings
2. Pages
3. Source: Deploy from a branch
4. Branch: main
5. Folder: / (root)
6. Save

## 旧版データの移行

1. 旧サイトで「JSONを書き出す」
2. Ver2へGoogleログイン
3. 「JSONを読み込む」
4. Firestoreへ追加・上書き

## 注意

FirebaseのWeb設定値はブラウザへ配布される前提の値です。
データ保護はFirestoreセキュリティルールとFirebase Authenticationで行います。
