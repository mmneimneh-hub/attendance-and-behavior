(function(){
"use strict";

var initialized=false;
var currentBehaviorPage="behavior-dashboard";

var TXT={
  ar:{
    dashboard:"لوحة السلوك",log:"تسجيل مشكلة",records:"السجل الكامل",positive:"السلوك الإيجابي",
    positiveReport:"تقرير السلوك الإيجابي",procedures:"التدخلات والإجراءات",reference:"دليل المشكلات",
    settings:"إعدادات السلوك",all:"الكل",select:"— اختر —",noData:"لا توجد بيانات مطابقة",
    open:"مفتوحة",follow:"قيد المتابعة",closed:"مغلقة",yes:"نعم",no:"لا",na:"لا ينطبق",
    saved:"✅ تم حفظ سجل السلوك",updated:"✅ تم تحديث سجل السلوك",deleted:"🗑️ تم حذف السجل",
    required:"أكمل الحقول المطلوبة",confirmDelete:"هل تريد حذف هذا السجل؟",
    attendance:"الحضور",behavior:"السلوك"
  },
  en:{
    dashboard:"Behavior Dashboard",log:"Record Problem",records:"Complete Register",positive:"Positive Behavior",
    positiveReport:"Positive Behavior Report",procedures:"Interventions & Procedures",reference:"Problems Guide",
    settings:"Behavior Settings",all:"All",select:"— Select —",noData:"No matching data",
    open:"Open",follow:"Under Follow-up",closed:"Closed",yes:"Yes",no:"No",na:"N/A",
    saved:"✅ Behavior record saved",updated:"✅ Behavior record updated",deleted:"🗑️ Record deleted",
    required:"Complete the required fields",confirmDelete:"Delete this record?",
    attendance:"Attendance",behavior:"Behavior"
  }
};

var VIOLATIONS={
  D1:{
    labelAr:"الدرجة الأولى",labelEn:"Level One",deduction:1,
    itemsAr:["عدم التقيد بالزي المدرسي","التأخر الصباحي","عدم حضور الاصطفاف الصباحي مع وجود الطالب داخل المدرسة","التأخر عن الاصطفاف الصباحي أو العبث أثناءه","التأخر في الدخول إلى الحصص","تناول الأطعمة أو المشروبات أثناء الدرس دون استئذان","النوم داخل الفصل","تكرار الخروج والدخول من البوابة قبل وقت الحضور والانصراف","التجمهر أمام بوابة المدرسة"],
    itemsEn:["Failure to comply with the school uniform","Morning lateness","Missing morning assembly while present at school","Arriving late to or disrupting morning assembly","Arriving late to lessons","Eating or drinking during a lesson without permission","Sleeping in class","Repeatedly entering or leaving through the gate outside arrival and dismissal times","Gathering in front of the school gate"],
    procsAr:["تنبيه شفهي وتسجيل الحالة","توجيه تربوي من المعلم","حسم درجة واحدة من رصيد السلوك الإيجابي","إشعار ولي الأمر عند التكرار"],
    procsEn:["Verbal warning and case documentation","Educational guidance by the teacher","Deduct one point from the positive behavior balance","Notify the parent/guardian if repeated"]
  },
  D2:{
    labelAr:"الدرجة الثانية",labelEn:"Level Two",deduction:2,
    itemsAr:["عدم حضور الحصة الدراسية أو الهروب منها","الدخول أو الخروج من الفصل دون استئذان","دخول فصل آخر دون استئذان","إثارة الفوضى داخل الفصل أو المدرسة أو في وسائل النقل","الشجار أو الاشتراك في مضاربة جماعية","الإشارة بحركات مخلة بالأدب تجاه الطلبة","الكلمات النابية أو التهديد أو السخرية من الطلبة","إلحاق الضرر المتعمد بممتلكات الطلبة","العبث بتجهيزات المدرسة أو مبانيها","امتهان الكتب الدراسية"],
    itemsEn:["Missing or leaving a lesson without permission","Entering or leaving the classroom without permission","Entering another classroom without permission","Causing disruption in class, school, or school transport","Fighting or taking part in a group fight","Using indecent gestures toward students","Using abusive language, threats, or ridicule toward students","Intentionally damaging student property","Tampering with school equipment or buildings","Disrespecting textbooks"],
    procsAr:["توثيق رسمي للحالة","إشعار ولي الأمر رسمياً","إحالة للمرشد الطلابي","وضع خطة سلوكية قصيرة","حسم درجتين من رصيد السلوك الإيجابي"],
    procsEn:["Officially document the case","Officially notify the parent/guardian","Refer to the student counselor","Create a short behavior plan","Deduct two points from the positive behavior balance"]
  },
  D3:{
    labelAr:"الدرجة الثالثة",labelEn:"Level Three",deduction:3,
    itemsAr:["إلحاق الضرر المتعمد بتجهيزات المدرسة أو مبانيها","سرقة ممتلكات الطلبة أو المدرسة","التعرض لأحد الطلبة بالضرب","التصوير أو التسجيل الصوتي للطلبة","الهروب من المدرسة","التوقيع عن ولي الأمر دون علمه","إحضار أو استخدام مواد أو ألعاب خطرة (ألعاب نارية، بخاخات، مواد كيميائية)"],
    itemsEn:["Intentionally damaging school equipment or buildings","Stealing student or school property","Physically assaulting another student","Photographing or audio-recording students","Leaving school without permission","Signing on behalf of a parent/guardian without their knowledge","Bringing or using dangerous materials or toys, including fireworks, sprays, or chemicals"],
    procsAr:["توثيق رسمي مع جمع الأدلة","استدعاء ولي الأمر للمدرسة","إحالة رسمية للجنة التوجيه والسلوك","وضع خطة تدخل علاجية مكثفة","حسم 3 درجات من رصيد السلوك الإيجابي"],
    procsEn:["Official documentation with evidence collection","Call the parent/guardian to school","Official referral to the Guidance and Behavior Committee","Create an intensive corrective intervention plan","Deduct three points from the positive behavior balance"]
  },
  D4:{
    labelAr:"الدرجة الرابعة",labelEn:"Level Four",deduction:10,
    itemsAr:["الإساءة أو الاستهزاء بشعائر الإسلام","الإساءة للدولة أو رموزها","التحرش الجنسي","إشعال النار داخل المدرسة","حيازة السجائر بأنواعها","التدخين بأنواعه داخل المدرسة","حيازة آلة حادة (مثل السكاكين)","الجرائم المعلوماتية بكافة أنواعها","المظاهر أو الصور الدالة على الشذوذ الجنسي أو الترويج له","التنمر بجميع أنواعه وأشكاله","حيازة أو عرض المواد الإعلامية الممنوعة"],
    itemsEn:["Insulting or mocking Islamic rituals","Insulting the state or its symbols","Sexual harassment","Starting a fire inside the school","Possessing cigarettes or similar products","Smoking in any form inside the school","Possessing a sharp instrument such as a knife","Committing cybercrimes of any kind","Displaying or promoting prohibited sexual imagery or conduct","Bullying in any form","Possessing or displaying prohibited media"],
    procsAr:["تحقيق إداري فوري","إشعار عاجل لولي الأمر واستدعاؤه فوراً","إحالة رسمية للجنة السلوك الطلابي","رفع تقرير رسمي لقائد المدرسة","حسم 10 درجات من رصيد السلوك الإيجابي"],
    procsEn:["Immediate administrative investigation","Urgently notify and summon the parent/guardian","Official referral to the Student Behavior Committee","Submit a formal report to the school principal","Deduct ten points from the positive behavior balance"]
  },
  D5:{
    labelAr:"الدرجة الخامسة",labelEn:"Level Five",deduction:15,
    itemsAr:["مشكلات تستوجب الرفع لإدارة التعليم بقرار لجنة السلوك"],
    itemsEn:["Cases requiring referral to the Education Department by decision of the Behavior Committee"],
    procsAr:["إجراء أمني فوري","توثيق الأدلة والشهادات","إشعار فوري لولي الأمر","رفع الحالة لإدارة التعليم","حسم 15 درجة من رصيد السلوك الإيجابي"],
    procsEn:["Immediate safety action","Document evidence and statements","Immediately notify the parent/guardian","Refer the case to the Education Department","Deduct fifteen points from the positive behavior balance"]
  },
  DA:{
    labelAr:"تجاه الهيئة (د. رابعة)",labelEn:"Toward Staff (Level Four)",deduction:10,
    itemsAr:["تهديد المعلمين أو الإداريين أو منسوبي المدرسة","التلفظ بألفاظ غير لائقة تجاه المعلمين أو الإداريين","السخرية من المعلمين أو الإداريين قولاً أو فعلاً","التوقيع عن أحد منسوبي المدرسة على المكاتبات","تصوير المعلمين أو الإداريين أو التسجيل الصوتي لهم (دون إذن خطي)"],
    itemsEn:["Threatening teachers, administrators, or school staff","Using inappropriate language toward teachers or administrators","Mocking teachers or administrators verbally or through actions","Signing correspondence on behalf of a staff member","Photographing or audio-recording teachers or administrators without written permission"],
    procsAr:["تحقيق إداري فوري","إشعار عاجل لولي الأمر","إحالة للجنة السلوك","رفع تقرير لقائد المدرسة","حسم 10 درجات"],
    procsEn:["Immediate administrative investigation","Urgently notify the parent/guardian","Refer to the Behavior Committee","Submit a report to the school principal","Deduct ten points"]
  },
  DB:{
    labelAr:"خطيرة تجاه الهيئة (د. خامسة)",labelEn:"Serious Toward Staff (Level Five)",deduction:15,
    itemsAr:["إلحاق الضرر بممتلكات المعلمين أو الإداريين أو سرقتها","الإشارة بحركات مخلة بالأدب تجاه المعلمين أو الإداريين","الاعتداء بالضرب على المعلمين أو الإداريين","ابتزاز المعلمين أو الإداريين أو منسوبي المدرسة","الجرائم المعلوماتية تجاه المعلمين أو الإداريين"],
    itemsEn:["Damaging or stealing teacher or administrator property","Using indecent gestures toward teachers or administrators","Physically assaulting teachers or administrators","Blackmailing teachers, administrators, or school staff","Committing cybercrimes against teachers or administrators"],
    procsAr:["إجراء أمني فوري","تحقيق إداري عاجل","إشعار فوري لولي الأمر","رفع الحالة لإدارة التعليم","حسم 15 درجة"],
    procsEn:["Immediate safety action","Urgent administrative investigation","Immediately notify the parent/guardian","Refer the case to the Education Department","Deduct fifteen points"]
  }
};

var POSITIVE_BEHAVIORS=[
  ["positive_attendance_discipline","الالتزام بالحضور والانضباط","Commitment to Attendance and Discipline"],
  ["positive_behavior_improvement","تحسن واضح في السلوك","Clear Improvement in Behavior"],
  ["positive_cooperation","التعاون مع الزملاء","Cooperation with Classmates"],
  ["positive_respect_teachers","احترام المعلمين","Respect for Teachers"],
  ["positive_school_property","المحافظة على ممتلكات المدرسة","Care for School Property"],
  ["positive_initiative_helpfulness","المبادرة والمساعدة","Initiative and Helpfulness"],
  ["positive_classroom_leadership","القيادة الإيجابية داخل الصف","Positive Classroom Leadership"],
  ["positive_active_participation","المشاركة الفعالة","Active Participation"],
  ["positive_assignments_completion","إنجاز الواجبات بانتظام","Consistent Completion of Assignments"],
  ["positive_cleanliness","المحافظة على النظافة","Maintaining Cleanliness"],
  ["positive_problem_solving","حل مشكلة بطريقة إيجابية","Solving a Problem Positively"],
  ["positive_school_instructions","الالتزام بتعليمات المدرسة","Compliance with School Instructions"],
  ["positive_school_representation","تمثيل المدرسة بصورة مشرفة","Representing the School Positively"]
];
var REWARD_TYPES=[
  ["reward_certificate","شهادة شكر","Appreciation Certificate"],
  ["reward_positive_points","نقاط إيجابية","Positive Points"],
  ["reward_parent_notification","إشعار ولي الأمر","Parent/Guardian Notification"],
  ["reward_morning_assembly","تكريم في الطابور الصباحي","Recognition at Morning Assembly"],
  ["reward_classroom_recognition","تكريم داخل الصف","Classroom Recognition"],
  ["reward_excellence_card","بطاقة تميز","Excellence Card"],
  ["reward_ideal_student","ترشيح للطالب المثالي","Nomination for Ideal Student"],
  ["reward_honor_board","نشر في لوحة الشرف","Honor Board Recognition"],
  ["reward_parent_message","رسالة تقدير لولي الأمر","Appreciation Message to Parent/Guardian"]
];
var CONTACTS=[
  ["","—","—"],["phone","هاتف","Phone"],["call","اتصال هاتفي","Phone Call"],["sms","رسالة نصية","SMS Message"],
  ["whatsapp","واتساب","WhatsApp"],["edunation","إديونيشن","Edunation"],["letter","رسالة ورقية","Printed Letter"],["none","لم يتم التواصل","No Contact Made"]
];
var DEFAULT_RESPONSIBLES=[
  {id:"student-affairs",ar:"وكيل شؤون الطلاب",en:"Student Affairs Vice Principal"},
  {id:"counselor",ar:"المرشد الطلابي",en:"Student Counselor"},
  {id:"principal",ar:"قائد المدرسة",en:"School Principal"},
  {id:"teacher",ar:"المعلم",en:"Teacher"},
  {id:"administration",ar:"الإدارة",en:"Administration"}
];

function L(){return typeof LANG!=="undefined"&&LANG==="en"?"en":"ar";}
function tr(ar,en){return L()==="ar"?ar:en;}
function tx(key){return (TXT[L()]&&TXT[L()][key])||key;}
function esc(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function todayValue(){return new Date().toISOString().slice(0,10);}
function displayDate(value){if(!value)return"—";var d=new Date(value+"T00:00:00");return isNaN(d)?value:d.toLocaleDateString(L()==="ar"?"ar-SA":"en-GB");}
function option(value,label,selected){return "<option value='"+esc(value)+"'"+(String(selected)===String(value)?" selected":"")+">"+esc(label)+"</option>";}
function rowEmpty(cols){return "<tr><td colspan='"+cols+"'><div class='beh-empty'><span class='beh-empty-icon'>📭</span>"+esc(tx("noData"))+"</div></td></tr>";}
function levelLabel(level){var item=VIOLATIONS[level];return item?(L()==="ar"?item.labelAr:item.labelEn):level||"—";}
function statusLabel(value){return tx(value||"open");}
function yesNo(value){return value==="yes"?tx("yes"):value==="no"?tx("no"):tx("na");}
function tupleLabel(list,key){var item=list.find(function(x){return x[0]===key;});return item?(L()==="ar"?item[1]:item[2]):key||"—";}

function settings(){
  if(!db.behaviorSettings)db.behaviorSettings={responsibles:copyData(DEFAULT_RESPONSIBLES),customProcedures:[]};
  if(!Array.isArray(db.behaviorSettings.responsibles)||!db.behaviorSettings.responsibles.length)db.behaviorSettings.responsibles=copyData(DEFAULT_RESPONSIBLES);
  if(!Array.isArray(db.behaviorSettings.customProcedures))db.behaviorSettings.customProcedures=[];
  return db.behaviorSettings;
}
function bstate(){
  ensureAcademicModel();
  var sem=db.academicYears[db.activeAcademicYear].semesters[String(db.activeSemester)];
  if(!sem.behavior)sem.behavior=emptyBehaviorState();
  return sem.behavior;
}
function behaviorReportPeriod(kind){
  var prefix=kind==="positive"?"behPositive":"behRecord",yearEl=document.getElementById(prefix+"Year"),semesterEl=document.getElementById(prefix+"Semester");
  var academicYear=yearEl&&db.academicYears[yearEl.value]?yearEl.value:db.activeAcademicYear;
  var semester=semesterEl&&["1","2","both"].includes(semesterEl.value)?semesterEl.value:String(db.activeSemester||"1");
  return{academicYear:academicYear,semester:semester,semesters:semester==="both"?["1","2"]:[semester],yearData:db.academicYears[academicYear]||{classes:{},students:{},semesters:{}}};
}
function behaviorSemesterLabel(period){return period.semester==="both"?tr("الفصلان الأول والثاني","Semesters 1 & 2"):tr(period.semester==="1"?"الفصل الأول":"الفصل الثاني","Semester "+period.semester);}
function behaviorReportClasses(kind){
  var period=behaviorReportPeriod(kind),programs=allowedPrograms(),grades=allowedGrades(db.activeProgram);
  return Object.values(period.yearData.classes||{}).map(normalizeClassScope).filter(function(c){return c.program===db.activeProgram&&programs.includes(c.program)&&grades.includes(classGrade(c));});
}
function allowedBehaviorReportRecord(record,period){
  var cls=period.yearData.classes&&period.yearData.classes[record.classId],program=record.program||(cls&&normalizeClassScope(cls).program)||db.activeProgram,grade=String(record.grade||(cls&&classGrade(cls))||"");
  return program===db.activeProgram&&allowedPrograms().includes(program)&&(!grade||allowedGrades(program).includes(grade));
}
function behaviorReportRecords(kind){
  var period=behaviorReportPeriod(kind),field=kind==="positive"?"positives":"violations",records=[];
  period.semesters.forEach(function(semester){
    var behavior=period.yearData.semesters&&period.yearData.semesters[semester]&&period.yearData.semesters[semester].behavior;
    (behavior&&behavior[field]||[]).forEach(function(record){if(allowedBehaviorReportRecord(record,period))records.push(Object.assign({},record,{__reportYear:period.academicYear,__reportSemester:semester,__yearData:period.yearData}));});
  });
  return records;
}
function behaviorReportStudent(record){return record.__yearData&&record.__yearData.students&&record.__yearData.students[record.studentId]||studentFor(record.studentId);}
function behaviorReportClass(record){return record.__yearData&&record.__yearData.classes&&record.__yearData.classes[record.classId]||classFor(record.classId);}
function behaviorReportStudentName(record){return behaviorReportStudent(record).name||record.studentName||"—";}
function behaviorReportClassName(record){var cls=behaviorReportClass(record);return cls&&Object.keys(cls).length?className(cls):record.className||"—";}
function behaviorReportEditable(kind){var period=behaviorReportPeriod(kind);return period.academicYear===db.activeAcademicYear&&period.semester===String(db.activeSemester);}
function visibleClassIds(){return new Set(visibleClasses().map(function(c){return c.id;}));}
function allowedBehaviorRecord(record){
  var ids=visibleClassIds();
  if(record.classId)return ids.has(record.classId);
  var student=db.students[record.studentId];
  return !!student&&ids.has(student.classId);
}
function visibleViolations(){return bstate().violations.filter(allowedBehaviorRecord);}
function visiblePositives(){return bstate().positives.filter(allowedBehaviorRecord);}
function studentFor(id){return db.students[id]||{};}
function classFor(id){return db.classes[id]||{};}
function studentDisplay(id,fallback){return studentFor(id).name||fallback||"—";}
function classDisplay(id,fallback){return db.classes[id]?className(db.classes[id]):fallback||"—";}
function responsibleLabel(id){
  var item=settings().responsibles.find(function(r){return r.id===id;});
  return item?(L()==="ar"?item.ar:item.en):id||"—";
}
function violationTypeLabel(level,key){
  var parsed=String(key||"").match(/_(\d{2})$/);
  var index=parsed?Number(parsed[1])-1:-1;
  var group=VIOLATIONS[level];
  var list=group?(L()==="ar"?group.itemsAr:group.itemsEn):[];
  return list[index]||key||"—";
}
function procedureLabel(level,key){
  if(String(key).indexOf("custom:")===0){
    var custom=settings().customProcedures.find(function(p){return p.id===String(key).slice(7);});
    return custom?(L()==="ar"?custom.ar:custom.en):key;
  }
  var parsed=String(key||"").match(/_(\d{2})$/);
  var index=parsed?Number(parsed[1])-1:-1;
  var group=VIOLATIONS[level];
  var list=group?(L()==="ar"?group.procsAr:group.procsEn):[];
  return list[index]||key||"—";
}
function addAudit(action,targetId,details){
  var st=bstate();
  var entry={
    id:"audit-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),action:action,targetId:targetId,details:details||"",
    actorId:user&&user.id||"",actorName:user&&user.name||"",actorEmail:user&&user.email||"",at:new Date().toISOString()
  };
  st.audit.unshift(entry);
  st.audit=st.audit.slice(0,300);
  return entry;
}
function nextId(kind){
  var st=bstate(),positive=kind==="positive",prop=positive?"nextPositiveId":"nextViolationId",prefix=positive?"PB-":"BH-";
  var all=positive?st.positives:st.violations;
  var max=all.reduce(function(m,r){var n=Number(String(r.id||"").replace(/\D/g,""));return Math.max(m,isFinite(n)?n:0);},0);
  st[prop]=Math.max(Number(st[prop])||1,max+1);
  var id=prefix+String(st[prop]).padStart(4,"0");st[prop]++;return id;
}
function recordMeta(existing){
  return {
    createdAt:existing&&existing.createdAt||new Date().toISOString(),
    createdBy:existing&&existing.createdBy||user.id,createdByName:existing&&existing.createdByName||user.name,createdByEmail:existing&&existing.createdByEmail||user.email,
    updatedAt:new Date().toISOString(),updatedBy:user.id,updatedByName:user.name,updatedByEmail:user.email
  };
}

function navItem(page,icon,ar,en,permission){
  return "<div class='ni behavior-ni' data-behavior-permission='"+permission+"' onclick=\"goBehaviorPage('"+page+"',this)\"><span class='ic'>"+icon+"</span><span data-ar='"+esc(ar)+"' data-en='"+esc(en)+"'>"+esc(ar)+"</span></div>";
}
function buildNavigation(){
  var nav=document.getElementById("behaviorNav");if(!nav)return;
  nav.innerHTML=
    "<div class='behavior-app-label'>⭐ <span data-ar='نظام السلوك والمواظبة' data-en='Behavior System'>نظام السلوك والمواظبة</span></div>"+
    "<div class='nav-sec' data-ar='الرئيسية' data-en='Main'>الرئيسية</div>"+
    navItem("behavior-dashboard","🏠","لوحة التحكم","Dashboard","behavior_dashboard")+
    navItem("behavior-log","⚠️","تسجيل مشكلة","Record Problem","behavior_record")+
    navItem("behavior-positive","⭐","السلوك الإيجابي","Positive Behavior","behavior_record")+
    "<div class='nav-sec' data-ar='السجلات والتقارير' data-en='Records & Reports'>السجلات والتقارير</div>"+
    navItem("behavior-records","📋","سجل المشكلات","Problems Report","behavior_reports")+
    navItem("behavior-positive-report","📊","تقرير السلوك الإيجابي","Positive Report","behavior_reports")+
    "<div class='nav-sec' data-ar='الأدلة' data-en='Guides'>الأدلة</div>"+
    navItem("behavior-procedures","📌","التدخلات والإجراءات","Interventions","behavior_reference")+
    navItem("behavior-reference","📖","دليل المشكلات","Problems Guide","behavior_reference")+
    "<div class='nav-sec' data-ar='البيانات المشتركة' data-en='Shared Data'>البيانات المشتركة</div>"+
    "<div class='ni behavior-ni' data-behavior-permission='students_edit' onclick=\"openBehaviorSharedPage('students',this)\"><span class='ic'>👥</span><span data-ar='الطلاب' data-en='Students'>الطلاب</span></div>"+
    "<div class='ni behavior-ni' data-behavior-permission='classes' onclick=\"openBehaviorSharedPage('classes',this)\"><span class='ic'>🏫</span><span data-ar='الفصول' data-en='Classes'>الفصول</span></div>"+
    "<div class='ni behavior-ni' data-behavior-permission='roster_import' onclick='openBehaviorRosterImport(this)'><span class='ic'>📥</span><span data-ar='استيراد الطلاب والفصول' data-en='Import Students & Classes'>استيراد الطلاب والفصول</span></div>"+
    "<div class='ni behavior-ni' data-behavior-permission='teachers' onclick=\"openBehaviorSharedPage('teachers',this)\"><span class='ic'>👤</span><span data-ar='المستخدمون' data-en='Users'>المستخدمون</span></div>"+
    navItem("behavior-settings","⚙️","إعدادات السلوك","Behavior Settings","behavior_manage")+
    "<div class='ni behavior-ni admin-only' data-behavior-permission='settings' onclick=\"openBehaviorSharedPage('settings',this)\"><span class='ic'>🛠️</span><span data-ar='إعدادات المنصة' data-en='Platform Settings'>إعدادات المنصة</span></div>";
}

function field(labelAr,labelEn,id,type,extra){
  return "<div class='beh-field"+((extra&&extra.full)?" full":"")+"'><label for='"+id+"' data-ar='"+esc(labelAr)+"' data-en='"+esc(labelEn)+"'>"+esc(labelAr)+"</label><"+type+" id='"+id+"'"+((extra&&extra.attrs)?" "+extra.attrs:"")+"></"+type+"></div>";
}

function buildPages(){
  if(document.getElementById("page-behavior-dashboard"))return;
  var main=document.querySelector("#app .main");if(!main)return;
  var html="";
  html+="<div class='page behavior-page' id='page-behavior-dashboard'><div id='behDashboard'></div></div>";
  html+="<div class='page behavior-page' id='page-behavior-log'>"+
    "<div class='behavior-hero'><div><h3 data-ar='تسجيل مشكلة سلوكية' data-en='Record a Behavioral Problem'>تسجيل مشكلة سلوكية</h3><p data-ar='سجل موحد مرتبط بالطالب والفصل والسنة والفصل الدراسي الحالي.' data-en='A unified record linked to the student, class, scholastic year, and current semester.'>سجل موحد مرتبط بالطالب والفصل والسنة والفصل الدراسي الحالي.</p></div><div class='behavior-hero-actions'><button class='beh-btn beh-btn-light' onclick='resetViolationForm()'>↻ <span data-ar='نموذج جديد' data-en='New Form'>نموذج جديد</span></button></div></div>"+
    "<input type='hidden' id='behViolationId'>"+
    "<div class='beh-form-section'><div class='beh-form-title'>👤 <span data-ar='1 — الطالب والحالة' data-en='1 — Student and Case'>1 — الطالب والحالة</span></div><div class='beh-form-body'><div class='beh-form-grid'>"+
      field("التاريخ *","Date *","behViolationDate","input",{attrs:"type='date'"})+
      field("الفصل *","Class *","behViolationClass","select",{attrs:"onchange='fillBehaviorStudents(\"violation\")'"})+
      field("الطالب *","Student *","behViolationStudent","select",{})+
      field("حالة المتابعة *","Follow-up Status *","behViolationStatus","select",{})+
    "</div></div></div>"+
    "<div class='beh-form-section'><div class='beh-form-title'>⚠️ <span data-ar='2 — المشكلة والتصنيف' data-en='2 — Problem and Classification'>2 — المشكلة والتصنيف</span></div><div class='beh-form-body'><div class='beh-form-grid'>"+
      field("درجة المشكلة *","Problem Level *","behViolationLevel","select",{attrs:"onchange='updateViolationCatalog()'"})+
      field("نوع المشكلة *","Problem Type *","behViolationType","select",{})+
      field("وصف الواقعة","Incident Description","behViolationDescription","textarea",{full:true,attrs:"rows='3'"})+
    "</div><div id='behProcedurePreview' class='beh-procedure-preview' style='margin-top:12px'></div></div></div>"+
    "<div class='beh-form-section'><div class='beh-form-title'>📌 <span data-ar='3 — التدخلات والإجراءات' data-en='3 — Interventions and Actions'>3 — التدخلات والإجراءات</span></div><div class='beh-form-body'><div class='beh-grid-2'><div><div id='behProcedureChecks' class='beh-check-list'></div></div><div class='beh-form-grid'>"+
      field("إجراء يدوي إضافي","Additional Manual Intervention","behManualProcedure","textarea",{full:true,attrs:"rows='3'"})+
      field("ملاحظات الإجراءات","Intervention Notes","behProcedureNotes","textarea",{full:true,attrs:"rows='3'"})+
    "</div></div></div></div>"+
    "<div class='beh-form-section'><div class='beh-form-title'>📞 <span data-ar='4 — التوثيق والمتابعة' data-en='4 — Documentation and Follow-up'>4 — التوثيق والمتابعة</span></div><div class='beh-form-body'><div class='beh-form-grid'>"+
      field("تم التوثيق؟","Documented?","behDocumented","select",{})+
      field("توقيع الطالب","Student Signature","behStudentSigned","select",{})+
      field("تم إشعار ولي الأمر؟","Parent/Guardian Notified?","behParentNotified","select",{})+
      field("وسيلة التواصل","Contact Method","behContactMethod","select",{})+
      field("تاريخ التواصل","Contact Date","behContactDate","input",{attrs:"type='date'"})+
      field("المسؤول عن المتابعة","Responsible Person","behResponsible","select",{})+
      field("ملاحظات ختامية","Final Notes","behViolationNotes","textarea",{full:true,attrs:"rows='3'"})+
    "</div></div></div>"+
    "<div class='beh-form-actions'><button class='beh-btn beh-btn-outline' onclick='resetViolationForm()'><span data-ar='إلغاء / مسح' data-en='Cancel / Clear'>إلغاء / مسح</span></button><button id='behSaveViolation' class='beh-btn beh-btn-primary' onclick='saveViolationRecord()'>💾 <span data-ar='حفظ المشكلة' data-en='Save Problem'>حفظ المشكلة</span></button></div>"+
  "</div>";

  html+="<div class='page behavior-page' id='page-behavior-records'>"+
    "<div class='behavior-hero'><div><h3 data-ar='السجل الكامل للمشكلات' data-en='Complete Problems Register'>السجل الكامل للمشكلات</h3><p data-ar='البحث والتصفية والتعديل والطباعة والتصدير ضمن نطاق صلاحيات المستخدم.' data-en='Search, filter, edit, print, and export within the signed-in user scope.'>البحث والتصفية والتعديل والطباعة والتصدير ضمن نطاق صلاحيات المستخدم.</p></div><div class='behavior-hero-actions'><button class='beh-btn beh-btn-light' data-behavior-permission='behavior_reports' onclick=\"exportBehaviorExcel('violations')\">📗 <span data-ar='Excel' data-en='Excel'>Excel</span></button><button class='beh-btn beh-btn-gold' data-behavior-permission='behavior_reports' onclick=\"printBehaviorReport('violations')\">🖨️ <span data-ar='طباعة' data-en='Print'>طباعة</span></button></div></div>"+
    "<div class='beh-filters'>"+
      "<div class='beh-filter'><label data-ar='السنة الدراسية' data-en='Scholastic Year'>السنة الدراسية</label><select id='behRecordYear' onchange=\"changeBehaviorReportPeriod('violations')\"></select></div>"+
      "<div class='beh-filter'><label data-ar='الفصل الدراسي' data-en='Semester'>الفصل الدراسي</label><select id='behRecordSemester' onchange=\"changeBehaviorReportPeriod('violations')\"></select></div>"+
      "<div class='beh-filter'><label data-ar='بحث' data-en='Search'>بحث</label><input id='behRecordSearch' oninput='renderBehaviorRecords()' placeholder=''></div>"+
      "<div class='beh-filter'><label data-ar='الفصل' data-en='Class'>الفصل</label><select id='behRecordClass' onchange='renderBehaviorRecords()'></select></div>"+
      "<div class='beh-filter'><label data-ar='الدرجة' data-en='Level'>الدرجة</label><select id='behRecordLevel' onchange='renderBehaviorRecords()'></select></div>"+
      "<div class='beh-filter'><label data-ar='الحالة' data-en='Status'>الحالة</label><select id='behRecordStatus' onchange='renderBehaviorRecords()'></select></div>"+
      "<div class='beh-filter'><label data-ar='من تاريخ' data-en='From Date'>من تاريخ</label><input type='date' id='behRecordFrom' onchange='renderBehaviorRecords()'></div>"+
    "</div><div class='beh-filter' style='max-width:220px;margin-bottom:12px'><label data-ar='إلى تاريخ' data-en='To Date'>إلى تاريخ</label><input type='date' id='behRecordTo' onchange='renderBehaviorRecords()'></div>"+
    "<div id='behRecordCount' class='beh-count'></div><div class='beh-table-wrap'><table class='beh-table'><thead><tr><th data-ar='رقم الحالة' data-en='Case No.'>رقم الحالة</th><th data-ar='التاريخ' data-en='Date'>التاريخ</th><th data-ar='الطالب' data-en='Student'>الطالب</th><th data-ar='الفصل' data-en='Class'>الفصل</th><th data-ar='الدرجة' data-en='Level'>الدرجة</th><th data-ar='المشكلة' data-en='Problem'>المشكلة</th><th data-ar='ولي الأمر' data-en='Parent'>ولي الأمر</th><th data-ar='الحالة' data-en='Status'>الحالة</th><th data-ar='الإجراءات' data-en='Actions'>الإجراءات</th></tr></thead><tbody id='behRecordsBody'></tbody></table></div>"+
  "</div>";

  html+="<div class='page behavior-page' id='page-behavior-positive'>"+
    "<div class='behavior-hero'><div><h3 data-ar='تسجيل سلوك إيجابي' data-en='Record Positive Behavior'>تسجيل سلوك إيجابي</h3><p data-ar='تعزيز السلوك الإيجابي وتوثيق نقاط الطالب وتكريمه.' data-en='Reinforce positive behavior and document student points and recognition.'>تعزيز السلوك الإيجابي وتوثيق نقاط الطالب وتكريمه.</p></div><div class='behavior-hero-actions'><button class='beh-btn beh-btn-light' onclick='resetPositiveForm()'>↻ <span data-ar='نموذج جديد' data-en='New Form'>نموذج جديد</span></button></div></div>"+
    "<input type='hidden' id='behPositiveId'>"+
    "<div class='beh-form-section'><div class='beh-form-title'>👤 <span data-ar='1 — الطالب' data-en='1 — Student'>1 — الطالب</span></div><div class='beh-form-body'><div class='beh-form-grid'>"+
      field("التاريخ *","Date *","behPositiveDate","input",{attrs:"type='date'"})+
      field("الفصل *","Class *","behPositiveClass","select",{attrs:"onchange='fillBehaviorStudents(\"positive\")'"})+
      field("الطالب *","Student *","behPositiveStudent","select",{})+
      field("نوع السلوك الإيجابي *","Positive Behavior Type *","behPositiveType","select",{})+
    "</div></div></div>"+
    "<div class='beh-form-section'><div class='beh-form-title'>⭐ <span data-ar='2 — التعزيز والتوثيق' data-en='2 — Reinforcement and Documentation'>2 — التعزيز والتوثيق</span></div><div class='beh-form-body'><div class='beh-form-grid'>"+
      field("نقاط التعزيز (1–10) *","Reinforcement Points (1–10) *","behPositivePoints","select",{})+
      field("نوع التعزيز *","Reinforcement Type *","behPositiveReward","select",{})+
      field("وصف الموقف الإيجابي *","Positive Situation Description *","behPositiveDescription","textarea",{full:true,attrs:"rows='3'"})+
      field("تم إشعار ولي الأمر؟","Parent/Guardian Notified?","behPositiveParent","select",{})+
      field("وسيلة التواصل","Contact Method","behPositiveContact","select",{})+
      field("المسؤول","Responsible Person","behPositiveResponsible","select",{})+
      field("التوصية","Recommendation","behPositiveRecommendation","textarea",{full:true,attrs:"rows='3'"})+
    "</div></div></div>"+
    "<div class='beh-form-actions'><button class='beh-btn beh-btn-outline' onclick='resetPositiveForm()'><span data-ar='إلغاء / مسح' data-en='Cancel / Clear'>إلغاء / مسح</span></button><button id='behSavePositive' class='beh-btn beh-btn-primary' onclick='savePositiveRecord()'>💾 <span data-ar='حفظ السلوك الإيجابي' data-en='Save Positive Behavior'>حفظ السلوك الإيجابي</span></button></div>"+
  "</div>";

  html+="<div class='page behavior-page' id='page-behavior-positive-report'>"+
    "<div class='behavior-hero'><div><h3 data-ar='تقرير السلوك الإيجابي' data-en='Positive Behavior Report'>تقرير السلوك الإيجابي</h3><p data-ar='تحليل شامل للسلوك الإيجابي وبطاقات الطلاب.' data-en='Comprehensive analysis of positive behavior and student cards.'>تحليل شامل للسلوك الإيجابي وبطاقات الطلاب.</p></div><div class='behavior-hero-actions'><button class='beh-btn beh-btn-light' data-behavior-permission='behavior_reports' onclick=\"exportBehaviorExcel('positive')\">📗 Excel</button><button class='beh-btn beh-btn-gold' data-behavior-permission='behavior_reports' onclick=\"printBehaviorReport('positive')\">🖨️ <span data-ar='طباعة' data-en='Print'>طباعة</span></button></div></div>"+
    "<div class='beh-filters'><div class='beh-filter'><label data-ar='السنة الدراسية' data-en='Scholastic Year'>السنة الدراسية</label><select id='behPositiveYear' onchange=\"changeBehaviorReportPeriod('positive')\"></select></div><div class='beh-filter'><label data-ar='الفصل الدراسي' data-en='Semester'>الفصل الدراسي</label><select id='behPositiveSemester' onchange=\"changeBehaviorReportPeriod('positive')\"></select></div><div class='beh-filter'><label data-ar='بحث' data-en='Search'>بحث</label><input id='behPositiveSearch' oninput='renderPositiveReport()'></div><div class='beh-filter'><label data-ar='الفصل' data-en='Class'>الفصل</label><select id='behPositiveFilterClass' onchange='renderPositiveReport()'></select></div><div class='beh-filter'><label data-ar='نوع السلوك' data-en='Behavior Type'>نوع السلوك</label><select id='behPositiveFilterType' onchange='renderPositiveReport()'></select></div><div class='beh-filter'><label data-ar='من تاريخ' data-en='From Date'>من تاريخ</label><input type='date' id='behPositiveFrom' onchange='renderPositiveReport()'></div><div class='beh-filter'><label data-ar='إلى تاريخ' data-en='To Date'>إلى تاريخ</label><input type='date' id='behPositiveTo' onchange='renderPositiveReport()'></div></div>"+
    "<div id='behPositiveStats' class='beh-kpis'></div><div class='beh-panel'><div class='beh-panel-head'><h3 data-ar='السجلات المطابقة' data-en='Matching Records'>السجلات المطابقة</h3><span id='behPositiveCount' class='beh-count'></span></div><div class='beh-table-wrap' style='border:0;border-radius:0'><table class='beh-table'><thead><tr><th data-ar='الرقم' data-en='No.'>الرقم</th><th data-ar='التاريخ' data-en='Date'>التاريخ</th><th data-ar='الطالب' data-en='Student'>الطالب</th><th data-ar='الفصل' data-en='Class'>الفصل</th><th data-ar='نوع السلوك' data-en='Behavior Type'>نوع السلوك</th><th data-ar='النقاط' data-en='Points'>النقاط</th><th data-ar='التعزيز' data-en='Reward'>التعزيز</th><th data-ar='الإجراءات' data-en='Actions'>الإجراءات</th></tr></thead><tbody id='behPositiveBody'></tbody></table></div></div><div class='beh-panel'><div class='beh-panel-head'><h3 data-ar='بطاقات الطلاب' data-en='Student Cards'>بطاقات الطلاب</h3></div><div class='beh-panel-body'><div id='behStudentCards' class='beh-student-cards'></div></div></div>"+
  "</div>";

  html+="<div class='page behavior-page' id='page-behavior-procedures'><div class='behavior-hero'><div><h3 data-ar='التدخلات والإجراءات التنظيمية' data-en='Regulatory Interventions and Procedures'>التدخلات والإجراءات التنظيمية</h3><p data-ar='ملخص التدخلات المرتبطة بكل درجة من دليل السلوك.' data-en='Summary of interventions linked to each level in the behavior guide.'>ملخص التدخلات المرتبطة بكل درجة من دليل السلوك.</p></div></div><div id='behProceduresGrid' class='beh-reference-grid'></div></div>";
  html+="<div class='page behavior-page' id='page-behavior-reference'><div class='behavior-hero'><div><h3 data-ar='دليل المشكلات السلوكية' data-en='Behavioral Problems Guide'>دليل المشكلات السلوكية</h3><p data-ar='جميع درجات المشكلات وأنواعها والحسم المرتبط بها كما في الملف الأصلي.' data-en='All problem levels, types, and deductions retained from the original file.'>جميع درجات المشكلات وأنواعها والحسم المرتبط بها كما في الملف الأصلي.</p></div></div><div id='behReferenceGrid' class='beh-reference-grid'></div></div>";
  html+="<div class='page behavior-page' id='page-behavior-settings'><div class='behavior-hero'><div><h3 data-ar='إعدادات السلوك' data-en='Behavior Settings'>إعدادات السلوك</h3><p data-ar='المسؤولون والإجراءات المخصصة وسجل النشاط.' data-en='Responsible people, custom interventions, and activity log.'>المسؤولون والإجراءات المخصصة وسجل النشاط.</p></div></div>"+
    "<div class='beh-grid-2'><div class='beh-panel'><div class='beh-panel-head'><h3 data-ar='المسؤولون عن المتابعة' data-en='Responsible People'>المسؤولون عن المتابعة</h3></div><div class='beh-panel-body'><div class='beh-form-grid'><div class='beh-field'><label data-ar='الاسم بالعربية' data-en='Arabic Name'>الاسم بالعربية</label><input id='behResponsibleAr'></div><div class='beh-field'><label data-ar='الاسم بالإنجليزية' data-en='English Name'>الاسم بالإنجليزية</label><input id='behResponsibleEn'></div></div><button class='beh-btn beh-btn-primary' style='margin-top:10px' data-behavior-permission='settings' onclick='addBehaviorResponsible()'>➕ <span data-ar='إضافة مسؤول' data-en='Add Person'>إضافة مسؤول</span></button><div id='behResponsibleList' style='margin-top:12px'></div></div></div>"+
    "<div class='beh-panel'><div class='beh-panel-head'><h3 data-ar='إجراءات مخصصة' data-en='Custom Interventions'>إجراءات مخصصة</h3></div><div class='beh-panel-body'><div class='beh-form-grid'><div class='beh-field'><label data-ar='الإجراء بالعربية' data-en='Arabic Intervention'>الإجراء بالعربية</label><input id='behProcedureAr'></div><div class='beh-field'><label data-ar='الإجراء بالإنجليزية' data-en='English Intervention'>الإجراء بالإنجليزية</label><input id='behProcedureEn'></div></div><button class='beh-btn beh-btn-primary' style='margin-top:10px' data-behavior-permission='settings' onclick='addBehaviorProcedure()'>➕ <span data-ar='إضافة إجراء' data-en='Add Intervention'>إضافة إجراء</span></button><div id='behCustomProcedureList' style='margin-top:12px'></div></div></div></div>"+
    "<div class='beh-panel'><div class='beh-panel-head'><h3 data-ar='سجل النشاط للفصل الدراسي الحالي' data-en='Current Semester Activity Log'>سجل النشاط للفصل الدراسي الحالي</h3></div><div class='beh-panel-body'><div id='behAuditLog' class='beh-audit'></div></div></div>"+
  "</div>";
  main.insertAdjacentHTML("beforeend",html);
}

function appHasAttendance(){
  return ["dashboard","attendance","students_edit","classes","reports","notifications"].some(function(p){return hasPermission(p);});
}
function appHasBehavior(){
  return ["behavior_dashboard","behavior_record","behavior_manage","behavior_reports","behavior_reference"].some(function(p){return hasPermission(p);});
}

window.showAppChooser=function(){
  if(!user)return;
  var chooser=document.getElementById("appChooser"),app=document.getElementById("app");
  if(app)app.style.display="none";if(chooser)chooser.style.display="flex";
  var greeting=document.getElementById("chooserGreeting");
  if(greeting)greeting.textContent=tr("مرحباً، ","Welcome, ")+user.name+" · "+((t("roles")||{})[user.role]||user.role);
  var a=document.getElementById("attendanceChoice"),b=document.getElementById("behaviorChoice");
  if(a)a.style.display=appHasAttendance()?"flex":"none";if(b)b.style.display=appHasBehavior()?"flex":"none";
  applySchoolBranding();
};

window.selectPlatformApp=function(appName,remember){
  if(remember!==false)remember=true;
  if(appName!=="attendance"&&appName!=="behavior")appName="attendance";
  if(appName==="behavior"&&!appHasBehavior())appName="attendance";
  if(appName==="attendance"&&!appHasAttendance()&&appHasBehavior())appName="behavior";
  var chooser=document.getElementById("appChooser"),app=document.getElementById("app");
  if(chooser)chooser.style.display="none";if(app)app.style.display="block";
  if(remember)localStorage.setItem("najd_platform_app",appName);
  window.currentPlatformApp=appName;
  var attendanceNav=document.getElementById("attendanceNav"),behaviorNav=document.getElementById("behaviorNav");
  if(attendanceNav)attendanceNav.style.display=appName==="attendance"?"block":"none";
  if(behaviorNav)behaviorNav.style.display=appName==="behavior"?"block":"none";
  updateActiveAppChip();
  if(appName==="behavior"){
    var first=document.querySelector("#behaviorNav .behavior-ni[data-behavior-permission]:not([style*='display: none'])");
    goBehaviorPage(first&&first.getAttribute("onclick")&&first.getAttribute("onclick").indexOf("behavior-dashboard")>=0?"behavior-dashboard":firstPageAllowed(),first);
  }else{
    var attendanceItem=Array.from(document.querySelectorAll("#attendanceNav .ni")).find(function(el){return el.style.display!=="none"&&(el.getAttribute("onclick")||"").indexOf("goPage")>=0;});
    if(attendanceItem){var match=(attendanceItem.getAttribute("onclick")||"").match(/goPage\('([^']+)'/);if(match)goPage(match[1],attendanceItem);}
  }
};

window.switchPlatformApp=function(){
  if(!user)return;
  var current=window.currentPlatformApp||"attendance";
  var target=current==="attendance"?"behavior":"attendance";
  if(target==="behavior"&&!appHasBehavior()){
    toast(tr("لا تملك صلاحية لتطبيق السلوك","You do not have access to the Behavior app"));return;
  }
  if(target==="attendance"&&!appHasAttendance()){
    toast(tr("لا تملك صلاحية لتطبيق الحضور","You do not have access to the Attendance app"));return;
  }
  window.selectPlatformApp(target,true);
};

function firstPageAllowed(){
  var order=["behavior-dashboard","behavior-log","behavior-positive","behavior-records","behavior-positive-report","behavior-procedures","behavior-reference","behavior-settings"];
  return order.find(function(page){return behaviorPageAllowed(page);})||"behavior-dashboard";
}
function updateActiveAppChip(){
  var button=document.getElementById("activeAppButton");if(!button)return;
  var behavior=window.currentPlatformApp==="behavior";
  button.innerHTML=(behavior?"⭐ ":"📋 ")+"<span>"+esc(behavior?tx("behavior"):tx("attendance"))+"</span> ⇄";
}
function behaviorPermission(page){
  return {
    "behavior-dashboard":"behavior_dashboard","behavior-log":"behavior_record","behavior-positive":"behavior_record",
    "behavior-records":"behavior_reports","behavior-positive-report":"behavior_reports",
    "behavior-procedures":"behavior_reference","behavior-reference":"behavior_reference","behavior-settings":"behavior_manage"
  }[page];
}
function behaviorPageAllowed(page){var permission=behaviorPermission(page);return !permission||hasPermission(permission);}

window.goBehaviorPage=function(page,el){
  if(!behaviorPageAllowed(page)){toast(tr("لا تملك صلاحية لهذه الصفحة","You do not have permission for this page"));return;}
  window.currentPlatformApp="behavior";currentBehaviorPage=page;
  document.querySelectorAll(".page").forEach(function(node){node.classList.remove("active");});
  document.querySelectorAll(".ni").forEach(function(node){node.classList.remove("active");node.removeAttribute("aria-current");});
  var target=document.getElementById("page-"+page);if(!target)return;target.classList.add("active");
  if(el){el.classList.add("active");el.setAttribute("aria-current","page");}
  document.getElementById("pageTitle").textContent={
    "behavior-dashboard":tx("dashboard"),"behavior-log":tx("log"),"behavior-records":tx("records"),"behavior-positive":tx("positive"),
    "behavior-positive-report":tx("positiveReport"),"behavior-procedures":tx("procedures"),"behavior-reference":tx("reference"),"behavior-settings":tx("settings")
  }[page]||tx("behavior");
  renderBehaviorPage(page);document.getElementById("sidebar").classList.remove("open");
};
window.openBehaviorSharedPage=function(page,el){
  if(!pageAllowed(page)){toast(tr("لا تملك صلاحية لهذه الصفحة","You do not have permission for this page"));return;}
  goPage(page,el);window.currentPlatformApp="behavior";currentBehaviorPage="shared-"+page;updateActiveAppChip();
};
window.openBehaviorRosterImport=function(el){
  if(!hasPermission("roster_import")){toast(tr("لا تملك صلاحية الاستيراد","You do not have import permission"));return;}
  openBehaviorSharedPage("students",el);openM("mImport");
};

window.applyBehaviorPermissions=function(){
  document.querySelectorAll("[data-behavior-permission]").forEach(function(el){
    var permission=el.getAttribute("data-behavior-permission");
    el.style.display=hasPermission(permission)?"":"none";
  });
  var a=document.getElementById("attendanceChoice"),b=document.getElementById("behaviorChoice");
  if(a)a.style.display=appHasAttendance()?"flex":"none";if(b)b.style.display=appHasBehavior()?"flex":"none";
};

window.applyBehaviorLanguage=function(){
  if(!initialized)return;
  updateActiveAppChip();
  refreshBehaviorContext();
  if(window.currentPlatformApp==="behavior"&&currentBehaviorPage.indexOf("behavior-")===0){
    var title=document.getElementById("pageTitle");
    if(title)title.textContent={
      "behavior-dashboard":tx("dashboard"),"behavior-log":tx("log"),"behavior-records":tx("records"),"behavior-positive":tx("positive"),
      "behavior-positive-report":tx("positiveReport"),"behavior-procedures":tx("procedures"),"behavior-reference":tx("reference"),"behavior-settings":tx("settings")
    }[currentBehaviorPage]||tx("behavior");
  }
};

window.initBehaviorModule=function(){
  settings();bstate();
  if(!initialized){buildNavigation();buildPages();initialized=true;resetViolationForm();resetPositiveForm();}
  applyBehaviorPermissions();refreshBehaviorContext();
};

function renderBehaviorPage(page){
  if(page==="behavior-dashboard")renderBehaviorDashboard();
  if(page==="behavior-log"){fillBehaviorSelectors();updateViolationCatalog();}
  if(page==="behavior-records")renderBehaviorRecords();
  if(page==="behavior-positive")fillBehaviorSelectors();
  if(page==="behavior-positive-report")renderPositiveReport();
  if(page==="behavior-procedures")renderBehaviorReferences(true);
  if(page==="behavior-reference")renderBehaviorReferences(false);
  if(page==="behavior-settings")renderBehaviorSettings();
}

window.refreshBehaviorContext=function(){
  if(!initialized)return;
  fillBehaviorSelectors();
  if(document.getElementById("behViolationLevel")&&document.getElementById("behViolationLevel").value)updateViolationCatalog();
  renderBehaviorDashboard();renderBehaviorRecords();renderPositiveReport();renderBehaviorReferences(false);renderBehaviorReferences(true);renderBehaviorSettings();
};

function fillOptions(id,items,value){
  var el=document.getElementById(id);if(!el)return;
  el.innerHTML=items.map(function(x){return option(x.value,x.label,value);}).join("");
}
function classOptions(all){
  var items=[{value:"",label:all?tx("all"):tx("select")}];
  visibleClasses().sort(function(a,b){return className(a).localeCompare(className(b),L()==="ar"?"ar":"en");}).forEach(function(c){
    items.push({value:c.id,label:className(c)+" · "+programLabel(c.program)+" · "+tr("صف ","Grade ")+classGrade(c)});
  });
  return items;
}
function fillBehaviorReportPeriod(kind){
  var prefix=kind==="positive"?"behPositive":"behRecord",yearEl=document.getElementById(prefix+"Year"),semesterEl=document.getElementById(prefix+"Semester");if(!yearEl||!semesterEl)return;
  syncActiveAcademicData();
  var years=Object.keys(db.academicYears).sort().reverse(),savedYear=yearEl.value,savedSemester=semesterEl.value;
  var selectedYear=years.includes(savedYear)?savedYear:(years.includes(db.activeAcademicYear)?db.activeAcademicYear:years[0]);
  yearEl.innerHTML=years.map(function(year){return option(year,year,selectedYear);}).join("");
  var selectedSemester=["1","2","both"].includes(savedSemester)?savedSemester:String(db.activeSemester||"1");
  semesterEl.innerHTML=option("both",tr("الفصلان الأول والثاني","Both Semesters"),selectedSemester)+option("1",tr("الفصل الأول","Semester 1"),selectedSemester)+option("2",tr("الفصل الثاني","Semester 2"),selectedSemester);
  var classId=kind==="positive"?"behPositiveFilterClass":"behRecordClass",classEl=document.getElementById(classId),previous=classEl&&classEl.value;
  if(classEl){var classes=behaviorReportClasses(kind).sort(function(a,b){return className(a).localeCompare(className(b),L()==="ar"?"ar":"en");});classEl.innerHTML=option("",tx("all"))+classes.map(function(c){return option(c.id,className(c)+" · "+programLabel(c.program)+" · "+tr("صف ","Grade ")+classGrade(c),previous);}).join("");if(!classes.some(function(c){return c.id===previous;}))classEl.value="";}
}
window.changeBehaviorReportPeriod=function(kind){
  fillBehaviorReportPeriod(kind);
  if(kind==="positive")renderPositiveReport();else renderBehaviorRecords();
};
function responsibleOptions(){
  return [{value:"",label:tx("select")}].concat(settings().responsibles.map(function(r){return{value:r.id,label:L()==="ar"?r.ar:r.en};}));
}
function contactOptions(){return CONTACTS.map(function(c){return{value:c[0],label:L()==="ar"?c[1]:c[2]};});}
function yesOptions(includeNa){
  var arr=[{value:"yes",label:"✅ "+tx("yes")},{value:"no",label:"❌ "+tx("no")}];
  if(includeNa)arr.push({value:"na",label:tx("na")});return arr;
}
function statusOptions(all){
  var arr=all?[{value:"",label:tx("all")}]:[];
  arr.push({value:"open",label:"🔴 "+tx("open")},{value:"follow",label:"🟡 "+tx("follow")},{value:"closed",label:"🟢 "+tx("closed")});return arr;
}
function levelOptions(all){
  var arr=[{value:"",label:all?tx("all"):tx("select")}];
  Object.keys(VIOLATIONS).forEach(function(key){arr.push({value:key,label:key+" — "+levelLabel(key)+" ("+VIOLATIONS[key].deduction+" "+tr("درجة","points")+")"});});return arr;
}
function fillBehaviorSelectors(){
  var saved={};
  ["behViolationClass","behPositiveClass","behRecordClass","behPositiveFilterClass","behViolationLevel","behRecordLevel","behViolationStatus","behRecordStatus","behDocumented","behStudentSigned","behParentNotified","behContactMethod","behResponsible","behPositiveType","behPositivePoints","behPositiveReward","behPositiveParent","behPositiveContact","behPositiveResponsible","behPositiveFilterType"].forEach(function(id){var e=document.getElementById(id);saved[id]=e&&e.value;});
  fillOptions("behViolationClass",classOptions(false),saved.behViolationClass);
  fillOptions("behPositiveClass",classOptions(false),saved.behPositiveClass);
  fillOptions("behRecordClass",classOptions(true),saved.behRecordClass);
  fillOptions("behPositiveFilterClass",classOptions(true),saved.behPositiveFilterClass);
  fillOptions("behViolationLevel",levelOptions(false),saved.behViolationLevel);
  fillOptions("behRecordLevel",levelOptions(true),saved.behRecordLevel);
  fillOptions("behViolationStatus",statusOptions(false),saved.behViolationStatus||"open");
  fillOptions("behRecordStatus",statusOptions(true),saved.behRecordStatus);
  fillOptions("behDocumented",yesOptions(false),saved.behDocumented||"yes");
  fillOptions("behStudentSigned",[{value:"yes",label:"✅ "+tx("yes")},{value:"no",label:"❌ "+tx("no")},{value:"refused",label:tr("رفض التوقيع","Refused to Sign")}],saved.behStudentSigned||"yes");
  fillOptions("behParentNotified",yesOptions(true),saved.behParentNotified||"no");
  fillOptions("behContactMethod",contactOptions(),saved.behContactMethod);
  fillOptions("behResponsible",responsibleOptions(),saved.behResponsible);
  fillOptions("behPositiveType",[{value:"",label:tx("select")}].concat(POSITIVE_BEHAVIORS.map(function(x){return{value:x[0],label:L()==="ar"?x[1]:x[2]};})),saved.behPositiveType);
  fillOptions("behPositiveFilterType",[{value:"",label:tx("all")}].concat(POSITIVE_BEHAVIORS.map(function(x){return{value:x[0],label:L()==="ar"?x[1]:x[2]};})),saved.behPositiveFilterType);
  var points=[{value:"",label:tx("select")}];for(var i=1;i<=10;i++)points.push({value:String(i),label:i+" — "+(i<=2?tr("سلوك بسيط إيجابي","Simple Positive Behavior"):i<=5?tr("سلوك متكرر جيد","Consistently Good Behavior"):i<=8?tr("سلوك مميز","Distinguished Behavior"):tr("سلوك استثنائي 🌟","Exceptional Behavior 🌟"))});
  fillOptions("behPositivePoints",points,saved.behPositivePoints);
  fillOptions("behPositiveReward",[{value:"",label:tx("select")}].concat(REWARD_TYPES.map(function(x){return{value:x[0],label:L()==="ar"?x[1]:x[2]};})),saved.behPositiveReward);
  fillOptions("behPositiveParent",yesOptions(true),saved.behPositiveParent||"no");
  fillOptions("behPositiveContact",contactOptions(),saved.behPositiveContact);
  fillOptions("behPositiveResponsible",responsibleOptions(),saved.behPositiveResponsible);
  fillBehaviorReportPeriod("violations");fillBehaviorReportPeriod("positive");
  fillBehaviorStudents("violation",saved.behViolationStudent);fillBehaviorStudents("positive",saved.behPositiveStudent);
}

window.fillBehaviorStudents=function(kind,selected){
  var classId=document.getElementById(kind==="positive"?"behPositiveClass":"behViolationClass").value;
  var target=document.getElementById(kind==="positive"?"behPositiveStudent":"behViolationStudent");if(!target)return;
  var current=selected||target.value;
  var students=visibleStudents().filter(function(s){return s.classId===classId;}).sort(function(a,b){return a.name.localeCompare(b.name,"ar");});
  target.innerHTML=option("",tx("select"),current)+students.map(function(s){return option(s.id,s.name+(s.schoolId?" · "+s.schoolId:""),current);}).join("");
};

window.updateViolationCatalog=function(){
  var levelEl=document.getElementById("behViolationLevel"),typeEl=document.getElementById("behViolationType");
  if(!levelEl||!typeEl)return;var level=levelEl.value,group=VIOLATIONS[level],saved=typeEl.value;
  var selectedProcedures=Array.from(document.querySelectorAll(".beh-procedure-option:checked")).map(function(el){return el.value;});
  if(!group){typeEl.innerHTML=option("",tr("اختر الدرجة أولاً","Select a level first"));document.getElementById("behProcedureChecks").innerHTML="";document.getElementById("behProcedurePreview").textContent="";return;}
  var items=L()==="ar"?group.itemsAr:group.itemsEn;
  typeEl.innerHTML=option("",tx("select"))+items.map(function(label,index){return option("violation_"+level.toLowerCase()+"_"+String(index+1).padStart(2,"0"),label,saved);}).join("");
  var procs=L()==="ar"?group.procsAr:group.procsEn;
  var custom=settings().customProcedures;
  document.getElementById("behProcedureChecks").innerHTML=procs.map(function(label,index){
    var key="action_"+level.toLowerCase()+"_"+String(index+1).padStart(2,"0");
    return "<label class='beh-check'><input type='checkbox' class='beh-procedure-option' value='"+key+"'"+(selectedProcedures.includes(key)?" checked":"")+"><span>"+esc(label)+"</span></label>";
  }).join("")+custom.map(function(p){var key="custom:"+p.id;return "<label class='beh-check'><input type='checkbox' class='beh-procedure-option' value='"+esc(key)+"'"+(selectedProcedures.includes(key)?" checked":"")+"><span>"+esc(L()==="ar"?p.ar:p.en)+"</span></label>";}).join("");
  document.getElementById("behProcedurePreview").textContent=procs.map(function(p,i){return(i+1)+". "+p;}).join("\n")+"\n"+tr("الحسم: ","Deduction: ")+group.deduction+" "+tr("درجة","points");
};

window.resetViolationForm=function(){
  var id=document.getElementById("behViolationId");if(!id)return;
  id.value="";document.getElementById("behViolationDate").value=todayValue();
  ["behViolationClass","behViolationStudent","behViolationLevel","behViolationType","behContactMethod","behResponsible"].forEach(function(x){var el=document.getElementById(x);if(el)el.value="";});
  ["behViolationDescription","behManualProcedure","behProcedureNotes","behViolationNotes","behContactDate"].forEach(function(x){var el=document.getElementById(x);if(el)el.value="";});
  document.getElementById("behViolationStatus").value="open";document.getElementById("behDocumented").value="yes";document.getElementById("behStudentSigned").value="yes";document.getElementById("behParentNotified").value="no";
  updateViolationCatalog();var button=document.getElementById("behSaveViolation");if(button)button.innerHTML="💾 <span data-ar='حفظ المشكلة' data-en='Save Problem'>"+tr("حفظ المشكلة","Save Problem")+"</span>";
};

window.saveViolationRecord=function(){
  if(!hasPermission("behavior_record"))return;
  var existingId=document.getElementById("behViolationId").value;
  if(existingId&&!hasPermission("behavior_manage"))return;
  var date=document.getElementById("behViolationDate").value,classId=document.getElementById("behViolationClass").value;
  var studentId=document.getElementById("behViolationStudent").value,level=document.getElementById("behViolationLevel").value,type=document.getElementById("behViolationType").value;
  if(!date||!classId||!studentId||!level||!type){toast(tx("required"));return;}
  if(!visibleClassIds().has(classId)){toast(tr("الفصل خارج نطاق صلاحيتك","The class is outside your permission scope"));return;}
  var st=bstate(),existing=existingId?st.violations.find(function(r){return r.id===existingId;}):null;
  var selected=Array.from(document.querySelectorAll(".beh-procedure-option:checked")).map(function(el){return el.value;});
  var record=Object.assign({
    id:existing?existing.id:nextId("violation"),date:date,studentId:studentId,studentName:studentDisplay(studentId),classId:classId,className:classDisplay(classId),
    program:classFor(classId).program||db.activeProgram,grade:classGrade(classFor(classId)),vlevel:level,vlevelLabel:levelLabel(level),vtypeKey:type,vtype:type,
    desc:document.getElementById("behViolationDescription").value.trim(),procedureKeys:selected,procedures:selected,
    manualProcedure:document.getElementById("behManualProcedure").value.trim(),procNotes:document.getElementById("behProcedureNotes").value.trim(),
    documented:document.getElementById("behDocumented").value,studentSigned:document.getElementById("behStudentSigned").value,
    parentNotified:document.getElementById("behParentNotified").value,contactMethod:document.getElementById("behContactMethod").value,
    contactDate:document.getElementById("behContactDate").value,responsible:document.getElementById("behResponsible").value,
    status:document.getElementById("behViolationStatus").value,notes:document.getElementById("behViolationNotes").value.trim(),deduction:VIOLATIONS[level].deduction
  },recordMeta(existing));
  if(existing)Object.assign(existing,record);else st.violations.unshift(record);
  var audit=addAudit(existing?"update-violation":"create-violation",record.id,studentDisplay(studentId));
  window.persistBehaviorRecord("violations",record,false,audit);toast(existing?tx("updated"):tx("saved"));resetViolationForm();renderBehaviorDashboard();renderBehaviorRecords();
};

window.editViolationRecord=function(id){
  if(!hasPermission("behavior_manage"))return;
  var record=bstate().violations.find(function(r){return r.id===id;});if(!record||!allowedBehaviorRecord(record))return;
  goBehaviorPage("behavior-log",document.querySelector("#behaviorNav [onclick*='behavior-log']"));
  document.getElementById("behViolationId").value=record.id;document.getElementById("behViolationDate").value=record.date||todayValue();
  document.getElementById("behViolationClass").value=record.classId||"";fillBehaviorStudents("violation",record.studentId);
  document.getElementById("behViolationStudent").value=record.studentId||"";document.getElementById("behViolationLevel").value=record.vlevel||"";
  updateViolationCatalog();document.getElementById("behViolationType").value=record.vtypeKey||record.vtype||"";
  document.querySelectorAll(".beh-procedure-option").forEach(function(el){el.checked=(record.procedureKeys||record.procedures||[]).includes(el.value);});
  document.getElementById("behViolationDescription").value=record.desc||"";document.getElementById("behManualProcedure").value=record.manualProcedure||"";
  document.getElementById("behProcedureNotes").value=record.procNotes||"";document.getElementById("behDocumented").value=record.documented||"no";
  document.getElementById("behStudentSigned").value=record.studentSigned||"no";document.getElementById("behParentNotified").value=record.parentNotified||"no";
  document.getElementById("behContactMethod").value=record.contactMethod||"";document.getElementById("behContactDate").value=record.contactDate||"";
  document.getElementById("behResponsible").value=record.responsible||"";document.getElementById("behViolationStatus").value=record.status||"open";
  document.getElementById("behViolationNotes").value=record.notes||"";
  document.getElementById("behSaveViolation").innerHTML="💾 <span>"+tr("حفظ التعديلات","Save Changes")+"</span>";window.scrollTo({top:0,behavior:"smooth"});
};
window.deleteViolationRecord=function(id){
  if(!hasPermission("behavior_manage")||!confirm(tx("confirmDelete")))return;
  var st=bstate(),record=st.violations.find(function(r){return r.id===id;});if(!record||!allowedBehaviorRecord(record))return;
  st.violations=st.violations.filter(function(r){return r.id!==id;});var audit=addAudit("delete-violation",id,studentDisplay(record.studentId,record.studentName));window.persistBehaviorRecord("violations",record,true,audit);toast(tx("deleted"));renderBehaviorRecords();renderBehaviorDashboard();
};

function filteredViolationRecords(){
  var list=behaviorReportRecords("violations"),search=(document.getElementById("behRecordSearch")&&document.getElementById("behRecordSearch").value||"").trim().toLowerCase();
  var classId=document.getElementById("behRecordClass")&&document.getElementById("behRecordClass").value||"";
  var level=document.getElementById("behRecordLevel")&&document.getElementById("behRecordLevel").value||"";
  var status=document.getElementById("behRecordStatus")&&document.getElementById("behRecordStatus").value||"";
  var from=document.getElementById("behRecordFrom")&&document.getElementById("behRecordFrom").value||"",to=document.getElementById("behRecordTo")&&document.getElementById("behRecordTo").value||"";
  return list.filter(function(r){
    var hay=[r.id,behaviorReportStudentName(r),behaviorReportClassName(r),violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype),r.desc,r.notes].join(" ").toLowerCase();
    return(!search||hay.indexOf(search)>=0)&&(!classId||r.classId===classId)&&(!level||r.vlevel===level)&&(!status||r.status===status)&&(!from||r.date>=from)&&(!to||r.date<=to);
  }).sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""))||String(b.id).localeCompare(String(a.id));});
}
window.renderBehaviorRecords=function(){
  var body=document.getElementById("behRecordsBody");if(!body)return;var rows=filteredViolationRecords();
  var allRecords=behaviorReportRecords("violations"),editable=behaviorReportEditable("violations"),count=document.getElementById("behRecordCount");if(count)count.textContent=tr("عرض ","Showing ")+rows.length+tr(" من "," of ")+allRecords.length+tr(" سجل"," records");
  body.innerHTML=rows.length?rows.map(function(r){
    var actions=editable&&hasPermission("behavior_manage")?"<div class='beh-table-actions'><button class='beh-btn beh-btn-outline beh-btn-sm' onclick=\"editViolationRecord('"+esc(r.id)+"')\">✏️</button><button class='beh-btn beh-btn-danger beh-btn-sm' onclick=\"deleteViolationRecord('"+esc(r.id)+"')\">🗑️</button></div>":"—";
    return "<tr><td><strong>"+esc(r.id)+"</strong></td><td>"+esc(displayDate(r.date))+"</td><td>"+esc(behaviorReportStudentName(r))+"</td><td>"+esc(behaviorReportClassName(r))+"</td><td><span class='beh-badge beh-level-"+esc(r.vlevel)+"'>"+esc(r.vlevel+" · "+levelLabel(r.vlevel))+"</span></td><td title='"+esc(violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype))+"'>"+esc(violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype))+"</td><td>"+esc(yesNo(r.parentNotified))+"</td><td><span class='beh-badge beh-status-"+esc(r.status||"open")+"'>"+esc(statusLabel(r.status))+"</span></td><td>"+actions+"</td></tr>";
  }).join(""):rowEmpty(9);
};

