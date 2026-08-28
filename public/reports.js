const REPORT_CONFIGS={
  rCls:{outputId:'clsRptOut',slug:'class-report',titleAr:'تقرير الفصل',titleEn:'Class Report',render:renderClsRpt},
  rStu:{outputId:'stuRptOut',slug:'student-report',titleAr:'تقرير الطالب',titleEn:'Student Report',render:renderStuRpt},
  rDay:{outputId:'dayRptOut',slug:'daily-report',titleAr:'التقرير اليومي',titleEn:'Daily Report',render:renderDayRpt},
  rPer:{outputId:'perRptOut',slug:'date-range-report',titleAr:'تقرير النطاق الزمني',titleEn:'Date Range Report',render:renderPerRpt},
  rTop:{outputId:'topRptOut',slug:'top-absent-report',titleAr:'الأكثر غياباً',titleEn:'Most Absent',render:renderTopRpt}
};

function selectedReportAcademicPeriod(){
  const yearSelect=document.getElementById('reportAcademicYear');
  const semesterSelect=document.getElementById('reportSemester');
  const academicYear=yearSelect&&db.academicYears?.[yearSelect.value]?yearSelect.value:db.activeAcademicYear;
  const semester=['1','2','both'].includes(semesterSelect?.value)?semesterSelect.value:String(db.activeSemester||'1');
  return{academicYear,semester,semesters:semester==='both'?['1','2']:[semester]};
}

function reportSemesterLabel(period=selectedReportAcademicPeriod()){
  if(period.semester==='both')return LANG==='ar'?'الفصلان الأول والثاني':'Semesters 1 & 2';
  return LANG==='ar'?`الفصل ${period.semester==='1'?'الأول':'الثاني'}`:`Semester ${period.semester}`;
}

async function ensureSelectedAttendanceReportPeriod(){
  const period=selectedReportAcademicPeriod();
  if(window.ensureAttendancePeriodLoaded)await Promise.all(period.semesters.map(semester=>window.ensureAttendancePeriodLoaded(period.academicYear,semester)));
  return period;
}

function mergeReportAttendance(period){
  const merged={};const priority={present:1,tardy:2,early:3,absent:4};
  const year=db.academicYears?.[period.academicYear];
  period.semesters.forEach(semester=>{
    const attendance=year?.semesters?.[semester]?.attendance||{};
    Object.entries(attendance).forEach(([classId,byDate])=>{
      const targetClass=merged[classId]||(merged[classId]={});
      Object.entries(byDate||{}).forEach(([date,byStudent])=>{
        const targetDay=targetClass[date]||(targetClass[date]={});
        Object.entries(byStudent||{}).forEach(([studentId,record])=>{
          const previous=targetDay[studentId];
          if(!previous||(priority[record?.status]||0)>=(priority[previous?.status]||0))targetDay[studentId]=copyData(record);
        });
      });
    });
  });
  return merged;
}

window.withAttendanceReportContext=function(callback){
  if(window.__attendanceReportContext)return callback(window.__attendanceReportContext);
  syncActiveAcademicData();
  const period=selectedReportAcademicPeriod();
  const year=db.academicYears?.[period.academicYear]||{classes:{},students:{}};
  const saved={classes:db.classes,students:db.students,attendance:db.attendance,activeAcademicYear:db.activeAcademicYear,activeSemester:db.activeSemester};
  db.classes=copyData(year.classes||{});db.students=copyData(year.students||{});db.attendance=mergeReportAttendance(period);
  db.activeAcademicYear=period.academicYear;db.activeSemester=period.semester;window.__attendanceReportContext=period;
  try{return callback(period);}finally{
    db.classes=saved.classes;db.students=saved.students;db.attendance=saved.attendance;db.activeAcademicYear=saved.activeAcademicYear;db.activeSemester=saved.activeSemester;delete window.__attendanceReportContext;
  }
};

window.refreshActiveAttendanceReport=async function(){
  if(!document.getElementById('page-reports')?.classList.contains('active'))return;
  try{await ensureSelectedAttendanceReportPeriod();const config=activeReportConfig();config.render();}
  catch(error){console.error('Attendance report refresh failed',error);toast(LANG==='ar'?'❌ تعذر تحميل بيانات التقرير':'❌ Could not load report data');}
};

