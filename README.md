# ちかみち給付金 — GitHub Pages確認版

2026年10月23日の依頼により、説明を追加する前の4問チェックLP（`4c0e59e`）を基準に戻しました。LINE誘導の削除と、チェックから結果表示まで完全無料の方針は維持しています。

- 公開URL: https://tnkkakuei3-design.github.io/chikamichi-kyufukin/
- GitHub Pages: `main` ブランチの `/docs`。ビルド不要。
- 本番 `turn.loan` とDNSは変更していません。
- 確認版のため `noindex, nofollow` を指定しています。

## 内容

- `docs/index.html`: 以前の構成・文章に戻したLP
- `docs/app.js`: 4問のチェック、確認ポイント、コピー、FAQ
- `docs/service/index.html`: 無料サービス、運営会社、連絡先、プライバシー
- `docs/styles.css` / `docs/assets/`: 表示と画像

回答はブラウザ内だけで処理し、外部送信・永続保存は行いません。結果は確認事項の整理で、金額の試算ではありません。結果のボタンは同じサイト内のサービス案内へ移動します。公式リンクは任意の参考リンクです。

今回、広告画像は変更していません。Git履歴には金額試算版 `6d45416` も保存されています。

## 確認

`node --check docs/app.js` とリンク・4問の動作を確認します。実施記録は `tests/QA.md` に記載します。