window.resetPositiveForm=function(){
  var id=document.getElementById("behPositiveId");if(!id)return;id.value="";document.getElementById("behPositiveDate").value=todayValue();
  ["behPositiveClass","behPositiveStudent","behPositiveType","behPositivePoints","behPositiveReward","behPositiveContact","behPositiveResponsible"].forEach(function(x){var el=document.getElementById(x);if(el)el.value="";});
  ["behPositiveDescription","behPositiveRecommendation"].forEach(function(x){var el=document.getElementById(x);if(el)el.value="";});
  document.getElementById("behPositiveParent").value="no";var button=document.getElementById("behSavePositive");if(button)button.innerHTML="💾 <span>"+tr("حفظ السلوك الإيجابي","Save Positive Behavior")+"</span>";
};
window.savePositiveRecord=function(){
  if(!hasPermission("behavior_record"))return;var existingId=document.getElementById("behPositiveId").value;if(existingId&&!hasPermission("behavior_manage"))return;
  var date=document.getElementById("behPositiveDate").value,classId=document.getElementById("behPositiveClass").value,studentId=document.getElementById("behPositiveStudent").value;
  var behaviorType=document.getElementById("behPositiveType").value,points=Number(document.getElementById("behPositivePoints").value),reward=document.getElementById("behPositiveReward").value,desc=document.getElementById("behPositiveDescription").value.trim();
  if(!date||!classId||!studentId||!behaviorType||!points||!reward||!desc){toast(tx("required"));return;}
  if(!visibleClassIds().has(classId)){toast(tr("الفصل خارج نطاق صلاحيتك","The class is outside your permission scope"));return;}
  var st=bstate(),existing=existingId?st.positives.find(function(r){return r.id===existingId;}):null;
  var record=Object.assign({
    id:existing?existing.id:nextId("positive"),date:date,studentId:studentId,studentName:studentDisplay(studentId),classId:classId,className:classDisplay(classId),
    program:classFor(classId).program||db.activeProgram,grade:classGrade(classFor(classId)),behaviorTypeKey:behaviorType,behaviorType:behaviorType,
    desc:desc,points:points,rewardTypeKey:reward,rewardType:reward,parentNotified:document.getElementById("behPositiveParent").value,
    contactMethod:document.getElementById("behPositiveContact").value,responsible:document.getElementById("behPositiveResponsible").value,
    recommendation:document.getElementById("behPositiveRecommendation").value.trim()
  },recordMeta(existing));
  if(existing)Object.assign(existing,record);else st.positives.unshift(record);
  var audit=addAudit(existing?"update-positive":"create-positive",record.id,studentDisplay(studentId));window.persistBehaviorRecord("positives",record,false,audit);toast(existing?tx("updated"):tx("saved"));resetPositiveForm();renderPositiveReport();renderBehaviorDashboard();
};
window.editPositiveRecord=function(id){
  if(!hasPermission("behavior_manage"))return;var r=bstate().positives.find(function(x){return x.id===id;});if(!r||!allowedBehaviorRecord(r))return;
  goBehaviorPage("behavior-positive",document.querySelector("#behaviorNav [onclick*='behavior-positive']"));
  document.getElementById("behPositiveId").value=r.id;document.getElementById("behPositiveDate").value=r.date||todayValue();document.getElementById("behPositiveClass").value=r.classId||"";
  fillBehaviorStudents("positive",r.studentId);document.getElementById("behPositiveStudent").value=r.studentId||"";document.getElementById("behPositiveType").value=r.behaviorTypeKey||r.behaviorType||"";
  document.getElementById("behPositivePoints").value=String(r.points||"");document.getElementById("behPositiveReward").value=r.rewardTypeKey||r.rewardType||"";
  document.getElementById("behPositiveDescription").value=r.desc||"";document.getElementById("behPositiveParent").value=r.parentNotified||"no";document.getElementById("behPositiveContact").value=r.contactMethod||"";
  document.getElementById("behPositiveResponsible").value=r.responsible||"";document.getElementById("behPositiveRecommendation").value=r.recommendation||"";
  document.getElementById("behSavePositive").innerHTML="💾 <span>"+tr("حفظ التعديلات","Save Changes")+"</span>";window.scrollTo({top:0,behavior:"smooth"});
};
window.deletePositiveRecord=function(id){
  if(!hasPermission("behavior_manage")||!confirm(tx("confirmDelete")))return;var st=bstate(),record=st.positives.find(function(r){return r.id===id;});if(!record||!allowedBehaviorRecord(record))return;
  st.positives=st.positives.filter(function(r){return r.id!==id;});var audit=addAudit("delete-positive",id,studentDisplay(record.studentId,record.studentName));window.persistBehaviorRecord("positives",record,true,audit);toast(tx("deleted"));renderPositiveReport();renderBehaviorDashboard();
};

