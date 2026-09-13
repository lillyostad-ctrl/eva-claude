import {seed,type DB} from './engine';
export const DATABASE_KEY='evalcore-demo-db-v3';
// Mock database adapter. UI code depends on this boundary so a server repository can replace it.
export function loadDatabase():DB{
 try{const value=JSON.parse(localStorage.getItem(DATABASE_KEY)||'null');
 if(value?.version===2&&Array.isArray(value.connectors)&&Array.isArray(value.people)&&Array.isArray(value.workItems)&&Array.isArray(value.sampling)&&Array.isArray(value.periods)&&Array.isArray(value.evidence)&&Array.isArray(value.ledger)&&Array.isArray(value.decisions)&&Array.isArray(value.appeals)&&Number.isInteger(value.revision))return value;
 }catch{/* A missing or unreadable local store opens the known demo dataset. */}
 return seed();
}
export function persistDatabase(value:DB){localStorage.setItem(DATABASE_KEY,JSON.stringify(value));}
