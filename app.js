// ===== RECOMP - Absolute Fitness Workout Tracker =====
(function(){
"use strict";

// ===== STORAGE =====
const LS={
  get(k){try{return JSON.parse(localStorage.getItem('rc-'+k))}catch(e){return null}},
  set(k,v){localStorage.setItem('rc-'+k,JSON.stringify(v))},
  del(k){localStorage.removeItem('rc-'+k)}
};

// ===== DEFAULT SPLITS =====
const DEFAULT_SPLITS=[
  {name:'Bis/Chest/Shoulders',exercises:['Cable Curl','Incline Bench','Cable Hammer','Flat Chest Press','Chest Fly','Shoulder Lateral Raise','Machine Preacher'],custom:true},
  {name:'Tris/Back/Rear Delts',exercises:['Tricep Pushdown','Overhead Tricep Extension','Lat Pulldown','Machine Row','Pec Deck Machine','Pull-Ups','Tricep Rope'],custom:true},
  {name:'Legs',exercises:['Squat','Leg Press','Hamstring Curl','Quad Extension','Calf Raises'],custom:true},
  {name:'SARMS',exercises:['DB Shoulder Press','DB Lateral Raise Drop Set','Rear Delts','Hammer Curl','Cable Curl'],custom:true},
  {name:'Push (PPL)',exercises:['Bench Press','OHP','Incline DB Press','Lateral Raise','Tricep Pushdown','Chest Fly'],custom:false},
  {name:'Pull (PPL)',exercises:['Barbell Row','Pull-Ups','Face Pull','Barbell Curl','Hammer Curl','Lat Pulldown'],custom:false},
  {name:'Legs (PPL)',exercises:['Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises','Leg Extension'],custom:false},
  {name:'Upper',exercises:['Bench Press','Barbell Row','OHP','Pull-Ups','Lateral Raise','Barbell Curl','Tricep Pushdown'],custom:false},
  {name:'Lower',exercises:['Squat','Romanian Deadlift','Leg Press','Leg Curl','Calf Raises'],custom:false},
  {name:'Full Body',exercises:['Squat','Bench Press','Barbell Row','OHP','Barbell Curl','Tricep Pushdown'],custom:false},
  {name:'Chest Day',exercises:['Bench Press','Incline DB Press','Cable Fly','Chest Dip','Pec Deck'],custom:false},
  {name:'Back Day',exercises:['Deadlift','Barbell Row','Lat Pulldown','Cable Row','Face Pull'],custom:false},
  {name:'Arms Day',exercises:['Barbell Curl','Tricep Pushdown','Hammer Curl','Overhead Extension','Preacher Curl','Dips'],custom:false},
  {name:'Shoulders Day',exercises:['OHP','Lateral Raise','Face Pull','Rear Delt Fly','Shrugs'],custom:false},
];

const ABS_EXERCISES=['Plank','Cable Crunch','Leg Raise','Russian Twist','Ab Wheel','Dead Bug','Bicycle Crunch'];
const CARDIO_TYPES=['Treadmill','Cycling','Rowing','Stair Climber','Jump Rope','Elliptical'];

// ===== STATE =====
let state={
  screen:'main', // no login, straight to app
  tab:'home',
  dropdown:false,
  preview:null,
  calDay:new Date().getDate(),
  calMonth:new Date().getMonth(),
  calYear:new Date().getFullYear(),
  editing:false,
  editingWorkout:null,
  futurePlan:false,
  drill:null,
  restTimer:false,
  restTimeLeft:0,
  restInterval:null,
  summary:null,
  restDayPicker:false,
  addAbs:false,
  addCardio:false,
  editingProfile:false,
  backfillDate:null,
  activeWorkout:null,
  workoutStart:null,
  workoutElapsed:0,
  workoutInterval:null,
};

// ===== INIT =====
function init(){
  // No login — go straight to home. Set default profile if none exists.
  if(!LS.get('prof')){LS.set('prof',{name:'Athlete',age:'',height:'',currentWeight:'',goalWeight:'',startWeight:''});}
  state.screen='main';state.tab='home';
  if(LS.get('dk')===false)document.body.className='light';
  else document.body.className='dark';
  // Restore active workout if exists
  const aw=LS.get('aw');
  if(aw){state.activeWorkout=aw;state.tab='workout';}
  render();
}

// ===== HELPERS =====
function $(s){return document.querySelector(s)}
function $$(s){return document.querySelectorAll(s)}
function html(el,h){el.innerHTML=h}
function today(){return fmtDate(new Date())}
function fmtDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateStr(ds){const d=new Date(ds+'T12:00:00');const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return days[d.getDay()]+', '+months[d.getMonth()]+' '+d.getDate()}
function shortDate(ds){const d=new Date(ds+'T12:00:00');const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return months[d.getMonth()]+' '+d.getDate()}
function getSplits(){return LS.get('splits')||DEFAULT_SPLITS}
function getWorkouts(){return LS.get('wk')||[]}
function getRestDays(){return LS.get('rest')||[]}
function getWeights(){return LS.get('bw')||[]}
function getProfile(){return LS.get('prof')||{}}
function getRestDuration(){return LS.get('rd')||90}
function getStreak(){
  const wks=getWorkouts().map(w=>w.date);
  const rds=getRestDays().map(r=>r.date);
  const all=[...new Set([...wks,...rds])].sort().reverse();
  if(!all.length)return{current:0,best:0};
  let streak=0;let d=new Date();d.setHours(12,0,0,0);
  // Check if today or yesterday has activity
  const todayStr=fmtDate(d);
  const yest=new Date(d);yest.setDate(yest.getDate()-1);const yestStr=fmtDate(yest);
  if(!all.includes(todayStr)&&!all.includes(yestStr))return{current:0,best:LS.get('streakBest')||0};
  let check=new Date(d);
  if(!all.includes(fmtDate(check))){check.setDate(check.getDate()-1)}
  while(all.includes(fmtDate(check))){streak++;check.setDate(check.getDate()-1)}
  const best=Math.max(streak,LS.get('streakBest')||0);
  LS.set('streakBest',best);
  return{current:streak,best};
}
function getExerciseHistory(name){
  return getWorkouts().filter(w=>w.exercises&&w.exercises.some(e=>e.name===name)).map(w=>{
    const ex=w.exercises.find(e=>e.name===name);
    const sets=(ex.sets||[]).filter(s=>s.type!=='warmup'&&s.checked);
    const maxW=Math.max(0,...sets.map(s=>parseFloat(s.weight)||0));
    const vol=sets.reduce((a,s)=>(a+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)),0);
    return{date:w.date,sets,maxWeight:maxW,volume:vol};
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
function getExerciseStats(name){
  const hist=getExerciseHistory(name);
  if(!hist.length)return{max:0,bestVol:0,avgVol:0,sessions:0};
  const max=Math.max(0,...hist.map(h=>h.maxWeight));
  const bestVol=Math.max(0,...hist.map(h=>h.volume));
  const avgVol=Math.round(hist.reduce((a,h)=>a+h.volume,0)/hist.length);
  return{max,bestVol,avgVol,sessions:hist.length};
}
function getLastExercise(name){
  const hist=getExerciseHistory(name);
  if(!hist.length)return null;
  return hist[0];
}
function fmtVol(v){return v>=1000?(v/1000).toFixed(1)+'k':v.toString()}
function fmtTime(s){const m=Math.floor(s/60);const sec=s%60;return m+':'+String(sec).padStart(2,'0')}
function fmtDuration(ms){const m=Math.floor(ms/60000);if(m>=60)return Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';return m+'m'}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

// ===== RENDER =====
function render(){
  const root=document.getElementById('root');
  if(!root)return;
  let h='';
  if(state.screen==='onboarding'){h=renderOnboarding();}
  else{h=renderMain();}
  root.innerHTML=h;
  bindEvents();
}

// ===== ONBOARDING =====
function renderOnboarding(){
  return`<div style="flex:1;overflow-y:auto;padding:20px;text-align:center;">
    <div style="margin-top:16px;font-size:28px;font-weight:800;letter-spacing:4px;color:var(--c1);">RECOMP</div>
    <div style="font-size:9px;letter-spacing:3px;color:var(--c4);margin-top:2px;">ABSOLUTE FITNESS</div>
    <p style="font-size:14px;color:var(--c3);margin:22px 0 16px;">Set up your profile</p>
    <div style="width:76px;height:76px;border-radius:50%;background:var(--ip);border:2px dashed var(--c5);margin:0 auto 6px;display:flex;align-items:center;justify-content:center;position:relative;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--c5)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/></svg>
    </div>
    <p style="font-size:10px;color:var(--c5);margin-bottom:18px;">Photo coming soon</p>
    <div style="text-align:left;display:flex;flex-direction:column;gap:10px;">
      <div><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">NAME</div><input type="text" id="ob-name" placeholder="Your name" style="font-size:14px;"/></div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">AGE</div><input type="number" id="ob-age" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
        <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">HEIGHT</div><input type="text" id="ob-height" placeholder="5'10&quot;" style="text-align:center;font-size:14px;"/></div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">CURRENT LB</div><input type="number" id="ob-cw" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
        <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">GOAL LB</div><input type="number" id="ob-gw" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
      </div>
    </div>
    <div id="ob-go" style="background:linear-gradient(135deg,#1a3a7a,#0d2459);border-radius:14px;padding:15px;text-align:center;font-size:14px;font-weight:700;letter-spacing:2px;color:#fff;margin-top:20px;cursor:pointer;">LET'S GO</div>
    <p style="font-size:10px;color:var(--c6);margin-top:6px;">Edit anytime in Me tab</p>
  </div>`;
}

// ===== MAIN SHELL =====
function renderMain(){
  let content='';
  if(state.tab==='home'){
    if(state.dropdown)content=renderDropdown();
    else if(state.preview)content=renderPreview();
    else content=renderHome();
  }
  else if(state.tab==='workout')content=renderWorkout();
  else if(state.tab==='calendar')content=renderCalendar();
  else if(state.tab==='stats')content=renderStats();
  else if(state.tab==='me')content=renderMe();
  else if(state.tab==='splits')content=renderSplits();

  let overlays='';
  if(state.restTimer)overlays+=renderRestTimer();
  if(state.summary)overlays+=renderSummary();
  if(state.restDayPicker)overlays+=renderRestDayPicker();
  if(state.drill)overlays+=renderDrillDown();

  const isWorkout=state.tab==='workout'&&state.activeWorkout&&!state.summary;

  return`
    <div style="background:var(--hd);padding:12px 16px 8px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--bd);flex-shrink:0;z-index:5;">
      ${isWorkout?`
        <div id="nav-logo" style="cursor:pointer;"><div style="font-size:11px;color:var(--bl);font-weight:600;letter-spacing:1px;">${(state.activeWorkout.split||'WORKOUT').toUpperCase()}</div><div id="wk-timer" style="font-size:10px;color:var(--c4);font-family:'DM Mono',monospace;">${fmtDuration(state.workoutElapsed)}</div></div>
        <div style="display:flex;gap:4px;">
          <div style="background:rgba(74,143,255,.08);border-radius:8px;padding:4px 8px;font-size:12px;font-weight:700;color:var(--bl);">${countSets()} <span style="font-size:8px;color:var(--c5);">sets</span></div>
          <div style="background:rgba(74,143,255,.08);border-radius:8px;padding:4px 8px;font-size:12px;font-weight:700;color:var(--bl);">${fmtVol(calcVolume())} <span style="font-size:8px;color:var(--c5);">vol</span></div>
        </div>
      `:`
        <div id="nav-logo" style="cursor:pointer;"><div style="font-size:18px;font-weight:800;letter-spacing:3px;color:var(--c1);">RECOMP</div><div style="font-size:8px;letter-spacing:2px;color:var(--c4);margin-top:1px;">ABSOLUTE FITNESS</div></div>
        <div id="theme-toggle" style="width:36px;height:20px;background:${document.body.className==='dark'?'#1a2d5a':'#ccc'};border-radius:10px;position:relative;cursor:pointer;">
          <div style="width:16px;height:16px;border-radius:50%;background:${document.body.className==='dark'?'var(--bl)':'#fff'};position:absolute;${document.body.className==='dark'?'right':'left'}:2px;top:2px;${document.body.className==='dark'?'':'box-shadow:0 1px 3px rgba(0,0,0,.2);'}"></div>
        </div>
      `}
    </div>
    <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;position:relative;padding-bottom:56px;">
      ${content}
      ${overlays}
    </div>
    ${renderNav()}
  `;
}

// ===== NAV =====
function renderNav(){
  const tabs=['home','calendar','stats','me','splits'];
  const cur=state.tab==='workout'?'home':state.tab;
  return`<div style="display:flex;padding:8px 10px 14px;border-top:1px solid var(--bd);background:var(--bg);flex-shrink:0;">
    ${tabs.map(t=>`<div class="nav-tab" data-tab="${t}" style="flex:1;text-align:center;padding:4px 0;cursor:pointer;">
      <div style="width:5px;height:5px;border-radius:50%;background:${cur===t?'var(--bl)':'transparent'};margin:0 auto 3px;"></div>
      <div style="font-size:9px;letter-spacing:1px;color:${cur===t?'var(--bl)':'var(--c6)'};">${t==='calendar'?'CAL':t.toUpperCase()}</div>
    </div>`).join('')}
  </div>`;
}

// ===== HOME =====
function renderHome(){
  const streak=getStreak();
  const recent=getWorkouts().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  const restDays=getRestDays().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  // Merge recent + rest days, sort by date
  const all=[...recent.map(w=>({...w,tp:'workout'})),...restDays.map(r=>({date:r.date,tp:r.type}))].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);

  return`<div style="padding:10px 16px;">
    <p style="font-size:12px;color:var(--c3);margin-bottom:10px;">${dateStr(today())}</p>
    <!-- Streak -->
    <div style="background:linear-gradient(135deg,rgba(255,140,40,.06),rgba(255,80,20,.02));border:1px solid rgba(255,140,40,.1);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,rgba(255,160,40,.12),rgba(255,100,20,.06));display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:26px;">&#128293;</div>
      <div style="flex:1;">
        <div style="display:flex;align-items:baseline;gap:5px;"><span style="font-size:24px;font-weight:800;color:var(--fi);">${streak.current}</span><span style="font-size:12px;font-weight:600;color:var(--fi);">day streak</span></div>
        <div style="display:flex;gap:2px;margin-top:4px;">${'MTWTFSS'.split('').map((d,i)=>`<div style="width:20px;height:20px;border-radius:5px;background:rgba(255,140,40,${i<streak.current%7?.12:.04});display:flex;align-items:center;justify-content:center;font-size:8px;color:${i<streak.current%7?'var(--fi)':'var(--c5)'};font-weight:600;">${d}</div>`).join('')}</div>
        <div style="font-size:9px;color:var(--c5);margin-top:3px;">Best: ${streak.best} days</div>
      </div>
    </div>
    <!-- Start Workout -->
    <div id="start-workout" style="background:linear-gradient(135deg,#1a3a7a,#0d2459);border-radius:14px;padding:20px;text-align:center;margin-bottom:10px;cursor:pointer;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-20px;right:-20px;width:70px;height:70px;border-radius:50%;background:rgba(74,143,255,.08);"></div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2" style="margin-bottom:4px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <div style="font-size:14px;font-weight:700;letter-spacing:3px;color:#fff;">START WORKOUT</div>
      <div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:4px;">Choose your split</div>
    </div>
    <!-- Rest Day -->
    <div id="log-rest" style="background:var(--cd);border:1px solid var(--bd);border-radius:12px;padding:11px;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;cursor:pointer;">
      <span style="font-size:13px;">&#128164;</span>
      <span style="font-size:12px;color:var(--c3);">Log Rest Day / Active Recovery</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c5)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
    </div>
    <!-- Recent -->
    <div style="font-size:10px;font-weight:600;color:var(--c4);letter-spacing:2px;margin-bottom:7px;">RECENT</div>
    <div style="background:var(--cd);border-radius:12px;overflow:hidden;border:1px solid var(--bd);">
      ${all.length===0?'<div style="padding:20px;text-align:center;font-size:12px;color:var(--c5);">No workouts yet. Start your first one!</div>':''}
      ${all.map((item,i)=>{
        if(item.tp==='rest')return`<div style="padding:9px 12px;display:flex;align-items:center;gap:8px;${i<all.length-1?'border-bottom:1px solid var(--bd)':''}"><div style="width:30px;height:30px;border-radius:50%;background:rgba(100,130,200,.06);display:flex;align-items:center;justify-content:center;font-size:14px;">&#128164;</div><div><div style="font-size:12px;color:var(--c4);font-style:italic;">Rest Day</div><div style="font-size:10px;color:var(--c5);">${shortDate(item.date)}</div></div></div>`;
        if(item.tp==='active')return`<div style="padding:9px 12px;display:flex;align-items:center;gap:8px;${i<all.length-1?'border-bottom:1px solid var(--bd)':''}"><div style="width:30px;height:30px;border-radius:50%;background:rgba(34,204,102,.06);display:flex;align-items:center;justify-content:center;font-size:14px;">&#129495;</div><div><div style="font-size:12px;color:var(--gn);font-style:italic;">Active Recovery</div><div style="font-size:10px;color:var(--c5);">${shortDate(item.date)}</div></div></div>`;
        const ex=item.exercises||[];
        const sets=ex.reduce((a,e)=>a+(e.sets||[]).filter(s=>s.checked&&s.type!=='warmup').length,0);
        return`<div style="padding:9px 12px;display:flex;align-items:center;${i<all.length-1?'border-bottom:1px solid var(--bd)':''}">
          <div style="flex:1;"><div style="font-size:12px;font-weight:600;color:var(--c2);">${item.split||'Workout'}</div><div style="font-size:10px;color:var(--c4);">${shortDate(item.date)}${item.duration?' · '+fmtDuration(item.duration):''}</div></div>
          <div class="repeat-btn" data-id="${item.id}" style="background:rgba(74,143,255,.08);border:1px solid rgba(74,143,255,.12);border-radius:6px;padding:3px 7px;font-size:9px;color:var(--bl);cursor:pointer;letter-spacing:.5px;">REPEAT</div>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

// ===== DROPDOWN =====
function renderDropdown(){
  const splits=getSplits();
  const custom=splits.filter(s=>s.custom);
  const popular=splits.filter(s=>!s.custom&&['Push (PPL)','Pull (PPL)','Legs (PPL)','Upper','Lower','Full Body'].includes(s.name));
  const bro=splits.filter(s=>!s.custom&&['Chest Day','Back Day','Arms Day','Shoulders Day'].includes(s.name));

  return`<div style="padding:10px 16px;">
    <div style="background:linear-gradient(135deg,#1a3a7a,#0d2459);border-radius:14px 14px 0 0;padding:14px;text-align:center;"><div style="font-size:13px;font-weight:700;letter-spacing:3px;color:#fff;">START WORKOUT</div></div>
    <div style="background:var(--cd);border:1.5px solid var(--bd);border-top:0;border-radius:0 0 14px 14px;max-height:420px;overflow-y:auto;">
      <div style="padding:5px 0;border-bottom:1px solid var(--bd);">
        <div style="padding:3px 12px;font-size:9px;color:var(--c5);letter-spacing:2px;font-weight:600;">YOUR SPLITS</div>
        ${custom.map(s=>`<div class="split-pick" data-split="${s.name}" style="padding:10px 14px;font-size:13px;color:var(--c2);display:flex;justify-content:space-between;cursor:pointer;">${s.name}<span style="font-size:10px;color:var(--c5);">${s.exercises.length} ex</span></div>`).join('')}
      </div>
      <div style="padding:5px 0;border-bottom:1px solid var(--bd);">
        <div style="padding:3px 12px;font-size:9px;color:var(--c5);letter-spacing:2px;font-weight:600;">POPULAR</div>
        ${popular.map(s=>`<div class="split-pick" data-split="${s.name}" style="padding:8px 14px;font-size:12px;color:var(--c3);display:flex;justify-content:space-between;cursor:pointer;">${s.name}<span style="font-size:10px;color:var(--c6);">${s.exercises.length} ex</span></div>`).join('')}
      </div>
      <div style="padding:5px 0;border-bottom:1px solid var(--bd);">
        <div style="padding:3px 12px;font-size:9px;color:var(--c5);letter-spacing:2px;font-weight:600;">BRO SPLIT</div>
        ${bro.map(s=>`<div class="split-pick" data-split="${s.name}" style="padding:8px 14px;font-size:12px;color:var(--c3);display:flex;justify-content:space-between;cursor:pointer;">${s.name}<span style="font-size:10px;color:var(--c6);">${s.exercises.length} ex</span></div>`).join('')}
      </div>
      <div id="start-blank" style="padding:10px;font-size:11px;color:var(--c4);text-align:center;cursor:pointer;font-style:italic;">Start blank workout</div>
    </div>
    <div id="dd-cancel" style="margin-top:8px;text-align:center;font-size:11px;color:var(--c4);cursor:pointer;">Cancel</div>
  </div>`;
}

// ===== PREVIEW =====
function renderPreview(){
  const split=getSplits().find(s=>s.name===state.preview);
  const exercises=split?split.exercises:[];
  return`<div style="padding:10px 16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div><div style="font-size:15px;font-weight:700;color:var(--c2);">${state.preview}</div><div style="font-size:10px;color:var(--c4);margin-top:2px;">${exercises.length} exercises · preview</div></div>
      <div id="pv-cancel" style="font-size:10px;color:var(--c4);border:1px solid var(--bd);padding:5px 9px;border-radius:8px;cursor:pointer;">Cancel</div>
    </div>
    <div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;overflow:hidden;margin-bottom:8px;">
      ${exercises.map((e,i)=>`<div style="padding:9px 11px;display:flex;align-items:center;${i<exercises.length-1?'border-bottom:1px solid var(--bd)':''}">
        <div style="display:flex;flex-direction:column;margin-right:7px;color:var(--c5);font-size:8px;line-height:1.2;"><span>▲</span><span>▼</span></div>
        <div style="flex:1;font-size:12px;font-weight:600;color:var(--c2);">${e}</div>
        <div style="font-size:10px;color:var(--c5);font-family:'DM Mono',monospace;margin-right:8px;">${getLastExercise(e)?getLastExercise(e).sets.map(s=>(s.weight||'?')+'×'+(s.reps||'?')).join(', '):''}</div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--c5)" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </div>`).join('')}
    </div>
    <!-- Abs / Cardio -->
    <div style="display:flex;gap:5px;margin-bottom:8px;">
      <div id="toggle-abs" style="flex:1;background:${state.addAbs?'rgba(74,143,255,.1)':'var(--cd)'};border:1px solid ${state.addAbs?'var(--bl)':'var(--bd)'};border-radius:10px;padding:9px;text-align:center;font-size:11px;color:${state.addAbs?'var(--bl)':'var(--c4)'};cursor:pointer;font-weight:${state.addAbs?600:400};">+ Abs</div>
      <div id="toggle-cardio" style="flex:1;background:${state.addCardio?'rgba(34,204,102,.08)':'var(--cd)'};border:1px solid ${state.addCardio?'var(--gn)':'var(--bd)'};border-radius:10px;padding:9px;text-align:center;font-size:11px;color:${state.addCardio?'var(--gn)':'var(--c4)'};cursor:pointer;font-weight:${state.addCardio?600:400};">+ Cardio</div>
    </div>
    ${state.addAbs?`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:10px;padding:9px;margin-bottom:6px;"><div style="font-size:9px;letter-spacing:2px;color:var(--bl);margin-bottom:5px;">ABS</div>${['Plank (timed)','Cable Crunch','Leg Raise'].map(e=>`<div style="padding:4px 0;font-size:11px;color:var(--c3);border-bottom:1px solid var(--bd);">${e}</div>`).join('')}</div>`:''}
    ${state.addCardio?`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:10px;padding:9px;margin-bottom:6px;"><div style="font-size:9px;letter-spacing:2px;color:var(--gn);margin-bottom:5px;">CARDIO</div><div style="font-size:11px;color:var(--c3);">Treadmill — 25 min</div></div>`:''}
    <div id="pv-start" style="background:linear-gradient(135deg,var(--gn),#18a050);border-radius:12px;padding:14px;text-align:center;font-size:13px;font-weight:700;letter-spacing:2px;color:#fff;cursor:pointer;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" style="vertical-align:-1px;margin-right:5px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>START WORKOUT
    </div>
    <p style="font-size:10px;color:var(--c6);text-align:center;margin-top:6px;">Edit exercises, toggle abs/cardio</p>
  </div>`;
}

// ===== ACTIVE WORKOUT =====
function countSets(){if(!state.activeWorkout)return 0;return(state.activeWorkout.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.checked&&s.type!=='warmup').length,0)}
function calcVolume(){if(!state.activeWorkout)return 0;return(state.activeWorkout.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.checked&&s.type!=='warmup').reduce((b,s)=>b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),0)}

function renderWorkout(){
  if(!state.activeWorkout)return'<div style="padding:40px;text-align:center;color:var(--c4);">No active workout</div>';
  const w=state.activeWorkout;
  return`<div style="padding:5px 16px;">
    <div style="display:flex;gap:5px;margin-bottom:8px;">
      <div id="wk-finish" style="flex:1;background:rgba(34,204,102,.06);border:1px solid rgba(34,204,102,.15);border-radius:10px;padding:9px;text-align:center;font-size:11px;font-weight:600;color:var(--gn);cursor:pointer;">Finish</div>
      <div id="wk-cancel" style="flex:1;background:rgba(255,85,85,.04);border:1px solid rgba(255,85,85,.1);border-radius:10px;padding:9px;text-align:center;font-size:11px;color:var(--rd);cursor:pointer;">Cancel</div>
    </div>
    ${(w.exercises||[]).map((ex,ei)=>renderExerciseCard(ex,ei)).join('')}
    ${w.abs&&w.abs.length?`
      <div style="display:flex;align-items:center;gap:8px;margin:8px 0 5px;"><div style="flex:1;height:1px;background:var(--bd);"></div><span style="font-size:9px;letter-spacing:2px;color:var(--bl);font-weight:600;">ABS</span><div style="flex:1;height:1px;background:var(--bd);"></div></div>
      ${(w.abs||[]).map((ab,ai)=>renderAbsCard(ab,ai)).join('')}
    `:''}
    ${w.cardio&&w.cardio.length?`
      <div style="display:flex;align-items:center;gap:8px;margin:8px 0 5px;"><div style="flex:1;height:1px;background:var(--bd);"></div><span style="font-size:9px;letter-spacing:2px;color:var(--gn);font-weight:600;">CARDIO</span><div style="flex:1;height:1px;background:var(--bd);"></div></div>
      ${(w.cardio||[]).map((c,ci)=>renderCardioCard(c,ci)).join('')}
    `:''}
    <div id="wk-add-ex" style="background:linear-gradient(135deg,#1a3a7a,#0d2459);border-radius:12px;padding:12px;text-align:center;font-size:12px;font-weight:600;letter-spacing:2px;color:#fff;cursor:pointer;margin:8px 0;">+ ADD EXERCISE</div>
    <div style="margin-bottom:8px;">
      <textarea id="wk-notes" placeholder="Notes: How did it feel?" style="font-size:12px;min-height:50px;font-style:italic;">${w.notes||''}</textarea>
    </div>
  </div>`;
}

function renderExerciseCard(ex,ei){
  const last=getLastExercise(ex.name);
  const lastStr=last?last.sets.map(s=>(s.weight||'?')+'×'+(s.reps||'?')).join(', '):'';
  const lastMax=last?last.maxWeight:0;
  // Get current max from filled sets
  const curMax=Math.max(0,...(ex.sets||[]).filter(s=>s.type!=='warmup'&&s.weight).map(s=>parseFloat(s.weight)||0));
  let arrow='';
  if(last&&curMax>0){
    if(curMax>lastMax)arrow=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gn)" stroke-width="3"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
    else if(curMax<lastMax)arrow=`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--rd)" stroke-width="3"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`;
    else arrow=`<span style="font-size:10px;color:var(--c5);font-weight:700;">—</span>`;
  }
  return`<div style="background:var(--cd);border-radius:14px;padding:11px;margin-bottom:7px;border:1px solid var(--bd);">
    <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
      <div>
        <div style="display:flex;align-items:center;gap:5px;"><span style="font-size:13px;font-weight:700;color:var(--c1);">${ex.name}</span>${arrow}</div>
        ${lastStr?`<div style="font-size:9px;color:var(--c5);font-family:'DM Mono',monospace;margin-top:2px;">Last: ${lastStr}</div>`:'<div style="font-size:9px;color:var(--c5);margin-top:2px;">First time — no history</div>'}
      </div>
      <div class="ex-drill" data-name="${ex.name}" style="width:20px;height:20px;border-radius:5px;background:var(--ip);display:flex;align-items:center;justify-content:center;cursor:pointer;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--c5)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
      </div>
    </div>
    <div style="display:flex;padding:3px 0;font-size:8px;color:var(--c6);font-family:'DM Mono',monospace;border-bottom:1px solid var(--bd);">
      <span style="width:36px;">SET</span><span style="flex:1;text-align:center;">LB</span><span style="flex:1;text-align:center;">REPS</span><span style="width:32px;"></span>
    </div>
    ${(ex.sets||[]).map((s,si)=>`
      <div style="display:flex;align-items:center;padding:3px 0;${s.type==='warmup'?'opacity:.7':''}">
        <span style="width:36px;font-size:10px;color:${s.type==='warmup'?'var(--gl)':'var(--c5)'};font-family:'DM Mono',monospace;">${s.type==='warmup'?'W':(ex.sets.filter((x,j)=>j<=si&&x.type!=='warmup').length)}</span>
        <div style="flex:1;margin-right:3px;"><input type="number" class="set-weight" data-ei="${ei}" data-si="${si}" value="${s.weight||''}" placeholder="-" style="font-size:12px;padding:6px;border-radius:6px;${s.type==='warmup'?'color:var(--gl);border:1px solid rgba(176,128,48,.15);':''}"/></div>
        <div style="flex:1;margin-right:3px;"><input type="number" class="set-reps" data-ei="${ei}" data-si="${si}" value="${s.reps||''}" placeholder="-" style="font-size:12px;padding:6px;border-radius:6px;${s.type==='warmup'?'color:var(--gl);border:1px solid rgba(176,128,48,.15);':''}"/></div>
        <div class="set-check-btn" data-ei="${ei}" data-si="${si}" style="width:28px;height:28px;border-radius:7px;${s.checked?`background:${s.type==='warmup'?'rgba(176,128,48,.15)':'var(--bl)'}`:'background:var(--ip);border:1px solid var(--bd)'};display:flex;align-items:center;justify-content:center;cursor:pointer;">
          ${s.checked?`<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="${s.type==='warmup'?'var(--gl)':'#000'}" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>`:`<span style="font-size:12px;color:var(--c5);">○</span>`}
        </div>
      </div>
    `).join('')}
    <div style="display:flex;gap:4px;margin-top:5px;">
      <div class="add-working" data-ei="${ei}" style="flex:1;border:1px dashed var(--bd);border-radius:6px;padding:5px;text-align:center;font-size:9px;color:var(--c5);cursor:pointer;">+ Working set</div>
      <div class="add-warmup" data-ei="${ei}" style="flex:1;border:1px dashed rgba(176,128,48,.2);border-radius:6px;padding:5px;text-align:center;font-size:9px;color:var(--gl);cursor:pointer;">+ Warmup</div>
    </div>
  </div>`;
}

function renderAbsCard(ab,ai){
  return`<div style="background:var(--cd);border-radius:14px;padding:11px;margin-bottom:7px;border:1px solid var(--bd);">
    <div style="font-size:13px;font-weight:700;color:var(--c1);margin-bottom:5px;">${ab.name}</div>
    <div style="display:flex;padding:3px 0;font-size:8px;color:var(--c6);font-family:'DM Mono',monospace;border-bottom:1px solid var(--bd);">
      <span style="width:36px;">SET</span><span style="flex:1;text-align:center;">${ab.timed?'SEC':'REPS'}</span><span style="width:32px;"></span>
    </div>
    ${(ab.sets||[]).map((s,si)=>`
      <div style="display:flex;align-items:center;padding:3px 0;">
        <span style="width:36px;font-size:10px;color:var(--c5);font-family:'DM Mono',monospace;">${si+1}</span>
        <div style="flex:1;margin-right:3px;"><input type="number" value="${s.value||''}" placeholder="-" style="font-size:12px;padding:6px;border-radius:6px;"/></div>
        <div style="width:28px;height:28px;border-radius:7px;${s.checked?'background:var(--bl)':'background:var(--ip);border:1px solid var(--bd)'};display:flex;align-items:center;justify-content:center;cursor:pointer;">
          ${s.checked?'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3"><path d="M5 12l5 5L19 7"/></svg>':'<span style="font-size:12px;color:var(--c5);">○</span>'}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function renderCardioCard(c,ci){
  return`<div style="background:var(--cd);border-radius:14px;padding:11px;margin-bottom:7px;border:1px solid var(--bd);">
    <div style="font-size:13px;font-weight:700;color:var(--c1);margin-bottom:7px;">${c.type}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;">
      ${[['MIN',c.minutes||''],['DIST',c.distance||''],['CAL',c.calories||'']].map(([l,v])=>`
        <div><div style="font-size:8px;color:var(--c5);letter-spacing:1px;margin-bottom:3px;">${l}</div><input type="number" value="${v}" placeholder="-" style="font-size:12px;padding:6px;border-radius:6px;"/></div>
      `).join('')}
    </div>
  </div>`;
}

// ===== REST TIMER =====
function renderRestTimer(){
  const left=state.restTimeLeft;
  const total=getRestDuration();
  const pct=Math.max(0,Math.min(1,left/total));
  const circ=2*Math.PI*48;
  const offset=circ*(1-pct);
  return`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(4,5,8,.95);z-index:20;display:flex;align-items:center;justify-content:center;">
    <div style="text-align:center;padding:20px;">
      <div style="width:160px;height:160px;margin:0 auto 20px;position:relative;display:flex;align-items:center;justify-content:center;">
        <svg viewBox="0 0 100 100" width="160" height="160" style="position:absolute;top:0;left:0;transform:rotate(-90deg);"><circle cx="50" cy="50" r="48" fill="none" stroke="#12162a" stroke-width="3"/><circle cx="50" cy="50" r="48" fill="none" stroke="var(--bl)" stroke-width="3" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" style="transition:stroke-dashoffset .3s;"/></svg>
        <div><div style="font-size:48px;font-weight:700;color:var(--bl);font-family:'DM Mono',monospace;line-height:1;">${fmtTime(left)}</div><div style="font-size:10px;color:var(--c4);letter-spacing:2px;margin-top:4px;">REMAINING</div></div>
      </div>
      <div style="font-size:11px;color:var(--c4);margin-bottom:14px;">Rest between sets</div>
      <div style="display:flex;gap:8px;justify-content:center;">
        <div id="rt-add" style="background:#0d1b3a;border:1px solid #1a2d5a;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;color:var(--bl);cursor:pointer;">+15s</div>
        <div id="rt-sub" style="background:#0d1b3a;border:1px solid #1a2d5a;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;color:var(--bl);cursor:pointer;">-15s</div>
        <div id="rt-skip" style="background:rgba(255,85,85,.06);border:1px solid rgba(255,85,85,.15);border-radius:10px;padding:11px 18px;font-size:14px;font-weight:600;color:var(--rd);cursor:pointer;">Skip</div>
      </div>
    </div>
  </div>`;
}

// ===== SUMMARY =====
function renderSummary(){
  const s=state.summary;
  if(!s)return'';
  const streak=getStreak();
  return`<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:20;overflow-y:auto;background:var(--bg);">
    <div style="padding:16px;">
      <div style="background:linear-gradient(180deg,#0e1830,#0c1020);border:1px solid #1a2d5a;border-radius:20px;padding:22px 18px;text-align:center;">
        <div style="font-size:10px;font-weight:800;letter-spacing:3px;color:#1a2d5a;margin-bottom:12px;">RECOMP</div>
        <div style="font-size:18px;font-weight:800;color:#e0e4f0;">${s.split||'Workout'}</div>
        <div style="font-size:11px;color:var(--bl);margin:3px 0 14px;">${dateStr(s.date)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px;">
          <div style="background:rgba(74,143,255,.06);border-radius:10px;padding:12px;"><div style="font-size:22px;font-weight:800;color:var(--bl);">${fmtDuration(s.duration)}</div><div style="font-size:8px;color:#3a4a6a;letter-spacing:1px;margin-top:2px;">DURATION</div></div>
          <div style="background:rgba(74,143,255,.06);border-radius:10px;padding:12px;"><div style="font-size:22px;font-weight:800;color:var(--bl);">${s.sets}</div><div style="font-size:8px;color:#3a4a6a;letter-spacing:1px;margin-top:2px;">SETS</div></div>
          <div style="background:rgba(74,143,255,.06);border-radius:10px;padding:12px;"><div style="font-size:22px;font-weight:800;color:var(--bl);">${fmtVol(s.volume)}</div><div style="font-size:8px;color:#3a4a6a;letter-spacing:1px;margin-top:2px;">VOLUME</div></div>
          <div style="background:rgba(74,143,255,.06);border-radius:10px;padding:12px;"><div style="font-size:22px;font-weight:800;color:var(--bl);">${s.exercises}</div><div style="font-size:8px;color:#3a4a6a;letter-spacing:1px;margin-top:2px;">EXERCISES</div></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;background:linear-gradient(135deg,rgba(255,160,40,.08),rgba(255,100,20,.04));border-radius:12px;padding:10px;">
          <span style="font-size:22px;">&#128293;</span>
          <div><div style="font-size:18px;font-weight:800;color:var(--fi);">${streak.current} Day Streak!</div></div>
        </div>
      </div>
      <div id="summary-done" style="background:var(--bl);border-radius:12px;padding:14px;text-align:center;font-size:13px;font-weight:700;color:#000;cursor:pointer;margin-top:14px;">Done</div>
    </div>
  </div>`;
}

// ===== REST DAY PICKER =====
function renderRestDayPicker(){
  return`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(4,5,8,.92);z-index:20;display:flex;align-items:center;justify-content:center;">
    <div style="background:var(--cd);border:1px solid var(--bd);border-radius:20px;padding:22px;max-width:280px;width:90%;text-align:center;">
      <div style="font-size:11px;letter-spacing:2px;color:var(--c4);margin-bottom:14px;font-weight:600;">LOG REST DAY</div>
      <div style="font-size:12px;color:var(--c3);margin-bottom:14px;">Keeps your streak alive</div>
      <div id="rest-full" style="background:rgba(100,130,200,.06);border:1px solid rgba(100,130,200,.12);border-radius:14px;padding:16px;margin-bottom:8px;cursor:pointer;">
        <div style="font-size:24px;margin-bottom:3px;">&#128164;</div>
        <div style="font-size:14px;font-weight:700;color:var(--c2);">Full Rest</div>
        <div style="font-size:10px;color:var(--c4);margin-top:2px;">No activity — just recovering</div>
      </div>
      <div id="rest-active" style="background:rgba(34,204,102,.04);border:1px solid rgba(34,204,102,.12);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;">
        <div style="font-size:24px;margin-bottom:3px;">&#129495;</div>
        <div style="font-size:14px;font-weight:700;color:var(--c2);">Active Recovery</div>
        <div style="font-size:10px;color:var(--c4);margin-top:2px;">Walk, stretch, yoga</div>
      </div>
      <div id="rest-cancel" style="font-size:11px;color:var(--c4);cursor:pointer;">Cancel</div>
    </div>
  </div>`;
}

// ===== DRILL DOWN =====
function renderDrillDown(){
  const nm=state.drill;
  const stats=getExerciseStats(nm);
  const hist=getExerciseHistory(nm).reverse(); // oldest first for chart
  const histDesc=[...hist].reverse(); // newest first for list
  
  // Build SVG chart
  let chart='';
  if(hist.length>=2){
    const weights=hist.map(h=>h.maxWeight);
    const minW=Math.min(...weights)*0.9;
    const maxW=Math.max(...weights)*1.1;
    const range=maxW-minW||1;
    const w=280,h2=80,pad=5;
    const pts=weights.map((wt,i)=>{
      const x=pad+i*(w-pad*2)/(weights.length-1);
      const y=pad+(1-(wt-minW)/range)*(h2-pad*2);
      return x+','+y;
    });
    chart=`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;margin-bottom:10px;">
      <div style="font-size:9px;color:var(--c5);letter-spacing:2px;margin-bottom:6px;">WEIGHT OVER TIME</div>
      <div style="position:relative;">
        <svg viewBox="0 0 ${w} ${h2}" style="width:100%;height:80px;" preserveAspectRatio="none">
          <polyline points="${pts.join(' ')}" fill="none" stroke="var(--bl)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          ${weights.map((wt,i)=>{
            const x=pad+i*(w-pad*2)/(weights.length-1);
            const y=pad+(1-(wt-minW)/range)*(h2-pad*2);
            return`<circle cx="${x}" cy="${y}" r="3" fill="var(--bl)"/>`;
          }).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--c6);margin-top:2px;">
          <span>${shortDate(hist[0].date)}</span>
          <span>${shortDate(hist[hist.length-1].date)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span style="font-size:9px;color:var(--c5);">Low: ${Math.min(...weights)} lb</span>
          <span style="font-size:9px;color:var(--c5);">High: ${Math.max(...weights)} lb</span>
        </div>
      </div>
    </div>`;
  } else if(hist.length===1){
    chart=`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:16px;margin-bottom:10px;text-align:center;">
      <div style="font-size:9px;color:var(--c5);letter-spacing:2px;margin-bottom:4px;">WEIGHT OVER TIME</div>
      <div style="font-size:12px;color:var(--c4);">Need 2+ sessions to show chart</div>
    </div>`;
  }

  return`<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(4,5,8,.96);z-index:20;overflow-y:auto;">
    <div style="padding:14px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div><div style="font-size:17px;font-weight:800;color:var(--c1);">${nm}</div><div style="font-size:10px;color:var(--c4);margin-top:2px;">Exercise history</div></div>
        <div id="drill-close" style="background:var(--ip);border:1px solid var(--bd);border-radius:8px;padding:6px 12px;font-size:11px;color:var(--c4);cursor:pointer;">Close</div>
      </div>
      <div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;margin-bottom:10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;">
          <div style="background:var(--dp);border-radius:7px;padding:9px 6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:var(--c1);">${stats.max}<span style="font-size:10px;color:var(--c5);">lb</span></div><div style="font-size:7px;color:var(--c6);margin-top:2px;">MAX</div></div>
          <div style="background:var(--dp);border-radius:7px;padding:9px 6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:var(--c1);">${fmtVol(stats.bestVol)}</div><div style="font-size:7px;color:var(--c6);margin-top:2px;">BEST VOL</div></div>
          <div style="background:var(--dp);border-radius:7px;padding:9px 6px;text-align:center;"><div style="font-size:16px;font-weight:700;color:var(--c1);">${stats.sessions}</div><div style="font-size:7px;color:var(--c6);margin-top:2px;">SESSIONS</div></div>
        </div>
      </div>
      ${chart}
      <div style="font-size:9px;color:var(--c5);letter-spacing:2px;margin-bottom:6px;">ALL SESSIONS</div>
      ${histDesc.map(h=>`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:10px;padding:10px;margin-bottom:5px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:11px;color:var(--c3);">${shortDate(h.date)}</span>
          <span style="font-size:10px;color:var(--c4);">${fmtVol(h.volume)} vol</span>
        </div>
        <div style="font-size:12px;color:var(--c2);font-family:'DM Mono',monospace;">${h.sets.map(s=>(s.weight||'?')+'×'+(s.reps||'?')).join(', ')}</div>
      </div>`).join('')}
      ${histDesc.length===0?'<div style="text-align:center;padding:20px;font-size:12px;color:var(--c5);">No sessions yet</div>':''}
    </div>
  </div>`;
}

// ===== CALENDAR =====
function renderCalendar(){
  const y=state.calYear,m=state.calMonth;
  const firstDay=new Date(y,m,1).getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const todayD=new Date();
  const todayStr=fmtDate(todayD);
  const wks=getWorkouts();
  const rds=getRestDays();
  const wkDates=new Set(wks.map(w=>w.date));
  const rdDates={};rds.forEach(r=>rdDates[r.date]=r.type);

  let cells='';
  for(let i=0;i<firstDay;i++)cells+=`<div style="padding:6px 2px;"></div>`;
  for(let d=1;d<=daysInMonth;d++){
    const ds=fmtDate(new Date(y,m,d));
    const isToday=ds===todayStr;
    const isSel=d===state.calDay&&m===state.calMonth&&y===state.calYear;
    const hasWk=wkDates.has(ds);
    const hasRd=rdDates[ds];
    const isFuture=new Date(y,m,d)>todayD;
    let style=`text-align:center;padding:6px 2px;font-size:12px;border-radius:7px;cursor:pointer;position:relative;`;
    if(isToday)style+=`font-weight:700;color:#000;background:var(--bl);`;
    else if(isSel)style+=`font-weight:600;color:var(--bl);border:1.5px solid var(--bl);`;
    else if(hasWk)style+=`font-weight:700;color:var(--c2);background:rgba(74,143,255,.06);`;
    else if(hasRd==='rest')style+=`color:#7a8aaa;background:rgba(100,130,200,.04);`;
    else if(hasRd==='active')style+=`color:var(--gn);background:rgba(34,204,102,.04);`;
    else if(isFuture)style+=`color:var(--c5);`;
    else style+=`color:var(--c5);`;
    let dot='';
    if(hasWk)dot=`<div style="width:4px;height:4px;border-radius:50%;background:var(--bl);margin:1px auto 0;"></div>`;
    else if(hasRd==='rest')dot=`<div style="width:4px;height:4px;border-radius:50%;background:#7a8aaa;margin:1px auto 0;"></div>`;
    else if(hasRd==='active')dot=`<div style="width:4px;height:4px;border-radius:50%;background:var(--gn);margin:1px auto 0;"></div>`;
    cells+=`<div class="cal-d" data-day="${d}" style="${style}">${d}${dot}</div>`;
  }

  // Day detail
  const selDate=fmtDate(new Date(y,m,state.calDay));
  const selWk=wks.find(w=>w.date===selDate);
  const selRd=rdDates[selDate];
  const isFuture=new Date(y,m,state.calDay)>todayD;

  let detail='';
  if(state.editing&&selWk){
    detail=renderCalendarEdit(selWk);
  } else if(state.futurePlan){
    detail=renderFuturePlan();
  } else if(selWk){
    detail=renderCalendarWorkout(selWk);
  } else if(selRd){
    detail=`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:20px;text-align:center;">
      <div style="font-size:28px;margin-bottom:6px;">${selRd==='rest'?'&#128164;':'&#129495;'}</div>
      <div style="font-size:15px;font-weight:700;color:${selRd==='rest'?'var(--c3)':'var(--gn)'};">${selRd==='rest'?'Rest Day':'Active Recovery'}</div>
      <div style="font-size:11px;color:var(--c5);margin:4px 0 10px;">${shortDate(selDate)}</div>
    </div>`;
  } else if(isFuture){
    detail=`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:18px;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:var(--c2);">${shortDate(selDate)}</div>
      <div style="font-size:11px;color:var(--c5);margin:4px 0;">Upcoming</div>
    </div>`;
  } else {
    detail=`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:18px;text-align:center;">
      <div style="font-size:14px;font-weight:600;color:var(--c2);">${shortDate(selDate)}</div>
      <div style="font-size:12px;color:var(--c5);margin:6px 0 12px;">Nothing logged</div>
      <div id="cal-log-past" style="background:linear-gradient(135deg,#1a3a7a,#0d2459);border-radius:10px;padding:12px;font-size:12px;font-weight:600;color:#fff;cursor:pointer;margin-bottom:8px;">+ LOG PAST WORKOUT</div>
      <div style="display:flex;gap:6px;">
        <div id="cal-rest-past" style="flex:1;background:var(--ip);border:1px solid var(--bd);border-radius:8px;padding:9px;text-align:center;font-size:10px;color:var(--c4);cursor:pointer;">+ Rest Day</div>
        <div id="cal-photo-past" style="flex:1;background:var(--ip);border:1px solid var(--bd);border-radius:8px;padding:9px;text-align:center;font-size:10px;color:var(--c4);cursor:pointer;">+ Photos</div>
      </div>
    </div>`;
  }

  return`<div style="padding:10px 16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div id="cal-prev" style="cursor:pointer;padding:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></div>
      <span style="font-size:14px;font-weight:600;color:var(--c2);">${months[m]} ${y}</span>
      <div id="cal-next" style="cursor:pointer;padding:4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:3px;">
      ${'SMTWTFS'.split('').map(d=>`<div style="text-align:center;font-size:9px;color:var(--c6);padding:2px;font-weight:600;">${d}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:8px;">${cells}</div>
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px;font-size:8px;color:var(--c5);">
      <div style="display:flex;align-items:center;gap:3px;"><div style="width:5px;height:5px;border-radius:50%;background:var(--bl);"></div>Workout</div>
      <div style="display:flex;align-items:center;gap:3px;"><div style="width:5px;height:5px;border-radius:50%;background:#7a8aaa;"></div>Rest</div>
      <div style="display:flex;align-items:center;gap:3px;"><div style="width:5px;height:5px;border-radius:50%;background:var(--gn);"></div>Active</div>
    </div>
    ${detail}
  </div>`;
}

function renderCalendarWorkout(w){
  return`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div><div style="font-size:14px;font-weight:700;color:var(--c2);">${shortDate(w.date)}</div><div style="font-size:10px;color:var(--bl);margin-top:1px;">${w.split||'Workout'}${w.duration?' · '+fmtDuration(w.duration):''}</div></div>
      <div id="cal-edit" style="display:flex;align-items:center;gap:4px;background:rgba(74,143,255,.08);border:1px solid rgba(74,143,255,.12);border-radius:8px;padding:5px 10px;cursor:pointer;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span style="font-size:10px;color:var(--bl);font-weight:600;">Edit</span>
      </div>
    </div>
    ${(w.exercises||[]).map(ex=>{
      const sets=(ex.sets||[]).filter(s=>s.type!=='warmup'&&s.checked);
      return`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--bd);">
        <span class="ex-drill-link" data-name="${ex.name}" style="font-size:12px;color:var(--bl);cursor:pointer;text-decoration:underline;text-decoration-color:rgba(74,143,255,.3);">${ex.name}</span>
        <span style="font-size:10px;color:var(--c5);font-family:'DM Mono',monospace;">${sets.map(s=>(s.weight||'?')+'×'+(s.reps||'?')).join(', ')}</span>
      </div>`;
    }).join('')}
    ${w.notes?`<div style="margin-top:8px;font-size:10px;color:var(--c4);font-style:italic;">${w.notes}</div>`:''}
  </div>`;
}

function renderCalendarEdit(w){
  return`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div style="font-size:14px;font-weight:700;color:var(--c2);">Editing ${shortDate(w.date)}</div>
      <div id="cal-edit-cancel" style="font-size:10px;color:var(--c4);border:1px solid var(--bd);padding:4px 8px;border-radius:6px;cursor:pointer;">Cancel</div>
    </div>
    <div style="display:flex;gap:5px;margin-bottom:10px;">
      <div id="cal-edit-save" style="flex:1;background:var(--bl);border-radius:10px;padding:9px;text-align:center;font-size:11px;font-weight:700;color:#000;cursor:pointer;">Save</div>
      <div id="cal-edit-delete" style="flex:1;background:rgba(255,85,85,.06);border:1px solid rgba(255,85,85,.12);border-radius:10px;padding:9px;text-align:center;font-size:11px;color:var(--rd);cursor:pointer;">Delete</div>
    </div>
    <p style="font-size:10px;color:var(--c5);text-align:center;">Edit feature coming in next update</p>
  </div>`;
}

function renderFuturePlan(){
  return`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <div style="font-size:14px;font-weight:700;color:var(--c2);">Plan workout</div>
      <div id="future-cancel" style="font-size:10px;color:var(--c4);border:1px solid var(--bd);padding:4px 8px;border-radius:6px;cursor:pointer;">Cancel</div>
    </div>
    <p style="font-size:10px;color:var(--c5);text-align:center;">Future planning coming in next update</p>
  </div>`;
}

// ===== STATS =====
function renderStats(){
  const splits=getSplits().filter(s=>s.custom);
  const wks=getWorkouts();
  return`<div style="padding:10px 16px;">
    ${splits.map(sp=>{
      const exStats=sp.exercises.map(name=>({name,...getExerciseStats(name)})).filter(e=>e.sessions>0);
      if(!exStats.length)return'';
      return`<div style="font-size:10px;color:var(--bl);letter-spacing:2px;font-weight:600;margin:8px 0 6px;">${sp.name.toUpperCase()}</div>
      ${exStats.map(e=>`<div class="stat-drill" data-name="${e.name}" style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:11px;margin-bottom:5px;cursor:pointer;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
          <span style="font-size:13px;font-weight:700;color:var(--c1);">${e.name}</span>
          <div style="display:flex;align-items:center;gap:3px;font-size:9px;color:var(--bl);">History <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">
          <div style="background:var(--dp);border-radius:6px;padding:7px 5px;"><div style="font-size:15px;font-weight:700;color:var(--c1);">${e.max}<span style="font-size:10px;color:var(--c5);">lb</span></div><div style="font-size:7px;color:var(--c6);margin-top:1px;">MAX</div></div>
          <div style="background:var(--dp);border-radius:6px;padding:7px 5px;"><div style="font-size:15px;font-weight:700;color:var(--c1);">${fmtVol(e.bestVol)}</div><div style="font-size:7px;color:var(--c6);margin-top:1px;">BEST VOL</div></div>
          <div style="background:var(--dp);border-radius:6px;padding:7px 5px;"><div style="font-size:15px;font-weight:700;color:var(--c1);">${fmtVol(e.avgVol)}</div><div style="font-size:7px;color:var(--c6);margin-top:1px;">AVG VOL</div></div>
        </div>
      </div>`).join('')}`;
    }).join('')}
    ${wks.length===0?'<div style="text-align:center;padding:40px;font-size:12px;color:var(--c5);">Complete workouts to see your stats here</div>':''}
  </div>`;
}

// ===== ME =====
function renderMe(){
  const p=getProfile();
  const bw=getWeights();
  const latest=bw.length?bw[bw.length-1]:null;
  const startW=parseFloat(p.startWeight)||parseFloat(p.currentWeight)||0;
  const goalW=parseFloat(p.goalWeight)||0;
  const curW=latest?parseFloat(latest.weight):startW;
  const progress=startW&&goalW&&startW!==goalW?Math.max(0,Math.min(100,Math.round(Math.abs(startW-curW)/Math.abs(startW-goalW)*100))):0;

  // Edit profile form
  if(state.editingProfile){
    return`<div style="padding:10px 16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:700;color:var(--c1);">Edit Profile</div>
        <div id="prof-cancel" style="font-size:11px;color:var(--c4);border:1px solid var(--bd);padding:5px 10px;border-radius:8px;cursor:pointer;">Cancel</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">NAME</div><input type="text" id="prof-name" value="${p.name||''}" placeholder="Your name" style="font-size:14px;"/></div>
        <div style="display:flex;gap:8px;">
          <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">AGE</div><input type="number" id="prof-age" value="${p.age||''}" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
          <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">HEIGHT</div><input type="text" id="prof-height" value="${p.height||''}" placeholder="5'10&quot;" style="text-align:center;font-size:14px;"/></div>
        </div>
        <div style="display:flex;gap:8px;">
          <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">CURRENT LB</div><input type="number" id="prof-cw" value="${p.currentWeight||''}" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
          <div style="flex:1;"><div style="font-size:9px;letter-spacing:2px;color:var(--c4);margin-bottom:4px;">GOAL LB</div><input type="number" id="prof-gw" value="${p.goalWeight||''}" placeholder="-" style="text-align:center;font-size:14px;padding:11px;border-radius:10px;"/></div>
        </div>
      </div>
      <div id="prof-save" style="background:var(--bl);border-radius:14px;padding:14px;text-align:center;font-size:14px;font-weight:700;color:#000;cursor:pointer;margin-top:20px;">SAVE</div>
    </div>`;
  }

  return`<div style="padding:10px 16px;">
    <!-- Set Up Profile prompt if no name -->
    ${p.name==='Athlete'?`<div style="background:rgba(74,143,255,.06);border:1px solid rgba(74,143,255,.12);border-radius:12px;padding:14px;margin-bottom:12px;text-align:center;">
      <div style="font-size:13px;font-weight:600;color:var(--bl);margin-bottom:4px;">Set up your profile</div>
      <div style="font-size:11px;color:var(--c4);margin-bottom:10px;">Add your name, age, and goals</div>
      <div id="edit-profile" style="background:var(--bl);border-radius:10px;padding:10px;font-size:12px;font-weight:700;color:#000;cursor:pointer;">SET UP</div>
    </div>`:`
    <div style="background:var(--cd);border:1px solid var(--bd);border-radius:16px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#1a3a7a,#0d2459);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--bl);flex-shrink:0;">${(p.name||'?')[0].toUpperCase()}</div>
        <div style="flex:1;"><div style="font-size:17px;font-weight:700;color:var(--c1);">${p.name||'User'}</div><div style="font-size:11px;color:var(--c4);">${p.age?p.age+' · ':''}${p.height||''}</div></div>
        <div id="edit-profile" style="background:var(--ip);border-radius:8px;padding:5px 9px;cursor:pointer;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c4)" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
      </div>
      ${goalW?`<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--bd);">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="font-size:9px;color:var(--c4);">GOAL</span><span style="font-size:10px;color:var(--bl);font-weight:600;">${curW} → ${goalW} lb</span></div>
        <div style="width:100%;height:6px;background:var(--ip);border-radius:3px;overflow:hidden;"><div style="width:${progress}%;height:100%;background:linear-gradient(90deg,var(--bl),var(--gn));border-radius:3px;"></div></div>
        <div style="display:flex;justify-content:space-between;margin-top:3px;"><span style="font-size:8px;color:var(--c6);">Start: ${startW}</span><span style="font-size:8px;color:var(--gn);">${progress}%</span></div>
      </div>`:''}
    </div>`}
    <!-- Body Weight -->
    <div style="font-size:9px;color:var(--bl);letter-spacing:2px;font-weight:600;margin-bottom:5px;">BODY WEIGHT</div>
    <div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <input type="number" id="bw-input" placeholder="Enter weight" style="flex:1;font-size:13px;padding:9px;border-radius:8px;"/>
        <div id="bw-log" style="background:var(--bl);border-radius:8px;padding:9px 14px;font-size:12px;font-weight:700;color:#000;cursor:pointer;">Log</div>
      </div>
      ${latest?`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <div><span style="font-size:17px;font-weight:700;color:var(--c1);">${latest.weight}</span><span style="font-size:10px;color:var(--c4);"> lb</span></div>
        ${bw.length>=2?`<div style="display:flex;align-items:center;gap:2px;background:rgba(34,204,102,.08);padding:2px 6px;border-radius:4px;">
          <span style="font-size:9px;font-weight:600;color:var(--gn);">${(parseFloat(bw[bw.length-1].weight)-parseFloat(bw[bw.length-2].weight)).toFixed(1)} lb</span>
        </div>`:``}
      </div>`:'<div style="font-size:12px;color:var(--c5);text-align:center;">No weigh-ins yet</div>'}
    </div>
    <!-- Progress Photos -->
    <div style="font-size:9px;color:var(--bl);letter-spacing:2px;font-weight:600;margin-bottom:5px;">PROGRESS PHOTOS</div>
    <div style="background:var(--cd);border:1px solid var(--bd);border-radius:14px;padding:12px;margin-bottom:10px;">
      <div style="display:flex;gap:5px;">
        ${['front','side','back'].map(t=>{
          const photos=LS.get('photos')||{};
          const todayPhotos=photos[today()]||{};
          const src=todayPhotos[t]||'';
          return`<div style="flex:1;">
            <div class="photo-slot-btn" data-type="${t}" style="width:100%;aspect-ratio:3/4;background:var(--ip);border-radius:8px;display:flex;align-items:center;justify-content:center;border:1px dashed var(--bd);cursor:pointer;overflow:hidden;position:relative;">
              ${src?`<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:7px;"/>`:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c6)" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>`}
            </div>
            <div style="text-align:center;font-size:8px;color:var(--c5);margin-top:3px;letter-spacing:1px;">${t.toUpperCase()}</div>
            <input type="file" accept="image/*" class="photo-input" data-type="${t}" style="display:none;"/>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:5px;margin-top:8px;">
        <div id="photo-camera" style="flex:1;background:var(--ip);border:1px solid var(--bd);border-radius:8px;padding:8px;text-align:center;font-size:10px;color:var(--bl);cursor:pointer;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2" style="vertical-align:-2px;margin-right:3px;"><rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 2h8l2 4H6l2-4"/></svg>Camera
        </div>
        <div id="photo-gallery" style="flex:1;background:var(--ip);border:1px solid var(--bd);border-radius:8px;padding:8px;text-align:center;font-size:10px;color:var(--bl);cursor:pointer;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bl)" stroke-width="2" style="vertical-align:-2px;margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>Gallery
        </div>
      </div>
    </div>
    <!-- Photo Timeline -->
    ${(()=>{
      const photos=LS.get('photos')||{};
      const dates=Object.keys(photos).sort().reverse().slice(0,5);
      if(!dates.length)return'';
      return`<div style="font-size:9px;color:var(--c5);letter-spacing:2px;font-weight:600;margin-bottom:5px;">PHOTO TIMELINE</div>
      ${dates.map(d=>{
        const p=photos[d];
        return`<div style="background:var(--cd);border:1px solid var(--bd);border-radius:10px;padding:10px;margin-bottom:6px;">
          <div style="font-size:10px;color:var(--c4);margin-bottom:6px;">${shortDate(d)}</div>
          <div style="display:flex;gap:4px;">
            ${['front','side','back'].map(t=>p[t]?`<div style="flex:1;aspect-ratio:3/4;border-radius:6px;overflow:hidden;"><img src="${p[t]}" style="width:100%;height:100%;object-fit:cover;"/></div>`:`<div style="flex:1;aspect-ratio:3/4;background:var(--ip);border-radius:6px;"></div>`).join('')}
          </div>
        </div>`;
      }).join('')}`;
    })()}
  </div>`;
}

// ===== SPLITS =====
function renderSplits(){
  const all=getSplits();
  const custom=all.filter(s=>s.custom);
  const templates=all.filter(s=>!s.custom);
  const rd=getRestDuration();
  return`<div style="padding:10px 16px;">
    <div style="font-size:9px;color:var(--bl);letter-spacing:2px;font-weight:600;margin-bottom:6px;">YOUR SPLITS</div>
    <div style="background:var(--cd);border-radius:12px;overflow:hidden;border:1px solid var(--bd);margin-bottom:10px;">
      ${custom.map((s,i)=>`<div style="padding:11px 12px;display:flex;justify-content:space-between;${i<custom.length-1?'border-bottom:1px solid var(--bd)':''}">
        <div><div style="font-size:13px;font-weight:600;color:var(--c2);">${s.name}</div><div style="font-size:10px;color:var(--c5);">${s.exercises.length} exercises</div></div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c5)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>`).join('')}
    </div>
    <div style="font-size:9px;color:var(--c4);letter-spacing:2px;font-weight:600;margin-bottom:6px;">TEMPLATES</div>
    <div style="background:var(--cd);border-radius:12px;overflow:hidden;border:1px solid var(--bd);margin-bottom:12px;">
      ${templates.slice(0,7).map((s,i)=>`<div style="padding:10px 12px;display:flex;justify-content:space-between;${i<6?'border-bottom:1px solid var(--bd)':''}">
        <span style="font-size:12px;color:var(--c3);">${s.name}</span><span style="font-size:10px;color:var(--c6);">${s.exercises.length} ex</span>
      </div>`).join('')}
    </div>
    <!-- Rest Timer Setting -->
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding-top:10px;border-top:1px solid var(--bd);">
      <span style="font-size:11px;color:var(--c5);">Rest timer default</span>
      <div style="display:flex;align-items:center;gap:5px;">
        <div id="rd-sub" style="width:28px;height:28px;background:var(--ip);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--bl);font-size:16px;cursor:pointer;">−</div>
        <span style="font-size:15px;font-weight:700;color:var(--bl);font-family:'DM Mono',monospace;min-width:40px;text-align:center;">${rd}s</span>
        <div id="rd-add" style="width:28px;height:28px;background:var(--ip);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--bl);font-size:16px;cursor:pointer;">+</div>
      </div>
    </div>
  </div>`;
}

// ===== EVENT BINDING =====
function bindEvents(){
  const root=document.getElementById('root');
  if(!root)return;

  // Logo -> Home
  const logo=root.querySelector('#nav-logo');
  if(logo)logo.onclick=()=>{state.tab='home';state.dropdown=false;state.preview=null;render()};

  // Theme toggle
  const tt=root.querySelector('#theme-toggle');
  if(tt)tt.onclick=()=>{const isDark=document.body.className==='dark';document.body.className=isDark?'light':'dark';LS.set('dk',!isDark);render()};

  // Nav tabs
  root.querySelectorAll('.nav-tab').forEach(el=>{
    el.onclick=()=>{state.tab=el.dataset.tab;state.dropdown=false;state.preview=null;state.editing=false;state.futurePlan=false;state.drill=null;render()};
  });

  // Onboarding
  const obGo=root.querySelector('#ob-go');
  if(obGo)obGo.onclick=()=>{
    const name=(root.querySelector('#ob-name')||{}).value||'';
    const age=(root.querySelector('#ob-age')||{}).value||'';
    const height=(root.querySelector('#ob-height')||{}).value||'';
    const cw=(root.querySelector('#ob-cw')||{}).value||'';
    const gw=(root.querySelector('#ob-gw')||{}).value||'';
    LS.set('prof',{name:name||'Athlete',age,height,currentWeight:cw,goalWeight:gw,startWeight:cw});
    if(cw)LS.set('bw',[{date:today(),weight:cw}]);
    state.screen='main';state.tab='home';render();
  };

  // Start workout
  const sw=root.querySelector('#start-workout');
  if(sw)sw.onclick=()=>{state.dropdown=true;render()};

  // Dropdown cancel
  const ddc=root.querySelector('#dd-cancel');
  if(ddc)ddc.onclick=()=>{state.dropdown=false;render()};

  // Split pick
  root.querySelectorAll('.split-pick').forEach(el=>{
    el.onclick=()=>{state.dropdown=false;state.preview=el.dataset.split;render()};
  });

  // Start blank
  const sb=root.querySelector('#start-blank');
  if(sb)sb.onclick=()=>{startWorkout(null,[]);};

  // Preview
  const pvc=root.querySelector('#pv-cancel');
  if(pvc)pvc.onclick=()=>{state.preview=null;state.addAbs=false;state.addCardio=false;render()};

  const pvs=root.querySelector('#pv-start');
  if(pvs)pvs.onclick=()=>{
    const split=getSplits().find(s=>s.name===state.preview);
    const exercises=(split?split.exercises:[]).map(name=>{
      const last=getLastExercise(name);
      const lastWeight=last&&last.sets.length?last.sets[0].weight:'';
      return{name,sets:[{type:'working',weight:lastWeight,reps:'',checked:false},{type:'working',weight:lastWeight,reps:'',checked:false}]};
    });
    const abs=state.addAbs?[{name:'Plank',timed:true,sets:[{value:'60',checked:false}]},{name:'Cable Crunch',timed:false,sets:[{value:'',checked:false}]},{name:'Leg Raise',timed:false,sets:[{value:'',checked:false}]}]:[];
    const cardio=state.addCardio?[{type:'Treadmill',minutes:'',distance:'',calories:''}]:[];
    startWorkout(state.preview,exercises,abs,cardio);
  };

  // Toggle abs/cardio
  const ta=root.querySelector('#toggle-abs');
  if(ta)ta.onclick=()=>{state.addAbs=!state.addAbs;render()};
  const tc=root.querySelector('#toggle-cardio');
  if(tc)tc.onclick=()=>{state.addCardio=!state.addCardio;render()};

  // Repeat button
  root.querySelectorAll('.repeat-btn').forEach(el=>{
    el.onclick=(e)=>{
      e.stopPropagation();
      const wk=getWorkouts().find(w=>w.id===el.dataset.id);
      if(wk){
        const exercises=(wk.exercises||[]).map(ex=>({name:ex.name,sets:(ex.sets||[]).map(s=>({type:s.type,weight:s.weight,reps:'',checked:false}))}));
        startWorkout(wk.split,exercises,wk.abs||[],wk.cardio||[]);
      }
    };
  });

  // Log rest day
  const lr=root.querySelector('#log-rest');
  if(lr)lr.onclick=()=>{state.restDayPicker=true;render()};

  // Rest day picker
  const rf=root.querySelector('#rest-full');
  if(rf)rf.onclick=()=>{logRestDay('rest')};
  const ra=root.querySelector('#rest-active');
  if(ra)ra.onclick=()=>{logRestDay('active')};
  const rc=root.querySelector('#rest-cancel');
  if(rc)rc.onclick=()=>{state.restDayPicker=false;render()};

  // Workout controls
  const wkf=root.querySelector('#wk-finish');
  if(wkf)wkf.onclick=finishWorkout;
  const wkc=root.querySelector('#wk-cancel');
  if(wkc)wkc.onclick=cancelWorkout;

  // Set check buttons
  root.querySelectorAll('.set-check-btn').forEach(el=>{
    el.onclick=()=>{
      const ei=parseInt(el.dataset.ei),si=parseInt(el.dataset.si);
      const w=state.activeWorkout;
      if(w&&w.exercises[ei]&&w.exercises[ei].sets[si]){
        w.exercises[ei].sets[si].checked=!w.exercises[ei].sets[si].checked;
        LS.set('aw',w);
        // Start rest timer if checking a working set
        if(w.exercises[ei].sets[si].checked&&w.exercises[ei].sets[si].type!=='warmup'){
          startRestTimer();
        }
        render();
      }
    };
  });

  // Set weight/reps inputs
  root.querySelectorAll('.set-weight').forEach(el=>{
    el.onchange=()=>{
      const ei=parseInt(el.dataset.ei),si=parseInt(el.dataset.si);
      if(state.activeWorkout)state.activeWorkout.exercises[ei].sets[si].weight=el.value;
      LS.set('aw',state.activeWorkout);
    };
  });
  root.querySelectorAll('.set-reps').forEach(el=>{
    el.onchange=()=>{
      const ei=parseInt(el.dataset.ei),si=parseInt(el.dataset.si);
      if(state.activeWorkout)state.activeWorkout.exercises[ei].sets[si].reps=el.value;
      LS.set('aw',state.activeWorkout);
    };
  });

  // Add working/warmup set
  root.querySelectorAll('.add-working').forEach(el=>{
    el.onclick=()=>{
      const ei=parseInt(el.dataset.ei);
      if(state.activeWorkout){
        const lastSet=state.activeWorkout.exercises[ei].sets.filter(s=>s.type!=='warmup').pop();
        state.activeWorkout.exercises[ei].sets.push({type:'working',weight:lastSet?lastSet.weight:'',reps:'',checked:false});
        LS.set('aw',state.activeWorkout);render();
      }
    };
  });
  root.querySelectorAll('.add-warmup').forEach(el=>{
    el.onclick=()=>{
      const ei=parseInt(el.dataset.ei);
      if(state.activeWorkout){
        // Insert warmup at the beginning
        state.activeWorkout.exercises[ei].sets.unshift({type:'warmup',weight:'',reps:'',checked:false});
        LS.set('aw',state.activeWorkout);render();
      }
    };
  });

  // Add exercise button
  const wkae=root.querySelector('#wk-add-ex');
  if(wkae)wkae.onclick=()=>{
    const name=prompt('Exercise name:');
    if(name&&state.activeWorkout){
      state.activeWorkout.exercises.push({name,sets:[{type:'working',weight:'',reps:'',checked:false},{type:'working',weight:'',reps:'',checked:false}]});
      LS.set('aw',state.activeWorkout);render();
    }
  };

  // Workout notes
  const wkn=root.querySelector('#wk-notes');
  if(wkn)wkn.onchange=()=>{if(state.activeWorkout){state.activeWorkout.notes=wkn.value;LS.set('aw',state.activeWorkout)}};

  // Rest timer controls
  const rtAdd=root.querySelector('#rt-add');
  if(rtAdd)rtAdd.onclick=()=>{state.restTimeLeft+=15;render()};
  const rtSub=root.querySelector('#rt-sub');
  if(rtSub)rtSub.onclick=()=>{state.restTimeLeft=Math.max(0,state.restTimeLeft-15);render()};
  const rtSkip=root.querySelector('#rt-skip');
  if(rtSkip)rtSkip.onclick=()=>{stopRestTimer()};

  // Summary done
  const sd=root.querySelector('#summary-done');
  if(sd)sd.onclick=()=>{state.summary=null;state.tab='home';render()};

  // Calendar
  root.querySelectorAll('.cal-d').forEach(el=>{
    el.onclick=()=>{state.calDay=parseInt(el.dataset.day);state.editing=false;state.futurePlan=false;render()};
  });
  const cp=root.querySelector('#cal-prev');
  if(cp)cp.onclick=()=>{state.calMonth--;if(state.calMonth<0){state.calMonth=11;state.calYear--}state.calDay=1;render()};
  const cn=root.querySelector('#cal-next');
  if(cn)cn.onclick=()=>{state.calMonth++;if(state.calMonth>11){state.calMonth=0;state.calYear++}state.calDay=1;render()};

  // Calendar edit
  const ce=root.querySelector('#cal-edit');
  if(ce)ce.onclick=()=>{state.editing=true;render()};
  const cec=root.querySelector('#cal-edit-cancel');
  if(cec)cec.onclick=()=>{state.editing=false;render()};
  const ces=root.querySelector('#cal-edit-save');
  if(ces)ces.onclick=()=>{state.editing=false;render()};
  const ced=root.querySelector('#cal-edit-delete');
  if(ced)ced.onclick=()=>{
    const selDate=fmtDate(new Date(state.calYear,state.calMonth,state.calDay));
    let wks=getWorkouts().filter(w=>w.date!==selDate);
    LS.set('wk',wks);state.editing=false;render();
  };

  // Calendar future
  const cplan=root.querySelector('#cal-plan');
  if(cplan)cplan.onclick=()=>{state.futurePlan=true;render()};
  const fc=root.querySelector('#future-cancel');
  if(fc)fc.onclick=()=>{state.futurePlan=false;render()};

  // Calendar rest day buttons
  ['cal-rest-future','cal-rest-past','cal-active-future'].forEach(id=>{
    const el=root.querySelector('#'+id);
    if(el)el.onclick=()=>{
      const selDate=fmtDate(new Date(state.calYear,state.calMonth,state.calDay));
      const type=id.includes('active')?'active':'rest';
      const rds=getRestDays().filter(r=>r.date!==selDate);
      rds.push({date:selDate,type});
      LS.set('rest',rds);render();
    };
  });

  // Calendar log past
  const clp=root.querySelector('#cal-log-past');
  if(clp)clp.onclick=()=>{
    // Store the date we're backfilling for, then open split picker
    const selDate=fmtDate(new Date(state.calYear,state.calMonth,state.calDay));
    state.backfillDate=selDate;
    state.dropdown=true;state.tab='home';render();
  };

  // Exercise drill-down
  root.querySelectorAll('.ex-drill,.ex-drill-link,.stat-drill').forEach(el=>{
    el.onclick=(e)=>{e.stopPropagation();state.drill=el.dataset.name;render()};
  });
  const dc=root.querySelector('#drill-close');
  if(dc)dc.onclick=()=>{state.drill=null;render()};

  // Body weight log
  const bwl=root.querySelector('#bw-log');
  if(bwl)bwl.onclick=()=>{
    const inp=root.querySelector('#bw-input');
    if(inp&&inp.value){
      const bw=getWeights();bw.push({date:today(),weight:inp.value});LS.set('bw',bw);render();
    }
  };

  // Edit profile
  const ep=root.querySelector('#edit-profile');
  if(ep)ep.onclick=()=>{state.editingProfile=true;render()};
  // Profile save
  const ps=root.querySelector('#prof-save');
  if(ps)ps.onclick=()=>{
    const p=getProfile();
    const n=root.querySelector('#prof-name');if(n)p.name=n.value||'Athlete';
    const a=root.querySelector('#prof-age');if(a)p.age=a.value;
    const h=root.querySelector('#prof-height');if(h)p.height=h.value;
    const cw=root.querySelector('#prof-cw');if(cw){p.currentWeight=cw.value;if(!p.startWeight)p.startWeight=cw.value;}
    const gw=root.querySelector('#prof-gw');if(gw)p.goalWeight=gw.value;
    LS.set('prof',p);state.editingProfile=false;render();
  };
  const pc=root.querySelector('#prof-cancel');
  if(pc)pc.onclick=()=>{state.editingProfile=false;render()};

  // Progress photo handlers
  let activePhotoType=null;
  root.querySelectorAll('.photo-slot-btn').forEach(el=>{
    el.onclick=()=>{
      activePhotoType=el.dataset.type;
      const inp=root.querySelector('.photo-input[data-type="'+el.dataset.type+'"]');
      if(inp){inp.removeAttribute('capture');inp.click();}
    };
  });
  const pcam=root.querySelector('#photo-camera');
  if(pcam)pcam.onclick=()=>{
    activePhotoType=activePhotoType||'front';
    const inp=root.querySelector('.photo-input[data-type="'+activePhotoType+'"]');
    if(inp){inp.setAttribute('capture','environment');inp.click();}
  };
  const pgal=root.querySelector('#photo-gallery');
  if(pgal)pgal.onclick=()=>{
    activePhotoType=activePhotoType||'front';
    const inp=root.querySelector('.photo-input[data-type="'+activePhotoType+'"]');
    if(inp){inp.removeAttribute('capture');inp.click();}
  };
  root.querySelectorAll('.photo-input').forEach(inp=>{
    inp.onchange=(e)=>{
      const file=e.target.files[0];
      if(!file)return;
      const type=inp.dataset.type;
      const reader=new FileReader();
      reader.onload=(ev)=>{
        // Resize to save storage space
        const img=new Image();
        img.onload=()=>{
          const canvas=document.createElement('canvas');
          const max=400;
          let w=img.width,h=img.height;
          if(w>h){h=h*(max/w);w=max;}else{w=w*(max/h);h=max;}
          canvas.width=w;canvas.height=h;
          canvas.getContext('2d').drawImage(img,0,0,w,h);
          const dataUrl=canvas.toDataURL('image/jpeg',0.7);
          const photos=LS.get('photos')||{};
          if(!photos[today()])photos[today()]={};
          photos[today()][type]=dataUrl;
          LS.set('photos',photos);
          render();
        };
        img.src=ev.target.result;
      };
      reader.readAsDataURL(file);
    };
  });

  // Rest duration controls
  const rda=root.querySelector('#rd-add');
  if(rda)rda.onclick=()=>{LS.set('rd',getRestDuration()+15);render()};
  const rds=root.querySelector('#rd-sub');
  if(rds)rds.onclick=()=>{LS.set('rd',Math.max(15,getRestDuration()-15));render()};
}

// ===== WORKOUT ACTIONS =====
function startWorkout(splitName,exercises,abs,cardio){
  const wkDate=state.backfillDate||today();
  state.activeWorkout={
    id:uid(),
    split:splitName||'Blank',
    exercises:exercises||[],
    abs:abs||[],
    cardio:cardio||[],
    notes:'',
    date:wkDate
  };
  state.workoutStart=Date.now();
  state.workoutElapsed=0;
  state.tab='workout';
  state.dropdown=false;
  state.preview=null;
  state.addAbs=false;
  state.addCardio=false;
  state.backfillDate=null;
  LS.set('aw',state.activeWorkout);
  // Start workout timer
  if(state.workoutInterval)clearInterval(state.workoutInterval);
  state.workoutInterval=setInterval(()=>{
    state.workoutElapsed=Date.now()-state.workoutStart;
    const el=document.querySelector('#wk-timer');
    if(el)el.textContent=fmtDuration(state.workoutElapsed);
  },1000);
  render();
}

function finishWorkout(){
  if(!state.activeWorkout)return;
  const w=state.activeWorkout;
  w.duration=state.workoutElapsed;
  // Save workout
  const wks=getWorkouts();
  wks.push(w);
  LS.set('wk',wks);
  LS.del('aw');
  // Build summary
  const sets=countSets();
  const volume=calcVolume();
  const exCount=(w.exercises||[]).length;
  state.summary={split:w.split,date:w.date,duration:w.duration,sets,volume,exercises:exCount};
  state.activeWorkout=null;
  if(state.workoutInterval)clearInterval(state.workoutInterval);
  state.tab='home';
  render();
}

function cancelWorkout(){
  if(confirm('Cancel this workout? Data will be lost.')){
    state.activeWorkout=null;
    LS.del('aw');
    if(state.workoutInterval)clearInterval(state.workoutInterval);
    state.tab='home';
    render();
  }
}

function logRestDay(type){
  const rds=getRestDays().filter(r=>r.date!==today());
  rds.push({date:today(),type});
  LS.set('rest',rds);
  state.restDayPicker=false;
  render();
}

// ===== REST TIMER =====
function startRestTimer(){
  state.restTimeLeft=getRestDuration();
  state.restTimer=true;
  if(state.restInterval)clearInterval(state.restInterval);
  state.restInterval=setInterval(()=>{
    state.restTimeLeft--;
    if(state.restTimeLeft<=0){
      stopRestTimer();
      // Vibrate
      if(navigator.vibrate)navigator.vibrate([200,100,200]);
    } else {
      render();
    }
  },1000);
  render();
}

function stopRestTimer(){
  state.restTimer=false;
  state.restTimeLeft=0;
  if(state.restInterval)clearInterval(state.restInterval);
  render();
}

// ===== START =====
init();

})();
