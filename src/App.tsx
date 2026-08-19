import { useEffect, useState } from 'react';
import { isSupabaseConfigured, makeCode, supabase } from './lib/supabase';
import './styles.css';

type Mode = 'home' | 'host' | 'player';
type Room = { id: string; code: string; host_id: string; game: string; state: string; round: number; sound_on: boolean };
type Player = { id: string; name: string; avatar: string; title: string; ready: boolean; score: number; lives: number; ammo: number };

const games = ['Gun Battle', 'Meme vs Meme'];
const avatars = ['🦊', '🐸', '👾', '🐼', '🦄', '🐙'];
const roomKey = 'snowyparty-local-room';
const playersKey = 'snowyparty-local-players';
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const localRoom = (code: string): Room => ({ id: newId(), code, host_id: 'local-host', game: games[0], state: 'lobby', round: 1, sound_on: true });

function readLocalRoom(): Room | null { try { return JSON.parse(localStorage.getItem(roomKey) || 'null'); } catch { return null; } }
function writeLocalRoom(room: Room) { try { localStorage.setItem(roomKey, JSON.stringify(room)); } catch { /* storage is optional */ } }
function readLocalPlayers(): Player[] { try { return JSON.parse(localStorage.getItem(playersKey) || '[]'); } catch { return []; } }
function writeLocalPlayers(players: Player[]) { try { localStorage.setItem(playersKey, JSON.stringify(players)); } catch { /* storage is optional */ } }

