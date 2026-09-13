import {useState,type FormEvent,type ReactNode} from 'react';
import {ArrowUpLeft,CheckCircle2,Clock3,Database,Download,GitBranch,LockKeyhole,Plus,Search,ShieldCheck,Target} from 'lucide-react';
import {scopeFor,type AppContext} from './access';
import {actors,calculate,dimensions,units,weights,type DB,type Evidence,type WorkRole} from './engine';
import type {Save} from './Workspace';
import {faDate,faNum,faPeriod,faSource,tr} from './fa';

type Props={db:DB;context:AppContext;page:string;period:string;navigate:(page:string)=>void;save:Save;notify:(s:string)=>void};
const avg=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:0;
const roles:Record<WorkRole,string>={requester:'درخواست‌دهنده',planner:'برنامه‌ریز',assigner:'واگذارکننده',decision_owner:'مالک تصمیم',executor:'مجری',contributor:'مشارکت‌کننده',reviewer:'بازبین'};
const fmt=(n:number|null)=>n===null?'—':faNum(n);
export const customPages=new Set(['Home','Expectations','Team outcomes','Evidence gaps','System quality','Project snapshot','Attribution','Job families','Performance profiles','Integrations','Engine ledger','Calibration facilitator','Quality samples','Governance cases','Payroll preview','Access management']);

