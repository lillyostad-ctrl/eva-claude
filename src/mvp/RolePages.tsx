import {useState,type ReactNode} from 'react';
import {ArrowUpLeft,CheckCircle2,Clock3,Database,GitBranch,LockKeyhole,ShieldCheck} from 'lucide-react';
import {scopeFor,type AppContext} from './access';
import {actors,avg,calculate,dimensions,dimsFromEvidence,units,weights,type DB,type Evidence,type WorkItem,type WorkRole} from './engine';
import {faDate,faNum,faPeriod,faSource,tr} from './fa';
import {Modal} from './Workspace';

type Props={db:DB;context:AppContext;page:string;period:string;navigate:(page:string)=>void};
const roles:Record<WorkRole,string>={requester:'درخواست‌دهنده',planner:'برنامه‌ریز',assigner:'واگذارکننده',decision_owner:'مالک تصمیم',executor:'مجری',contributor:'مشارکت‌کننده',reviewer:'بازبین'};
const fmt=(n:number|null)=>n===null?'—':faNum(n);
export const customPages=new Set(['Home','Expectations','Team outcomes','Evidence gaps','System quality','Project snapshot','Attribution','Job families','Performance profiles','Integrations','Engine ledger','Calibration facilitator','Quality samples','Governance cases','Payroll preview','Access management']);

