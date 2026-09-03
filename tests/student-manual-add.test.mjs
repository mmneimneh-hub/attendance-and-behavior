import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const functionSource=(name)=>{
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

async function runManualAdd({activeProgram='national',requestedProgram='international',placement='international-4-a',existingStudent=null,flushError=null,changeProgramError=null}={}){
  const fields={
    eStuId:{value:existingStudent?.id||''},eStuName:{value:'Manual Test Student'},eStuCls:{value:placement},
    eStuProgram:{value:requestedProgram},eStuSid:{value:'TEST-001'},eStuPar:{value:''},
    eStuPhone:{value:''},eStuEmail:{value:''}
  };
  const calls={save:0,flush:0,changeProgram:0,refresh:0,close:0,toast:[]};
  const db={activeProgram,students:existingStudent?{[existingStudent.id]:existingStudent}:{},classes:{
    'international-4-a':{id:'international-4-a',program:'international',gradeLevel:'4'}
  }};
  const context={
    db,LANG:'en',document:{getElementById:id=>fields[id]},
    hasPermission:()=>true,allowedPrograms:()=>['national','international'],allowedGrades:()=>['4'],
    normalizeClassScope:value=>value,classGrade:value=>value.gradeLevel,
    studentClassHistory:student=>[...(student?.classHistory||[])],
    studentCurrentGrade:student=>student?.gradeLevel||'',
    studentEnrollmentStatus:student=>student?.classId?'active':(['withdrawn','left_school'].includes(student?.enrollmentStatus)?'withdrawn':'no_class'),
    today:()=> '2026-09-02',rnd:()=> 'manual-test',
    save:()=>{calls.save+=1;},
    flushStateSave:async options=>{
      calls.flush+=1;assert.equal(options?.throwOnError,true);
      if(flushError)throw flushError;
    },
    changeProgram:async program=>{
      calls.changeProgram+=1;
      if(changeProgramError)throw changeProgramError;
      db.activeProgram=program;
    },
    rememberAcademicContext:()=>{},
    refreshAcademicViews:()=>{calls.refresh+=1;},closeM:()=>{calls.close+=1;},
    toast:message=>{calls.toast.push(message);},t:key=>key==='saved'?'Saved':key,
    console:{error:()=>{},warn:()=>{}}
  };
  vm.runInNewContext(functionSource('saveStu'),context);
  await context.saveStu();
  return{db,fields,calls};
}

const crossProgram=await runManualAdd();
const created=crossProgram.db.students['smanual-test'];
assert.ok(created,'manual student must be added to the active academic roster');
assert.equal(created.classId,'international-4-a');
assert.equal(created.program,'international');
assert.equal(created.enrollmentStatus,'active');
assert.equal(crossProgram.fields.eStuId.value,created.id,'retry must reuse the same student id');
assert.equal(crossProgram.calls.save,1);
assert.equal(crossProgram.calls.flush,1,'success must wait for confirmed persistence');
assert.equal(crossProgram.calls.changeProgram,1,'the roster must switch to the selected program');
assert.equal(crossProgram.db.activeProgram,'international');
assert.equal(crossProgram.calls.close,1);
assert.deepEqual(crossProgram.calls.toast,['Saved']);

const noClass=await runManualAdd({requestedProgram:'international',placement:'__no_class__'});
assert.equal(noClass.db.students['smanual-test'].program,'international','a student without a class must retain the selected program');
assert.equal(noClass.db.students['smanual-test'].classId,'');
assert.equal(noClass.db.students['smanual-test'].enrollmentStatus,'no_class');
assert.equal(noClass.db.students['smanual-test'].withdrawnAt,null);

const previouslyActive={id:'s-existing',name:'Existing Student',classId:'international-4-a',program:'international',gradeLevel:'4',enrollmentStatus:'active',classHistory:['international-3-a']};
const withdrawn=await runManualAdd({activeProgram:'international',requestedProgram:'international',placement:'__withdrawn__',existingStudent:previouslyActive});
const withdrawnStudent=withdrawn.db.students['s-existing'];
assert.equal(withdrawnStudent.classId,'');
assert.equal(withdrawnStudent.enrollmentStatus,'withdrawn');
assert.equal(withdrawnStudent.withdrawnAt,'2026-09-02');
assert.equal(withdrawnStudent.leftSchoolAt,'2026-09-02');
assert.deepEqual(JSON.parse(JSON.stringify(withdrawnStudent.classHistory)),['international-3-a','international-4-a'],'withdrawing must preserve all previous class placements');

const sameProgram=await runManualAdd({activeProgram:'international'});
assert.equal(sameProgram.calls.changeProgram,0);
assert.equal(sameProgram.calls.refresh,1,'the current roster must refresh after saving');

const failed=await runManualAdd({flushError:new Error('offline')});
assert.equal(failed.calls.changeProgram,0);
assert.equal(failed.calls.refresh,0);
assert.equal(failed.calls.close,0,'the editor must remain open when persistence is unconfirmed');
assert.match(failed.calls.toast[0],/Could not save/);

const refreshFailed=await runManualAdd({changeProgramError:new Error('summary unavailable')});
assert.equal(refreshFailed.db.activeProgram,'international');
assert.equal(refreshFailed.calls.refresh,1,'a secondary refresh failure must fall back to the selected roster');
assert.equal(refreshFailed.calls.close,1,'a confirmed save must still close the editor');
assert.deepEqual(refreshFailed.calls.toast,['Saved']);

const editFields={
  eStuId:{value:''},eStuName:{value:''},eStuSid:{value:''},eStuPar:{value:''},
  eStuPhone:{value:''},eStuEmail:{value:''}
};
const editCalls=[];
const editContext={
  db:{students:{s1:{id:'s1',name:'Existing Student',schoolId:'1001',classId:'',program:'international',enrollmentStatus:'no_class'}}},
  document:{getElementById:id=>editFields[id]},
  studentCurrentProgram:student=>student.program,
  studentEnrollmentStatus:student=>student.enrollmentStatus,
  syncStudentClassOptions:(selectedClass,selectedProgram)=>editCalls.push({selectedClass,selectedProgram}),
  openM:(id,preserve)=>editCalls.push({id,preserve})
};
vm.runInNewContext(functionSource('editStu'),editContext);
editContext.editStu('s1');
assert.deepEqual(editCalls[0],{selectedClass:'__no_class__',selectedProgram:'international'},'editing must restore the saved student program explicitly');
assert.deepEqual(editCalls[1],{id:'mStu',preserve:true});

editCalls.length=0;
editContext.db.students.s1.enrollmentStatus='withdrawn';
editContext.editStu('s1');
assert.deepEqual(editCalls[0],{selectedClass:'__withdrawn__',selectedProgram:'international'},'editing must restore the withdrawn status');

const statusContext={};
vm.runInNewContext(functionSource('studentEnrollmentStatus'),statusContext);
assert.equal(statusContext.studentEnrollmentStatus({classId:'international-4-a',enrollmentStatus:'withdrawn'}),'active');
assert.equal(statusContext.studentEnrollmentStatus({classId:'',enrollmentStatus:'left_school'}),'withdrawn','legacy left-school records must remain withdrawn');
assert.equal(statusContext.studentEnrollmentStatus({classId:'',enrollmentStatus:'no_class'}),'no_class');

console.log('Manual student roster regression checks passed.');