export default function RolePages({db,context,page,period,navigate,save,notify}:Props){
 const person=db.people.find(p=>p.id===actors.Employee)||db.people[0];
 const results=db.people.map(p=>({p,r:calculate(db,p,period)}));
 const scope=scopeFor(db,context),scopeIds=new Set(scope.map(p=>p.id));
 const scopedResults=context.managerId||context.id==='self'?results.filter(x=>scopeIds.has(x.p.id)):results;
 const scopedTeams=context.managerId?[...new Set(scope.map(p=>p.team))]:[...new Set(db.people.map(p=>p.team))];
 const scores=scopedResults.map(x=>x.r.score).filter((x):x is number=>x!==null);
 const trendPoints=db.periods.map(pd=>({label:faPeriod(pd.id),value:avg(scope.map(p=>calculate(db,p,pd.id).score).filter((x):x is number=>x!==null))}));
 if(page==='Home'){
  if(context.id==='self')return <SelfHome db={db} person={person} period={period} navigate={navigate}/>;
  return <><div className="role-hero"><div><span className="eyebrow">{context.roleTitle}</span><h1>{context.label.split(' — ')[1]||context.label}</h1><p>این نما فقط داده‌ها و اقدام‌های دامنه «{context.scope}» را نشان می‌دهد.</p></div><span className="secure-pill"><LockKeyhole size={15}/>دامنه دسترسی فعال</span></div><div className="stats"><section className="stat"><div>دوره فعال<Clock3 size={16}/></div><strong>{faPeriod(period)}</strong><small>{tr(db.periods.find(p=>p.id===period)?.state)}</small></section><section className="stat"><div>اقدام‌های در انتظار<ShieldCheck size={16}/></div><strong>{faNum(db.sampling.filter(s=>s.status==='Queued').length+db.appeals.filter(a=>a.status==='Open').length)}</strong><small>نمونه و پرونده در دامنه</small></section><section className="stat"><div>پوشش داده<Database size={16}/></div><strong>{faNum(avg(scopedResults.map(x=>x.r.confidence)))}٪</strong><small>میانگین اطمینان شواهد</small></section><section className="stat"><div>میانگین نتیجه<ArrowUpLeft size={16}/></div><strong>{faNum(avg(scores))}</strong><small>بدون توزیع اجباری</small></section></div><section className="panel"><div className="panel-title"><div><h2>روند امتیاز میانگین دامنه</h2><small>میانگین امتیاز غلتان محاسبه‌شده در {faNum(scope.length)} پرونده، به تفکیک دوره</small></div></div><Trend points={trendPoints}/></section><section className="panel"><div className="panel-title"><div><h2>کارهای این زمینه</h2><small>منو بر اساس قابلیت‌های مؤثر ساخته شده است</small></div></div><div className="quick-grid">{context.nav.filter(n=>n.id!=='Home').map(n=><button key={n.id} onClick={()=>navigate(n.id)}><span><strong>{n.label}</strong><small>بازکردن نمای {context.roleTitle}</small></span><ArrowUpLeft size={17}/></button>)}</div></section></>;
 }
 if(page==='Expectations')return <ExpectationsPage db={db} person={person} period={period} save={save} notify={notify}/>;
 if(page==='Team outcomes')return <Page title="پیامدها و اهداف تیم" text="نتیجه تیم با حجم کار خام سنجیده نمی‌شود؛ پیچیدگی، پذیرش و کیفیت مبنا هستند."><Table heads={['تیم','اقلام کار','واحد پیچیدگی','پذیرفته‌شده','استثنا']} rows={scopedTeams.map(team=>{const ws=db.workItems.filter(w=>w.team===team);return[tr(team),faNum(ws.length),faNum(ws.reduce((s,w)=>s+w.complexity.workUnits,0)),faNum(ws.filter(w=>w.events.some(e=>e.eventType==='Accepted')).length),faNum(ws.filter(w=>w.exception).length)]})}/></Page>;
 if(page==='Evidence gaps')return <Page title="پوشش و شکاف شواهد" text="شکاف‌ها پیش از قفل دوره باید رفع یا با دلیل ثبت شوند."><Table heads={['فرد','تیم','پوشش','اطمینان','اقدام']} rows={scopedResults.sort((a,b)=>a.r.confidence-b.r.confidence).map(({p,r})=>[p.name,tr(p.team),`${faNum(r.confidence)}٪`,tr(r.state),r.confidence<80?'نیازمند شاهد تکمیلی':'کافی'])}/></Page>;
 if(page==='System quality')return <Page title="کیفیت سیستم کاری" text="این نما مسئله‌های ناشی از مدیریت، ظرفیت و وابستگی را از عملکرد فرد جدا می‌کند."><Table heads={['قلم کار','علت','شدت','مسئول پاسخ‌گویی','اثر بر مجری']} rows={db.workItems.filter(w=>w.attributionCause).map(w=>[tr(w.workType),tr(w.attributionCause),tr(w.exception?.severity),w.attributionCause?.includes('Management')?'مدیر/واگذارکننده':'مالک وابستگی',w.attributionCause==='Employee delay without blocker'?'محاسبه می‌شود':'حذف از قابلیت اتکا'])}/></Page>;
 if(page==='Project snapshot'){const items=context.managerId?db.workItems.filter(w=>scopeIds.has(w.roles.executor||'')):db.workItems;return <Page title="صف نمای پروژه" text="رهبر پروژه سهم‌ها، تحویل‌ها و انتساب علت را پیش از انتشار تأیید می‌کند."><Table heads={['قلم کار','مجری','واحد','رویداد پایانی','وضعیت انتساب']} rows={items.map(w=>[tr(w.workType),db.people.find(p=>p.id===w.roles.executor)?.name||'—',faNum(w.complexity.workUnits),tr(w.events.at(-1)?.eventType),w.attributionCause?tr(w.attributionCause):'بدون اختلاف'])}/></Page>}
 if(page==='Attribution'){const items=context.managerId?db.workItems.filter(w=>scopeIds.has(w.roles.executor||'')):db.workItems;const joint=items.filter(w=>w.roles.contributor&&w.roles.executor&&w.roles.contributor!==w.roles.executor);return <Page title="تشخیص انتساب" text="زمان و کیفیت فقط به نقشی نسبت داده می‌شود که کنترل واقعی بر علت داشته است."><Table heads={['قلم کار','سناریو','نقش پاسخ‌گو','حکم قابلیت اتکا','شاهد رویدادی']} rows={items.filter(w=>w.attributionCause).map(w=>[tr(w.workType),tr(w.attributionCause),w.attributionCause==='Employee delay without blocker'?'مجری':w.attributionCause?.includes('Management')?'واگذارکننده/مدیر':'مالک وابستگی','Employee delay without blocker'===w.attributionCause?'منظور شود':'از مجری کسر نشود',w.events.filter(e=>['Blocked','Unblocked','Assigned','Submitted'].includes(e.eventType)).map(e=>tr(e.eventType)).join(' ← ')])}/><section className="panel"><div className="panel-title"><div><h2>سهم مسئولیت مشترک</h2><small>وقتی مجری و مشارکت‌کننده متفاوت‌اند، سهم هرکدام از پیامد پذیرفته‌شده جداگانه ثبت می‌شود</small></div></div><div className="split-list">{joint.slice(0,25).map(w=>{const share=db.evidence.find(e=>e.workItemId===w.id)?.share??70;return <div className="split-row" key={w.id}><div className="split-head"><strong>{tr(w.workType)}</strong><small>{w.id}</small></div><SplitBar leftLabel={db.people.find(p=>p.id===w.roles.executor)?.name||'—'} leftPct={share} rightLabel={db.people.find(p=>p.id===w.roles.contributor)?.name||'—'} rightPct={100-share}/><small className="split-note"><CheckCircle2 size={12}/> مجموع سهم تأییدشده: ۱۰۰٪</small></div>})}{!joint.length&&<div className="empty">در این دامنه موردی از مسئولیت مشترک ثبت نشده است.</div>}</div></section></Page>}
 if(page==='Job families')return <Page title="خانواده‌های شغلی" text="نگاشت خانواده شغلی به الگوی کار نسخه‌بندی می‌شود."><Table heads={['خانواده','افراد','الگوی غالب','سطوح']} rows={[...new Set(db.people.map(p=>p.title))].map(title=>{const ps=db.people.filter(p=>p.title===title);return[tr(title),faNum(ps.length),tr(ps[0].primary),[...new Set(ps.map(p=>tr(p.level)))].join('، ')]})}/></Page>;
 if(page==='Performance profiles')return <Page title="پروفایل‌های عملکرد" text="وزن‌ها بر اساس الگوی کار تعیین می‌شوند و مسئولیت هر قلم، نوع شاهد را تعیین می‌کند."><Table heads={['پروفایل',...dimensions.map(tr)]} rows={Object.entries(weights).map(([name,row])=>[tr(name),...row.map(v=>`${faNum(v)}٪`)])}/></Page>;
 if(page==='Integrations')return <Page title="درگاه‌های داده" text="این نسخه همه رابط‌ها را در حالت نمایشی اجرا می‌کند و قرارداد تبدیل همان قرارداد تولید است."><Table heads={['درگاه','کاربرد','رکورد','آخرین همگام‌سازی','وضعیت']} rows={db.connectors.map(c=>[c.name,c.purpose,faNum(c.records),faDate(c.lastSync),'سالم · نمایشی'])}/></Page>;
 if(page==='Engine ledger')return <Page title="بازپخش و دفترکل موتور" text="هر رویداد استاندارد را می‌توان به ترتیب زمان بازپخش و نتیجه را دوباره ساخت."><Table heads={['رویداد','نوع','قلم کار','عامل','زمان']} rows={db.workItems.flatMap(w=>w.events).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)).slice(0,100).map(e=>[e.id,tr(e.eventType),e.workItemId,db.people.find(p=>p.id===e.actorId)?.name||e.actorId,faDate(e.occurredAt)])}/></Page>;
 if(page==='Calibration facilitator')return <Page title="مدیریت جلسات هم‌ترازی" text="تسهیل‌گر ترتیب بررسی را بر اساس اطمینان، استثنا و اختلاف تنظیم می‌کند."><Table heads={['فرد','زمینه مقایسه','امتیاز','اطمینان','اولویت جلسه']} rows={results.sort((a,b)=>a.r.confidence-b.r.confidence).map(({p,r})=>[p.name,`${tr(p.primary)} · ${tr(p.level)}`,faNum(r.score??0),`${faNum(r.confidence)}٪`,r.hold?tr(r.hold):'عادی'])}/></Page>;
 if(page==='Quality samples')return <Page title="صف نمونه‌های کیفیت" text="انتخاب نمونه از بازبینی آن جداست؛ بازبین فقط صف تخصیص‌یافته را می‌بیند."><Table heads={['نمونه','قلم کار','روش','دلیل','وضعیت']} rows={db.sampling.map(s=>[s.id,s.workItemId,s.method==='Random'?'تصادفی':'ریسک‌محور',s.reasons.join('، '),s.status==='Reviewed'?'بازبینی‌شده':'در صف'])}/></Page>;
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
 const path=coords.map((c,i)=>`${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
 return <div className="trend-chart"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="روند امتیاز میانگین به تفکیک دوره">{[0,25,50,75,100].map(g=><line key={g} x1={pad} x2={w-pad} y1={y(g)} y2={y(g)} className="trend-grid"/>)}<path d={path} className="trend-line" fill="none"/>{coords.map(c=><g key={c.label}><circle cx={c.x} cy={c.y} r={4} className="trend-dot"/><text x={c.x} y={h-6} className="trend-label" textAnchor="middle">{c.label}</text><text x={c.x} y={c.y-10} className="trend-value" textAnchor="middle">{faNum(c.value)}</text></g>)}</svg></div>;
}

// Two-series version of Trend: the employee's own history against the organization average, for the
// "سازمان" (organization) lens on personal score.
function CompareTrend({mine,org}:{mine:{label:string;value:number}[];org:{label:string;value:number}[]}){
 const w=640,h=170,pad=28,max=100;
 if(!mine.some(p=>!Number.isNaN(p.value)))return <div className="empty">داده کافی برای رسم روند وجود ندارد.</div>;
 const step=(w-pad*2)/Math.max(1,mine.length-1);
 const y=(v:number)=>h-pad-(Math.max(0,Math.min(max,v))/max)*(h-pad*2);
 const line=(pts:{value:number}[])=>pts.map((p,i)=>`${i===0?'M':'L'}${(pad+i*step).toFixed(1)},${Number.isNaN(p.value)?'':y(p.value).toFixed(1)}`).join(' ');
 return <div className="trend-chart"><svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="مقایسه امتیاز من با میانگین سازمان">{[0,25,50,75,100].map(g=><line key={g} x1={pad} x2={w-pad} y1={y(g)} y2={y(g)} className="trend-grid"/>)}<path d={line(org)} className="trend-line trend-line-org" fill="none"/><path d={line(mine)} className="trend-line" fill="none"/>{mine.map((c,i)=><g key={c.label}><circle cx={pad+i*step} cy={y(c.value)} r={4} className="trend-dot"/><text x={pad+i*step} y={h-6} className="trend-label" textAnchor="middle">{c.label}</text></g>)}</svg><div className="split-bar-legend"><span><i className="split-dot" style={{background:'#2c624b'}}/>امتیاز من</span><span><i className="split-dot" style={{background:'#c8a55a'}}/>میانگین سازمان</span></div></div>;
}

// A real split of an accepted work item's responsibility share between executor and contributor.
function SplitBar({leftLabel,leftPct,rightLabel,rightPct}:{leftLabel:string;leftPct:number;rightLabel:string;rightPct:number}){
 return <div className="split-bar"><div className="split-bar-track"><div className="split-bar-seg split-bar-executor" style={{width:`${leftPct}%`}} title={`${leftLabel} · ${faNum(leftPct)}٪`}/><div className="split-bar-seg split-bar-contributor" style={{width:`${rightPct}%`}} title={`${rightLabel} · ${faNum(rightPct)}٪`}/></div><div className="split-bar-legend"><span><i className="split-dot split-bar-executor"/>{leftLabel} (مجری) · {faNum(leftPct)}٪</span><span><i className="split-dot split-bar-contributor"/>{rightLabel} (مشارکت‌کننده) · {faNum(rightPct)}٪</span></div></div>;
}

// The employee's Home: their combined final evaluation (score, band, confidence, dimensions, evidence
// and decision trail) plus sliceable filters (time via the global period, role, project/team, and an
// organization-comparison toggle) — everything that used to live behind separate "My impact" and
// "Evidence package" menus, brought onto one page.
function SelfHome({db,person,period,navigate}:{db:DB;person:DB['people'][number];period:string;navigate:(p:string)=>void}){
 const [roleFilter,setRoleFilter]=useState<'all'|WorkRole>('all');
 const [projectFilter,setProjectFilter]=useState('all');
 const [compareOrg,setCompareOrg]=useState(false);
 const result=calculate(db,person,period);
 const mine=db.workItems.filter(w=>Object.values(w.roles).includes(person.id));
 const projectOptions=[...new Set(mine.map(w=>w.team))];
 const filtered=mine.filter(w=>(roleFilter==='all'||w.roles[roleFilter]===person.id)&&(projectFilter==='all'||w.team===projectFilter));
 const filteredIds=new Set(filtered.map(w=>w.id));
 const filteredEvidence=db.evidence.filter(e=>e.personId===person.id&&filteredIds.has(e.workItemId));
 const orgTrend=db.periods.map(pd=>({label:faPeriod(pd.id),value:avg(db.people.map(p=>calculate(db,p,pd.id).score).filter((x):x is number=>x!==null))}));
 const selfTrend=db.periods.map(pd=>({label:faPeriod(pd.id),value:calculate(db,person,pd.id).score??NaN}));
 return <>
  <div className="role-hero"><div><span className="eyebrow">کارمند · {faPeriod(period)}</span><h1>اثرگذاری من</h1></div></div>

  <div className="score-lead"><div className="score-number">{fmt(result.score)}<small>{tr(result.band)}</small></div><div className="score-meta"><span>اطمینان {fmt(result.confidence)}٪ · {tr(result.state)}</span><span>مرحله تأیید: {tr(result.stage)}</span></div></div>
  {result.hold&&<p className="hold-line">تأیید متوقف است: {tr(result.hold)} — امتیاز محاسبه‌شده همچنان دیده می‌شود.</p>}

  <div className="dim-bars">{dimensions.map((d,i)=>{const v=result.values[i];return <div className="dim-bar-row" key={d}><span className="dim-label">{tr(d)}</span><div className="dim-track"><div style={{width:`${v??0}%`}}/></div><span className="dim-value">{v!==null?fmt(v):'—'}</span><span className="dim-weight">{faNum(result.w[i])}٪</span></div>})}</div>
  <p className="formula-line">{fmt(result.current)}×۰٫۵۰ + {fmt(result.history[0])}×۰٫۳۰ + {fmt(result.history[1])}×۰٫۲۰ = {fmt(result.score)} (دوره جاری/قبل/قدیمی‌تر) · وزن‌ها از الگوی {tr(person.primary)}</p>

  <section className="panel"><div className="panel-title"><h2>روند امتیاز</h2><label className="check"><input type="checkbox" checked={compareOrg} onChange={e=>setCompareOrg(e.target.checked)}/>مقایسه با سازمان</label></div>{compareOrg?<CompareTrend mine={selfTrend} org={orgTrend}/>:<Trend points={selfTrend}/>}</section>

  <section className="panel"><div className="panel-title"><h2>شواهد به تفکیک نقش و پروژه</h2></div><div className="filters"><select aria-label="فیلتر نقش" value={roleFilter} onChange={e=>setRoleFilter(e.target.value as 'all'|WorkRole)}><option value="all">همه نقش‌ها</option>{Object.entries(roles).map(([k,label])=><option value={k} key={k}>{label}</option>)}</select><select aria-label="فیلتر پروژه یا تیم" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="all">همه پروژه‌ها/تیم‌ها</option>{projectOptions.map(p=><option value={p} key={p}>{tr(p)}</option>)}</select></div><div className="inline-metrics"><span><strong>{faNum(filtered.length)}</strong> قلم کار</span><span><strong>{faNum(filtered.reduce((s,w)=>s+w.complexity.workUnits,0))}</strong> واحد پیچیدگی</span><span><strong>{filteredEvidence.length?faNum(avg(filteredEvidence.map(e=>e.quality))):'—'}</strong> میانگین کیفیت</span></div><div className="table-wrap"><table><thead><tr><th>قلم کار</th><th>نقش من</th><th>تیم/پروژه</th><th>واحد</th><th>وضعیت</th></tr></thead><tbody>{filtered.map(w=><tr key={w.id}><td><strong>{tr(w.workType)}</strong><small>{w.id}</small></td><td>{Object.entries(w.roles).filter(([,id])=>id===person.id).map(([r])=>roles[r as WorkRole]).join('، ')}</td><td>{tr(w.team)}</td><td>{faNum(w.complexity.workUnits)}</td><td>{w.events.some(e=>e.eventType==='Accepted')?'پذیرفته‌شده':'در جریان'}</td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">با این فیلتر قلم کاری یافت نشد.</div>}</div></section>

  <section className="panel"><div className="panel-title"><h2>شواهد پشتیبان و مسیر تأیید</h2></div>{result.all.map(e=><button className="project-item" key={e.id} onClick={()=>navigate('Expectations')}><span>{tr(e.title)}<small>{e.reference} · {tr(e.status)}{e.excluded?' · تأخیر بیرونی حذف شده':''}</small></span><ArrowUpLeft size={16}/></button>)}{!result.all.length&&<div className="empty">برای این دوره شاهدی وجود ندارد.</div>}{result.decisions.map(d=><p key={d.stage} className="page-note"><strong>{tr(d.stage)}</strong> · {d.actor} · {d.reason}</p>)}</section>
 </>;
}

// The employee's unified "Expectations & Evidence" workspace: the team's KPI/OKR breakdown down to
// real tasks, every task the employee holds any responsibility role on, a full manual evidence
// submission form tied to a real task, and — merged in from the old standalone Evidence menu — the
// employee's own evidence ledger across every period, searchable and exportable.
function ExpectationsPage({db,person,period,save,notify}:{db:DB;person:DB['people'][number];period:string;save:Save;notify:(s:string)=>void}){
 const [tab,setTab]=useState<'goals'|'evidence'>('goals');
 const [open,setOpen]=useState(false);
 const [workItemId,setWorkItemId]=useState('');
 const [query,setQuery]=useState('');
 const [status,setStatus]=useState('All');
 const mine=db.workItems.filter(w=>Object.values(w.roles).includes(person.id));
 const teamItems=db.workItems.filter(w=>w.team===person.team);
 const byType=new Map<string,typeof teamItems>();
 teamItems.forEach(w=>byType.set(w.workType,[...(byType.get(w.workType)||[]),w]));
 const myEvidence=db.evidence.filter(e=>e.personId===person.id);
 const accepted=mine.filter(w=>w.events.some(e=>e.eventType==='Accepted')).length;
 const verified=myEvidence.filter(e=>e.status==='Verified').length;
 const openEvidenceFor=(id:string)=>{setWorkItemId(id);setOpen(true);setTab('goals')};
 const submit=(ev:FormEvent<HTMLFormElement>)=>{
  ev.preventDefault();
  try{
   if(db.periods.find(p=>p.id===period)?.state!=='Open')throw Error('این دوره قفل یا منتشر شده و قابل تغییر نیست.');
   const item=db.workItems.find(w=>w.id===workItemId);
   if(!item)throw Error('قلم کار معتبری انتخاب نشده است.');
   const d=new FormData(ev.currentTarget);
   const text=(k:string)=>String(d.get(k)||'').trim();
   const number=(k:string,min=0,max=100)=>{const n=Number(d.get(k));if(!Number.isFinite(n)||n<min||n>max)throw Error(`مقدار ${k} معتبر نیست.`);return n};
   const reference=text('reference');
   if(!reference)throw Error('مرجع منبع الزامی است.');
   if(db.evidence.some(e=>e.source===text('source')&&e.reference.toLowerCase()===reference.toLowerCase()))throw Error('این مرجع منبع قبلاً ثبت شده است.');
   const record:Evidence={id:'ev-'+crypto.randomUUID().slice(0,8),workItemId:item.id,personId:person.id,period,title:item.workType,project:item.team,source:text('source'),reference,factors:['scope','interdependence','judgment','risk'].map(k=>number(k,0,3)),share:number('share',1,100),quality:number('quality'),stewardship:number('stewardship'),collective:number('collective'),onTime:d.has('ontime'),excluded:d.has('excluded'),critical:d.has('critical'),status:'Pending',actor:person.id};
   save({...db,evidence:[...db.evidence,record]},'شاهد کار توسط کارمند ثبت شد',record.id,JSON.stringify(record,null,2),true);
   ev.currentTarget.reset();
   setOpen(false);
  }catch(error){notify(error instanceof Error?tr(error.message):'ثبت شاهد ممکن نشد.')}
 };
 const download=(name:string,value:string)=>{const url=URL.createObjectURL(new Blob([value],{type:'text/csv'})),a=document.createElement('a');a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),500)};
 const csv=(rows:unknown[][])=>rows.map(row=>row.map(v=>'"'+String(v??'').replace(/^[=+@-]/,"'").replace(/"/g,'""')+'"').join(',')).join('\r\n');
 const filteredEvidence=myEvidence.filter(e=>(status==='All'||e.status===status)&&`${e.title} ${e.reference}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.period.localeCompare(a.period));
 return <>
  <p className="page-note">ساختار شکست اهداف تیم تا سطح تسک، همه تسک‌هایی که در آن‌ها نقشی دارید، و دفتر کامل شواهد شما — در یک فضای کاری.</p>
  <div className="stats"><section className="stat"><div>تسک‌های من<CheckCircle2 size={16}/></div><strong>{faNum(mine.length)}</strong><small>با حداقل یک نقش مسئولیت</small></section><section className="stat"><div>نرخ پذیرش<Target size={16}/></div><strong>{mine.length?faNum(accepted/mine.length*100):'—'}٪</strong><small>{faNum(accepted)} از {faNum(mine.length)} پذیرفته‌شده</small></section><section className="stat"><div>شواهد ثبت‌شده<Database size={16}/></div><strong>{faNum(myEvidence.length)}</strong><small>در همه دوره‌ها</small></section><section className="stat"><div>نرخ تأیید شواهد<ShieldCheck size={16}/></div><strong>{myEvidence.length?faNum(verified/myEvidence.length*100):'—'}٪</strong><small>{faNum(verified)} از {faNum(myEvidence.length)} تأییدشده</small></section></div>

  <div className="tabs"><button className={tab==='goals'?'tab-btn active':'tab-btn'} onClick={()=>setTab('goals')}>اهداف و تسک‌ها</button><button className={tab==='evidence'?'tab-btn active':'tab-btn'} onClick={()=>setTab('evidence')}>شواهد من<span className="badge">{faNum(myEvidence.length)}</span></button></div>

  {tab==='goals'&&<>
   <section className="panel"><div className="panel-title"><div><h2>ساختار شکست اهداف تیم تا تسک</h2><small>تیم {tr(person.team)} · هر هدف عملیاتی (KPI/OKR) به تسک‌های واقعی متصل است</small></div></div><div className="wbs">{[...byType.entries()].map(([type,items])=>{const done=items.filter(w=>w.events.some(e=>e.eventType==='Accepted')).length;return <div className="wbs-node" key={type}><div className="wbs-head"><div><strong>{tr(type)}</strong><small>{faNum(items.length)} تسک · {faNum(items.reduce((s,w)=>s+w.complexity.workUnits,0))} واحد پیچیدگی</small></div><span className="badge">{faNum(done)}/{faNum(items.length)} پذیرفته‌شده</span></div><div className="progress"><div style={{width:`${items.length?done/items.length*100:0}%`}}/></div><div className="wbs-children">{items.map(w=>{const myRoles=Object.entries(w.roles).filter(([,id])=>id===person.id).map(([r])=>roles[r as WorkRole]);return <div className={`wbs-task${myRoles.length?' wbs-mine':''}`} key={w.id}><span>{tr(w.workType)}<small>{w.id}</small></span>{myRoles.length>0&&<span className="badge green">{myRoles.join('، ')}</span>}</div>})}</div></div>})}{!byType.size&&<div className="empty">هدفی برای این تیم ثبت نشده است.</div>}</div></section>

   <section className="panel"><div className="panel-title"><div><h2>تسک‌های من (هر نقشی)</h2><small>واگذارکننده، مجری، برنامه‌ریز، تأییدکننده، مالک، بازبین یا درخواست‌دهنده</small></div></div><div className="table-wrap"><table><thead><tr><th>تسک</th><th>تیم</th><th>نقش (های) من</th><th>پیچیدگی</th><th>وضعیت</th><th>شواهد</th><th/></tr></thead><tbody>{mine.map(w=><tr key={w.id}><td><strong>{tr(w.workType)}</strong><small>{w.id}</small></td><td>{tr(w.team)}</td><td>{Object.entries(w.roles).filter(([,id])=>id===person.id).map(([r])=>roles[r as WorkRole]).join('، ')}</td><td>{faNum(w.complexity.workUnits)} واحد</td><td>{w.events.some(e=>e.eventType==='Accepted')?'پذیرفته‌شده':'در جریان'}</td><td>{faNum(db.evidence.filter(e=>e.workItemId===w.id).length)}</td><td><button onClick={()=>openEvidenceFor(w.id)}><Plus size={13}/>ثبت شاهد</button></td></tr>)}</tbody></table>{!mine.length&&<div className="empty">هنوز تسکی با نقش شما ثبت نشده است.</div>}</div></section>

   {open&&<section className="panel"><div className="panel-title"><div><h2>ثبت دستی شاهد کار</h2><small>{workItemId?<>برای تسک <strong>{tr(db.workItems.find(w=>w.id===workItemId)?.workType||'')}</strong> ({workItemId})</>:'یک تسک را از جدول بالا انتخاب کنید'}</small></div><button onClick={()=>setOpen(false)}>بستن</button></div><form className="modal-body form-inline" onSubmit={submit}>
    <p>شاهد جدید تا زمان بازبینی مستقل، موقت است. پیچیدگی هنگام ثبت قفل می‌شود.</p>
    <label>تسک مرتبط<select value={workItemId} onChange={e=>setWorkItemId(e.target.value)} required><option value="" disabled>انتخاب تسک…</option>{mine.map(w=><option value={w.id} key={w.id}>{tr(w.workType)} ({w.id})</option>)}</select></label>
    <div className="form-grid"><label>منبع<select name="source"><option value="DMS">سامانه اسناد</option><option value="ERP/domain system">سامانه ERP</option><option value="Task manager">سامانه مدیریت کار</option><option value="CRM/case system">سامانه CRM</option><option value="HRIS">سامانه منابع انسانی</option></select></label><label>مرجع معتبر<input name="reference" required placeholder="DOC-501"/></label></div>
    <div className="form-grid">{[['scope','دامنه'],['interdependence','وابستگی'],['judgment','قضاوت'],['risk','ریسک']].map(([key,label])=><label key={key}>{label} (۰ تا ۳)<input name={key} type="number" min="0" max="3" defaultValue="2" required/></label>)}</div>
    <div className="form-grid">{[['share','سهم'],['quality','کیفیت'],['stewardship','پاسداری'],['collective','مشارکت جمعی']].map(([key,label])=><label key={key}>{label} (درصد)<input name={key} type="number" min={key==='share'?1:0} max="100" defaultValue={key==='share'?100:85} required/></label>)}</div>
    <label className="check"><input name="ontime" type="checkbox" defaultChecked/>در زمان مجاز تکمیل شد</label>
    <label className="check"><input name="excluded" type="checkbox"/>وابستگی بیرونی؛ از قابلیت اتکا حذف شود</label>
    <label className="check"><input name="critical" type="checkbox"/>استثنای بحرانی و نیازمند رسیدگی</label>
    <button className="primary" disabled={!workItemId}>ارسال برای بازبینی</button>
   </form></section>}
  </>}

  {tab==='evidence'&&<section className="panel"><div className="panel-title"><div><h2>دفتر شواهد من</h2><small>{faNum(filteredEvidence.length)} رکورد از {faNum(myEvidence.length)} · همه دوره‌ها</small></div><button className="primary" onClick={()=>{setTab('goals');setOpen(true)}}><Plus size={16}/>ثبت شاهد جدید</button></div><div className="filters"><div className="search"><Search size={16}/><input aria-label="جست‌وجوی شواهد" placeholder="جست‌وجوی عنوان یا مرجع" value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="فیلتر وضعیت" value={status} onChange={e=>setStatus(e.target.value)}><option value="All">همه وضعیت‌ها</option><option value="Pending">در انتظار</option><option value="Verified">تأییدشده</option><option value="Returned">برگشت‌خورده</option></select><button onClick={()=>download('evalcore-my-evidence.csv',csv([['شناسه','عنوان','دوره','منبع','مرجع','واحد','کیفیت','وضعیت'],...filteredEvidence.map(e=>[e.id,tr(e.title),faPeriod(e.period),faSource(e.source),e.reference,units(e.factors),e.quality,tr(e.status)])]))}><Download size={15}/>دریافت CSV</button></div><div className="evidence-list">{filteredEvidence.map(e=><details className="evidence-row" key={e.id}><summary><span className="evidence-row-title"><strong>{tr(e.title)}</strong><small>{e.id} · {faSource(e.source)} / {e.reference} · {faPeriod(e.period)}</small></span><span className="badge">{tr(e.status)}</span>{e.critical&&<span className="badge amber">استثنای بحرانی</span>}</summary><div className="evidence-row-body"><p>عوامل پیچیدگی: {e.factors.map(v=>faNum(v)).join(' + ')} = {faNum(e.factors.reduce((a,b)=>a+b,0))} ← {faNum(units(e.factors))} واحد. سهم مسئولیت: {faNum(e.share)}٪.</p><p>{e.excluded?'تأخیر بیرونی از قابلیت اتکای فرد حذف شده است.':e.onTime?'در زمان مجاز تکمیل شده است.':'مهلت مجاز از دست رفته است.'}</p><div className="formula">کیفیت {faNum(e.quality)} / پاسداری {faNum(e.stewardship)} / مشارکت جمعی {faNum(e.collective)}</div></div></details>)}{!filteredEvidence.length&&<div className="empty">با این فیلتر شاهدی یافت نشد.</div>}</div></section>}
 </>;
}
