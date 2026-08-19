export type ActionType='shoot'|'reload'|'shield'|'money'|'auto-shield'|'shield-remover'|'life';
export type Phase='lobby'|'countdown'|'reveal'|'recap'|'podium';
export interface Player { id:string; name:string; avatar:string; title?:string; frame?:string; lives:number; ammo:number; money:number; ready:boolean; eliminated:boolean; inventory:Record<string,number>; }
export interface Room { code:string; hostId:string; players:Player[]; state:GunBattleState; createdAt:number; }
export interface Action { type:ActionType; playerId:string; timestamp:number; }
export interface ShopItem { id:string; name:string; cost:number; description:string; }
export interface Cosmetic { id:string; name:string; kind:'title'|'frame'|'avatar'; cost:number; unlocked?:boolean; }
export interface Achievement { id:string; name:string; description:string; icon:string; progress:number; target:number; unlocked:boolean; }
export interface GameHistory { id:string; roomCode:string; playedAt:number; winner:string; players:number; rounds:number; stats:Record<string,number>; }
export interface GunBattleState { phase:Phase; round:number; countdown:number; actions:Record<string,Action>; revealed:boolean; recap?:string; winnerId?:string; suddenDeath:boolean; }