window.refreshAttendanceReportFilters=async function(options={}){
  if(!db?.academicYears)return;
  syncActiveAcademicData();
  const yearSelect=document.getElementById('reportAcademicYear');const semesterSelect=document.getElementById('reportSemester');
  if(!yearSelect||!semesterSelect)return;
  const previousYear=yearSelect.value;const years=Object.keys(db.academicYears).sort().reverse();
  const selectedYear=years.includes(previousYear)?previousYear:(years.includes(db.activeAcademicYear)?db.activeAcademicYear:years[0]);
  yearSelect.innerHTML=years.map(year=>`<option value="${escapeReportHtml(year)}" ${year===selectedYear?'selected':''}>${escapeReportHtml(year)}</option>`).join('');
  const previousSemester=semesterSelect.value;const selectedSemester=['1','2','both'].includes(previousSemester)?previousSemester:String(db.activeSemester||'1');
  semesterSelect.innerHTML=`<option value="both" ${selectedSemester==='both'?'selected':''}>${LANG==='ar'?'الفصلان الأول والثاني':'Both Semesters'}</option><option value="1" ${selectedSemester==='1'?'selected':''}>${LANG==='ar'?'الفصل الأول':'Semester 1'}</option><option value="2" ${selectedSemester==='2'?'selected':''}>${LANG==='ar'?'الفصل الثاني':'Semester 2'}</option>`;
  try{await ensureSelectedAttendanceReportPeriod();}
  catch(error){console.error('Attendance report period load failed',error);toast(LANG==='ar'?'❌ تعذر تحميل بيانات الفترة المحددة':'❌ Could not load the selected period');return;}
  window.withAttendanceReportContext(()=>{
    const classes=visibleClasses().sort((a,b)=>className(a).localeCompare(className(b),LANG==='ar'?'ar':'en'));
    const label=cls=>`${className(cls)} · ${programLabel(cls.program)} · ${LANG==='ar'?'صف':'Grade'} ${classGrade(cls)}`;
    [['rClsS',true],['rPerCls',true],['rStuCls',false]].forEach(([id,all])=>{
      const element=document.getElementById(id);if(!element)return;const previous=element.value;
      element.innerHTML=`<option value="">${all?(LANG==='ar'?'كل الفصول':'All Classes'):(LANG==='ar'?'اختر الفصل':'Select Class')}</option>`+classes.map(cls=>`<option value="${escapeReportHtml(cls.id)}">${escapeReportHtml(label(cls))}</option>`).join('');
      if(classes.some(cls=>cls.id===previous))element.value=previous;
    });
    fillRptStuList();
  });
  if(options.render!==false)window.refreshActiveAttendanceReport();
};

function activeReportConfig(){
  const id=document.querySelector('#page-reports .tp.active')?.id||'rCls';
  const config=REPORT_CONFIGS[id]||REPORT_CONFIGS.rCls;
  return{...config,id,title:LANG==='ar'?config.titleAr:config.titleEn};
}

function reportFiltersAreValid(config){
  if(config.id==='rStu'&&!document.getElementById('rStuS').value){
    toast(LANG==='ar'?'⚠️ اختر طالباً أولاً':'⚠️ Select a student first');return false;
  }
  if(config.id==='rDay'&&!document.getElementById('rDayD').value){
    toast(LANG==='ar'?'⚠️ اختر تاريخاً أولاً':'⚠️ Select a date first');return false;
  }
  if(config.id==='rPer'){
    const from=document.getElementById('rFrom').value;const to=document.getElementById('rTo').value;
    if(!from||!to){toast(LANG==='ar'?'⚠️ اختر تاريخ البداية والنهاية':'⚠️ Select both start and end dates');return false;}
    if(from>to){toast(LANG==='ar'?'⚠️ تاريخ البداية يجب أن يسبق تاريخ النهاية':'⚠️ Start date must be before end date');return false;}
  }
  return true;
}

function reportRate(stats){
  return attendanceRateValue(stats);
}

function reportRateText(stats){
  const rate=reportRate(stats);
  return rate===null?'—':`${rate}%`;
}

