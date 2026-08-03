window.HB=window.HB||{};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateString=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
let currentDate=new Date(),db=null,editTaskIndex=null,statsMode='week';
const order={A1:1,A2:2,A3:3,B1:4,B2:5,B3:6,C1:7,C2:8,C3:9};


function showLogin(){
  $('#loginScreen').classList.remove('hidden');
  const lastUser=HB.storage.lastUser();
  if(lastUser && !$('#loginUserInput').value){
    $('#loginUserInput').value=lastUser;
  }
  $('#loginPasswordInput').value='';
  setTimeout(()=>{
    if($('#loginUserInput').value){
      $('#loginPasswordInput').focus();
    }else{
      $('#loginUserInput').focus();
    }
  },80);
}

function hideLogin(){
  $('#loginScreen').classList.add('hidden');
}

function startForUser(){
  const user=HB.storage.currentUser();
  if(!user){
    showLogin();
    return;
  }

  $('#currentUserLabel').textContent=`${user}님`;
  db=HB.storage.load()||defaultDB();

  if(!db.settings.checklistNames||db.settings.checklistNames.length!==10){
    db.settings.checklistNames=[...HB.defaultChecklist];
  }

  hideLogin();
  renderAll();

  if(!save()){
    alert('브라우저 저장소에 데이터를 저장하지 못했습니다. Safari 개인정보 보호 설정을 확인하세요.');
  }
}

function handleLogin(){
  const result=HB.storage.login(
    $('#loginUserInput').value,
    $('#loginPasswordInput').value,
    $('#rememberLoginInput').checked
  );

  if(!result.ok){
    alert(result.message);
    return;
  }

  startForUser();
}

function handleLogout(){
  if(!confirm('로그아웃할까요?')) return;
  HB.storage.logout();
  db=null;
  $('#currentUserLabel').textContent='Professional';
  showLogin();
}

function defaultDB(){return{version:1,settings:{homeMode:'quote',mission:'나는 중요한 일을 먼저 하며 차분하고 꾸준하게 성장한다.',checklistNames:[...HB.defaultChecklist]},days:{}}}
function ensureDay(key){if(!db.days[key])db.days[key]={tasks:[],checklist:Array(10).fill(false),quickMemo:'',taskMemo:'',review:'',schedules:[]};const d=db.days[key];if(!Array.isArray(d.tasks))d.tasks=[];if(!Array.isArray(d.checklist)||d.checklist.length!==10)d.checklist=Array(10).fill(false);if(!Array.isArray(d.schedules))d.schedules=[];return d}
const key=()=>dateString(currentDate),day=()=>ensureDay(key());
function save(){
  if(!db) return false;
  const ok=HB.storage.save(db);
  if(!ok) console.warn('HB Planner 데이터 저장에 실패했습니다.');
  return ok;
}
const open=id=>$('#'+id).classList.add('show'),close=id=>$('#'+id).classList.remove('show');

