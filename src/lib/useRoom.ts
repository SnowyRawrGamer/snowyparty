import { useCallback, useEffect, useState } from 'react';
import type { Room } from '../game/types';
import { supabase } from './supabase';

const roomKey = (code: string) => `snowyparty:room:${code}`;
const profileKey = 'snowyparty:profile';

export type PartyProfile = { coins: number; title: string; frame: string; avatar: string; unlocked: string[] };
export const defaultProfile: PartyProfile = { coins: 0, title: 'None', frame: 'neon', avatar: '🐯', unlocked: [] };

function readLocal<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }

export function useRoom(code?: string) {
  const [room, setRoomState] = useState<Room | null>(() => code ? readLocal(roomKey(code), null) : null);
  const publish = useCallback((next: Room) => {
    localStorage.setItem(roomKey(next.code), JSON.stringify(next));
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(roomKey(next.code)) : null;
    channel?.postMessage(next); channel?.close();
    void supabase.from('rooms').upsert({ code: next.code, host_id: next.hostId, state: next.state.phase === 'reveal' ? 'playing' : next.state.phase === 'recap' ? 'round_recap' : next.state.phase === 'podium' ? 'game_over' : next.state.phase, round: next.state.round, payload: next }).then(() => undefined);
    setRoomState(next);
  }, []);
  useEffect(() => {
    if (!code) return;
    const key = roomKey(code);
    let active = true;
    const load = async () => {
      const local = readLocal<Room | null>(key, null); if (local && active) setRoomState(local);
      const { data } = await supabase.from('rooms').select('payload').eq('code', code).is('ended_at', null).maybeSingle();
      if (active && data?.payload) { localStorage.setItem(key, JSON.stringify(data.payload)); setRoomState(data.payload as Room); }
    };
    void load();
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(key) : null;
    const onMessage = (event: MessageEvent<Room>) => { if (event.data?.code === code) { localStorage.setItem(key, JSON.stringify(event.data)); setRoomState(event.data); } };
    bc?.addEventListener('message', onMessage);
    const channel = supabase.channel(`room:${code}`, { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'room-state' }, ({ payload }) => onMessage({ data: payload } as MessageEvent<Room>))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, payload => { const next = (payload.new as { payload?: Room }).payload; if (next) onMessage({ data: next } as MessageEvent<Room>); })
      .subscribe();
    return () => { active = false; bc?.removeEventListener('message', onMessage); bc?.close(); void supabase.removeChannel(channel); };
  }, [code]);
  const setRoom = useCallback((next: Room | null) => { if (next) publish(next); else setRoomState(null); }, [publish]);
  return { room, setRoom, publish };
}

export function loadProfile(): PartyProfile { return readLocal(profileKey, defaultProfile); }
export async function saveProfile(profile: PartyProfile) {
  localStorage.setItem(profileKey, JSON.stringify(profile));
  await supabase.from('party_profiles').upsert({ id: 'local-player', coins: profile.coins, title: profile.title, frame: profile.frame, avatar: profile.avatar, unlocked: profile.unlocked });
}