function reportRating(stats){
  if(reportRate(stats)===null)return LANG==='ar'?'لا توجد بيانات':'No data';
  if(stats.absent===0&&stats.tardy===0&&stats.early===0)return t('regular');
  return stats.absent<=2?t('warning'):t('critical');
}

function classDailyReportStats(cls,date){
  const students=visibleStudents().filter(student=>student.classId===cls.id);
  const daily=db.attendance?.[cls.id]?.[date]||{};
  const stats={present:0,absent:0,excusedAbsence:0,unexcusedAbsence:0,tardy:0,early:0};
  students.forEach(student=>{
    const record=daily[student.id];if(!record)return;
    if(record.status==='absent'){
      stats.absent++;
      if(normalizedAbsenceType(record)==='unexcused')stats.unexcusedAbsence++;else stats.excusedAbsence++;
    }else if(record.status==='tardy')stats.tardy++;
    else if(record.status==='early')stats.early++;
    else stats.present++;
  });
  return{...stats,studentCount:students.length,recordedDays:attendanceStatsTotal(stats),attendanceRate:attendanceRateValue(stats)};
}

function reportMonthLabel(month,year){
  const all=LANG==='ar'?'كل الأشهر':'All Months';
  if(!month)return year?`${all} - ${year}`:all;
  const name=new Date(2000,Number(month)-1,1).toLocaleString(LANG==='ar'?'ar-SA':'en-US',{month:'long'});
  return year?`${name} ${year}`:name;
}

function reportContextRows(extra=[]){
  const period=window.__attendanceReportContext||selectedReportAcademicPeriod();
  return[
    [localizedSchoolName()],
    [LANG==='ar'?'السنة الدراسية':'Academic Year',period.academicYear],
    [LANG==='ar'?'الفصل الدراسي':'Semester',reportSemesterLabel(period)],
    [LANG==='ar'?'البرنامج':'Program',programLabel(db.activeProgram)],
    ...extra,
    [LANG==='ar'?'تاريخ التصدير':'Generated',new Date().toLocaleString(LANG==='ar'?'ar-SA':'en-GB')],
    []
  ];
}

function reportStudentHeader(includeRating=false){
  const row=[LANG==='ar'?'الطالب':'Student',LANG==='ar'?'الرقم المدرسي':'School ID',t('present'),t('excusedAbsence'),t('unexcusedAbsence'),t('tardy'),t('earlyLeave'),LANG==='ar'?'نسبة الحضور':'Attendance Rate'];
  if(includeRating)row.push(LANG==='ar'?'التقييم':'Rating');
  return row;
}

function appendStudentStats(rows,classes,from,to,month,year,includeRating=false){
  const students=visibleStudents();
  classes.forEach(cls=>{
    const classStudents=students.filter(student=>student.classId===cls.id);
    if(!classStudents.length)return;
    rows.push([className(cls)]);rows.push(reportStudentHeader(includeRating));
    classStudents.forEach(student=>{
      const stats=getStuStats(student.id,from||null,to||null,month||null,year||null);
      const row=[student.name,student.schoolId||'',stats.present,stats.excusedAbsence,stats.unexcusedAbsence,stats.tardy,stats.early,reportRateText(stats)];
      if(includeRating)row.push(reportRating(stats));
      rows.push(row);
    });
    rows.push([]);
  });
}

function classReportRows(){
  const classId=document.getElementById('rClsS').value;
  const month=document.getElementById('rMonS').value;
  const classes=classId?[db.classes[classId]].filter(Boolean):visibleClasses();
  const rows=reportContextRows([
    [LANG==='ar'?'الفترة':'Period',reportMonthLabel(month)],
    [LANG==='ar'?'الفصل':'Class',classId&&db.classes[classId]?className(db.classes[classId]):(LANG==='ar'?'كل الفصول':'All Classes')]
  ]);
  appendStudentStats(rows,classes,null,null,month,null,true);return rows;
}