function renderDate(){$('#dateMain').textContent=currentDate.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});$('#dateSub').textContent=currentDate.toLocaleDateString('ko-KR',{weekday:'long'})}
function renderHome(){const mode=db.settings.homeMode,mission=db.settings.mission,q=HB.quotes[Math.abs([...key()].reduce((a,c)=>a+c.charCodeAt(0),0))%HB.quotes.length];$('#homeQuote').textContent=mode==='mission'?mission:mode==='both'?`${q[0]}\n\n────────\n\n${mission}`:q[0];$('#homeAuthor').textContent=mode==='mission'?'- 나의 사명선언 -':mode==='both'?`- ${q[1]} / 나의 사명선언 -`:`- ${q[1]} -`;$('#quickMemo').value=day().quickMemo||''}
function renderSummary(){const d=day(),done=d.tasks.filter(t=>t.status==='완료').length,score=d.checklist.filter(Boolean).length;$('#summaryTasks').textContent=d.tasks.filter(t=>t.content).length;$('#summaryDone').textContent=done;$('#summaryChecklist').textContent=`${score}/10`;$('#summarySchedules').textContent=d.schedules.length}
function renderTasks(){const box=$('#taskRows');box.innerHTML='';day().tasks.forEach((t,i)=>{const r=document.createElement('button');r.className='task-row'+(!t.content&&!t.status&&!t.priority?' empty':'');r.innerHTML=`<span class="status-${t.status}">${esc(t.status||'')}</span><span class="priority-${t.priority}">${esc(t.priority||'')}</span><span class="content">${t.content?esc(t.content):'터치하여 입력'}</span>`;r.onclick=()=>openTask(i);box.appendChild(r)})}
function openTask(i){editTaskIndex=i;const t=day().tasks[i];$('#taskStatusInput').value=t.status||'';$('#taskPriorityInput').value=t.priority||'';$('#taskContentInput').value=t.content||'';open('taskModal')}
function addTask(){day().tasks.push({status:'',priority:'',content:''});save();renderTasks();openTask(day().tasks.length-1)}
function renderChecklist(){const state=day().checklist,names=db.settings.checklistNames,box=$('#checklistRows');box.innerHTML='';names.forEach((name,i)=>{const r=document.createElement('label');r.className='check-row'+(state[i]?' done':'');r.innerHTML=`<input type="checkbox" ${state[i]?'checked':''}><span>${esc(name)}</span><span class="point">${state[i]?'1점':'0점'}</span>`;r.querySelector('input').onchange=e=>{state[i]=e.target.checked;save();renderChecklist();renderSummary();renderStats()};box.appendChild(r)});const score=state.filter(Boolean).length;$('#checkScore').textContent=`${score} / 10`;$('#checkRate').textContent=`${score*10}%`}
function scoreFor(k){const d=db.days[k];return d?d.checklist.filter(Boolean).length:0}
function statsRows(){const base=new Date(currentDate);if(statsMode==='week'){const diff=base.getDay()===0?-6:1-base.getDay(),start=new Date(base);start.setDate(start.getDate()+diff);return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return{label:['월','화','수','목','금','토','일'][i],score:scoreFor(dateString(d))}})}const y=base.getFullYear(),m=base.getMonth(),last=new Date(y,m+1,0).getDate();return Array.from({length:last},(_,i)=>{const d=new Date(y,m,i+1);return{label:String(i+1),score:scoreFor(dateString(d))}})}
function renderStats(){const rows=statsRows(),total=rows.reduce((s,r)=>s+r.score,0),max=rows.length*10,avg=rows.length?total/rows.length:0;$('#statsSummary').innerHTML=`<strong>${statsMode==='week'?'주간':'월간'} 합계 ${total}점 / ${max}점</strong><br>평균 ${avg.toFixed(1)}점 · 달성률 ${Math.round(total/max*100||0)}%`;const c=$('#statsChart');c.innerHTML='';rows.forEach(r=>{const w=document.createElement('div');w.className='bar-wrap';w.innerHTML=`<div class="bar-value">${r.score}</div><div class="bar" style="height:${Math.max(2,r.score*12)}px"></div><div class="bar-label">${r.label}</div>`;c.appendChild(w)});$('#weekTab').classList.toggle('active',statsMode==='week');$('#monthTab').classList.toggle('active',statsMode==='month')}
function renderSchedules(){const box=$('#scheduleRows');box.innerHTML='';day().schedules.sort((a,b)=>a.time.localeCompare(b.time)).forEach((s,i)=>{const r=document.createElement('div');r.className='schedule-row';r.innerHTML=`<strong>${s.time}</strong><span>${esc(s.title)}</span><button>삭제</button>`;r.querySelector('button').onclick=()=>{day().schedules.splice(i,1);save();renderSchedules();renderSummary()};box.appendChild(r)})}
function renderAll(){ensureDay(key());renderDate();renderHome();renderSummary();renderTasks();$('#taskMemo').value=day().taskMemo||'';renderChecklist();renderStats()}

