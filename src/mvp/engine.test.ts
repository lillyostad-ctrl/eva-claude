import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advance,allReports,band,calculate,directReports,seed,units,weights} from './engine.ts';
import {buildContexts} from './access.ts';

test('published archetype weights match the product model',()=>{
 assert.equal(Object.keys(weights).length,6);
 for(const row of Object.values(weights))assert.equal(row.reduce((a,b)=>a+b,0),100);
 assert.deepEqual(weights.Knowledge,[15,40,15,10,20]);
});

test('mock adapters populate the one live canonical database',()=>{
 const db=seed();
 assert.equal(db.version,2);assert.equal(db.people.length,50);assert.equal(db.connectors.length,5);
 assert.ok(db.workItems.length>50);assert.ok(db.evidence.length>50);
 assert.ok(db.workItems.flatMap(w=>w.events).length>300);
 for(const event of db.workItems.flatMap(w=>w.events)){assert.match(event.occurredAt,/Z$/);assert.ok(event.actorId);assert.ok(event.responsibilityRole)}
});

test('the organization forms a four-level management hierarchy',()=>{
 const db=seed(),ceo=db.people.find(p=>!p.managerId)!;
 assert.ok(ceo);
 const deptHeads=directReports(db,ceo.id);
 assert.ok(deptHeads.length>=3);
 for(const head of deptHeads)assert.ok(directReports(db,head.id).length>0,'department heads manage team managers');
 const allOrgMembers=allReports(db,ceo.id);
 assert.equal(allOrgMembers.length,db.people.length-1,'the executive recursively reports over everyone else');
});

test('every work item has a complete seven-role responsibility graph',()=>{
 const db=seed(),roles=['requester','planner','assigner','decision_owner','executor','contributor','reviewer'];
 for(const item of db.workItems)for(const role of roles)assert.ok(Object.hasOwn(item.roles,role));
});

test('risk, validation and random rules create review samples',()=>{
 const db=seed();assert.ok(db.sampling.length>0);assert.ok(db.sampling.some(s=>s.reasons.some(r=>r.includes('ریسک')||r.includes('پیامد'))));assert.ok(db.sampling.some(s=>s.reasons.some(r=>r.includes('تصادفی'))));
});

test('typed exceptions and attribution are preserved from the source',()=>{
 const db=seed(),exceptions=db.workItems.filter(w=>w.exception);assert.ok(exceptions.length>0);assert.ok(exceptions.some(w=>w.exception?.severity==='Critical'));assert.ok(exceptions.some(w=>w.attributionCause));
 assert.ok(db.evidence.some(e=>e.exceptionType&&e.exceptionSeverity));
});

test('imported period profiles drive visible score and dimensions',()=>{
 const db=seed(),person=db.people[0],source=person.sourceScores['2026-08'],result=calculate(db,person,'2026-08');
 assert.equal(result.current,source.hybrid);assert.equal(result.score,source.rolling);assert.deepEqual(result.values,source.dimensions);assert.equal(result.confidence,source.coverage);
});

test('locked or published periods reject workflow decisions',()=>{
 const db=seed(),person=db.people.find(p=>!calculate(db,p,'2026-07').hold)!;
 assert.throws(()=>advance(db,person.id,'2026-07','Reviewer','شواهد مستقل بازبینی شد'),/locked/);
});

test('open periods enforce ordered independent approvals',()=>{
 let db=seed();const person=db.people.find(p=>!calculate(db,p,'2026-08').hold)!;
 assert.throws(()=>advance(db,person.id,'2026-08','Governance','تأیید مستقیم'),/Reviewer/);
 db=advance(db,person.id,'2026-08','Reviewer','منابع مستقل بازبینی شدند');db=advance(db,person.id,'2026-08','Calibrator','هم‌ترازی زمینه انجام شد');db=advance(db,person.id,'2026-08','Governance','کنترل‌ها تکمیل شدند');
 assert.equal(calculate(db,person,'2026-08').exportable,true);
});

test('band and complexity boundaries remain continuous',()=>{
 assert.equal(band(74.9),'Partially meets');assert.equal(band(90),'Exceeds standard');assert.equal(band(null),'Not ratable');assert.deepEqual([0,2,3,5,6,8,9,12].map(n=>units([n])),[1,1,2,2,4,4,8,8]);
});

test('every capability menu destination has a live page implementation',()=>{
 const implemented=new Set(['Home','Expectations','Contributions','Responsibilities','Evidence package','Work capture','Team outcomes','Evidence gaps','System quality','Project snapshot','Attribution','Job families','Performance profiles','Integrations','Engine ledger','Calibration facilitator','Quality samples','Governance cases','Payroll preview','Access management','People','My impact','Calibration','Performance pay','Evidence','Quality review','Projects','Appeals','Model & policy','Data & controls','People analytics','Audit trail']);
 const contexts=buildContexts(seed());
 assert.ok(contexts.length>10,'every team manager and manager-of-managers gets a scoped context');
 for(const context of contexts)for(const entry of context.nav)assert.ok(implemented.has(entry.id),`${context.id}: ${entry.id}`);
});
