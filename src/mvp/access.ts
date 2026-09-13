import {actors,allReports,directReports,type DB,type Person,type Role} from './engine';
import {tr} from './fa';

export type AppContext={id:string;label:string;roleTitle:string;scope:string;engineRole:Role;readOnly?:boolean;managerId?:string;recursive?:boolean;personId?:string;nav:{id:string;label:string}[]};
const item=(id:string,label:string)=>({id,label});

const teamNav=[item('Home','خانه تیم'),item('Team outcomes','پیامدها و اهداف تیم'),item('People','اعضای تیم'),item('Project snapshot','صف نمای پروژه'),item('Attribution','تشخیص انتساب'),item('Evidence gaps','پوشش و شکاف شواهد'),item('System quality','کیفیت سیستم کاری'),item('Calibration','مرور شاهد و منطق پیش‌نویس'),item('Work capture','ثبت رویداد کار')];

// Manager contexts are built from the seeded organization so every team manager and every
// manager-of-managers (department head, executive) gets a scope of their own real reports.
function managerContexts(db:DB):AppContext[]{
 const managerIds=new Set(db.people.filter(p=>p.managerId).map(p=>p.managerId as string));
 return db.people.filter(p=>managerIds.has(p.id)).map(manager=>{
  const managesManagers=directReports(db,manager.id).some(r=>managerIds.has(r.id));
  const hasManager=managerIds.has(manager.managerId||'');
  const roleTitle=!hasManager?'مدیرعامل':managesManagers?'مدیر واحد (مدیر مدیران)':'مدیر تیم';
  const scope=!hasManager?'کل سازمان':managesManagers?`واحد ${tr(manager.team)}`:`تیم ${tr(manager.team)}`;
  return {id:`mgr-${manager.id}`,label:`مدیریت — ${scope}`,roleTitle,scope:`${scope} (${manager.name})`,engineRole:'Manager',managerId:manager.id,recursive:managesManagers,nav:teamNav};
 });
}

export function buildContexts(db:DB):AppContext[]{
 const self=db.people.find(p=>p.id===actors.Employee)||db.people[0];
 return [
  {id:'self',label:'شخصی — اثرگذاری من',roleTitle:'کارمند',scope:`پرونده شخصی ${self.name}`,engineRole:'Employee',personId:self.id,nav:[item('Home','خانه'),item('Expectations','انتظارات و اهداف'),item('Contributions','مشارکت‌ها و پیامدها'),item('Evidence','شواهد و بازخورد'),item('Appeals','اعتراض و پیگیری')]},
  ...managerContexts(db),
  {id:'model',label:'مدل عملکرد — سازمان',roleTitle:'مدیر مدل عملکرد',scope:'همه خانواده‌های شغلی',engineRole:'Model admin',nav:[item('Home','خانه مدل'),item('Job families','خانواده‌های شغلی'),item('Performance profiles','پروفایل‌های عملکرد'),item('Model & policy','وزن‌ها و سیاست')]},
  {id:'cycle',label:'دوره — مرداد ۱۴۰۵',roleTitle:'مدیر دوره',scope:'جمعیت واجد شرایط مرداد',engineRole:'Governance',nav:[item('Home','خانه دوره'),item('Data & controls','دوره‌های ارزیابی'),item('Calibration','آمادگی انتشار')]},
  {id:'data',label:'داده — درگاه‌های سازمان',roleTitle:'متولی داده',scope:'شش درگاه آزمایشی',engineRole:'Governance',nav:[item('Home','خانه داده'),item('Integrations','درگاه‌های داده'),item('Engine ledger','بازپخش و دفترکل'),item('Data & controls','رویدادهای استاندارد')]},
  {id:'calibration',label:'هم‌ترازی — گروه مقایسه',roleTitle:'عضو هم‌ترازی',scope:'گروه مقایسه تخصیص‌یافته',engineRole:'Calibrator',nav:[item('Home','خانه جلسه'),item('Calibration','جلسه هم‌ترازی')]},
  {id:'facilitator',label:'تسهیل‌گری — هم‌ترازی سازمان',roleTitle:'تسهیل‌گر هم‌ترازی',scope:'چرخه جلسات سازمان',engineRole:'Calibrator',nav:[item('Home','خانه تسهیل‌گری'),item('Calibration facilitator','مدیریت جلسات'),item('Calibration','صف تصمیم‌ها')]},
  {id:'quality',label:'بازبینی کیفیت — صف نمونه',roleTitle:'بازبین کیفیت',scope:'نمونه‌های تخصیص‌یافته',engineRole:'Reviewer',nav:[item('Home','خانه کیفیت'),item('Quality samples','صف نمونه‌های کیفیت'),item('Quality review','بازبینی شواهد')]},
  {id:'analyst',label:'تحلیل — سازمان',roleTitle:'تحلیلگر منابع انسانی',scope:'داده تجمیعی سازمان',engineRole:'Governance',readOnly:true,nav:[item('Home','خانه تحلیل'),item('People analytics','نمای تحلیلی')]},
  {id:'executive',label:'مدیریت ارشد — سازمان',roleTitle:'مدیر ارشد',scope:'شاخص‌های تجمیعی سازمان',engineRole:'Governance',readOnly:true,nav:[item('Home','نمای سازمان'),item('People analytics','روندها و ریسک‌ها')]},
  {id:'appeals',label:'رسیدگی — پرونده‌های من',roleTitle:'بازبین مستقل اعتراض',scope:'پرونده‌های تخصیص‌یافته',engineRole:'Governance',nav:[item('Home','خانه پرونده'),item('Governance cases','پرونده‌های تخصیص‌یافته'),item('Appeals','اعتراض‌ها')]},
  {id:'payroll',label:'حقوق — آماده ارسال',roleTitle:'تأییدکننده حقوق',scope:'خروجی‌های تأییدشده',engineRole:'Payroll',nav:[item('Home','خانه خروجی'),item('Payroll preview','پیش‌نمایش حقوق'),item('Performance pay','خروجی عملکرد')]},
  {id:'audit',label:'ممیزی — دامنه مصوب',roleTitle:'ممیز',scope:'ممیزی دوره مرداد',engineRole:'Governance',readOnly:true,nav:[item('Home','خانه ممیزی'),item('Audit trail','ردپای ممیزی'),item('Engine ledger','دفتر رویداد')]},
  {id:'admin',label:'سامانه — کاربران و دسترسی',roleTitle:'مدیر سامانه',scope:'تنظیمات فضای کاری',engineRole:'Model admin',nav:[item('Home','خانه سامانه'),item('Access management','کاربران و دسترسی‌ها'),item('Integrations','تنظیم درگاه‌ها')]},
 ];
}

// The scope a context can see: a manager's own reports (recursive for a manager of managers),
// the single demo employee for the personal context, or the whole organization for functional
// (quality, calibration, governance, payroll, model, analyst) contexts that are org-wide by design.
export function scopeFor(db:DB,context:AppContext):Person[]{
 if(context.managerId){const manager=db.people.find(p=>p.id===context.managerId);const reports=context.recursive?allReports(db,context.managerId):directReports(db,context.managerId);return manager?[manager,...reports]:reports;}
 if(context.id==='self')return db.people.filter(p=>p.id===context.personId);
 return db.people;
}
export const contextById=(contexts:AppContext[],id:string)=>contexts.find(c=>c.id===id)||contexts[0];
