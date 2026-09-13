import type {CanonicalEvent,EventCategory,WorkRole} from './engine';

export interface ConnectorState{id:string;name:string;mode:'Mock';status:'Healthy'|'Warning';records:number;lastSync:string;purpose:string;}
type SourceEvent={id:string;eventType:string;category:string;occurredAt:string;actorId:string;responsibilityRole:string;workItemId:string};

// Mock and production adapters share this normalization boundary.
export function normalizeEvents(events:SourceEvent[]):CanonicalEvent[]{
 return events.map(event=>({id:event.id,eventType:event.eventType.trim(),category:event.category as EventCategory,occurredAt:new Date(event.occurredAt).toISOString(),actorId:event.actorId,responsibilityRole:event.responsibilityRole as WorkRole,workItemId:event.workItemId}));
}

export function mockConnectorRegistry(evidence:{sourceSystem:string}[],generatedAt:string):ConnectorState[]{
 const definitions=[['HRIS','سامانه منابع انسانی','زمینه شغلی، سطح و عضویت تیم'],['Task manager','سامانه مدیریت کار','واگذاری، وضعیت و تحویل کار'],['ERP/domain system','سامانه عملیاتی','نتیجه و تراکنش دامنه'],['DMS','سامانه اسناد','سند و نسخه قابل راستی‌آزمایی'],['Payroll','سامانه حقوق','خروجی پس از تأیید نهایی']] as const;
 return definitions.map(([id,name,purpose])=>({id,name,mode:'Mock',status:'Healthy',records:evidence.filter(e=>e.sourceSystem===id).length,lastSync:generatedAt,purpose}));
}