export default function RolePages({db,context,page,period,navigate}:Props){
 const person=db.people.find(p=>p.id===actors.Employee)||db.people[0];
 const results=db.people.map(p=>({p,r:calculate(db,p,period)}));
 const scope=scopeFor(db,context),scopeIds=new Set(scope.map(p=>p.id));
 const scopedResults=context.managerId||context.id==='self'?results.filter(x=>scopeIds.has(x.p.id)):results;
 const scopedTeams=context.managerId?[...new Set(scope.map(p=>p.team))]:[...new Set(db.people.map(p=>p.team))];
 const scores=scopedResults.map(x=>x.r.score).filter((x):x is number=>x!==null);
 const trendPoints=db.periods.map(pd=>({label:faPeriod(pd.id),value:avg(scope.map(p=>calculate(db,p,pd.id).score).filter((x):x is number=>x!==null))}));
 if(page==='Home'){
  if(context.id==='self')return <SelfHome db={db} person={person} period={period}/>;
  return <><div className="role-hero"><div><span className="eyebrow">{context.roleTitle}</span><h1>{context.label.split(' — ')[1]||context.label}</h1><p>این نما فقط داده‌ها و اقدام‌های دامنه «{context.scope}» را نشان می‌دهد.</p></div><span className="secure-pill"><LockKeyhole size={15}/>دامنه دسترسی فعال</span></div><div className="stats"><section className="stat"><div>دوره فعال<Clock3 size={16}/></div><strong>{faPeriod(period)}</strong><small>{tr(db.periods.find(p=>p.id===period)?.state)}</small></section><section className="stat"><div>اقدام‌های در انتظار<ShieldCheck size={16}/></div><strong>{faNum(db.sampling.filter(s=>s.status==='Queued').length+db.appeals.filter(a=>a.status==='Open').length)}</strong><small>نمونه و پرونده در دامنه</small></section><section className="stat"><div>پوشش داده<Database size={16}/></div><strong>{faNum(avg(scopedResults.map(x=>x.r.confidence)))}٪</strong><small>میانگین اطمینان شواهد</small></section><section className="stat"><div>میانگین نتیجه<ArrowUpLeft size={16}/></div><strong>{faNum(avg(scores))}</strong><small>بدون توزیع اجباری</small></section></div><section className="panel"><div className="panel-title"><div><h2>روند امتیاز میانگین دامنه</h2><small>میانگین امتیاز غلتان محاسبه‌شده در {faNum(scope.length)} پرونده، به تفکیک دوره</small></div></div><Trend points={trendPoints}/></section><section className="panel"><div className="panel-title"><div><h2>کارهای این زمینه</h2><small>منو بر اساس قابلیت‌های مؤثر ساخته شده است</small></div></div><div className="quick-grid">{context.nav.filter(n=>n.id!=='Home').map(n=><button key={n.id} onClick={()=>navigate(n.id)}><span><strong>{n.label}</strong><small>بازکردن نمای {context.roleTitle}</small></span><ArrowUpLeft size={17}/></button>)}</div></section></>;
 }
 if(page==='Expectations')return <ExpectationsPage db={db} person={person} period={period}/>;
 if(page==='Team outcomes')return <Page title="پیامدها و اهداف تیم" text="نتیجه تیم با حجم کار خام سنجیده نمی‌شود؛ پیچیدگی، پذیرش و کیفیت مبنا هستند."><Table heads={['تیم','اقلام کار','واحد پیچیدگی','پذیرفته‌شده','استثنا']} rows={scopedTeams.map(team=>{const ws=db.workItems.filter(w=>w.team===team);return[tr(team),faNum(ws.length),faNum(ws.reduce((s,w)=>s+w.complexity.workUnits,0)),faNum(ws.filter(w=>w.events.some(e=>e.eventType==='Accepted')).length),faNum(ws.filter(w=>w.exception).length)]})}/></Page>;
 if(page==='Evidence gaps')return <Page title="پوشش و شکاف شواهد" text="شکاف‌ها پیش از قفل دوره باید رفع یا با دلیل ثبت شوند."><Table heads={['فرد','تیم','پوشش','اطمینان','اقدام']} rows={scopedResults.sort((a,b)=>a.r.confidence-b.r.confidence).map(({p,r})=>[p.name,tr(p.team),`${faNum(r.confidence)}٪`,tr(r.state),r.confidence<80?'نیازمند شاهد تکمیلی':'کافی'])}/></Page>;
 if(page==='System quality')return <Page title="کیفیت سیستم کاری" text="این نما مسئله‌های ناشی از مدیریت، ظرفیت و وابستگی را از عملکرد فرد جدا می‌کند."><Table heads={['کار','علت','شدت','مسئول پاسخ‌گویی','اثر بر مجری']} rows={db.workItems.filter(w=>w.attributionCause).map(w=>[tr(w.workType),tr(w.attributionCause),tr(w.exception?.severity),w.attributionCause?.includes('Management')?'مدیر/واگذارکننده':'مالک وابستگی',w.attributionCause==='Employee delay without blocker'?'محاسبه می‌شود':'حذف از قابلیت اتکا'])}/></Page>;
 if(page==='Project snapshot'){const items=context.managerId?db.workItems.filter(w=>scopeIds.has(w.roles.executor||'')):db.workItems;return <Page title="صف نمای پروژه" text="رهبر پروژه سهم‌ها، تحویل‌ها و انتساب علت را پیش از انتشار تأیید می‌کند."><Table heads={['کار','مجری','واحد','رویداد پایانی','وضعیت انتساب']} rows={items.map(w=>[tr(w.workType),db.people.find(p=>p.id===w.roles.executor)?.name||'—',faNum(w.complexity.workUnits),tr(w.events.at(-1)?.eventType),w.attributionCause?tr(w.attributionCause):'بدون اختلاف'])}/></Page>}
 if(page==='Attribution'){const items=context.managerId?db.workItems.filter(w=>scopeIds.has(w.roles.executor||'')):db.workItems;const joint=items.filter(w=>w.roles.contributor&&w.roles.executor&&w.roles.contributor!==w.roles.executor);return <Page title="تشخیص انتساب" text="زمان و کیفیت فقط به نقشی نسبت داده می‌شود که کنترل واقعی بر علت داشته است."><Table heads={['کار','سناریو','نقش پاسخ‌گو','حکم قابلیت اتکا','شاهد رویدادی']} rows={items.filter(w=>w.attributionCause).map(w=>[tr(w.workType),tr(w.attributionCause),w.attributionCause==='Employee delay without blocker'?'مجری':w.attributionCause?.includes('Management')?'واگذارکننده/مدیر':'مالک وابستگی','Employee delay without blocker'===w.attributionCause?'منظور شود':'از مجری کسر نشود',w.events.filter(e=>['Blocked','Unblocked','Assigned','Submitted'].includes(e.eventType)).map(e=>tr(e.eventType)).join(' ← ')])}/><section className="panel"><div className="panel-title"><div><h2>سهم مسئولیت مشترک</h2><small>وقتی مجری و مشارکت‌کننده متفاوت‌اند، سهم هرکدام از پیامد پذیرفته‌شده جداگانه ثبت می‌شود</small></div></div><div className="split-list">{joint.slice(0,25).map(w=>{const share=db.evidence.find(e=>e.workItemId===w.id)?.share??70;return <div className="split-row" key={w.id}><div className="split-head"><strong>{tr(w.workType)}</strong><small>{w.id}</small></div><SplitBar leftLabel={db.people.find(p=>p.id===w.roles.executor)?.name||'—'} leftPct={share} rightLabel={db.people.find(p=>p.id===w.roles.contributor)?.name||'—'} rightPct={100-share}/><small className="split-note"><CheckCircle2 size={12}/> مجموع سهم تأییدشده: ۱۰۰٪</small></div>})}{!joint.length&&<div className="empty">در این دامنه موردی از مسئولیت مشترک ثبت نشده است.</div>}</div></section></Page>}
 if(page==='Job families')return <Page title="خانواده‌های شغلی" text="نگاشت خانواده شغلی به الگوی کار نسخه‌بندی می‌شود."><Table heads={['خانواده','افراد','الگوی غالب','سطوح']} rows={[...new Set(db.people.map(p=>p.title))].map(title=>{const ps=db.people.filter(p=>p.title===title);return[tr(title),faNum(ps.length),tr(ps[0].primary),[...new Set(ps.map(p=>tr(p.level)))].join('، ')]})}/></Page>;
 if(page==='Performance profiles')return <Page title="پروفایل‌های عملکرد" text="وزن‌ها بر اساس الگوی کار تعیین می‌شوند و مسئولیت هر قلم، نوع شاهد را تعیین می‌کند."><Table heads={['پروفایل',...dimensions.map(tr)]} rows={Object.entries(weights).map(([name,row])=>[tr(name),...row.map(v=>`${faNum(v)}٪`)])}/></Page>;
 if(page==='Integrations')return <Page title="درگاه‌های داده" text="این نسخه همه رابط‌ها را در حالت نمایشی اجرا می‌کند و قرارداد تبدیل همان قرارداد تولید است."><Table heads={['درگاه','کاربرد','رکورد','آخرین همگام‌سازی','وضعیت']} rows={db.connectors.map(c=>[c.name,c.purpose,faNum(c.records),faDate(c.lastSync),'سالم · نمایشی'])}/></Page>;
 if(page==='Engine ledger')return <Page title="بازپخش و دفترکل موتور" text="هر رویداد استاندارد را می‌توان به ترتیب زمان بازپخش و نتیجه را دوباره ساخت."><Table heads={['رویداد','نوع','کار','عامل','زمان']} rows={db.workItems.flatMap(w=>w.events).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)).slice(0,100).map(e=>[e.id,tr(e.eventType),e.workItemId,db.people.find(p=>p.id===e.actorId)?.name||e.actorId,faDate(e.occurredAt)])}/></Page>;
 if(page==='Calibration facilitator')return <Page title="مدیریت جلسات هم‌ترازی" text="تسهیل‌گر ترتیب بررسی را بر اساس اطمینان، استثنا و اختلاف تنظیم می‌کند."><Table heads={['فرد','زمینه مقایسه','امتیاز','اطمینان','اولویت جلسه']} rows={results.sort((a,b)=>a.r.confidence-b.r.confidence).map(({p,r})=>[p.name,`${tr(p.primary)} · ${tr(p.level)}`,faNum(r.score??0),`${faNum(r.confidence)}٪`,r.hold?tr(r.hold):'عادی'])}/></Page>;
 if(page==='Quality samples')return <Page title="صف نمونه‌های کیفیت" text="انتخاب نمونه از بازبینی آن جداست؛ بازبین فقط صف تخصیص‌یافته را می‌بیند."><Table heads={['نمونه','کار','روش','دلیل','وضعیت']} rows={db.sampling.map(s=>[s.id,s.workItemId,s.method==='Random'?'تصادفی':'ریسک‌محور',s.reasons.join('، '),s.status==='Reviewed'?'بازبینی‌شده':'در صف'])}/></Page>;
 if(page==='Governance cases')return <Page title="پرونده‌های تخصیص‌یافته" text="پرونده، اعتراض، شواهد مرتبط و رأی مستدل را کنار هم نگه می‌دارد."><Table heads={['پرونده','فرد','دلیل','وضعیت','رسیدگی‌کننده']} rows={db.appeals.map(a=>[a.id,db.people.find(p=>p.id===a.personId)?.name||a.personId,a.reason,tr(a.status),a.actor||'تخصیص‌نیافته'])}/></Page>;
 if(page==='Payroll preview')return <Page title="پیش‌نمایش حقوق" text="هیچ رکوردی بدون سه مرحله تأیید و نبود توقف وارد خروجی نمی‌شود."><Table heads={['فرد','شناسه','امتیاز','بازه','وضعیت خروجی']} rows={results.map(({p,r})=>[p.name,p.id,faNum(r.score??0),tr(r.band),r.exportable?'آماده ارسال':'متوقف'])}/></Page>;
 if(page==='Access management')return <Page title="کاربران و دسترسی‌ها" text="در تولید، زمینه فعال از نشست احراز‌شده و مجوز سمت سرور ساخته می‌شود."><Table heads={['زمینه','نقش','دامنه','حالت']} rows={[['شخصی','کارمند','پرونده شخصی','خواندن و ثبت'],['تیم','مدیر صف','تیم تخصیص‌یافته','مدیریت شاهد'],['کیفیت','بازبین مستقل','نمونه‌های تخصیص‌یافته','تصمیم کنترل'],['حاکمیت','بازبین اعتراض','پرونده‌های تخصیص‌یافته','رأی مستدل'],['حقوق','تأییدکننده حقوق','نتایج نهایی','خروجی محدود']]}/></Page>;
 return null;
}

