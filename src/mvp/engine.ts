import mock from './mockData.json';
import {mockConnectorRegistry,normalizeEvents,type ConnectorState} from './connectors';
export const dimensions = ['Contribution','Quality','Reliability','Stewardship','Collective'];
export const weights = {Transactional:[25,35,25,10,5],Project:[35,25,20,5,15],Knowledge:[15,40,15,10,20],Coordination:[20,25,30,10,15],Control:[15,30,20,30,5],Management:[25,20,15,15,25]};
export type Archetype = keyof typeof weights;
export type Role = 'Employee'|'Manager'|'Reviewer'|'Calibrator'|'Governance'|'Payroll'|'Model admin';
export type WorkRole='requester'|'planner'|'assigner'|'decision_owner'|'executor'|'contributor'|'reviewer';
export type EventCategory='work'|'control'|'governance';
export type PeriodState='Open'|'Calculating'|'Locked'|'Published';
export interface CanonicalEvent{id:string;eventType:string;category:EventCategory;occurredAt:string;actorId:string;responsibilityRole:WorkRole;workItemId:string;}
export interface WorkItem{id:string;team:string;workType:string;archetype:Archetype;complexity:{factors:number[];total:number;band:string;workUnits:number};roles:Record<WorkRole,string|null>;exception:null|{type:string;severity:'Minor'|'Major'|'Critical'};attributionCause:string|null;events:CanonicalEvent[];}
export interface SamplingCase{id:string;workItemId:string;reasons:string[];method:'Random'|'Risk-based'|'Validation';status:'Queued'|'Reviewed';reviewerId?:string;}
export interface EvaluationPeriod{id:string;cadence:'Monthly'|'Quarterly'|'Semiannual';state:PeriodState;lockedAt?:string;publishedAt?:string;}
export interface Person {id:string;name:string;title:string;team:string;managerId:string|null;level:string;primary:Archetype;secondary?:Archetype;expected:number;prior:[number,number];sourceScores:Record<string,{dimensions:number[];hybrid:number;rolling:number;coverage:number;confidence:string}>;}
export interface Team {id:string;name:string;department:string;managerId:string;memberIds:string[];}
export interface Evidence {id:string;workItemId:string;personId:string;project:string;title:string;source:string;reference:string;period:string;factors:number[];share:number;quality:number;onTime:boolean;excluded:boolean;stewardship:number;collective:number;status:'Pending'|'Verified'|'Returned';critical:boolean;exceptionType?:string;exceptionSeverity?:'Minor'|'Major'|'Critical';attributionCause?:string|null;actor:string;}
export interface Entry {id:string;at:string;actor:string;action:string;target:string;detail:string;}
export interface Decision {personId:string;period:string;stage:'Reviewed'|'Calibrated'|'Approved';actor:string;reason:string;revision:number;score:number;}
export interface Appeal {id:string;personId:string;period:string;reason:string;grounds?:string;evidenceRef?:string;remedy?:string;openedAt?:string;status:'Open'|'Resolved';resolution?:string;outcome?:'Upheld'|'Partially upheld'|'Overturned';actor?:string;resolvedAt?:string;}
export interface DB {version:2;revision:number;connectors:ConnectorState[];people:Person[];teams:Team[];workItems:WorkItem[];sampling:SamplingCase[];periods:EvaluationPeriod[];evidence:Evidence[];ledger:Entry[];decisions:Decision[];appeals:Appeal[];standard:string;}
export const band=(s:number|null)=>s===null?'Not ratable':s<60?'Below standard':s<75?'Partially meets':s<90?'Meets standard':'Exceeds standard';
export const units=(f:number[])=>{const n=f.reduce((a,b)=>a+b,0);return n<=2?1:n<=5?2:n<=8?4:8;};
const avg=(n:number[])=>n.length?n.reduce((a,b)=>a+b,0)/n.length:0;
export function calculate(db:DB,p:Person,period:string){
 const all=db.evidence.filter(e=>e.personId===p.id&&e.period===period),verified=all.filter(e=>e.status==='Verified');
 const completed=verified.reduce((s,e)=>s+units(e.factors)*e.share/100,0),eligible=verified.filter(e=>!e.excluded);
 const imported=p.sourceScores[period];
 const calculatedValues=[Math.min(100,completed/p.expected*100),avg(verified.map(e=>e.quality)),eligible.length?avg(eligible.map(e=>e.onTime?100:0)):null,avg(verified.map(e=>e.stewardship)),avg(verified.map(e=>e.collective))];
 const values=imported?.dimensions||calculatedValues;
 const w=weights[p.primary].map((n,i)=>p.secondary?n*.7+weights[p.secondary][i]*.3:n);
 const current=imported?.hybrid??(verified.length&&values.every(v=>v!==null)?values.reduce<number>((s,v,i)=>s+v!*w[i]/100,0):null);
 const history=period==='2026-09'?[calculate(db,p,'2026-08').current,p.prior[0]]:p.prior;
 const score=imported?.rolling??(current===null||history.some(s=>s===null)?null:current*.5+history[0]!*.3+history[1]!*.2);
 const computedComponents=[Math.min(100,completed/p.expected*100),all.length?verified.length/all.length*100:0,Math.min(100,verified.length/3*100),Math.min(100,new Set(verified.map(e=>e.source)).size/3*100)];
 const components=imported?[imported.coverage,imported.coverage,Math.min(100,all.length/3*100),Math.min(100,new Set(all.map(e=>e.source)).size/3*100)]:computedComponents;
 const confidence=imported?.coverage??components.reduce((s,v,i)=>s+v*[.4,.3,.2,.1][i],0),state=imported?.confidence||(!verified.length?'Not ratable':confidence>=80?'High':confidence>=50?'Moderate':'Low');
 const critical=all.some(e=>e.critical),openAppeal=db.appeals.some(a=>a.personId===p.id&&a.period===period&&a.status==='Open');
 const decisions=db.decisions.filter(d=>d.personId===p.id&&d.period===period&&d.revision===db.revision),stage=decisions.at(-1)?.stage||'Draft';
 const hold=score===null||state==='Not ratable'?'Insufficient evidence':critical?'Critical exception':openAppeal?'Open appeal':state==='Low'?'Low confidence':null;
 return {score,current,history,values,w,confidence,state,components,completed,verified,all,stage,hold,decisions,exportable:stage==='Approved'&&!hold,band:band(score)};
}
export function seed():DB{
 const teamMap=new Map(mock.teams.map(t=>[t.id,t.name]));
 const archetype=(id:string)=>id.replace('arc_','').replace(/^./,x=>x.toUpperCase()) as Archetype;
 const people:Person[]=mock.people.map(p=>{const periods=p.scores.periods;const sourceScores=Object.fromEntries(periods.map(s=>[s.period,{dimensions:Object.values(s.dimensions),hybrid:s.hybridScore,rolling:s.period==='2026-08'?p.scores.rollingScore:s.hybridScore,coverage:s.evidenceCoveragePercent,confidence:s.confidence}]));return {id:p.id,name:p.fullName,title:p.jobFamily,team:teamMap.get(p.memberships[0]?.teamId)||'—',managerId:p.managerId??null,level:p.level,primary:archetype(p.primaryArchetype),secondary:p.secondaryArchetype?archetype(p.secondaryArchetype):undefined,expected:Math.max(8,Math.round(p.scores.periods.at(-1)!.evidenceCoveragePercent/7)),prior:[periods.find(x=>x.period==='2026-07')!.hybridScore,periods.find(x=>x.period==='2026-06')!.hybridScore],sourceScores}});
 const teams:Team[]=mock.teams.map(t=>({id:t.id,name:t.name,department:t.department,managerId:t.managerId,memberIds:t.memberIds}));
 const itemMap=new Map(mock.workItems.map(w=>[w.id,w]));
 const workItems:WorkItem[]=mock.workItems.map(w=>({id:w.id,team:teamMap.get(w.teamId)||w.teamId,workType:w.workType,archetype:archetype(w.archetype),complexity:{factors:Object.values(w.complexity.factors),total:w.complexity.total,band:w.complexity.band,workUnits:w.complexity.workUnits},roles:w.roleAssignments as Record<WorkRole,string|null>,exception:w.exception as WorkItem['exception'],attributionCause:w.attributionCause,events:normalizeEvents(w.events)}));
 const evidence:Evidence[]=mock.evidenceLedger.map(ev=>{const item=itemMap.get(ev.workItemId)!;const current=mock.people.find(p=>p.id===item.roleAssignments.executor)?.scores.periods.find(p=>p.period==='2026-08');const exception=item.exception;return {id:ev.id,workItemId:item.id,personId:item.roleAssignments.executor,project:teamMap.get(item.teamId)||item.teamId,title:item.workType,source:ev.sourceSystem,reference:ev.artifactReference,period:'2026-08',factors:Object.values(item.complexity.factors),share:item.roleAssignments.contributor===item.roleAssignments.executor?100:70,quality:current?.dimensions.quality||75,onTime:!exception||exception.type!=='Missed deadline',excluded:['External outage or unavailable dependency','Unrealistic deadline at assignment','Management-created overload'].includes(item.attributionCause||''),stewardship:current?.dimensions.stewardship||75,collective:current?.dimensions.collective||75,status:ev.verificationState==='Verified'?'Verified':ev.verificationState==='Rejected'?'Returned':'Pending',critical:exception?.severity==='Critical',exceptionType:exception?.type,exceptionSeverity:exception?.severity as Evidence['exceptionSeverity'],attributionCause:item.attributionCause,actor:item.roleAssignments.requester}});
 const sampling:SamplingCase[]=workItems.map((item,index)=>{const reasons:string[]=[];if(item.exception?.severity==='Critical'||item.complexity.band==='Exceptional')reasons.push('پیامد یا ریسک بالا');if(item.events.some(e=>e.eventType==='Returned'||e.eventType==='Reopened'))reasons.push('بازگشت یا بازگشایی تکرارشونده');if(item.exception?.type==='Duplicate or unnecessary work')reasons.push('احتمال خردکردن یا ثبت تکراری کار');if(item.events.some(e=>e.eventType==='Sample selected'))reasons.push('نمونه اعتبارسنجی منبع');if(index%10===0)reasons.push('نمونه تصادفی کنترل‌شده');return reasons.length?{id:`SMP-${String(index+1).padStart(3,'0')}`,workItemId:item.id,reasons,method:reasons.length===1&&reasons[0].startsWith('نمونه تصادفی')?'Random':'Risk-based',status:item.events.some(e=>e.eventType==='Sample reviewed')?'Reviewed':'Queued',reviewerId:item.roles.reviewer||undefined} as SamplingCase:null}).filter((x):x is SamplingCase=>x!==null);
 const appeals:Appeal[]=mock.workItems.filter(w=>w.attributionCause==='External outage or unavailable dependency').slice(0,2).map((w,i)=>({id:`AP-${101+i}`,personId:w.roleAssignments.executor,period:'2026-08',reason:'درخواست بررسی اثر اختلال بیرونی و حذف زمان خارج از کنترل از شاخص قابلیت اتکا.',grounds:'انتساب اشتباه علت',evidenceRef:w.evidenceIds?.[0],openedAt:mock.meta.generatedAt,status:'Open'}));
 return {version:2,revision:1,connectors:mockConnectorRegistry(mock.evidenceLedger,mock.meta.generatedAt),people,teams,workItems,sampling,periods:[{id:'2026-06',cadence:'Monthly',state:'Published',publishedAt:'2026-07-05T00:00:00Z'},{id:'2026-07',cadence:'Monthly',state:'Published',publishedAt:'2026-08-05T00:00:00Z'},{id:'2026-08',cadence:'Monthly',state:'Open'}],evidence,decisions:[],appeals,ledger:[{id:'AU-100',at:mock.meta.generatedAt,actor:'سامانه',action:'پایگاه داده نمایشی بارگذاری شد',target:'دوره ۲۰۲۶-۰۸',detail:`${people.length} نفر، ${mock.teams.length} واحد سازمانی، ${mock.workItems.length} قلم کار، ${workItems.flatMap(w=>w.events).length} رویداد و ${evidence.length} رکورد شواهد از فایل ارائه‌شده بارگذاری شد.`}],standard:'1.0'};
}
export const actors:Record<Role,string>={Employee:findEmployeeDemoId(),Manager:'manager-1',Reviewer:'reviewer-1',Calibrator:'calibrator-1',Governance:'governance-1',Payroll:'payroll-1','Model admin':'model-admin-1'};
function findEmployeeDemoId():string{const ic=mock.people.find(p=>!mock.people.some(other=>other.managerId===p.id));return ic?.id||mock.people[0].id;}
export const directReports=(db:DB,managerId:string):Person[]=>db.people.filter(p=>p.managerId===managerId);
export const allReports=(db:DB,managerId:string):Person[]=>directReports(db,managerId).flatMap(p=>[p,...allReports(db,p.id)]);
export const managerScope=(db:DB,managerId:string,recursive:boolean):Person[]=>{const manager=db.people.find(p=>p.id===managerId);const reports=recursive?allReports(db,managerId):directReports(db,managerId);return manager?[manager,...reports]:reports;};
export function advance(db:DB,id:string,period:string,role:Role,reason:string):DB{
 if(db.periods.find(p=>p.id===period)?.state!=='Open')throw Error('The evaluation period is locked.');
 const p=db.people.find(p=>p.id===id);if(!p||!reason.trim())throw Error('A reason is required.');
 const r=calculate(db,p,period);if(r.hold)throw Error(r.hold);
 const stage=r.stage==='Draft'?'Reviewed':r.stage==='Reviewed'?'Calibrated':r.stage==='Calibrated'?'Approved':null;
 const required=stage==='Reviewed'?'Reviewer':stage==='Calibrated'?'Calibrator':'Governance';
 if(!stage||role!==required)throw Error(`Switch to ${required} to continue.`);
 if(actors[role]===id||r.decisions.some(d=>d.actor===actors[role]))throw Error('Independent actors are required.');
 return {...db,decisions:[...db.decisions,{personId:id,period,stage,actor:actors[role],reason,revision:db.revision,score:r.score!}]};
}