function bind(){
  $$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.remove('active'));$$('.page').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#page-'+b.dataset.page).classList.add('active');if(b.dataset.page==='stats')renderStats()});
  $('#prevDay').onclick=()=>{currentDate.setDate(currentDate.getDate()-1);renderAll()};$('#nextDay').onclick=()=>{currentDate.setDate(currentDate.getDate()+1);renderAll()};
  $('#quickMemo').oninput=e=>{day().quickMemo=e.target.value;save()};$('#taskMemo').oninput=e=>{day().taskMemo=e.target.value;save()};
  $('#addTaskBtn').onclick=addTask;$('#saveTaskBtn').onclick=()=>{if(editTaskIndex===null)return;day().tasks[editTaskIndex]={status:$('#taskStatusInput').value,priority:$('#taskPriorityInput').value,content:$('#taskContentInput').value.trim()};save();renderTasks();renderSummary();close('taskModal')};
  $('#deleteTaskBtn').onclick=()=>{if(editTaskIndex===null)return;day().tasks.splice(editTaskIndex,1);save();renderTasks();renderSummary();close('taskModal')};
  $('#sortPriorityBtn').onclick=()=>{day().tasks.sort((a,b)=>(order[a.priority]||999)-(order[b.priority]||999));save();renderTasks()};
  $('#editChecklistBtn').onclick=()=>{const box=$('#checklistSettingsRows');box.innerHTML='';db.settings.checklistNames.forEach((n,i)=>{const r=document.createElement('label');r.className='setting-row';r.innerHTML=`<span>${i+1}</span><input maxlength="50" value="${esc(n)}">`;box.appendChild(r)});open('checklistSettingsModal')};
  $('#saveChecklistSettingsBtn').onclick=()=>{db.settings.checklistNames=$$('#checklistSettingsRows input').map((i,n)=>i.value.trim()||`체크리스트 ${n+1}`);save();renderChecklist();close('checklistSettingsModal')};
  $('#weekTab').onclick=()=>{statsMode='week';renderStats()};$('#monthTab').onclick=()=>{statsMode='month';renderStats()};
  $('#scheduleBtn').onclick=()=>{renderSchedules();open('scheduleModal')};$('#addScheduleBtn').onclick=()=>{const time=$('#scheduleTimeInput').value,title=$('#scheduleTitleInput').value.trim();if(!time||!title)return;day().schedules.push({time,title});save();$('#scheduleTitleInput').value='';renderSchedules();renderSummary()};
  $('#reviewBtn').onclick=()=>{$('#reviewInput').value=day().review||'';open('reviewModal')};$('#saveReviewBtn').onclick=()=>{day().review=$('#reviewInput').value;save();close('reviewModal')};
  $('#searchBtn').onclick=()=>{$('#searchInput').value='';$('#searchResults').innerHTML='';open('searchModal')};$('#runSearchBtn').onclick=()=>{const q=$('#searchInput').value.trim().toLowerCase(),box=$('#searchResults');box.innerHTML='';if(!q)return;const rs=[];Object.entries(db.days).forEach(([date,d])=>{d.tasks.forEach(t=>{if((t.content||'').toLowerCase().includes(q))rs.push({date,type:'업무',text:t.content})});[['quickMemo','메모'],['taskMemo','업무 메모'],['review','회고']].forEach(([k,type])=>{if((d[k]||'').toLowerCase().includes(q))rs.push({date,type,text:d[k]})})});if(!rs.length){box.innerHTML='<div class="search-result">검색 결과가 없습니다.</div>';return}rs.forEach(r=>{const e=document.createElement('div');e.className='search-result';e.innerHTML=`<strong>${r.date} · ${r.type}</strong><div>${esc(r.text)}</div>`;box.appendChild(e)})};
  $('#carryBtn').onclick=()=>{const src=day().tasks.filter(t=>t.content&&t.status!=='완료'&&t.status!=='취소');if(!src.length){alert('이월할 미완료 업무가 없습니다.');return}const n=new Date(currentDate);n.setDate(n.getDate()+1);const target=ensureDay(dateString(n));src.forEach(t=>target.tasks.push({...t,status:t.status==='연기'?'연기':'진행중'}));save();alert(`${src.length}개 업무를 다음 날로 이월했습니다.`)};
  $('#exportTextBtn').onclick=()=>{const d=day(),txt=[`[HB Planner ${key()}]`,'','■ 업무',...d.tasks.filter(t=>t.content).map(t=>`[${t.status||''}] ${t.priority||''} ${t.content}`),'','■ 메모',d.quickMemo||'','',d.taskMemo||'','', '■ 회고',d.review||''].join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));a.download=`HB_Planner_${key()}.txt`;a.click();URL.revokeObjectURL(a.href)};
  $('#backupBtn').onclick=()=>open('backupModal');$('#downloadBackupBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download=`HB_Planner_Backup_${dateString(new Date())}.json`;a.click();URL.revokeObjectURL(a.href)};
  $('#restoreBackupBtn').onclick=async()=>{const f=$('#restoreFileInput').files[0];if(!f){alert('파일을 선택하세요.');return}try{const data=JSON.parse(await f.text());if(!data.settings||!data.days)throw new Error();if(!confirm('현재 데이터를 백업 파일로 교체할까요?'))return;db=data;save();renderAll();close('backupModal');alert('복원 완료')}catch{alert('올바른 백업 파일이 아닙니다.')}};
  $('#settingsBtn').onclick=()=>{$('#homeModeInput').value=db.settings.homeMode;$('#missionInput').value=db.settings.mission;open('settingsModal')};$('#saveSettingsBtn').onclick=()=>{db.settings.homeMode=$('#homeModeInput').value;db.settings.mission=$('#missionInput').value.trim();save();renderHome();close('settingsModal')};
  $$('[data-close]').forEach(b=>b.onclick=()=>close(b.dataset.close));$$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)close(m.id)});
}
document.addEventListener('DOMContentLoaded',()=>{
  bind();

  $('#loginBtn').onclick=handleLogin;
  $('#logoutBtn').onclick=handleLogout;

  $('#loginPasswordInput').addEventListener('keydown',e=>{
    if(e.key==='Enter') handleLogin();
  });

  $('#loginUserInput').addEventListener('keydown',e=>{
    if(e.key==='Enter') $('#loginPasswordInput').focus();
  });

  startForUser();

  // Safari/PWA에서 앱을 닫거나 백그라운드로 보낼 때 마지막 상태 저장
  window.addEventListener('pagehide',()=>save());
  window.addEventListener('beforeunload',()=>save());
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'){
      save();
    }
  });

  // 뒤로가기 캐시에서 복귀할 때 저장 데이터 재확인
  window.addEventListener('pageshow',event=>{
    if(event.persisted && HB.storage.currentUser()){
      const loaded=HB.storage.load();
      if(loaded){
        db=loaded;
        renderAll();
      }
    }
  });
});
