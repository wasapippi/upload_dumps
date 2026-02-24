This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Command DB Design Notes

- HostType を主軸にコマンドを紐付け、装置側の hostTypeId に一致させる。
- platformId は補助条件で NULL を許容し、共通コマンド + 機種固有コマンドを同時表示できるようにする。
- danger は tags ではなく `commands.danger` を boolean で管理し、UIで強調と確認ダイアログを出す。
- 楽観ロックは `updatedAt` を hidden で保持し、更新時に `WHERE updatedAt = 旧値` を条件に含める。
- HostType ブロック順は `groupOrderIndex`、コマンド順は hostType + platform グループ内 `orderIndex` で制御する。