function studentReportRows(){
  const student=db.students[document.getElementById('rStuS').value];if(!student)return[];
  const month=document.getElementById('rStuMon').value;
  const cls=db.classes[student.classId];const stats=getStuStats(student.id,null,null,month||null,null);
  const rows=reportContextRows([[LANG==='ar'?'الفترة':'Period',reportMonthLabel(month)]]);
  rows.push(
    [LANG==='ar'?'الطالب':'Student',student.name],
    [LANG==='ar'?'الرقم المدرسي':'School ID',student.schoolId||''],
    [LANG==='ar'?'الفصل':'Class',cls?className(cls):student.classId],
    [LANG==='ar'?'ولي الأمر':'Guardian',student.parent||''],
    [LANG==='ar'?'هاتف ولي الأمر':'Guardian Phone',student.parentPhone||''],
    [LANG==='ar'?'بريد ولي الأمر':'Guardian Email',student.parentEmail||''],[],
    [t('present'),t('excusedAbsence'),t('unexcusedAbsence'),t('tardy'),t('earlyLeave'),LANG==='ar'?'نسبة الحضور':'Attendance Rate',LANG==='ar'?'التقييم':'Rating'],
    [stats.present,stats.excusedAbsence,stats.unexcusedAbsence,stats.tardy,stats.early,reportRateText(stats),reportRating(stats)],[],
    [t('excusedAbsence'),LANG==='ar'?'التاريخ':'Date']
  );
  if(stats.excusedAbsenceDates.length)stats.excusedAbsenceDates.forEach(date=>rows.push(['',date]));else rows.push(['','—']);
  rows.push([], [t('unexcusedAbsence'),LANG==='ar'?'التاريخ':'Date']);
  if(stats.unexcusedAbsenceDates.length)stats.unexcusedAbsenceDates.forEach(date=>rows.push(['',date]));else rows.push(['','—']);
  return rows;
}

function dailyReportRows(){
  const date=document.getElementById('rDayD').value;
  const rows=reportContextRows([[LANG==='ar'?'التاريخ':'Date',date]]);
  rows.push([LANG==='ar'?'الفصل':'Class',LANG==='ar'?'الطلاب':'Students',t('present'),t('excusedAbsence'),t('unexcusedAbsence'),t('tardy'),t('earlyLeave'),LANG==='ar'?'نسبة الحضور':'Attendance Rate']);
  visibleClasses().forEach(cls=>{
    const stats=classDailyReportStats(cls,date);
    rows.push([className(cls),stats.studentCount,stats.present,stats.excusedAbsence,stats.unexcusedAbsence,stats.tardy,stats.early,reportRateText(stats)]);
  });
  return rows;
}

function rangeReportRows(){
  const from=document.getElementById('rFrom').value;const to=document.getElementById('rTo').value;const classId=document.getElementById('rPerCls').value;
  const classes=classId?[db.classes[classId]].filter(Boolean):visibleClasses();
  const rows=reportContextRows([
    [LANG==='ar'?'من':'From',from],[LANG==='ar'?'إلى':'To',to],
    [LANG==='ar'?'الفصل':'Class',classId&&db.classes[classId]?className(db.classes[classId]):(LANG==='ar'?'كل الفصول':'All Classes')]
  ]);
  appendStudentStats(rows,classes,from,to);return rows;
}

function topAbsentReportRows(){
  const month=document.getElementById('rTopMon').value;
  const rows=reportContextRows([[LANG==='ar'?'الفترة':'Period',reportMonthLabel(month)]]);
  rows.push(['#',LANG==='ar'?'الطالب':'Student',LANG==='ar'?'الرقم المدرسي':'School ID',LANG==='ar'?'الفصل':'Class',t('excusedAbsence'),t('unexcusedAbsence'),t('tardy'),t('earlyLeave'),LANG==='ar'?'التقييم':'Rating']);
  visibleStudents()
    .map(student=>({student,stats:getStuStats(student.id,null,null,month||null,null),cls:db.classes[student.classId]}))
    .filter(item=>item.stats.absent>0||item.stats.tardy>0||item.stats.early>0)
    .sort((a,b)=>b.stats.absent-a.stats.absent||b.stats.tardy-a.stats.tardy||b.stats.early-a.stats.early)
    .forEach((item,index)=>rows.push([index+1,item.student.name,item.student.schoolId||'',item.cls?className(item.cls):item.student.classId,item.stats.excusedAbsence,item.stats.unexcusedAbsence,item.stats.tardy,item.stats.early,reportRating(item.stats)]));
  return rows;
}

