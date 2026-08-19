# SnowyParty

A clean React + TypeScript + Vite SPA rebuild for party games. It includes responsive navigation, profile/economy/cosmetics, shop, room-code lobby, game catalog, Gun Battle and Meme Vs Meme rule surfaces, audio vault, and history.

## Run

npm install && npm run dev

## Production integration notes

The UI uses a local friendly state engine so it is immediately demoable. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` and wire room/player/game persistence through Supabase Realtime, Auth, Storage, and Postgres policies. MediaRecorder is represented by the mic test control and should be connected to Storage for production clips.