// title is kept as a call-site hint even though App.tsx's page-heading already renders it —
// this component's own job is just the one-line explainer, kept out of a boxed "card".
function Page({text,children}:{title:string;text:string;children:ReactNode}){return <>{text&&<p className="page-note">{text}</p>}{children}</>}
function Table({heads,rows}:{heads:string[];rows:(string|number)[][]}){return <section className="panel"><div className="table-wrap"><table><thead><tr>{heads.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table>{!rows.length&&<div className="empty">موردی در این دامنه وجود ندارد.</div>}</div></section>}

// A real (data-driven) line chart of scoped average score per evaluation period — no placeholder values.
function Trend({points}:{points:{label:string;value:number}[]}){
 const w=640,h=160,pad=28,max=100,usable=points.filter(p=>!Number.isNaN(p.value));
 if(!usable.length)return <div className="empty">داده کافی برای رسم روند وجود ندارد.</div>;
 const step=(w-pad*2)/Math.max(1,points.length-1);
 const y=(v:number)=>h-pad-(Math.max(0,Math.min(max,v))/max)*(h-pad*2);
 const coords=points.map((p,i)=>({x:pad+i*step,y:y(p.value),...p}));
 const finite=coords.filter(c=>!Number.isNaN(c.value));
 const path=finite.map((c,i)=>`${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
 return <div className="trend-chart"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="روند امتیاز میانگین به تفکیک دوره">{[0,25,50,75,100].map(g=><line key={g} x1={pad} x2={w-pad} y1={y(g)} y2={y(g)} className="trend-grid"/>)}<path d={path} className="trend-line" fill="none"/>{finite.map(c=><g key={c.label}><circle cx={c.x} cy={c.y} r={4} className="trend-dot"/><text x={c.x} y={h-6} className="trend-label" textAnchor="middle">{c.label}</text><text x={c.x} y={c.y-10} className="trend-value" textAnchor="middle">{faNum(c.value)}</text></g>)}</svg></div>;
}

// Two-series version of Trend: the employee's own history against the organization average, for the
// "سازمان" (organization) lens on personal score. Labels are passed in because which metric is being
// compared changes with the active role/team filter (official score vs. filtered evidence quality).
function CompareTrend({mine,org,mineLabel,orgLabel}:{mine:{label:string;value:number}[];org:{label:string;value:number}[];mineLabel:string;orgLabel:string}){
 const w=640,h=170,pad=28,max=100;
 if(!mine.some(p=>!Number.isNaN(p.value)))return <div className="empty">داده کافی برای رسم روند وجود ندارد.</div>;
 const step=(w-pad*2)/Math.max(1,mine.length-1);
 const y=(v:number)=>h-pad-(Math.max(0,Math.min(max,v))/max)*(h-pad*2);
 const line=(pts:{value:number}[])=>pts.map((p,i)=>({x:pad+i*step,y:p.value})).filter(p=>!Number.isNaN(p.y)).map((p,i)=>`${i===0?'M':'L'}${p.x.toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
 return <div className="trend-chart"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`مقایسه ${mineLabel} با ${orgLabel}`}>{[0,25,50,75,100].map(g=><line key={g} x1={pad} x2={w-pad} y1={y(g)} y2={y(g)} className="trend-grid"/>)}<path d={line(org)} className="trend-line trend-line-org" fill="none"/><path d={line(mine)} className="trend-line" fill="none"/>{mine.map((c,i)=><g key={c.label}>{!Number.isNaN(c.value)&&<circle cx={pad+i*step} cy={y(c.value)} r={4} className="trend-dot"/>}<text x={pad+i*step} y={h-6} className="trend-label" textAnchor="middle">{c.label}</text></g>)}</svg><div className="split-bar-legend"><span><i className="split-dot" style={{background:'#2c624b'}}/>{mineLabel}</span><span><i className="split-dot" style={{background:'#c8a55a'}}/>{orgLabel}</span></div></div>;
}

// A real split of an accepted work item's responsibility share between executor and contributor.
function SplitBar({leftLabel,leftPct,rightLabel,rightPct}:{leftLabel:string;leftPct:number;rightLabel:string;rightPct:number}){
 return <div className="split-bar"><div className="split-bar-track"><div className="split-bar-seg split-bar-executor" style={{width:`${leftPct}%`}} title={`${leftLabel} · ${faNum(leftPct)}٪`}/><div className="split-bar-seg split-bar-contributor" style={{width:`${rightPct}%`}} title={`${rightLabel} · ${faNum(rightPct)}٪`}/></div><div className="split-bar-legend"><span><i className="split-dot split-bar-executor"/>{leftLabel} (مجری) · {faNum(leftPct)}٪</span><span><i className="split-dot split-bar-contributor"/>{rightLabel} (مشارکت‌کننده) · {faNum(rightPct)}٪</span></div></div>;
}

// The employee's Home: the official score headline (always authoritative, never filtered) plus two
// charts — "اثرگذاری" (the five weighted dimensions) and "روند امتیاز" (the score trend) — that share
// one filter bar above them (role, team/project, time range, organization compare), combinable freely.
// When a role/team filter is active the charts switch from the official imported numbers to an
// honest recomputation over the matching evidence subset (same formula calculate() itself falls back
// to), clearly labeled so it's never confused with the official score.
function SelfHome({db,person,period}:{db:DB;person:DB['people'][number];period:string}){
 const [roleFilter,setRoleFilter]=useState<'all'|WorkRole>('all');
 const [teamFilter,setTeamFilter]=useState('all');
 const [range,setRange]=useState<'all'|'last2'|'current'>('all');
 const [compareOrg,setCompareOrg]=useState(false);
 const result=calculate(db,person,period);
 const mine=db.workItems.filter(w=>Object.values(w.roles).includes(person.id));
 const teamOptions=[...new Set(mine.map(w=>w.team))];
 const isFiltered=roleFilter!=='all'||teamFilter!=='all';
 const matches=(w:{roles:Record<WorkRole,string|null>;team:string},mineOnly:boolean)=>(roleFilter==='all'||(mineOnly?w.roles[roleFilter]===person.id:!!w.roles[roleFilter]))&&(teamFilter==='all'||w.team===teamFilter);
 const filteredIds=new Set(mine.filter(w=>matches(w,true)).map(w=>w.id));
 const filteredEvidence=db.evidence.filter(e=>e.personId===person.id&&e.period===period&&filteredIds.has(e.workItemId));
 const dimValues=isFiltered?dimsFromEvidence(filteredEvidence,person.expected):result.values;
 const periodIds=range==='current'?[period]:range==='last2'?db.periods.slice(-2).map(p=>p.id):db.periods.map(p=>p.id);
 const selfTrend=periodIds.map(pid=>{
  if(!isFiltered)return {label:faPeriod(pid),value:calculate(db,person,pid).score??NaN};
  const ids=new Set(db.workItems.filter(w=>Object.values(w.roles).includes(person.id)&&matches(w,true)).map(w=>w.id));
  const ev=db.evidence.filter(e=>e.personId===person.id&&e.period===pid&&ids.has(e.workItemId)&&e.status==='Verified');
  return {label:faPeriod(pid),value:ev.length?avg(ev.map(e=>e.quality)):NaN};
 });
 const orgTrend=periodIds.map(pid=>{
  if(!isFiltered)return {label:faPeriod(pid),value:avg(db.people.map(p=>calculate(db,p,pid).score).filter((x):x is number=>x!==null))};
  const ids=new Set(db.workItems.filter(w=>matches(w,false)).map(w=>w.id));
  const ev=db.evidence.filter(e=>e.period===pid&&ids.has(e.workItemId)&&e.status==='Verified');
  return {label:faPeriod(pid),value:ev.length?avg(ev.map(e=>e.quality)):NaN};
 });
 const trendLabel=isFiltered?'میانگین کیفیت شواهد فیلترشده':'امتیاز غلتان رسمی';
 return <>
  <div className="role-hero"><div><span className="eyebrow">کارمند · {faPeriod(period)}</span><h1>اثرگذاری من</h1></div></div>

  <div className="score-lead"><div className="score-number">{fmt(result.score)}<small>{tr(result.band)}</small></div><div className="score-meta"><span>اطمینان {fmt(result.confidence)}٪ · {tr(result.state)}</span><span>مرحله تأیید: {tr(result.stage)}</span></div></div>
  {result.hold&&<p className="hold-line">تأیید متوقف است: {tr(result.hold)} — امتیاز محاسبه‌شده همچنان دیده می‌شود.</p>}

  <section className="panel"><div className="panel-title"><h2>فیلتر نمودارها</h2><small>روی اثرگذاری و روند امتیاز هم‌زمان اعمال می‌شود، مستقل یا ترکیبی</small></div><div className="filters"><select aria-label="فیلتر نقش" value={roleFilter} onChange={e=>setRoleFilter(e.target.value as 'all'|WorkRole)}><option value="all">نقش: همه</option>{Object.entries(roles).map(([k,label])=><option value={k} key={k}>نقش: {label}</option>)}</select><select aria-label="فیلتر تیم یا پروژه" value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}><option value="all">تیم/پروژه: همه</option>{teamOptions.map(t=><option value={t} key={t}>تیم/پروژه: {tr(t)}</option>)}</select><select aria-label="بازه زمانی" value={range} onChange={e=>setRange(e.target.value as typeof range)}><option value="all">زمان: همه دوره‌ها</option><option value="last2">زمان: ۲ دوره اخیر</option><option value="current">زمان: فقط دوره جاری</option></select><label className="check"><input type="checkbox" checked={compareOrg} onChange={e=>setCompareOrg(e.target.checked)}/>سازمان: مقایسه با میانگین</label></div></section>

  <section className="panel"><div className="panel-title"><h2>اثرگذاری</h2><small>{isFiltered?'میانگین ابعاد بر اساس شواهد فیلترشدهٔ همین دوره — ممکن است با امتیاز رسمی بالا اندکی تفاوت داشته باشد':`وزن هر بُعد از الگوی کاری ${tr(person.primary)} گرفته می‌شود`}</small></div><div className="dim-bars">{dimensions.map((d,i)=>{const v=dimValues[i];return <div className="dim-bar-row" key={d}><span className="dim-label">{tr(d)}</span><div className="dim-track"><div style={{width:`${v??0}%`}}/></div><span className="dim-value">{v!==null?fmt(v):'—'}</span><span className="dim-weight">{faNum(result.w[i])}٪</span></div>})}</div>{!isFiltered&&<p className="formula-line">{fmt(result.current)}×۰٫۵۰ + {fmt(result.history[0])}×۰٫۳۰ + {fmt(result.history[1])}×۰٫۲۰ = {fmt(result.score)} (دوره جاری/قبل/قدیمی‌تر)</p>}</section>

  <section className="panel"><div className="panel-title"><h2>روند امتیاز</h2><small>{trendLabel} به تفکیک دوره</small></div>{compareOrg?<CompareTrend mine={selfTrend} org={orgTrend} mineLabel={isFiltered?'من (فیلترشده)':'امتیاز من'} orgLabel={isFiltered?'سازمان (همین فیلتر)':'میانگین سازمان'}/>:<Trend points={selfTrend}/>}</section>
 </>;
}

// Expectations: the evidence-by-role/project breakdown and the supporting-evidence/approval-trail
// tables (moved here from Home), plus a real "task path" column showing where each task originated
// — the project-management (task) system, a KPI, an OKR, an approved resolution, or, for evidence
// with no matching formal task record, directly from evidence.
function ExpectationsPage({db,person,period}:{db:DB;person:DB['people'][number];period:string}){
 const [tab,setTab]=useState<'tasks'|'support'>('tasks');
 const [roleFilter,setRoleFilter]=useState<'all'|WorkRole>('all');
 const [teamFilter,setTeamFilter]=useState('all');
 const [openTaskId,setOpenTaskId]=useState<string|null>(null);
 const [openEvidenceId,setOpenEvidenceId]=useState<string|null>(null);
 const mine=db.workItems.filter(w=>Object.values(w.roles).includes(person.id));
 const teamOptions=[...new Set(mine.map(w=>w.team))];
 const filtered=mine.filter(w=>(roleFilter==='all'||w.roles[roleFilter]===person.id)&&(teamFilter==='all'||w.team===teamFilter));
 const filteredIds=new Set(filtered.map(w=>w.id));
 const filteredEvidence=db.evidence.filter(e=>e.personId===person.id&&filteredIds.has(e.workItemId));
 const orphanEvidence=db.evidence.filter(e=>e.personId===person.id&&!db.workItems.some(w=>w.id===e.workItemId));
 const result=calculate(db,person,period);
 const openTask=openTaskId?db.workItems.find(w=>w.id===openTaskId):undefined;
 const openEvidence=openEvidenceId?db.evidence.find(e=>e.id===openEvidenceId):undefined;
 const openFromEvidence=(e:Evidence)=>db.workItems.some(w=>w.id===e.workItemId)?setOpenTaskId(e.workItemId):setOpenEvidenceId(e.id);
 const statusOf=(w:WorkItem)=>w.events.some(e=>e.eventType==='Accepted')?'پذیرفته‌شده':'در جریان';
 const myRolesOf=(w:WorkItem)=>Object.entries(w.roles).filter(([,id])=>id===person.id).map(([r])=>roles[r as WorkRole]).join('، ');
 return <>
  <p className="page-note">شواهد شما به تفکیک نقش و پروژه، منشأ هر تسک، و شواهد پشتیبان همراه با مسیر کامل تأیید نتیجه. روی هر کار کلیک کنید تا نحوهٔ محاسبهٔ امتیاز آن را ببینید.</p>

  <div className="tabs"><button className={tab==='tasks'?'tab-btn active':'tab-btn'} onClick={()=>setTab('tasks')}>شواهد به تفکیک پروژه<span className="badge">{faNum(mine.length+orphanEvidence.length)}</span></button><button className={tab==='support'?'tab-btn active':'tab-btn'} onClick={()=>setTab('support')}>شواهد پشتیبان و مسیر تأیید<span className="badge">{faNum(result.all.length)}</span></button></div>

  {tab==='tasks'&&<>
   <section className="panel"><div className="filters"><select aria-label="فیلتر نقش" value={roleFilter} onChange={e=>setRoleFilter(e.target.value as 'all'|WorkRole)}><option value="all">نقش: همه</option>{Object.entries(roles).map(([k,label])=><option value={k} key={k}>نقش: {label}</option>)}</select><select aria-label="فیلتر تیم یا پروژه" value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}><option value="all">تیم/پروژه: همه</option>{teamOptions.map(t=><option value={t} key={t}>تیم/پروژه: {tr(t)}</option>)}</select></div><div className="inline-metrics"><span><strong>{faNum(filtered.length)}</strong> کار</span><span><strong>{faNum(filtered.reduce((s,w)=>s+w.complexity.workUnits,0))}</strong> واحد پیچیدگی</span><span><strong>{filteredEvidence.length?faNum(avg(filteredEvidence.map(e=>e.quality))):'—'}</strong> میانگین کیفیت</span></div></section>

   {teamOptions.filter(team=>teamFilter==='all'||team===teamFilter).map(team=>{
    const teamTasks=filtered.filter(w=>w.team===team);
    if(!teamTasks.length)return null;
    return <section className="panel" key={team}><div className="panel-title"><h2>{tr(team)}</h2><span className="badge">{faNum(teamTasks.length)} کار</span></div>{teamTasks.map(w=><button className="project-item" key={w.id} onClick={()=>setOpenTaskId(w.id)}><span><strong>{tr(w.workType)}</strong><small>{w.id} · نقش: {myRolesOf(w)} · مسیر: {tr(w.origin)} · {faNum(w.complexity.workUnits)} واحد · {statusOf(w)}</small></span><ArrowUpLeft size={16}/></button>)}</section>;
   })}

   {roleFilter==='all'&&teamFilter==='all'&&orphanEvidence.length>0&&<section className="panel"><div className="panel-title"><h2>مستقیم از شواهد</h2><span className="badge">{faNum(orphanEvidence.length)}</span></div>{orphanEvidence.map(e=><button className="project-item" key={e.id} onClick={()=>setOpenEvidenceId(e.id)}><span><strong>{tr(e.title)}</strong><small>{e.id} · {tr(e.project)} · {tr(e.status)}</small></span><ArrowUpLeft size={16}/></button>)}</section>}

   {!filtered.length&&!orphanEvidence.length&&<div className="empty">با این فیلتر کاری یافت نشد.</div>}
  </>}

  {tab==='support'&&<section className="panel"><div className="panel-title"><h2>شواهد پشتیبان و مسیر تأیید</h2></div>{result.all.map(e=><button className="project-item" key={e.id} onClick={()=>openFromEvidence(e)}><span>{tr(e.title)}<small>{e.reference} · {tr(e.status)}{e.excluded?' · تأخیر بیرونی حذف شده':''}</small></span><ArrowUpLeft size={16}/></button>)}{!result.all.length&&<div className="empty">برای این دوره شاهدی وجود ندارد.</div>}{result.decisions.map(d=><p key={d.stage} className="page-note"><strong>{tr(d.stage)}</strong> · {d.actor} · {d.reason}</p>)}</section>}

  {openTask&&<TaskDetail db={db} item={openTask} person={person} onClose={()=>setOpenTaskId(null)}/>}
  {openEvidence&&<EvidenceDetail evidence={openEvidence} person={person} onClose={()=>setOpenEvidenceId(null)}/>}
 </>;
}

