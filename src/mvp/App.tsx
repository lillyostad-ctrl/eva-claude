import {useMemo,useState,type ReactNode} from 'react';
import {Activity,Bell,CalendarDays,Check,ChevronDown,ChevronLeft,CircleEllipsis,Database,Fingerprint,FolderKanban,Gauge,GitBranch,Home,Layers3,LockKeyhole,Menu,Search,ShieldCheck,Sparkles,Users,X} from 'lucide-react';
import {buildContexts,scopeFor} from './access';
import {actors,calculate,type DB} from './engine';
import {faNum,faPeriod,tr} from './fa';
import {loadDatabase,persistDatabase} from './repository';
import RolePages,{customPages} from './RolePages';
import Workspace from './Workspace';
import './style.css';

const fmt=(n:number|null)=>n===null?'—':faNum(n);
const iconFor=(id:string)=>id==='Home'?Home:id.includes('Evidence')||id.includes('impact')||id.includes('Expectation')?Fingerprint:id.includes('People')||id.includes('Team')?Users:id.includes('Project')||id.includes('Attribution')||id.includes('Contribution')||id.includes('Responsibil')?GitBranch:id.includes('analytic')||id.includes('System')?Gauge:id.includes('Integration')||id.includes('Data')||id.includes('Engine')?Database:id.includes('Quality')||id.includes('Appeal')||id.includes('Governance')||id.includes('Audit')?ShieldCheck:id.includes('Work')?FolderKanban:Activity;
export function Badge({children}:{children:ReactNode}){const text=String(children);return <span className={`badge ${/High|Verified|Approved|Resolved|بالا|تأیید|آماده/.test(text)?'green':/Low|Pending|Open|Critical|Draft|پایین|انتظار|باز|بحرانی|متوقف/.test(text)?'amber':''}`}>{tr(text)}</span>}

