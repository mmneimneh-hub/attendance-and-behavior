import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const functionSource=name=>{
  const asyncStart=html.indexOf(`async function ${name}(`);
  const start=asyncStart>=0?asyncStart:html.indexOf(`function ${name}(`);
  assert.notEqual(start,-1,`${name} must remain present in index.html`);
  const bodyStart=html.indexOf('{',start);
  let depth=0;
  for(let index=bodyStart;index<html.length;index+=1){
    if(html[index]==='{')depth+=1;
    if(html[index]==='}')depth-=1;
    if(depth===0)return html.slice(start,index+1);
  }
  throw new Error(`${name} is incomplete in index.html`);
};

const student={id:'s-test',name:'Persistence Test',classId:'',program:'international',enrollmentStatus:'withdrawn',withdrawnAt:'2026-09-03',classHistory:['international-4-a']};
const rosterOperation={
  type:'set',path:['academicYears','2026-2027','students',student.id],value:student
};

async function runPersist({operations=[rosterOperation],confirmedMatches=true}={}){
  const calls={rpc:0,readback:0,adopt:0,apply:0,verifiedOperations:[]};
  const confirmed={
    data:{academicYears:{'2026-2027':{students:{[student.id]:student}}}},
    updated_at:'2026-09-03T04:00:00.000Z',content_hash:'confirmed-hash'
  };
  const context={
    window:{neonClient:{rpc:async()=>{calls.rpc+=1;return{data:true,error:null};}}},
    user:{id:'staff-test'},behaviorStateLoaded:false,
    collectStateOperations:()=>operations,
    readAppSharedState:async includeBehavior=>{
      calls.readback+=1;assert.equal(includeBehavior,false);return confirmed;
    },
    stateOperationsMatch:(state,verifiedOperations)=>{
      calls.verifiedOperations=verifiedOperations;
      return confirmedMatches;
    },
    delayedSaveError:message=>Object.assign(new Error(message),{code:'SAVE_BUSY'}),
    adoptConfirmedState:(data,updatedAt)=>{
      calls.adopt+=1;context.lastConfirmedState=data;context.lastServerUpdatedAt=updatedAt;
    },
    applyStateOperations:()=>{calls.apply+=1;return{locallyApplied:true};},
    schoolStateContentHash:'old-hash',lastConfirmedState:{},lastServerUpdatedAt:'old-time',
    pendingStateSave:null
  };
  vm.runInNewContext(functionSource('persistState'),context);
  let error=null;
  try{await context.persistState({base:{},snapshot:{}});}catch(value){error=value;}
  return{calls,context,error};
}

const verified=await runPersist();
assert.equal(verified.error,null);
assert.equal(verified.calls.rpc,1);
assert.equal(verified.calls.readback,1,'student mutations must be read back from Neon');
assert.deepEqual(verified.calls.verifiedOperations,[rosterOperation],'student verification must exclude unrelated fields omitted from the attendance response');
assert.equal(verified.calls.adopt,1,'the confirmed server state must replace the speculative baseline');
assert.equal(verified.calls.apply,0);
assert.equal(verified.context.schoolStateContentHash,'confirmed-hash');
assert.equal(verified.context.lastServerUpdatedAt,'2026-09-03T04:00:00.000Z');
assert.equal(verified.context.lastConfirmedState.academicYears['2026-2027'].students['s-test'].program,'international');
assert.equal(verified.context.lastConfirmedState.academicYears['2026-2027'].students['s-test'].enrollmentStatus,'withdrawn');
assert.deepEqual(verified.context.lastConfirmedState.academicYears['2026-2027'].students['s-test'].classHistory,['international-4-a']);

const missing=await runPersist({confirmedMatches:false});
assert.equal(missing.error?.code,'SAVE_BUSY','an unconfirmed student must remain eligible for automatic retry');
assert.equal(missing.calls.adopt,0);

const settingsOperation={type:'set',path:['settings','schoolNameEn'],value:'Najd National Schools'};
const ordinary=await runPersist({operations:[settingsOperation]});
assert.equal(ordinary.error,null);
assert.equal(ordinary.calls.readback,0,'ordinary state saves must not add a full-state read');
assert.equal(ordinary.calls.apply,1);
assert.equal(ordinary.context.schoolStateContentHash,'');
assert.equal(ordinary.context.lastServerUpdatedAt,'');

const mixed=await runPersist({operations:[rosterOperation,settingsOperation]});
assert.equal(mixed.error,null,'an unrelated generic operation must not make a confirmed student edit appear to fail');
assert.deepEqual(mixed.calls.verifiedOperations,[rosterOperation]);

const behaviorPathContext={behaviorStateLoaded:false,sameStateValue:()=>false};
vm.runInNewContext(functionSource('ignoredGenericStatePath'),behaviorPathContext);
assert.equal(
  behaviorPathContext.ignoredGenericStatePath(['teachers']),
  true,
  'generic roster saves must not overwrite the separately managed staff subject directory'
);
assert.equal(
  behaviorPathContext.ignoredGenericStatePath(['academicYears','2026-2027','semesters','1','behavior']),
  true,
  'attendance-only saves must ignore the unloaded behavior root instead of writing an empty behavior object'
);
behaviorPathContext.behaviorStateLoaded=true;
assert.equal(
  behaviorPathContext.ignoredGenericStatePath(['academicYears','2026-2027','semesters','1','behavior']),
  false,
  'the behavior root remains available after the full behavior state is loaded'
);

assert.match(
  html,
  /Object\.entries\(db\.attendance\|\|\{\}\)\.forEach/,
  'student statistics must tolerate attendance details that have not been loaded'
);
const statsContext={
  window:{},db:{attendance:undefined},user:null,
  attendanceSummaryStudentStats:()=>null,
  attendanceCountValue:stats=>stats.present+stats.tardy+stats.early,
  attendanceStatsTotal:stats=>stats.present+stats.absent+stats.tardy+stats.early,
  attendanceRateValue:()=>null
};
vm.runInNewContext(functionSource('getStuStats'),statsContext);
assert.deepEqual(
  JSON.parse(JSON.stringify(statsContext.getStuStats('s-test'))),
  {
    present:0,absent:0,excusedAbsence:0,unexcusedAbsence:0,tardy:0,early:0,
    attended:0,recordedDays:0,attendanceRate:null,
    absentDates:[],excusedAbsenceDates:[],unexcusedAbsenceDates:[]
  },
  'the student list must render before attendance detail data is loaded'
);

console.log('Student persistence verification checks passed.');