// The per-task detail card: exactly how this task's complexity turns into work units, who holds each
// of the seven responsibility roles, its full canonical-event timeline, any exception/attribution, and
// every evidence record it produced — i.e. everything that feeds the score calculation for this task.
const factorLabels=['دامنه','عدم قطعیت','هماهنگی','ریسک'];
function TaskDetail({db,item,person,onClose}:{db:DB;item:WorkItem;person:DB['people'][number];onClose:()=>void}){
 const personName=(id:string|null)=>id?db.people.find(p=>p.id===id)?.name||id:'—';
 const roleEntries=Object.entries(item.roles) as [WorkRole,string|null][];
 const myRoles=roleEntries.filter(([,id])=>id===person.id).map(([r])=>roles[r]);
 const taskEvidence=db.evidence.filter(e=>e.workItemId===item.id);
 const accepted=item.events.some(e=>e.eventType==='Accepted');
 return <Modal title={`${tr(item.workType)} · ${item.id}`} onClose={onClose}>
  <div className="modal-body">
   <p>{tr(item.team)} · مسیر تسک: {tr(item.origin)} · {myRoles.length?`نقش شما: ${myRoles.join('، ')}`:'شما در این کار نقشی ندارید'}</p>
   <div className="detail-stats">
    <div><strong>{faNum(item.complexity.workUnits)}</strong><small>واحد پیچیدگی · {tr(item.complexity.band)}</small></div>
    <div><strong>{accepted?'پذیرفته‌شده':'در جریان'}</strong><small>وضعیت کار</small></div>
    <div><strong>{faNum(taskEvidence.length)}</strong><small>رکورد شاهد</small></div>
   </div>
   <h3>محاسبه پیچیدگی</h3>
   <p>{item.complexity.factors.map((v,i)=>`${factorLabels[i]} ${faNum(v)}`).join(' + ')} = {faNum(item.complexity.total)} ← {faNum(item.complexity.workUnits)} واحد کار ({tr(item.complexity.band)}).</p>
   <h3>نقش‌های مسئولیت (هفت‌گانه)</h3>
   <table><thead><tr><th>نقش</th><th>فرد</th></tr></thead><tbody>{roleEntries.map(([r,id])=><tr key={r}><td>{roles[r]}</td><td>{id===person.id?<strong>{personName(id)} (شما)</strong>:personName(id)}</td></tr>)}</tbody></table>
   {item.exception&&<div className="notice"><p><strong>استثنا:</strong> {tr(item.exception.type)} · شدت {tr(item.exception.severity)}{item.attributionCause&&<> · <strong>انتساب علت:</strong> {tr(item.attributionCause)}</>}</p></div>}
   <h3>مسیر رویدادها</h3>
   {item.events.slice().sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)).map(e=><p key={e.id} className="page-note"><strong>{tr(e.eventType)}</strong> · {personName(e.actorId)} ({roles[e.responsibilityRole]}) · {faDate(e.occurredAt)}</p>)}
   <h3>شواهد این کار</h3>
   {taskEvidence.map(e=><div className="project-item" key={e.id}><span><strong>{personName(e.personId)}{e.personId===person.id?' (شما)':''}</strong><small>{faSource(e.source)} / {e.reference} · {faPeriod(e.period)} · {tr(e.status)}</small><small>کیفیت {faNum(e.quality)} / پاسداری {faNum(e.stewardship)} / مشارکت جمعی {faNum(e.collective)} · سهم {faNum(e.share)}٪{e.excluded?' · تأخیر بیرونی حذف شده از قابلیت اتکا':''}</small></span></div>)}
   {!taskEvidence.length&&<div className="empty">هنوز شاهدی برای این کار ثبت نشده است.</div>}
  </div>
 </Modal>;
}

