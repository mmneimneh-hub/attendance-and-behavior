import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const functionSource=(name)=>{
  const start=html.indexOf(`function ${name}(`);
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
const context={};
vm.runInNewContext([
  functionSource('attendanceCountValue'),
  functionSource('attendanceStatsTotal'),
  functionSource('attendanceRateValue')
].join('\n'),context);

const liveDailySummaries=[
  [{present:72,excusedAbsence:8,unexcusedAbsence:1,tardy:1,early:0},82,89],
  [{present:108,excusedAbsence:5,unexcusedAbsence:1,tardy:0,early:0},114,95],
  [{present:155,excusedAbsence:7,unexcusedAbsence:0,tardy:0,early:1},163,96],
  [{present:24,excusedAbsence:6,unexcusedAbsence:0,tardy:0,early:0},30,80],
  [{present:104,excusedAbsence:2,unexcusedAbsence:0,tardy:12,early:0},118,98]
];
liveDailySummaries.forEach(([summary,total,rate])=>{
  assert.equal(context.attendanceStatsTotal(summary),total);
  assert.equal(context.attendanceRateValue(summary),rate);
});

const aggregateAndBreakdown={present:24,absent:6,excusedAbsence:6,unexcusedAbsence:0,tardy:0,early:0};
assert.equal(context.attendanceStatsTotal(aggregateAndBreakdown),30,'absence breakdown must not be double counted');
assert.equal(context.attendanceRateValue(aggregateAndBreakdown),80);

assert.equal(context.attendanceRateValue({present:8,absent:2,tardy:0,early:0}),80);
assert.equal(context.attendanceRateValue({present:73,absent:0,tardy:0,early:0}),100);
assert.equal(context.attendanceRateValue({}),null);

console.log('Attendance rate regression checks passed.');
