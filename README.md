# SnowyParty

React + TypeScript + Vite party-game SPA. The lobby now supports host-created AI players with per-bot Easy, Medium, Hard, and Extreme difficulty. `src/botEngine.ts` centralizes difficulty-weighted Gun Battle decisions, tactical shield/dodge behavior, synergized Meme Vs Meme remix selection, and placement rewards.

Run with `npm install && npm run dev`. The current game loops are local and playable; connect room state, authoritative rewards, Supabase Auth/Realtime/Storage, and MediaRecorder persistence for production.