function buildActiveReportPayload(config=activeReportConfig()){
  const builders={rCls:classReportRows,rStu:studentReportRows,rDay:dailyReportRows,rPer:rangeReportRows,rTop:topAbsentReportRows};
  return{...config,rows:builders[config.id]()};
}

function prepareActiveReport(){
  if(!hasPermission('reports'))return null;
  const config=activeReportConfig();if(!reportFiltersAreValid(config))return null;
  return window.withAttendanceReportContext(period=>{config.render();return{...buildActiveReportPayload(config),period};});
}

async function exportActiveReport(button){
  try{await ensureSelectedAttendanceReportPeriod();}
  catch(error){console.error('Attendance export data load failed',error);toast(LANG==='ar'?'❌ تعذر تحميل بيانات التقرير':'❌ Could not load report data');return;}
  const report=prepareActiveReport();if(!report)return;
  const original=button.innerHTML;button.disabled=true;button.innerHTML=LANG==='ar'?'⏳ جارٍ التصدير...':'⏳ Exporting...';
  try{
    const XLSX=await ensureXlsxLibrary();const workbook=XLSX.utils.book_new();
    const allRows=[[report.title],...report.rows];const sheet=XLSX.utils.aoa_to_sheet(allRows);
    const columnCount=Math.max(1,...allRows.map(row=>row.length));
    sheet['!cols']=Array.from({length:columnCount},(_,index)=>({wch:Math.min(45,Math.max(12,...allRows.map(row=>String(row[index]??'').length+2)))}));
    workbook.Props={Title:report.title,Subject:`${report.period.academicYear} - ${reportSemesterLabel(report.period)}`,Author:localizedSchoolName()};
    workbook.Workbook={Views:[{RTL:LANG==='ar'}]};
    XLSX.utils.book_append_sheet(workbook,sheet,(report.title||'Report').replace(/[\\/?*\[\]:]/g,' ').slice(0,31));
    XLSX.writeFile(workbook,`attendance-${report.slug}-${report.period.academicYear}-${report.period.semester}-${today()}.xlsx`,{compression:true});
    toast(LANG==='ar'?'✅ تم تصدير التقرير إلى Excel':'✅ Report exported to Excel');
  }catch(error){
    console.error('Report export failed',error);
    toast(LANG==='ar'?'❌ تعذر تصدير التقرير':'❌ Could not export the report');
  }finally{button.disabled=false;button.innerHTML=original;}
}

