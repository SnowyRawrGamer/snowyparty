import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, makeCode, supabase as configuredSupabase } from './lib/supabase';
import './styles.css';

type Mode = 'home' | 'host' | 'player';
type Room = { id: string; code: string; host_id: string; game: string; state: string; round: number; sound_on: boolean };
type Player = { id: string; name: string; avatar: string; title: string; ready: boolean; score: number; lives: number; ammo: number };
type Message = { type: string; player?: Player; players?: Player[]; room?: Room; action?: string; playerId?: string };

const SUPABASE_URL = 'https://beuzyqudahxusphhbtqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmF4eSIsInJlZiI6ImJldXp5cXVkYWh4dXNwaGhidHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTc4NDYsImV4cCI6MjA5NTg5Mzg0Nn0.6KvHBFH5GTQvMEiOdNgW-fi0rSpYNC6i-_khiHl_4uo';
const realtime = isSupabaseConfigured ? configuredSupabase : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const games = ['Gun Battle', 'Meme vs Meme'];
const avatars = ['🦊', '🐸', '👾', '🐼', '🦄', '🐙'];
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const blankRoom = (code: string): Room => ({ id: `local-${code}`, code, host_id: 'local-host', game: games[0], state: 'lobby', round: 1, sound_on: true });

function read<T>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function write(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional storage */ } }

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [me, setMe] = useState<Player | null>(null);
  const [avatar, setAvatar] = useState(avatars[0]);
  const [notice, setNotice] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const isHost = mode === 'host';

  const send = useCallback((message: Message) => {
    if (!room) return;
    localChannelRef.current?.postMessage(message);
    void channelRef.current?.send({ type: 'broadcast', event: message.type, payload: message });
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const roomCode = room.code.toUpperCase();
    const handle = (message: Message) => {
      if (message.type === 'player_join' && isHost && message.player) {
        setPlayers(current => { const next = current.some(p => p.id === message.player!.id) ? current : [...current, message.player!]; write(`snowyparty-players-${roomCode}`, next); return next; });
        send({ type: 'sync_state', players: [...players, message.player], room });
      } else if (message.type === 'sync_state') {
        if (message.players) { setPlayers(message.players); write(`snowyparty-players-${roomCode}`, message.players); }
        if (message.room) setRoom(message.room);
      } else if (message.type === 'player_update' && message.player) {
        setPlayers(current => current.map(p => p.id === message.player!.id ? message.player! : p));
        if (message.player.id === me?.id) setMe(message.player);
      } else if (message.type === 'game_start' && message.room) { setRoom(message.room); setMode('player'); }
      else if (message.type === 'game_action' && isHost && message.player) setPlayers(current => current.map(p => p.id === message.player!.id ? message.player! : p));
      else if (message.type === 'kick_player' && message.playerId) { if (message.playerId === me?.id) { setMe(null); setMode('home'); setNotice('You were removed from the room'); } setPlayers(current => current.filter(p => p.id !== message.playerId)); }
      else if (message.type === 'end_room') { setRoom(null); setMe(null); setMode('home'); setNotice('Room ended'); }
    };
    const local = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`snowyparty_${roomCode}`) : null;
    if (local) { local.onmessage = event => handle(event.data as Message); localChannelRef.current = local; }
    const channel = realtime.channel(`snowyparty_${roomCode}`, { config: { broadcast: { self: true } } });
    channel.on('broadcast', { event: '*' }, ({ payload }) => handle(payload as Message)).subscribe();
    channelRef.current = channel;
    return () => { local?.close(); localChannelRef.current = null; void realtime.removeChannel(channel); channelRef.current = null; };
  }, [room?.code, isHost, me?.id, send, players, room]);

  const create = () => { const created = { ...blankRoom(makeCode()), id: newId() }; setRoom(created); setPlayers([]); setMode('host'); setNotice('Room ready'); write('snowyparty-room', created); void realtime.from('rooms').insert({ code: created.code, game: created.game }).select().single().then(({ data }) => { if (data) setRoom(data as Room); }).catch(() => undefined); };
  const join = () => { const wanted = code.trim().toUpperCase(); if (wanted.length !== 4) { setNotice('Enter a 4-letter room code'); return; } const saved = read<Room | null>('snowyparty-room', null); const joined = saved?.code === wanted ? saved : blankRoom(wanted); setRoom(joined); setMode('player'); setNotice(''); };
  const enter = () => { if (!room || !name.trim()) { setNotice('Choose a display name first'); return; } const player: Player = { id: newId(), name: name.trim(), avatar, title: 'Player', ready: true, score: 0, lives: 3, ammo: 6 }; setMe(player); setPlayers(current => [...current, player]); send({ type: 'player_join', player }); };
  const updateRoom = (patch: Partial<Room>) => { if (!room) return; const next = { ...room, ...patch }; setRoom(next); write('snowyparty-room', next); send({ type: patch.state === 'countdown' ? 'game_start' : 'sync_state', room: next, players }); };
  const kick = (id: string) => { setPlayers(current => current.filter(p => p.id !== id)); send({ type: 'kick_player', playerId: id }); };
  const updatePlayer = (player: Player) => { setMe(player); setPlayers(current => current.map(p => p.id === player.id ? player : p)); send({ type: 'player_update', player }); };

  if (mode === 'home') return <main className="home"><h1>SNOWY <i>PARTY</i></h1><p>Jackbox-style chaos. Host on the big screen, play from your phone.</p><button onClick={create}>Host Room</button><div className="join"><input aria-label="Room code" maxLength={4} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ABCD"/><button onClick={join}>Join Room</button></div>{notice && <p role="status">{notice}</p>}</main>;
  if (mode === 'player' && room) return <main className="phone"><button onClick={() => setMode('home')}>← Home</button><small>ROOM {room.code}</small>{!me ? <><h1>Join the party</h1><input value={name} onChange={e => setName(e.target.value)} placeholder="Display name"/><div className="avatars">{avatars.map(a => <button type="button" key={a} className={a === avatar ? 'chosen' : ''} onClick={() => setAvatar(a)}>{a}</button>)}</div><button onClick={enter}>Ready up</button>{notice && <p role="status">{notice}</p>}</> : <Controller room={room} me={me} onUpdate={updatePlayer}/>}</main>;
  if (!room) return null;
  return <main className="host"><button onClick={() => setMode('home')}>← Home</button><header><div><small>ROOM CODE</small><strong>{room.code}</strong><p>{players.length} player{players.length === 1 ? '' : 's'} connected</p></div><div className="qr">▦</div></header><section className="state"><span>{room.state.replace('_', ' ')}</span>{room.state === 'lobby' ? <button onClick={() => updateRoom({ state: 'countdown' })}>Start {room.game}</button> : <button onClick={() => updateRoom({ state: 'lobby' })}>Back to lobby</button>}</section><section className="players">{players.map(p => <article key={p.id}><span>{p.avatar}</span><b>{p.name}</b><small>{p.title} {p.ready ? '✓ READY' : ''} · ❤️ {p.lives} · 🔫 {p.ammo}</small><button onClick={() => kick(p.id)}>Kick</button></article>)}{!players.length && <p>Waiting for players to join…</p>}</section><footer><select aria-label="Game" value={room.game} onChange={e => updateRoom({ game: e.target.value })}>{games.map(g => <option key={g}>{g}</option>)}</select><button onClick={() => updateRoom({ sound_on: !room.sound_on })}>Sound {room.sound_on ? 'on' : 'off'}</button><button onClick={() => { send({ type: 'end_room' }); setRoom(null); setMode('home'); }}>End room</button></footer></main>;
}

function Controller({ room, me, onUpdate }: { room: Room; me: Player; onUpdate: (p: Player) => void }) { const act = (action: string) => { const next = action === 'Shoot' && me.ammo > 0 ? { ...me, ammo: me.ammo - 1, score: me.score + 1 } : action === 'Reload' ? { ...me, ammo: 6 } : action === 'Shield' ? { ...me, lives: Math.min(3, me.lives + 1) } : { ...me, score: me.score + 1 }; onUpdate(next); }; return <><h1>{room.game}</h1><p>Round {room.round} · {room.state}</p><div className="stats">❤️ {me.lives} · 🔫 {me.ammo} · ⭐ {me.score}</div><div className="actions">{['Shoot', 'Reload', 'Shield', 'Money'].map(a => <button key={a} onClick={() => act(a)}>{a}</button>)}</div><button className="shop" onClick={() => act('Shop')}>Shop: Auto-Shield · Shield Remover · +1 Life</button>{room.game === 'Meme vs Meme' && <textarea aria-label="Meme prompt" placeholder="Record or remix your meme prompt…"/>}</>; }