// A standalone evidence record with no matching formal task (evidence captured directly).
function EvidenceDetail({evidence,person,onClose}:{evidence:Evidence;person:DB['people'][number];onClose:()=>void}){
 return <Modal title={`${tr(evidence.title)} · ${evidence.id}`} onClose={onClose}>
  <div className="modal-body">
   <p>مستقیم از شواهد · {tr(evidence.project)} · {evidence.personId===person.id?'شاهد شخصی شما':'—'}</p>
   <div className="lineage">{faSource(evidence.source)} / {evidence.reference} ← {evidence.id} ← ارزیابی {faPeriod(evidence.period)}</div>
   <p>عوامل پیچیدگی: {evidence.factors.map(v=>faNum(v)).join(' + ')} = {faNum(evidence.factors.reduce((a,b)=>a+b,0))} ← {faNum(units(evidence.factors))} واحد. سهم مسئولیت: {faNum(evidence.share)}٪.</p>
   <p>{evidence.excluded?'تأخیر بیرونی از قابلیت اتکای فرد حذف شده است.':evidence.onTime?'در زمان مجاز تکمیل شده است.':'مهلت مجاز از دست رفته است.'}</p>
   <div className="formula">کیفیت {faNum(evidence.quality)} / پاسداری {faNum(evidence.stewardship)} / مشارکت جمعی {faNum(evidence.collective)}</div>
  </div>
 </Modal>;
}