export default function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState('');
  const [me, setMe] = useState<Player | null>(null);
  const [avatar, setAvatar] = useState(avatars[0]);
  const [notice, setNotice] = useState('');

  const create = () => {
    const created = localRoom(makeCode());
    writeLocalRoom(created);
    setRoom(created); setPlayers([]); setMode('host'); setNotice('Room ready');
    if (isSupabaseConfigured) void (async () => {
      try { const { data } = await supabase.from('rooms').insert({ code: created.code, game: created.game }).select().single(); if (data) setRoom(data as Room); }
      catch { /* local room remains fully usable */ }
    })();
  };

  const join = () => {
    const wanted = code.trim().toUpperCase();
    if (wanted.length !== 4) { setNotice('Enter a 4-letter room code'); return; }
    const saved = readLocalRoom();
    const fallback = saved && saved.code === wanted ? saved : { ...localRoom(wanted), id: `local-${wanted}` };
    setRoom(fallback); setMode('player'); setNotice('');
    if (isSupabaseConfigured) void (async () => {
      try { const { data } = await supabase.from('rooms').select('*').eq('code', wanted).is('ended_at', null).maybeSingle(); if (data) setRoom(data as Room); }
      catch { /* continue with local room */ }
    })();
  };

  useEffect(() => {
    if (!room) return;
    setPlayers(readLocalPlayers());
    if (!isSupabaseConfigured || room.id.startsWith('local-')) return;
    let active = true;
    const load = async () => { try { const { data } = await supabase.from('room_players').select('*').eq('room_id', room.id).order('joined_at'); if (active && data) setPlayers(data as Player[]); } catch { /* local fallback */ } };
    void load();
    const channel = supabase.channel(`room-${room.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, payload => { if (payload.new) setRoom(payload.new as Room); }).on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => void load()).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [room?.id]);

  const enter = () => {
    if (!room || !name.trim()) { setNotice('Choose a display name first'); return; }
    const player: Player = { id: newId(), name: name.trim(), avatar, title: 'Player', ready: true, score: 0, lives: 3, ammo: 6 };
    const next = [...readLocalPlayers(), player]; writeLocalPlayers(next); setPlayers(next); setMe(player); setNotice('You are in!');
    if (isSupabaseConfigured && !room.id.startsWith('local-')) void supabase.from('room_players').insert({ room_id: room.id, name: player.name, avatar }).select().single().then(({ data }) => { if (data) setMe(data as Player); }).catch(() => undefined);
  };
  const updateRoom = (patch: Partial<Room>) => { if (!room) return; const next = { ...room, ...patch }; setRoom(next); writeLocalRoom(next); if (isSupabaseConfigured && !room.id.startsWith('local-')) void supabase.from('rooms').update(patch).eq('id', room.id).then(() => undefined).catch(() => undefined); };
  const kick = (id: string) => { const next = players.filter(p => p.id !== id); setPlayers(next); writeLocalPlayers(next); if (isSupabaseConfigured && room && !room.id.startsWith('local-')) void supabase.from('room_players').delete().eq('id', id).then(() => undefined).catch(() => undefined); };

  if (mode === 'home') return <main className="home"><h1>SNOWY <i>PARTY</i></h1><p>Jackbox-style chaos. Host on the big screen, play from your phone.</p><button onClick={create}>Host Room</button><div className="join"><input aria-label="Room code" maxLength={4} value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') join(); }} placeholder="ABCD"/><button onClick={join}>Join Room</button></div>{notice && <p role="status">{notice}</p>}</main>;
  if (mode === 'player' && room) return <main className="phone"><button onClick={() => setMode('home')}>← Home</button><small>ROOM {room.code}</small>{!me ? <><h1>Join the party</h1><input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') enter(); }} placeholder="Display name"/><div className="avatars">{avatars.map(a => <button type="button" key={a} className={a === avatar ? 'chosen' : ''} onClick={() => setAvatar(a)}>{a}</button>)}</div><button onClick={enter}>Ready up</button>{notice && <p role="status">{notice}</p>}</> : <Controller room={room} me={me} onUpdate={setMe}/>}</main>;
  if (!room) return null;
  return <main className="host"><button onClick={() => setMode('home')}>← Home</button><header><div><small>ROOM CODE</small><strong>{room.code}</strong><p>Players can join with this code.</p></div><div className="qr">▦</div></header><section className="state"><span>{room.state.replace('_', ' ')}</span>{room.state === 'lobby' ? <button onClick={() => updateRoom({ state: 'countdown' })}>Start {room.game}</button> : <button onClick={() => updateRoom({ state: 'lobby' })}>Back to lobby</button>}</section><section className="players">{players.map(p => <article key={p.id}><span>{p.avatar}</span><b>{p.name}</b><small>{p.title} {p.ready ? '✓ READY' : ''}</small><button onClick={() => kick(p.id)}>Kick</button></article>)}{!players.length && <p>Waiting for players to join…</p>}</section><footer><select aria-label="Game" value={room.game} onChange={e => updateRoom({ game: e.target.value })}>{games.map(g => <option key={g}>{g}</option>)}</select><button onClick={() => updateRoom({ sound_on: !room.sound_on })}>Sound {room.sound_on ? 'on' : 'off'}</button><button onClick={() => { localStorage.removeItem(roomKey); setRoom(null); setMode('home'); }}>End room</button></footer></main>;
}

function Controller({ room, me, onUpdate }: { room: Room; me: Player; onUpdate: (p: Player) => void }) {
  const act = (action: string) => { const next = action === 'Shoot' && me.ammo > 0 ? { ...me, ammo: me.ammo - 1, score: me.score + 1 } : action === 'Reload' ? { ...me, ammo: 6 } : action === 'Shield' ? { ...me, lives: Math.min(3, me.lives + 1) } : { ...me, score: me.score + 1 }; onUpdate(next); writeLocalPlayers(readLocalPlayers().map(p => p.id === me.id ? next : p)); };
  return <><h1>{room.game}</h1><p>Round {room.round} · {room.state}</p><div className="stats">❤️ {me.lives} · 🔫 {me.ammo} · ⭐ {me.score}</div><div className="actions">{['Shoot', 'Reload', 'Shield', 'Money'].map(a => <button key={a} onClick={() => act(a)}>{a}</button>)}</div><button className="shop" onClick={() => act('Shop')}>Shop: Auto-Shield · Shield Remover · +1 Life</button>{room.game === 'Meme vs Meme' && <textarea aria-label="Meme prompt" placeholder="Record or remix your meme prompt…"/>}</>;
}