function filteredPositiveRecords(){
  var list=behaviorReportRecords("positive"),search=(document.getElementById("behPositiveSearch")&&document.getElementById("behPositiveSearch").value||"").trim().toLowerCase();
  var classId=document.getElementById("behPositiveFilterClass")&&document.getElementById("behPositiveFilterClass").value||"",type=document.getElementById("behPositiveFilterType")&&document.getElementById("behPositiveFilterType").value||"";
  var from=document.getElementById("behPositiveFrom")&&document.getElementById("behPositiveFrom").value||"",to=document.getElementById("behPositiveTo")&&document.getElementById("behPositiveTo").value||"";
  return list.filter(function(r){
    var hay=[r.id,behaviorReportStudentName(r),behaviorReportClassName(r),tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType),r.desc].join(" ").toLowerCase();
    return(!search||hay.indexOf(search)>=0)&&(!classId||r.classId===classId)&&(!type||(r.behaviorTypeKey||r.behaviorType)===type)&&(!from||r.date>=from)&&(!to||r.date<=to);
  }).sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""))||String(b.id).localeCompare(String(a.id));});
}
window.renderPositiveReport=function(){
  var body=document.getElementById("behPositiveBody");if(!body)return;var rows=filteredPositiveRecords(),points=rows.reduce(function(sum,r){return sum+(Number(r.points)||0);},0),students=new Set(rows.map(function(r){return r.studentId||r.studentName;})).size,parent=rows.filter(function(r){return r.parentNotified==="yes";}).length;
  document.getElementById("behPositiveStats").innerHTML=[
    ["⭐",rows.length,tr("سلوك إيجابي","Positive Records"),"green","records"],["🏆",points,tr("نقاط التعزيز","Reinforcement Points"),"gold","points"],["👤",students,tr("طلاب مميزون","Distinguished Students"),"","students"],["📱",parent,tr("أُشعر ولي الأمر","Parent Notified"),"green","parent"]
  ].map(function(k){return reportKpi(k[0],k[1],k[2],k[3],k[4]);}).join("");
  document.getElementById("behPositiveCount").textContent=tr("عرض ","Showing ")+rows.length+tr(" من "," of ")+behaviorReportRecords("positive").length;
  body.innerHTML=rows.length?rows.map(function(r){
    var actions=behaviorReportEditable("positive")&&hasPermission("behavior_manage")?"<div class='beh-table-actions'><button class='beh-btn beh-btn-outline beh-btn-sm' onclick=\"editPositiveRecord('"+esc(r.id)+"')\">✏️</button><button class='beh-btn beh-btn-danger beh-btn-sm' onclick=\"deletePositiveRecord('"+esc(r.id)+"')\">🗑️</button></div>":"—";
    return "<tr><td><strong>"+esc(r.id)+"</strong></td><td>"+esc(displayDate(r.date))+"</td><td>"+esc(behaviorReportStudentName(r))+"</td><td>"+esc(behaviorReportClassName(r))+"</td><td>"+esc(tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType))+"</td><td><span class='beh-badge beh-positive'>+"+esc(r.points)+"</span></td><td>"+esc(tupleLabel(REWARD_TYPES,r.rewardTypeKey||r.rewardType))+"</td><td>"+actions+"</td></tr>";
  }).join(""):rowEmpty(8);
  renderBehaviorStudentCards(rows);
};
function renderBehaviorStudentCards(rows){
  var target=document.getElementById("behStudentCards");if(!target)return;var map={};
  rows.forEach(function(r){var key=r.studentId||r.studentName;if(!map[key])map[key]={key:key,studentId:r.studentId,name:behaviorReportStudentName(r),points:0,count:0,last:""};map[key].points+=Number(r.points)||0;map[key].count++;if(!map[key].last||r.date>map[key].last)map[key].last=r.date;});
  var cards=Object.values(map).sort(function(a,b){return b.points-a.points;});
  target.innerHTML=cards.length?cards.map(function(s){return "<div class='beh-student-card beh-student-card-action' role='button' tabindex='0' onclick=\"openBehaviorReportStudentDetails(decodeURIComponent('"+encodeURIComponent(s.key)+"'))\" onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();openBehaviorReportStudentDetails(decodeURIComponent('"+encodeURIComponent(s.key)+"'))}\"><strong>"+esc(s.name)+"</strong><div class='score'>"+s.points+" "+tr("نقطة","points")+"</div><small>"+s.count+" "+tr("سجل · آخر تعزيز ","records · last reinforcement ")+displayDate(s.last)+"</small></div>";}).join(""):"<div class='beh-empty'>"+esc(tx("noData"))+"</div>";
}

