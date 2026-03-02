# surfboard-pages-mysql

Pages Router + `mysql@^2.18.1` で既存 `surfboard` DB を参照する移行用プロジェクトです。

## 目的
- Prisma Generate 不要
- 既存 MySQL データをそのまま利用
- App Router ではなく Pages Router で動作

## セットアップ
1. `cp .env.example .env.local`
2. `npm install`
3. `npm run dev`
4. `http://localhost:3001`

## Docker 起動
1. `cp .env.docker .env`
2. `docker compose up -d`
3. `http://localhost:3001`

## 画面
- `/platforms`
- `/commands`
- `/links`

## API
- `GET /api/categories`
- `GET /api/host-types`
- `GET /api/vendors`
- `GET /api/platforms`
- `GET /api/commands`
- `GET /api/commands/for-device`
- `GET /api/platform-links`
- `GET /api/tags/suggest`

## SQL
- `sql/surfboard_command_links_full.sql`
  - 既存レコード込みの CREATE + INSERT ダンプ

## 注意
- この版は移行ベースの最小実装です。
- 既存 App Router 版の全機能を完全移植したものではありません。
