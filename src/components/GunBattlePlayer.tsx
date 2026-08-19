import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loadProfile, saveProfile, useRoom } from '../lib/useRoom';
export default function GunBattlePlayer() {
  const location = useLocation();
  const code = new URLSearchParams(location.search).get('code')?.toUpperCase() || '';
  const { room } = useRoom(code || undefined);
  const [profile, setProfile] = useState(loadProfile);
  const [clash, setClash] = useState(false);
  useEffect(() => { void saveProfile(profile); }, [profile]);
  const act = (label: string) => { if (label === 'MONEY') setProfile(p => ({ ...p, coins: p.coins + 1 })); setClash(true); window.setTimeout(() => setClash(false), 600); };
  return <main className={`controller ${clash ? 'clash' : ''}`}><p className="eyebrow">PLAYER CONTROLLER {code && `• ROOM ${code}`}</p><h1>LOCK AND <span>LOAD</span></h1>
    <div className="sync-pill">{room ? '● SYNCED' : '○ WAITING FOR ROOM'}</div><div className="stats"><b>❤ 3</b><b>◉ 2</b><b>¢ {profile.coins}</b></div>
    <div className="actions"><button onClick={() => act('SHOOT')}>◉<small>SHOOT</small></button><button onClick={() => act('RELOAD')}>↻<small>RELOAD</small></button><button onClick={() => act('SHIELD')}>◇<small>SHIELD</small></button><button onClick={() => act('MONEY')}>¢<small>MONEY</small></button></div>
    <p className="cosmetic-line">{profile.avatar} {profile.title} · {profile.frame} frame</p><Link to="/">Leave match</Link></main>;
}