function reportKpi(icon,value,label,color,type){return "<div class='beh-kpi beh-kpi-action "+color+"' role='button' tabindex='0' aria-label='"+esc(label+": "+value)+"' onclick=\"openBehaviorReportCard('"+type+"')\" onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();openBehaviorReportCard('"+type+"')}\"><span class='beh-kpi-icon'>"+icon+"</span><div><strong>"+value+"</strong><small>"+esc(label)+"</small></div><span class='beh-kpi-arrow'>›</span></div>";}
function positiveDetailRows(items){return items.map(function(r){return[r.id||"—",displayDate(r.date),behaviorReportStudentName(r),behaviorReportClassName(r),tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType),Number(r.points)||0,yesNo(r.parentNotified)];});}
function positiveReportScope(){var period=behaviorReportPeriod("positive");return typeof dashboardScopeText==="function"?dashboardScopeText(period):"";}
window.openBehaviorReportCard=function(type){
  if(!hasPermission("behavior_reports")||typeof window.showDashboardDetails!=="function")return;
  var all=filteredPositiveRecords(),items=all,title="",icon="",summary="",headers=[tr("الرقم","No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("نوع السلوك","Behavior Type"),tr("النقاط","Points"),tr("ولي الأمر","Parent")],rows=[];
  if(type==="records"){icon="⭐";title=tr("السلوك الإيجابي","Positive Records");rows=positiveDetailRows(items);}
  else if(type==="points"){icon="🏆";title=tr("نقاط التعزيز","Reinforcement Points");rows=positiveDetailRows(items);summary=items.reduce(function(total,r){return total+(Number(r.points)||0);},0)+" "+tr("نقطة ضمن النتائج المفلترة","points in the filtered results");}
  else if(type==="parent"){icon="📱";title=tr("أُشعر ولي الأمر","Parent Notified");items=all.filter(function(r){return r.parentNotified==="yes";});rows=positiveDetailRows(items);}
  else if(type==="students"){
    icon="👤";title=tr("طلاب مميزون","Distinguished Students");headers=[tr("الطالب","Student"),tr("الفصل","Class"),tr("السجلات","Records"),tr("مجموع النقاط","Total Points")];var map={};
    all.forEach(function(r){var key=r.studentId||r.studentName;if(!map[key])map[key]={name:behaviorReportStudentName(r),className:behaviorReportClassName(r),count:0,points:0};map[key].count++;map[key].points+=Number(r.points)||0;});rows=Object.values(map).sort(function(a,b){return b.points-a.points;}).map(function(item){return[item.name,item.className,item.count,item.points];});
  }else return;
  window.showDashboardDetails({icon:icon,title:title,headers:headers,rows:rows,summary:summary,scope:positiveReportScope()});
};
window.openBehaviorReportStudentDetails=function(studentKey){
  if(!hasPermission("behavior_reports")||typeof window.showDashboardDetails!=="function")return;var all=filteredPositiveRecords(),items=all.filter(function(r){return(r.studentId||r.studentName)===studentKey;}),name=items.length?behaviorReportStudentName(items[0]):tr("الطالب","Student");
  window.showDashboardDetails({icon:"👤",title:name,headers:[tr("الرقم","No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("نوع السلوك","Behavior Type"),tr("النقاط","Points"),tr("ولي الأمر","Parent")],rows:positiveDetailRows(items),scope:positiveReportScope()});
};

window.renderBehaviorDashboard=function(){
  var target=document.getElementById("behDashboard");if(!target)return;var v=visibleViolations(),p=visiblePositives();
  var open=v.filter(function(r){return(r.status||"open")==="open";}).length,follow=v.filter(function(r){return r.status==="follow";}).length,closed=v.filter(function(r){return r.status==="closed";}).length;
  var unique=new Set(v.map(function(r){return r.studentId||r.studentName;})).size,points=p.reduce(function(s,r){return s+(Number(r.points)||0);},0);
  var recent=v.slice().sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));}).slice(0,6);
  var maxLevel=Math.max(1,Object.keys(VIOLATIONS).reduce(function(m,key){return Math.max(m,v.filter(function(r){return r.vlevel===key;}).length);},0));
  target.innerHTML=
    "<div class='behavior-hero'><div><h3>"+esc(tx("dashboard"))+"</h3><p>"+esc(tr("متابعة المشكلات والسلوك الإيجابي ضمن البرنامج والسنة والفصل الدراسي المفتوح.","Monitor problems and positive behavior within the selected program, year, and semester."))+"</p></div><div class='behavior-hero-actions'>"+(hasPermission("behavior_record")?"<button class='beh-btn beh-btn-gold' onclick=\"goBehaviorPage('behavior-log',document.querySelector('#behaviorNav [onclick*=behavior-log]'))\">➕ "+esc(tx("log"))+"</button><button class='beh-btn beh-btn-light' onclick=\"goBehaviorPage('behavior-positive',document.querySelector('#behaviorNav [onclick*=behavior-positive]'))\">⭐ "+esc(tx("positive"))+"</button>":"")+"</div></div>"+
    "<div class='beh-kpis'>"+
      kpi("⚠️",v.length,tr("إجمالي المشكلات","Total Problems"),"red","problems")+kpi("👤",unique,tr("طلاب لديهم مشكلات","Students with Problems"),"","students")+kpi("🔴",open,tr("حالات مفتوحة","Open Cases"),"red","open")+kpi("🟡",follow,tr("قيد المتابعة","Under Follow-up"),"orange","follow")+
      kpi("🟢",closed,tr("حالات مغلقة","Closed Cases"),"green","closed")+kpi("⭐",p.length,tr("سلوك إيجابي","Positive Records"),"green","positive")+kpi("🏆",points,tr("نقاط التعزيز","Reinforcement Points"),"gold","points")+kpi("📱",v.filter(function(r){return r.parentNotified==="yes";}).length,tr("إشعار ولي الأمر","Parent Notified"),"","parent")+
    "</div><div class='beh-grid-2'><div class='beh-panel'><div class='beh-panel-head'><h3>"+esc(tr("توزيع المشكلات حسب الدرجة","Problems by Level"))+"</h3></div><div class='beh-panel-body'><div class='beh-level-bars'>"+
      Object.keys(VIOLATIONS).map(function(key){var count=v.filter(function(r){return r.vlevel===key;}).length,label=key+" · "+levelLabel(key)+": "+count;return "<div class='beh-level-row dashboard-chart-action' role='button' tabindex='0' aria-label='"+esc(label)+"' onclick=\"openBehaviorDashboardDetails('level-"+esc(key)+"')\" onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();openBehaviorDashboardDetails('level-"+esc(key)+"')}\"><span>"+esc(key+" · "+levelLabel(key))+"</span><div class='beh-level-track'><div class='beh-level-fill' style='width:"+Math.round(count/maxLevel*100)+"%'></div></div><strong>"+count+"</strong></div>";}).join("")+
    "</div></div></div><div class='beh-panel'><div class='beh-panel-head'><h3>"+esc(tr("أحدث الحالات","Recent Cases"))+"</h3><button class='beh-btn beh-btn-outline beh-btn-sm' onclick=\"goBehaviorPage('behavior-records',document.querySelector('#behaviorNav [onclick*=behavior-records]'))\">"+esc(tr("عرض الكل","View All"))+"</button></div><div class='beh-panel-body'><div class='beh-recent'>"+
      (recent.length?recent.map(function(r){return "<div class='beh-recent-item'><span class='beh-badge beh-level-"+esc(r.vlevel)+"'>"+esc(r.vlevel)+"</span><div><strong>"+esc(studentDisplay(r.studentId,r.studentName))+"</strong><small>"+esc(violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype))+"</small></div><small>"+esc(displayDate(r.date))+"</small></div>";}).join(""):"<div class='beh-empty'>"+esc(tx("noData"))+"</div>")+
    "</div></div></div></div>";
}
function kpi(icon,value,label,color,type){return "<div class='beh-kpi beh-kpi-action "+color+"' role='button' tabindex='0' aria-label='"+esc(label+": "+value)+"' onclick=\"openBehaviorDashboardDetails('"+type+"')\" onkeydown=\"if(event.key==='Enter'||event.key===' '){event.preventDefault();openBehaviorDashboardDetails('"+type+"')}\"><span class='beh-kpi-icon'>"+icon+"</span><div><strong>"+value+"</strong><small>"+esc(label)+"</small></div><span class='beh-kpi-arrow'>›</span></div>";}

window.openBehaviorDashboardDetails=function(type){
  if(!hasPermission("behavior_dashboard")||typeof window.showDashboardDetails!=="function")return;
  var violations=visibleViolations(),positives=visiblePositives(),records=[],headers=[],title="",icon="",summary="";
  var canSeeRecords=hasPermission("behavior_record")||hasPermission("behavior_manage")||hasPermission("behavior_reports");
  if(!canSeeRecords){
    var source=[],valueFor=function(){return 1;},uniqueStudents=false,labels={problems:["⚠️",tr("إجمالي المشكلات","Total Problems")],students:["👤",tr("طلاب لديهم مشكلات","Students with Problems")],open:["🔴",tr("حالات مفتوحة","Open Cases")],follow:["🟡",tr("قيد المتابعة","Under Follow-up")],closed:["🟢",tr("حالات مغلقة","Closed Cases")],positive:["⭐",tr("سلوك إيجابي","Positive Records")],points:["🏆",tr("نقاط التعزيز","Reinforcement Points")],parent:["📱",tr("إشعار ولي الأمر","Parent Notified")]};
    if(type==="positive"||type==="points")source=positives;
    else if(type==="students"){source=violations;uniqueStudents=true;}
    else if(type==="open"||type==="follow"||type==="closed")source=violations.filter(function(r){return(r.status||"open")===type;});
    else if(type==="parent")source=violations.filter(function(r){return r.parentNotified==="yes";});
    else if(type.indexOf("level-")===0){source=violations.filter(function(r){return r.vlevel===type.slice(6);});labels[type]=["📊",type.slice(6)+" · "+levelLabel(type.slice(6))];}
    else source=violations;
    if(type==="points")valueFor=function(r){return Number(r.points)||0;};
    var grouped={};source.forEach(function(r){var key=r.classId||"unknown";if(!grouped[key])grouped[key]={className:classDisplay(r.classId,r.className),value:0,students:{}};if(uniqueStudents)grouped[key].students[r.studentId||r.studentName]=true;else grouped[key].value+=valueFor(r);});
    records=Object.values(grouped).map(function(item){return[item.className,uniqueStudents?Object.keys(item.students).length:item.value];});var selectedAggregate=labels[type]||labels.problems;
    window.showDashboardDetails({icon:selectedAggregate[0],title:selectedAggregate[1],headers:[tr("الفصل","Class"),type==="points"?tr("النقاط","Points"):type==="students"?tr("الطلاب","Students"):tr("العدد","Count")],rows:records});return;
  }
  var problemRows=function(items){return items.slice().sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));}).map(function(r){return[r.id||"—",displayDate(r.date),studentDisplay(r.studentId,r.studentName),classDisplay(r.classId,r.className),violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype),statusLabel(r.status)];});};
  if(type==="problems"||type==="open"||type==="follow"||type==="closed"||type==="parent"||type.indexOf("level-")===0){
    var filtered=violations;
    if(type==="open"||type==="follow"||type==="closed")filtered=violations.filter(function(r){return(r.status||"open")===type;});
    if(type==="parent")filtered=violations.filter(function(r){return r.parentNotified==="yes";});
    if(type.indexOf("level-")===0)filtered=violations.filter(function(r){return r.vlevel===type.slice(6);});
    var labels={problems:["⚠️",tr("إجمالي المشكلات","Total Problems")],open:["🔴",tr("حالات مفتوحة","Open Cases")],follow:["🟡",tr("قيد المتابعة","Under Follow-up")],closed:["🟢",tr("حالات مغلقة","Closed Cases")],parent:["📱",tr("إشعار ولي الأمر","Parent Notified")]};
    var selected=labels[type]||["📊",type.slice(6)+" · "+levelLabel(type.slice(6))];
    icon=selected[0];title=selected[1];headers=[tr("رقم الحالة","Case No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("المشكلة","Problem"),tr("الحالة","Status")];records=problemRows(filtered);
  }else if(type==="students"){
    icon="👤";title=tr("طلاب لديهم مشكلات","Students with Problems");headers=[tr("الطالب","Student"),tr("الفصل","Class"),tr("عدد المشكلات","Problems"),tr("آخر حالة","Latest Case")];
    var studentMap={};violations.forEach(function(r){var key=r.studentId||r.studentName;if(!studentMap[key])studentMap[key]={name:studentDisplay(r.studentId,r.studentName),className:classDisplay(r.classId,r.className),count:0,last:""};studentMap[key].count++;if(!studentMap[key].last||r.date>studentMap[key].last)studentMap[key].last=r.date;});
    records=Object.values(studentMap).sort(function(a,b){return b.count-a.count;}).map(function(item){return[item.name,item.className,item.count,displayDate(item.last)];});
  }else if(type==="positive"){
    icon="⭐";title=tr("السلوك الإيجابي","Positive Records");headers=[tr("الرقم","No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("نوع السلوك","Behavior Type"),tr("النقاط","Points")];
    records=positives.slice().sort(function(a,b){return String(b.date||"").localeCompare(String(a.date||""));}).map(function(r){return[r.id||"—",displayDate(r.date),studentDisplay(r.studentId,r.studentName),classDisplay(r.classId,r.className),tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType),Number(r.points)||0];});
  }else if(type==="points"){
    icon="🏆";title=tr("نقاط التعزيز","Reinforcement Points");headers=[tr("الطالب","Student"),tr("الفصل","Class"),tr("السجلات","Records"),tr("مجموع النقاط","Total Points")];
    var pointsMap={};positives.forEach(function(r){var key=r.studentId||r.studentName;if(!pointsMap[key])pointsMap[key]={name:studentDisplay(r.studentId,r.studentName),className:classDisplay(r.classId,r.className),count:0,points:0};pointsMap[key].count++;pointsMap[key].points+=Number(r.points)||0;});
    records=Object.values(pointsMap).sort(function(a,b){return b.points-a.points;}).map(function(item){return[item.name,item.className,item.count,item.points];});
    summary=positives.reduce(function(total,r){return total+(Number(r.points)||0);},0)+" "+tr("نقطة ضمن صلاحياتك","points within your access");
  }else return;
  window.showDashboardDetails({icon:icon,title:title,headers:headers,rows:records,summary:summary});
};

function renderBehaviorReferences(proceduresOnly){
  var target=document.getElementById(proceduresOnly?"behProceduresGrid":"behReferenceGrid");if(!target)return;
  target.innerHTML=Object.keys(VIOLATIONS).map(function(key){var group=VIOLATIONS[key],items=L()==="ar"?group.itemsAr:group.itemsEn,procs=L()==="ar"?group.procsAr:group.procsEn;
    return "<article class='beh-reference'><div class='beh-reference-head'><h4>"+esc(key+" — "+levelLabel(key))+"</h4><span class='beh-badge' style='background:rgba(255,255,255,.16);color:white'>"+group.deduction+" "+esc(tr("درجة حسم","points deducted"))+"</span></div><div class='beh-reference-body'>"+
      (proceduresOnly?"":"<h4 style='margin-bottom:8px'>"+esc(tr("أنواع المشكلات","Problem Types"))+"</h4><ol>"+items.map(function(x){return"<li>"+esc(x)+"</li>";}).join("")+"</ol>")+
      "<div class='beh-reference-procs'><h4 style='margin-bottom:8px'>"+esc(tr("التدخلات المعتمدة","Approved Interventions"))+"</h4><ol>"+procs.map(function(x){return"<li>"+esc(x)+"</li>";}).join("")+"</ol></div></div></article>";
  }).join("");
}

function actionLabel(action){
  var map={
    "create-violation":["إضافة مشكلة","Created problem"],"update-violation":["تعديل مشكلة","Updated problem"],"delete-violation":["حذف مشكلة","Deleted problem"],
    "create-positive":["إضافة سلوك إيجابي","Created positive behavior"],"update-positive":["تعديل سلوك إيجابي","Updated positive behavior"],"delete-positive":["حذف سلوك إيجابي","Deleted positive behavior"],
    "settings":["تحديث إعدادات السلوك","Updated behavior settings"]
  };var x=map[action]||[action,action];return L()==="ar"?x[0]:x[1];
}
window.renderBehaviorSettings=function(){
  var resp=document.getElementById("behResponsibleList");if(!resp)return;var s=settings();
  resp.innerHTML=s.responsibles.map(function(r){return "<div class='beh-recent-item'><span>👤</span><div><strong>"+esc(L()==="ar"?r.ar:r.en)+"</strong><small>"+esc(L()==="ar"?r.en:r.ar)+"</small></div>"+(DEFAULT_RESPONSIBLES.some(function(x){return x.id===r.id;})?"":"<button class='beh-btn beh-btn-danger beh-btn-sm' data-behavior-permission='settings' onclick=\"deleteBehaviorResponsible('"+esc(r.id)+"')\">🗑️</button>")+"</div>";}).join("");
  document.getElementById("behCustomProcedureList").innerHTML=s.customProcedures.length?s.customProcedures.map(function(p){return "<div class='beh-recent-item'><span>📌</span><div><strong>"+esc(L()==="ar"?p.ar:p.en)+"</strong><small>"+esc(L()==="ar"?p.en:p.ar)+"</small></div><button class='beh-btn beh-btn-danger beh-btn-sm' data-behavior-permission='settings' onclick=\"deleteBehaviorProcedure('"+esc(p.id)+"')\">🗑️</button></div>";}).join(""):"<div class='beh-empty'>"+esc(tx("noData"))+"</div>";
  var audit=document.getElementById("behAuditLog"),rows=bstate().audit||[];
  audit.innerHTML=rows.length?rows.map(function(a){return "<div class='beh-audit-item'><strong>"+esc(actionLabel(a.action))+" · "+esc(a.targetId||"")+"</strong><div>"+esc(a.details||"")+"</div><small>"+esc(a.actorName||a.actorEmail||"")+" · "+esc(new Date(a.at).toLocaleString(L()==="ar"?"ar-SA":"en-GB"))+"</small></div>";}).join(""):"<div class='beh-empty'>"+esc(tx("noData"))+"</div>";
  applyBehaviorPermissions();
};
window.addBehaviorResponsible=function(){
  if(!hasPermission("settings"))return;var ar=document.getElementById("behResponsibleAr").value.trim(),en=document.getElementById("behResponsibleEn").value.trim();if(!ar||!en){toast(tx("required"));return;}
  settings().responsibles.push({id:"resp-"+Date.now(),ar:ar,en:en});document.getElementById("behResponsibleAr").value="";document.getElementById("behResponsibleEn").value="";addAudit("settings","responsibles",ar);save();fillBehaviorSelectors();renderBehaviorSettings();
};
window.deleteBehaviorResponsible=function(id){
  if(!hasPermission("settings"))return;settings().responsibles=settings().responsibles.filter(function(r){return r.id!==id;});addAudit("settings","responsibles",id);save();fillBehaviorSelectors();renderBehaviorSettings();
};
window.addBehaviorProcedure=function(){
  if(!hasPermission("settings"))return;var ar=document.getElementById("behProcedureAr").value.trim(),en=document.getElementById("behProcedureEn").value.trim();if(!ar||!en){toast(tx("required"));return;}
  settings().customProcedures.push({id:"proc-"+Date.now(),ar:ar,en:en});document.getElementById("behProcedureAr").value="";document.getElementById("behProcedureEn").value="";addAudit("settings","procedures",ar);save();updateViolationCatalog();renderBehaviorSettings();
};
window.deleteBehaviorProcedure=function(id){
  if(!hasPermission("settings"))return;settings().customProcedures=settings().customProcedures.filter(function(p){return p.id!==id;});addAudit("settings","procedures",id);save();updateViolationCatalog();renderBehaviorSettings();
};

function behaviorReportRows(kind){
  var period=behaviorReportPeriod(kind);
  var context=[
    [localizedSchoolName()],[tr("النظام","System"),tr("السلوك والمواظبة","Behavior")],[tr("السنة الدراسية","Academic Year"),period.academicYear],
    [tr("الفصل الدراسي","Semester"),behaviorSemesterLabel(period)],[tr("البرنامج","Program"),programLabel(db.activeProgram)],[tr("تاريخ التصدير","Generated"),new Date().toLocaleString(L()==="ar"?"ar-SA":"en-GB")],[]
  ];
  if(kind==="positive"){
    var p=filteredPositiveRecords();context.push([tr("الرقم","No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الرقم المدرسي","School ID"),tr("الفصل","Class"),tr("نوع السلوك","Behavior Type"),tr("النقاط","Points"),tr("التعزيز","Reward"),tr("ولي الأمر","Parent"),tr("المسؤول","Responsible"),tr("الوصف","Description"),tr("التوصية","Recommendation")]);
    return context.concat(p.map(function(r){return[r.id,r.date,behaviorReportStudentName(r),behaviorReportStudent(r).schoolId||"",behaviorReportClassName(r),tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType),r.points,tupleLabel(REWARD_TYPES,r.rewardTypeKey||r.rewardType),yesNo(r.parentNotified),responsibleLabel(r.responsible),r.desc||"",r.recommendation||""];}));
  }
  var v=filteredViolationRecords();context.push([tr("رقم الحالة","Case No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الرقم المدرسي","School ID"),tr("الفصل","Class"),tr("الدرجة","Level"),tr("المشكلة","Problem"),tr("الحسم","Deduction"),tr("الإجراءات","Interventions"),tr("التوثيق","Documented"),tr("ولي الأمر","Parent"),tr("الحالة","Status"),tr("المسؤول","Responsible"),tr("الملاحظات","Notes")]);
  return context.concat(v.map(function(r){return[r.id,r.date,behaviorReportStudentName(r),behaviorReportStudent(r).schoolId||"",behaviorReportClassName(r),r.vlevel+" · "+levelLabel(r.vlevel),violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype),r.deduction,(r.procedureKeys||r.procedures||[]).map(function(x){return procedureLabel(r.vlevel,x);}).concat(r.manualProcedure?[r.manualProcedure]:[]).join(" | "),yesNo(r.documented),yesNo(r.parentNotified),statusLabel(r.status),responsibleLabel(r.responsible),r.notes||""];}));
}
window.exportBehaviorExcel=async function(kind){
  if(!hasPermission("behavior_reports")){toast(tr("لا تملك صلاحية تقارير السلوك","You do not have Behavior Reports permission"));return;}
  try{
    var XLSXLib=await ensureXlsxLibrary(),rows=behaviorReportRows(kind),sheet=XLSXLib.utils.aoa_to_sheet(rows),book=XLSXLib.utils.book_new();
    sheet["!cols"]=Array.from({length:Math.max.apply(null,rows.map(function(r){return r.length;}))},function(_,i){return{wch:Math.min(45,Math.max(12,rows.reduce(function(m,r){return Math.max(m,String(r[i]||"").length);},0)+2))};});
    XLSXLib.utils.book_append_sheet(book,sheet,kind==="positive"?tr("السلوك الإيجابي","Positive Behavior"):tr("المشكلات","Problems"));
    var period=behaviorReportPeriod(kind);XLSXLib.writeFile(book,(kind==="positive"?"positive-behavior":"behavior-problems")+"-"+period.academicYear+"-"+period.semester+".xlsx");
  }catch(error){toast(error&&error.message||tr("تعذر إنشاء ملف Excel","Could not create the Excel file"));}
};