function escapeReportHtml(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function printableReportContent(outputId){
  const source=document.getElementById(outputId);if(!source)return'';
  const clone=source.cloneNode(true);
  clone.querySelectorAll('script,style,link,meta,iframe,object,embed,form,button,input,select,textarea,img').forEach(element=>element.remove());
  clone.querySelectorAll('*').forEach(element=>[...element.attributes].forEach(attribute=>{
    if(/^on/i.test(attribute.name)||attribute.name==='srcdoc')element.removeAttribute(attribute.name);
  }));
  return clone.innerHTML;
}

function buildPrintDocument(report,content){
  const rtl=LANG==='ar';const headerUrl=new URL(rtl?'/print-header-ar.png':'/print-header-en.png',location.origin).href;
  const semester=reportSemesterLabel(report.period);
  const generated=new Date().toLocaleString(rtl?'ar-SA':'en-GB');
  return`<!doctype html><html lang="${rtl?'ar':'en'}" dir="${rtl?'rtl':'ltr'}"><head><meta charset="utf-8"><title>${escapeReportHtml(report.title)}</title><style>
    *{box-sizing:border-box}html,body{margin:0;background:#fff;color:#172033;font-family:Tahoma,Arial,sans-serif}body{padding:0;font-size:9pt}.official-header{width:100%;margin:0 0 4mm;padding:0 0 3mm;border-bottom:.3mm solid #d7dde8}.official-header img{display:block;width:100%;height:auto;max-height:25mm;object-fit:contain}.report-title{font-size:16pt;font-weight:800;color:#173b6c;text-align:center;margin:0 0 3mm}.meta{display:flex;flex-wrap:wrap;gap:2mm 6mm;margin:0 0 4mm;padding:2.5mm 3mm;background:#f4f7fb;border:.25mm solid #dbe3ee;border-radius:2mm;color:#46556d}.meta b{color:#173b6c}main{width:100%;overflow:visible}table{width:100%!important;max-width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;margin:2mm 0 4mm!important;page-break-inside:auto!important}thead{display:table-header-group!important}tfoot{display:table-footer-group!important}tr{page-break-inside:avoid!important;break-inside:avoid!important}th,td{max-width:0;padding:1.5mm 1.8mm!important;border:.25mm solid #cfd8e6!important;text-align:${rtl?'right':'left'}!important;vertical-align:middle!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;font-size:8.3pt!important}th{background:#173b6c!important;color:#fff!important;font-weight:700!important}.badge{display:inline-block;padding:.5mm 1.5mm;border-radius:9mm;border:.2mm solid #ccd6e3;background:#f4f7fb}.bg-g{background:#dcfce7!important}.bg-r{background:#fee2e2!important}.bg-o{background:#ffedd5!important}.bg-b{background:#dbeafe!important}.bg-gr{background:#f1f5f9!important}.sg{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:2mm!important;margin:2mm 0 4mm!important}.sc{min-width:0;border:.25mm solid #dbe3ee!important;border-radius:2mm!important;padding:2mm!important;background:#f8fafc!important;display:flex!important;gap:2mm!important;align-items:center!important;break-inside:avoid!important}.sc-ico{display:none!important}.sc-num{font-size:13pt!important;font-weight:800!important}.sc-lbl{font-size:7.5pt!important}.pb{height:1.3mm!important;background:#e2e8f0!important;border-radius:2mm!important;overflow:hidden!important}.pf{height:100%!important;background:#16a34a!important}.pf.mi{background:#f59e0b!important}.pf.lo{background:#dc2626!important}@page{size:A4 landscape;margin:8mm}@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-shadow:none!important}.official-header{break-inside:avoid;page-break-inside:avoid}.report-title,.meta{break-after:avoid;page-break-after:avoid}}
    .sg{grid-template-columns:repeat(7,minmax(0,1fr))!important}
  </style></head><body><header class="official-header"><img src="${escapeReportHtml(headerUrl)}" alt="Najd National Schools official header"></header><h1 class="report-title">${escapeReportHtml(report.title)}</h1><div class="meta"><span><b>${rtl?'السنة الدراسية':'Academic Year'}:</b> ${escapeReportHtml(report.period.academicYear)}</span><span><b>${rtl?'الفصل الدراسي':'Semester'}:</b> ${escapeReportHtml(semester)}</span><span><b>${rtl?'البرنامج':'Program'}:</b> ${escapeReportHtml(programLabel(db.activeProgram))}</span><span><b>${rtl?'تاريخ الطباعة':'Printed'}:</b> ${escapeReportHtml(generated)}</span></div><main>${content}</main></body></html>`;
}

async function printActiveReport(){
  const printWindow=window.open('','_blank','width=1100,height=800');
  if(!printWindow){toast(LANG==='ar'?'⚠️ اسمح بالنوافذ المنبثقة للطباعة':'⚠️ Allow pop-ups to print');return;}
  printWindow.opener=null;
  try{await ensureSelectedAttendanceReportPeriod();}
  catch(error){printWindow.close();console.error('Attendance print data load failed',error);toast(LANG==='ar'?'❌ تعذر تحميل بيانات التقرير':'❌ Could not load report data');return;}
  const report=prepareActiveReport();if(!report){printWindow.close();return;}
  printWindow.document.open();
  printWindow.document.write(buildPrintDocument(report,printableReportContent(report.outputId)));
  printWindow.document.close();
  printWindow.onafterprint=()=>printWindow.close();
  const startPrint=()=>setTimeout(()=>{printWindow.focus();printWindow.print();},100);
  const image=printWindow.document.querySelector('.official-header img');
  if(image?.decode)image.decode().catch(()=>{}).finally(startPrint);else setTimeout(startPrint,250);
}
