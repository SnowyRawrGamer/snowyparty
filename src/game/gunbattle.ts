import type {ShopItem,ActionType} from './types';
export const SHOP_ITEMS:ShopItem[]=[{id:'auto-shield',name:'Auto-Shield',cost:150,description:'Hidden shield next turn'},{id:'shield-remover',name:'Shield Remover',cost:250,description:'One of the next 3 opponent shields fails'},{id:'life',name:'+1 Life',cost:600,description:'Restore one life'}];
export const ACTIONS:{type:ActionType;label:string;icon:string}[]=[{type:'shoot',label:'SHOOT',icon:'◉'},{type:'reload',label:'RELOAD',icon:'↻'},{type:'shield',label:'SHIELD',icon:'◇'},{type:'money',label:'MONEY',icon:'¢'}];
export const STARTING_LIVES=3, STARTING_AMMO=2;