function printTable(kind){
  var positive=kind==="positive",records=positive?filteredPositiveRecords():filteredViolationRecords();
  var heads=positive?[tr("الرقم","No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("نوع السلوك","Behavior Type"),tr("النقاط","Points"),tr("التعزيز","Reward")]:[tr("رقم الحالة","Case No."),tr("التاريخ","Date"),tr("الطالب","Student"),tr("الفصل","Class"),tr("الدرجة","Level"),tr("المشكلة","Problem"),tr("ولي الأمر","Parent"),tr("الحالة","Status")];
  var body=records.map(function(r){var cells=positive?[r.id,displayDate(r.date),behaviorReportStudentName(r),behaviorReportClassName(r),tupleLabel(POSITIVE_BEHAVIORS,r.behaviorTypeKey||r.behaviorType),r.points,tupleLabel(REWARD_TYPES,r.rewardTypeKey||r.rewardType)]:[r.id,displayDate(r.date),behaviorReportStudentName(r),behaviorReportClassName(r),r.vlevel+" · "+levelLabel(r.vlevel),violationTypeLabel(r.vlevel,r.vtypeKey||r.vtype),yesNo(r.parentNotified),statusLabel(r.status)];return"<tr>"+cells.map(function(x){return"<td>"+esc(x)+"</td>";}).join("")+"</tr>";}).join("");
  return "<table><thead><tr>"+heads.map(function(h){return"<th>"+esc(h)+"</th>";}).join("")+"</tr></thead><tbody>"+(body||"<tr><td colspan='"+heads.length+"'>"+esc(tx("noData"))+"</td></tr>")+"</tbody></table>";
}
window.printBehaviorReport=function(kind){
  if(!hasPermission("behavior_reports")){toast(tr("لا تملك صلاحية تقارير السلوك","You do not have Behavior Reports permission"));return;}
  var popup=window.open("","_blank","width=1100,height=800");if(!popup){toast(tr("اسمح بالنوافذ المنبثقة للطباعة","Allow pop-ups to print"));return;}popup.opener=null;
  var title=kind==="positive"?tx("positiveReport"):tx("records"),header=new URL(L()==="ar"?"/print-header-ar.png":"/print-header-en.png",location.href).href,period=behaviorReportPeriod(kind);
  var html="<!doctype html><html lang='"+L()+"' dir='"+(L()==="ar"?"rtl":"ltr")+"'><head><meta charset='utf-8'><title>"+esc(title)+"</title><style>@page{size:A4 landscape;margin:9mm}*{box-sizing:border-box}body{font-family:Arial,Tahoma,sans-serif;color:#17263a;margin:0;font-size:8pt}.header{width:100%;height:auto;max-height:34mm;object-fit:contain;margin-bottom:3mm}.meta{display:flex;justify-content:space-between;gap:8px;border:1px solid #b9c8d7;background:#f6f9fc;padding:6px 8px;margin-bottom:3mm;font-size:7.5pt}.title{text-align:center;font-size:14pt;color:#173b61;margin:2mm 0 3mm}table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#173b61;color:white}th,td{border:1px solid #aebdca;padding:4px;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid;page-break-inside:avoid}thead{display:table-header-group}.footer{margin-top:3mm;text-align:center;color:#667788;font-size:7pt}@media print{button{display:none}}</style></head><body><img class='header' src='"+header+"'><h1 class='title'>"+esc(title)+"</h1><div class='meta'><span>"+esc(tr("السنة الدراسية","Academic Year")+": "+period.academicYear)+"</span><span>"+esc(tr("الفصل الدراسي","Semester")+": "+behaviorSemesterLabel(period))+"</span><span>"+esc(tr("البرنامج","Program")+": "+programLabel(db.activeProgram))+"</span><span>"+esc(tr("التاريخ","Date")+": "+new Date().toLocaleDateString(L()==="ar"?"ar-SA":"en-GB"))+"</span></div>"+printTable(kind)+"<div class='footer'>"+esc(localizedSchoolName())+"</div></body></html>";
  popup.document.open();popup.document.write(html);popup.document.close();popup.onafterprint=function(){popup.close();};
  var startPrint=function(){setTimeout(function(){popup.focus();popup.print();},100);},image=popup.document.querySelector(".header");if(image&&image.decode)image.decode().catch(function(){}).finally(startPrint);else setTimeout(startPrint,250);
};

document.addEventListener("DOMContentLoaded",function(){
  if(typeof user!=="undefined"&&user&&typeof db!=="undefined"&&db.academicYears)window.initBehaviorModule();
});
})();