export default function App(){
 const [db,setDB]=useState<DB>(loadDatabase),[contextId,setContextId]=useState('self'),[page,setPage]=useState('Home'),[period,setPeriod]=useState('2026-08'),[search,setSearch]=useState(''),[team,setTeam]=useState('همه تیم‌ها'),[selected,setSelected]=useState<string|null>(null),[message,setMessage]=useState(''),[drawer,setDrawer]=useState(false),[inbox,setInbox]=useState(false);
 const contexts=useMemo(()=>buildContexts(db),[db]);
 const context=contexts.find(c=>c.id===contextId)||contexts[0],role=context.engineRole;
 const results=db.people.map(p=>({p,r:calculate(db,p,period)})),teams=Array.from(new Set<string>(db.people.map(p=>p.team)));
 const peopleInScope=scopeFor(db,context);
 const visible=results.filter(({p})=>peopleInScope.some(person=>person.id===p.id)&&(team==='همه تیم‌ها'||tr(p.team)===team)&&`${p.name} ${p.title} ${p.team}`.toLowerCase().includes(search.toLowerCase()));
 const pageLabel=context.nav.find(n=>n.id===page)?.label||tr(page);
 const actionCount=db.sampling.filter(s=>s.status==='Queued').length+db.appeals.filter(a=>a.status==='Open').length;
 const dataAsOf=useMemo(()=>new Date().toLocaleString('fa-IR',{dateStyle:'short',timeStyle:'short'}),[]);
 const self=db.people.find(p=>p.id===actors.Employee);
 const notify=(text:string)=>{setMessage(text);window.setTimeout(()=>setMessage(''),4500)};
 function save(next:DB,action:string,target:string,detail:string,invalidates=false){if(context.readOnly)return notify('این زمینه فقط خواندنی است.');const actor=context.managerId||context.personId||actors[role];const updated={...next,revision:next.revision+(invalidates?1:0),ledger:[...next.ledger,{id:crypto.randomUUID(),at:new Date().toISOString(),actor,action,target,detail}]};persistDatabase(updated);setDB(updated);notify(action)}
 function navigate(next:string){setPage(next);setSearch('');setSelected(null);setDrawer(false)}
 function switchContext(nextId:string){const next=contexts.find(c=>c.id===nextId)!;setContextId(nextId);setPage('Home');setSearch('');setSelected(null);setInbox(false);notify(`زمینه «${next.label}» فعال شد`)}
 const tablePage=['People','Calibration','Performance pay'].includes(page);
 return <div className="shell" dir="rtl">
  <aside className={drawer?'sidebar-open':''}>
   <div className="brand"><span className="brand-icon"><Sparkles size={20}/></span><div>اِوَل‌کور<small>سامانه شواهد عملکرد</small></div><button className="mobile-close" onClick={()=>setDrawer(false)} aria-label="بستن"><X size={19}/></button></div>
   <div className="context-summary"><small>زمینه فعال</small><strong>{context.roleTitle}</strong><span>{context.scope}</span></div>
   <div className="nav-label">منوی مجاز این زمینه</div><nav>{context.nav.map(item=>{const Icon=iconFor(item.id);return <button key={item.id} className={page===item.id?'active':''} onClick={()=>navigate(item.id)}><Icon size={18}/><span>{item.label}</span>{item.id==='Appeals'&&<em>{faNum(db.appeals.filter(a=>a.status==='Open').length)}</em>}</button>})}</nav>
   <div className="sidebar-bottom"><LockKeyhole size={14}/> منو از قابلیت‌های مؤثر ساخته شده<small>{context.readOnly?'زمینه فقط خواندنی':'عملیات در دفتر ممیزی ثبت می‌شود'}</small></div>
  </aside>{drawer&&<button className="drawer-scrim" onClick={()=>setDrawer(false)} aria-label="بستن منو"/>}
  <div className="main"><header>
   <button className="menu-button" onClick={()=>setDrawer(true)} aria-label="بازکردن منو"><Menu size={20}/></button>
   <div className="context-switcher"><label htmlFor="active-context">نقش و زمینه</label><div className="select-wrap"><select id="active-context" value={contextId} onChange={e=>switchContext(e.target.value)}>{contexts.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select><ChevronDown size={15}/></div></div>
   <div className="period"><CalendarDays size={16}/><div><small>دوره ارزیابی</small><select aria-label="دوره ارزیابی" value={period} onChange={e=>setPeriod(e.target.value)}>{db.periods.map(p=><option value={p.id} key={p.id}>{faPeriod(p.id)}</option>)}</select></div></div>
   <div className="freshness"><span/><div><small>داده تا</small><strong>{dataAsOf}</strong></div></div>
   <label className="global-search"><Search size={17}/><input aria-label="جست‌وجوی محدود به دامنه" placeholder={`جست‌وجو در ${context.scope}...`} value={search} onChange={e=>setSearch(e.target.value)}/></label>
   <div className="inbox-wrap"><button className="icon-button" onClick={()=>setInbox(!inbox)} aria-label="صندوق اقدام"><Bell size={18}/><b>{faNum(actionCount)}</b></button>{inbox&&<div className="inbox-pop"><div className="inbox-head"><div><strong>صندوق اقدام</strong><small>فقط موارد زمینه فعلی</small></div><button onClick={()=>setInbox(false)}><X size={16}/></button></div><button className="inbox-item" onClick={()=>navigate('Quality samples')}><span>{faNum(db.sampling.filter(s=>s.status==='Queued').length)}</span><div><strong>نمونه منتظر بازبینی</strong><small>صف کنترل کیفیت</small></div></button><button className="inbox-item" onClick={()=>navigate('Appeals')}><span>{faNum(db.appeals.filter(a=>a.status==='Open').length)}</span><div><strong>اعتراض باز</strong><small>نیازمند رسیدگی</small></div></button></div>}</div>
   <div className="profile"><span>{self?.name?.[0]||'؟'}</span><div><strong>{self?.name||'—'}</strong><small>{context.roleTitle}</small></div></div>
  </header>
  <main><div className="scope-strip"><span>دامنه: <strong>{context.scope}</strong></span><span>·</span><span>نقش دسترسی: <strong>{context.roleTitle}</strong></span><span className="scope-secure"><LockKeyhole size={13}/>{context.readOnly?'فقط خواندنی':'کنترل عملیات فعال'}</span></div>
   {page!=='Home'&&<div className="page-heading"><div><div className="eyebrow">{context.roleTitle}</div><h1>{pageLabel}</h1><p>{context.scope} · استاندارد {db.standard}</p></div><Badge>{faPeriod(period)}</Badge></div>}
   {customPages.has(page)&&<RolePages db={db} context={context} page={page} period={period} navigate={navigate} save={save} notify={notify}/>}
   {tablePage&&<section className="panel"><div className="panel-title"><h2>فضای ارزیابی</h2><Badge>{faPeriod(period)}</Badge></div><div className="filters"><div className="search"><Search size={16}/><input aria-label="جست‌وجوی افراد" placeholder="جست‌وجوی نام، سمت یا تیم" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="فیلتر تیم" value={team} onChange={e=>setTeam(e.target.value)}><option>همه تیم‌ها</option>{teams.map(t=><option key={t}>{tr(t)}</option>)}</select></div><div className="table-wrap"><table><thead><tr><th>فرد و نقش</th><th>الگوی کاری</th><th>امتیاز غلتان</th><th>اطمینان</th><th>وضعیت بازبینی</th><th/></tr></thead><tbody>{visible.map(({p,r})=><tr key={p.id}><td><button className="person" onClick={()=>setSelected(p.id)}><span className="avatar">{p.name.split(' ').map(s=>s[0]).join('')}</span><span><strong>{p.name}</strong><small>{tr(p.title)} · {tr(p.team)}</small></span></button></td><td>{tr(p.primary)}</td><td><strong className="score">{fmt(r.score)}</strong><small>{tr(r.band)}</small></td><td><Badge>{r.state}</Badge><small>{fmt(r.confidence)}٪</small></td><td><Badge>{r.hold||r.stage}</Badge></td><td><button className="icon-button" aria-label={`مشاهده ${p.name}`} onClick={()=>setSelected(p.id)}><ChevronLeft size={18}/></button></td></tr>)}</tbody></table></div></section>}
   <Workspace db={db} role={role} context={context} period={period} save={save} notify={notify} page={page} selected={selected} setSelected={setSelected}/><footer>اِوَل‌کور · ارزیابی مبتنی بر شواهد <span>{faNum(db.people.length)} نفر، {faNum(db.workItems.length)} قلم کار و {faNum(db.evidence.length)} رکورد شواهد</span></footer>
  </main></div>{message&&<div role="status" className="toast"><Check size={18}/>{message}</div>}
 </div>
}
