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

## Installation from Archives

If you received `frontend.zip` and `backend.zip` archives:

1. **Unzip both files** into the same parent directory:
   ```
   DealOrNoDeal/
   ├── frontend/
   └── backend/
   ```

2. **Start the Backend Server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server starts on **http://localhost:3001**

3. **Start the Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   App starts on **http://localhost:3000**

4. **Play the Game:**
   - Open http://localhost:3000 in your browser
   - Create a room (requires 2+ players to start)
   - Share the room code with another player to join

## Testing

- [Manual Countdown Test](/test/countdown) – visual test harness for the countdown component

## Component Imports

To reduce integration friction, use the canonical imports from the components barrel file:

```typescript
import { OfferZone, BankerScreen, BoxPodium } from '@/components';
```

Using these named imports ensures you are using the latest version of the components and allows for better tree-shaking where supported.
