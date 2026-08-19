import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { makeCode } from '../lib/supabase';
import { useRoom } from '../lib/useRoom';
import type { Room } from '../game/types';

const joinBase = 'https://snowyrawrgamer.github.io/snowyparty/#/join?code=';
export default function GunBattleHost() {
  const [code] = useState(() => makeCode());
  const [count, setCount] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const joinUrl = useMemo(() => `${joinBase}${code}`, [code]);
  const { room, setRoom } = useRoom(code);
  useEffect(() => {
    if (!room) {
      const initial: Room = { code, hostId: 'host', players: [{ id: 'host', name: 'Host', avatar: '🐯', lives: 3, ammo: 3, money: 0, ready: true, eliminated: false, inventory: {} }], state: { phase: 'lobby', round: 1, countdown: 0, actions: {}, revealed: false, suddenDeath: false }, createdAt: Date.now() };
      setRoom(initial);
    }
  }, [code, room, setRoom]);
  useEffect(() => { const canvas = canvasRef.current; if (canvas) void QRCode.toCanvas(canvas, joinUrl, { width: 210, margin: 2, color: { dark: '#17142f', light: '#fffaf0' } }); }, [joinUrl]);
  const startCountdown = () => { setCount(3); let n = 3; const timer = window.setInterval(() => { n -= 1; setCount(n); if (n === 0) window.clearInterval(timer); }, 800); };
  return <main className="host"><p className="eyebrow">SNOWY PARTY • HOST</p><h1>GUN <span>BATTLE</span></h1>
    <section className="room-code"><small>ROOM CODE</small><strong>{code}</strong><div className="qr-wrap"><canvas ref={canvasRef} aria-label={`QR code for ${joinUrl}`} /></div><p className="join-url">{joinUrl}</p></section>
    <p>Scan the code or share the join link with your crew.</p>
    <div className="host-controls"><button className="button" onClick={startCountdown}>Start round</button><Link className="button secondary" to="/">Back to lobby</Link></div>
    <div className={`countdown ${count < 3 ? 'is-active' : ''}`} aria-live="polite">{count > 0 ? count : 'CLASH!'}</div>
    <p className="player-count">{room?.players.length ?? 1} player{room?.players.length === 1 ? '' : 's'} connected</p>
  </main>;
}
