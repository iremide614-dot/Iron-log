const{useState,useEffect,useCallback,useRef}=React;
const h=React.createElement;

// === EXERCISE LIBRARY ===
const EXLIB={
Chest:["Bench Press","Incline Bench","Dumbbell Fly","Cable Crossover","Chest Press Machine","Decline Bench","Push-Ups"],
Back:["Deadlift","Barbell Row","Lat Pulldown","Seated Row","Pull-Ups","T-Bar Row","Cable Row","Machine Row"],
Shoulders:["Overhead Press","Lateral Raise","Front Raise","Face Pull","Arnold Press","Rear Delt Fly","DB Shoulder Press","Machine Shoulder Press"],
Arms:["Bicep Curl","Tricep Pushdown","Hammer Curl","Skull Crushers","Preacher Curl","Cable Curl","Tricep Rope","Overhead Tricep Extension","Cable Hammer"],
Legs:["Squat","Leg Press","Romanian Deadlift","Hamstring Curl","Quad Extension","Calf Raises","Lunges","Bulgarian Split Squat","Hip Thrust"],
Core:["Plank","Cable Crunch","Leg Raise","Russian Twist","Ab Rollout","Hanging Knee Raise","Dead Bug","Mountain Climbers"],
Cardio:["Treadmill","Cycling","Rowing","Stair Climber","Jump Rope","Elliptical"]
};
const ALL_EX=Object.values(EXLIB).flat();
const TIMED_EX=["Plank","Dead Bug","Mountain Climbers","Wall Sit","Dead Hang"];
const CARDIO_EX=["Treadmill","Cycling","Rowing","Stair Climber","Jump Rope","Elliptical"];

// === DEFAULT SPLITS ===
const DEF_SPLITS={
"Bis/Chest/Shoulders":[{name:"Cable Curl",sets:2,note:""},{name:"Incline Bench",sets:2,note:"3 plates"},{name:"Cable Hammer",sets:3,note:""},{name:"Chest Press Machine",sets:2,note:"or Chest Fly"},{name:"Chest Fly",sets:2,note:""},{name:"Lateral Raise",sets:2,note:"machine"},{name:"Preacher Curl",sets:2,note:"machine"}],
"Tris/Back/Rear Delts":[{name:"Tricep Pushdown",sets:2,note:""},{name:"Overhead Tricep Extension",sets:2,note:"bar"},{name:"Lat Pulldown",sets:2,note:""},{name:"Machine Row",sets:2,note:""},{name:"Rear Delt Fly",sets:2,note:"pec deck"},{name:"Pull-Ups",sets:2,note:"optional"},{name:"Tricep Rope",sets:2,note:""}],
"Legs":[{name:"Squat",sets:3,note:"or Leg Press"},{name:"Leg Press",sets:3,note:""},{name:"Hamstring Curl",sets:3,note:""},{name:"Quad Extension",sets:3,note:""},{name:"Calf Raises",sets:3,note:""}],
"SARMS":[{name:"DB Shoulder Press",sets:2,note:""},{name:"Lateral Raise",sets:2,note:"drop set"},{name:"Rear Delt Fly",sets:2,note:""},{name:"Hammer Curl",sets:2,note:""},{name:"Cable Curl",sets:2,note:""}],
"Push (PPL)":[{name:"Bench Press",sets:3,note:""},{name:"Incline Bench",sets:3,note:""},{name:"Overhead Press",sets:3,note:""},{name:"Lateral Raise",sets:3,note:""},{name:"Tricep Pushdown",sets:3,note:""},{name:"Cable Crossover",sets:2,note:""}],
"Pull (PPL)":[{name:"Deadlift",sets:3,note:""},{name:"Barbell Row",sets:3,note:""},{name:"Lat Pulldown",sets:3,note:""},{name:"Face Pull",sets:3,note:""},{name:"Bicep Curl",sets:3,note:""},{name:"Hammer Curl",sets:2,note:""}],
"Legs (PPL)":[{name:"Squat",sets:4,note:""},{name:"Romanian Deadlift",sets:3,note:""},{name:"Leg Press",sets:3,note:""},{name:"Hamstring Curl",sets:3,note:""},{name:"Quad Extension",sets:3,note:""},{name:"Calf Raises",sets:4,note:""}],
"Upper":[{name:"Bench Press",sets:3,note:""},{name:"Barbell Row",sets:3,note:""},{name:"Overhead Press",sets:3,note:""},{name:"Lat Pulldown",sets:3,note:""},{name:"Bicep Curl",sets:2,note:""},{name:"Tricep Pushdown",sets:2,note:""},{name:"Lateral Raise",sets:2,note:""}],
"Lower":[{name:"Squat",sets:4,note:""},{name:"Romanian Deadlift",sets:3,note:""},{name:"Leg Press",sets:3,note:""},{name:"Hamstring Curl",sets:3,note:""},{name:"Calf Raises",sets:4,note:""}],
"Full Body":[{name:"Squat",sets:3,note:""},{name:"Bench Press",sets:3,note:""},{name:"Barbell Row",sets:3,note:""},{name:"Overhead Press",sets:2,note:""},{name:"Hamstring Curl",sets:2,note:""},{name:"Bicep Curl",sets:2,note:""}],
"Chest Day":[{name:"Bench Press",sets:4,note:""},{name:"Incline Bench",sets:3,note:""},{name:"Dumbbell Fly",sets:3,note:""},{name:"Cable Crossover",sets:3,note:""},{name:"Chest Press Machine",sets:2,note:""}],
"Back Day":[{name:"Deadlift",sets:3,note:""},{name:"Lat Pulldown",sets:3,note:""},{name:"Barbell Row",sets:3,note:""},{name:"Seated Row",sets:3,note:""},{name:"Pull-Ups",sets:2,note:""}],
"Arms Day":[{name:"Bicep Curl",sets:3,note:""},{name:"Hammer Curl",sets:3,note:""},{name:"Tricep Pushdown",sets:3,note:""},{name:"Skull Crushers",sets:3,note:""},{name:"Preacher Curl",sets:2,note:""},{name:"Overhead Tricep Extension",sets:2,note:""}],
"Shoulders Day":[{name:"Overhead Press",sets:4,note:""},{name:"Lateral Raise",sets:3,note:""},{name:"Front Raise",sets:3,note:""},{name:"Face Pull",sets:3,note:""},{name:"Rear Delt Fly",sets:2,note:""}]
};

// === SVG ICONS ===
function ic(name,size,color){
const s=size||16,c=color||'currentColor';
const paths={
cam:`<rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M8 2h8l2 4H6l2-4"/>`,
x:`<path d="M18 6L6 18M6 6l12 12"/>`,
plus:`<path d="M12 5v14M5 12h14"/>`,
chk:`<path d="M5 12l5 5L19 7"/>`,
up:`<path d="M12 19V5M5 12l7-7 7 7"/>`,
dn:`<path d="M12 5v14M19 12l-7 7-7-7"/>`,
edit:`<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
play:`<polygon points="5 3 19 12 5 21 5 3"/>`,
chev:`<path d="M9 18l6-6-6-6"/>`,
chevL:`<path d="M15 18l-6-6 6-6"/>`,
sun:`<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>`,
moon:`<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>`,
user:`<circle cx="12" cy="8" r="4"/><path d="M5 20c0-4 3-7 7-7s7 3 7 7"/>`,
chart:`<path d="M3 20l5-8 4 4 4-8 5 6"/>`,
};
return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]||''}</svg>`;
}

// === HELPERS ===
const fmtD=d=>d.toISOString().split("T")[0];
const today=()=>fmtD(new Date());
const pDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})};
const sDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{month:"short",day:"numeric"})};
const fmtT=s=>{const m=Math.floor(s/60),sc=s%60;return m+":"+(sc<10?"0":"")+sc};
const fmtDur=ms=>{const s=Math.floor(ms/1000),m=Math.floor(s/60),hr=Math.floor(m/60);return hr>0?hr+"h "+(m%60)+"m":m+"m "+(s%60)+"s"};
const compImg=(file,max=600)=>new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");let w=img.width,ht=img.height;if(w>ht){if(w>max){ht=(ht*max)/w;w=max}}else if(ht>max){w=(w*max)/ht;ht=max}c.width=w;c.height=ht;c.getContext("2d").drawImage(img,0,0,w,ht);res(c.toDataURL("image/jpeg",.7))};img.src=e.target.result};r.readAsDataURL(file)});
const db={g:k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},s:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.error(e)}},r:k=>localStorage.removeItem(k)};
const dc=o=>JSON.parse(JSON.stringify(o));
const isTimed=n=>TIMED_EX.some(t=>n.toLowerCase().includes(t.toLowerCase()));
const isCardio=n=>CARDIO_EX.some(t=>n.toLowerCase().includes(t.toLowerCase()));

// === MAIN APP ===
function App(){
// --- State ---
const[profile,setProfile]=useState({name:"",age:"",height:"",currentWeight:"",goalWeight:"",startWeight:"",photo:null});
const[splits,setSplits]=useState(DEF_SPLITS);
const[workouts,setWorkouts]=useState({}); // {date:{type:'workout'|'rest'|'active',split,exercises,notes,duration,cardio}}
const[photos,setPhotos]=useState({});
const[bw,setBw]=useState({}); // {date:number}
const[pp,setPp]=useState({}); // {date:{front,side,back}}
const[exNotes,setExNotes]=useState({}); // {exName:string}
const[dark,setDark]=useState(true);
const[view,setView]=useState("onboarding");
const[loaded,setLoaded]=useState(false);
const[toast,setToast]=useState(null);
// Workout
const[aw,setAw]=useState(null); // active workout {date,startTime}
const[elapsed,setElapsed]=useState(0);
const[restTmr,setRestTmr]=useState(null); // {end,dur}
const[restLeft,setRestLeft]=useState(0);
const[restDur,setRestDur]=useState(90);
const[wkNotes,setWkNotes]=useState("");
// UI
const[dd,setDd]=useState(false); // dropdown open
const[pv,setPv]=useState(null); // preview split name
const[pvExs,setPvExs]=useState([]); // preview exercise list
const[pvAbs,setPvAbs]=useState(false);
const[pvCardio,setPvCardio]=useState(false);
const[calM,setCalM]=useState(new Date().getMonth());
const[calY,setCalY]=useState(new Date().getFullYear());
const[calSel,setCalSel]=useState(today());
const[editing,setEditing]=useState(false);
const[drill,setDrill]=useState(null); // exercise name for drill-down
const[rdPick,setRdPick]=useState(null); // date for rest day picker
const[viewPhoto,setViewPhoto]=useState(null);
const[photoMenu,setPhotoMenu]=useState(null); // exIdx
const[ppUpload,setPpUpload]=useState(null); // 'front'|'side'|'back'
const[editProf,setEditProf]=useState(false);
const fileRef=useRef(null);
const ppRef=useRef(null);
const capRef=useRef(null);

// --- Load ---
useEffect(()=>{
const p=db.g("rc-profile");if(p){setProfile(p);setView("home")}
const sp=db.g("rc-splits");if(sp)setSplits(sp);
const w=db.g("rc-wk");if(w)setWorkouts(w);
const ph=db.g("rc-ph");if(ph)setPhotos(ph);
const b=db.g("rc-bw");if(b)setBw(b);
const pp2=db.g("rc-pp");if(pp2)setPp(pp2);
const en=db.g("rc-en");if(en)setExNotes(en);
const dk=db.g("rc-dk");if(dk!==null)setDark(dk);
const rd=db.g("rc-rd");if(rd)setRestDur(rd);
const a=db.g("rc-aw");if(a){setAw(a);setView("workout");const d=db.g("rc-wk");if(d&&d[a.date])setWkNotes(d[a.date].notes||"")}
setLoaded(true);
},[]);

// Dark mode class
useEffect(()=>{document.body.className=dark?"":"light"},[dark]);

// Elapsed timer
useEffect(()=>{if(!aw)return;const iv=setInterval(()=>setElapsed(Date.now()-aw.startTime),1000);return()=>clearInterval(iv)},[aw]);

// Rest timer
useEffect(()=>{if(!restTmr)return;const iv=setInterval(()=>{const left=Math.max(0,Math.ceil((restTmr.end-Date.now())/1000));setRestLeft(left);if(left<=0){setRestTmr(null);try{navigator.vibrate?.([200,100,200])}catch(e){}}},250);return()=>clearInterval(iv)},[restTmr]);

// --- Save helpers ---
const svProfile=useCallback(d=>{db.s("rc-profile",d)},[]);
const svSplits=useCallback(d=>{db.s("rc-splits",d)},[]);
const svWk=useCallback(d=>{db.s("rc-wk",d)},[]);
const svPh=useCallback(d=>{db.s("rc-ph",d)},[]);
const svBw=useCallback(d=>{db.s("rc-bw",d)},[]);
const svPp=useCallback(d=>{db.s("rc-pp",d)},[]);
const svEn=useCallback(d=>{db.s("rc-en",d)},[]);
const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2200)};

// --- Data helpers ---
const getLastWeights=name=>{
const dates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));
for(const d of dates){const wk=workouts[d];if(wk.type!=='workout')continue;
const ex=(wk.exercises||[]).find(e=>e.name===name);
if(ex){const done=ex.sets.filter(s=>s.done&&s.weight);if(done.length)return done.map(s=>s.weight)}}
return null};

const getLastSession=(name,before)=>{
const dates=Object.keys(workouts).filter(d=>d<before).sort((a,b)=>b.localeCompare(a));
for(const d of dates){const wk=workouts[d];if(wk.type!=='workout')continue;
const ex=(wk.exercises||[]).find(e=>e.name===name);
if(ex){const done=ex.sets.filter(s=>s.done&&!s.warmup&&(s.weight||s.reps));if(done.length)return{date:d,sets:done}}}
return null};

const getAvgVol=(name,before)=>{
const all=[];Object.entries(workouts).forEach(([d,wk])=>{if(d>=before||wk.type!=='workout')return;
const ex=(wk.exercises||[]).find(e=>e.name===name);
if(ex)ex.sets.filter(s=>s.done&&!s.warmup&&s.weight&&s.reps).forEach(s=>all.push((+s.weight||0)*(+s.reps||0)))});
return all.length?Math.round(all.reduce((a,b)=>a+b,0)/all.length):null};

const getOverload=(name,sets,before)=>{
const last=getLastSession(name,before);if(!last)return null;
const lastMax=Math.max(...last.sets.map(s=>(+s.weight||0)*(+s.reps||0)));
const cur=sets.filter(s=>s.done&&!s.warmup);if(!cur.length)return null;
const curMax=Math.max(...cur.map(s=>(+s.weight||0)*(+s.reps||0)));
return curMax>lastMax?"up":curMax<lastMax?"dn":"eq"};

const getStreak=()=>{
let streak=0,best=db.g("rc-best")||0;
const d=new Date();d.setHours(12,0,0,0);
for(let i=0;i<365;i++){const ds=fmtD(d);
if(workouts[ds])streak++;else if(i>0){break}
d.setDate(d.getDate()-1)}
if(streak>best){best=streak;db.s("rc-best",best)}
return{current:streak,best}};

const getExHistory=name=>{
const sessions=[];
Object.entries(workouts).sort(([a],[b])=>b.localeCompare(a)).forEach(([d,wk])=>{
if(wk.type!=='workout')return;
const ex=(wk.exercises||[]).find(e=>e.name===name);
if(!ex)return;
const done=ex.sets.filter(s=>s.done&&!s.warmup&&s.weight&&s.reps);
if(done.length)sessions.push({date:d,sets:done,vol:done.reduce((a,s)=>a+(+s.weight||0)*(+s.reps||0),0)})});
if(!sessions.length)return null;
const maxW=Math.max(...sessions.flatMap(s=>s.sets.map(st=>+st.weight||0)));
const maxV=Math.max(...sessions.map(s=>s.vol));
return{sessions,maxW,maxV,count:sessions.length}};

// --- Photo handlers ---
const handleCapture=async(exIdx,file)=>{
if(!file)return;try{showToast("Processing...");
const comp=await compImg(file);const d=aw?.date||calSel;
const key=d+":"+exIdx;const up={...photos};
if(!up[key])up[key]=[];up[key].push(comp);
if(up[key].length>3)up[key]=up[key].slice(-3);
setPhotos(up);svPh(up);showToast("Photo saved!")}catch(e){showToast("Failed")}};
const rmPhoto=(key,i)=>{const up={...photos};if(up[key]){up[key].splice(i,1);if(!up[key].length)delete up[key];setPhotos(up);svPh(up);showToast("Removed")}setViewPhoto(null)};
const triggerCam=i=>{capRef.current=i;setPhotoMenu(i)};
const fileSel=mode=>{const inp=fileRef.current;if(!inp)return;mode==="cam"?inp.setAttribute("capture","environment"):inp.removeAttribute("capture");inp.click();setPhotoMenu(null)};
const onFile=async e=>{const f=e.target.files?.[0];if(f&&capRef.current!==null)await handleCapture(capRef.current,f);e.target.value=""};
const handlePP=async(type,file)=>{if(!file)return;try{const comp=await compImg(file,800);const up={...pp};const d=ppUpload==='future'?calSel:today();if(!up[d])up[d]={};up[d][type]=comp;setPp(up);svPp(up);showToast(type+" saved!")}catch(e){showToast("Failed")}setPpUpload(null)};
const onPPFile=async e=>{const f=e.target.files?.[0];if(f&&ppUpload&&ppUpload!=='future')await handlePP(ppUpload,f);e.target.value=""};

// --- Navigation ---
const nav=v=>{setView(v);setDd(false);setPv(null);setPvExs([]);setEditing(false);setDrill(null);setRdPick(null);setPhotoMenu(null);setPpUpload(null)};

// --- Workout lifecycle ---
const startWorkout=(splitName,date)=>{
const d=date||today();
const a={date:d,startTime:Date.now()};
if(!date){setAw(a);db.s("rc-aw",a)}
const up={...workouts};
if(!up[d])up[d]={type:"workout",split:splitName,exercises:[],notes:"",cardio:[],abs:[]};
else{up[d].type="workout";up[d].split=splitName;if(!up[d].exercises)up[d].exercises=[];if(!up[d].cardio)up[d].cardio=[];if(!up[d].abs)up[d].abs=[]}

// Load exercises from split
const splitExs=splits[splitName]||[];
splitExs.forEach(preset=>{
const sets=[];const lastW=getLastWeights(preset.name);
for(let i=0;i<(preset.sets||2);i++){
sets.push({weight:lastW?lastW[Math.min(i,lastW.length-1)]:"",reps:"",done:false,warmup:false})}
up[d].exercises.push({name:preset.name,split:splitName,note:preset.note||"",sets})});

// Add abs if toggled
if(pvAbs){["Plank","Cable Crunch","Leg Raise"].forEach(name=>{
up[d].abs.push({name,sets:[{duration:isTimed(name)?"60":"",reps:isTimed(name)?"":"12",done:false}]})})}

// Add cardio if toggled
if(pvCardio){up[d].cardio.push({type:"Treadmill",minutes:"",distance:"",incline:"",speed:"",calories:"",done:false})}

setWorkouts(up);svWk(up);setWkNotes("");
if(!date)setView("workout");
showToast("Let's go!");setPv(null);setPvExs([]);setPvAbs(false);setPvCardio(false)};

const finishWorkout=()=>{
const up={...workouts};const d=aw.date;
if(up[d]){up[d].endTime=Date.now();up[d].duration=Date.now()-aw.startTime;up[d].notes=wkNotes}
setWorkouts(up);svWk(up);setAw(null);db.r("rc-aw");setRestTmr(null);
setView("summary");showToast("Workout saved!")};

const cancelWorkout=()=>{
if(!confirm("Cancel this workout? All data for today will be deleted."))return;
const up={...workouts};delete up[aw?.date||calSel];setWorkouts(up);svWk(up);
setAw(null);db.r("rc-aw");setRestTmr(null);nav("home");showToast("Cancelled")};

const dupWorkout=date=>{
const wk=workouts[date];if(!wk||wk.type!=='workout')return;
startWorkout(wk.split||"Custom",null)};

const logRestDay=(date,type)=>{
const up={...workouts};up[date]={type};setWorkouts(up);svWk(up);
showToast(type==='rest'?"Rest day logged":"Active recovery logged");setRdPick(null)};

// --- Exercise actions ---
const wkDate=()=>aw?.date||calSel;
const addEx=(name,note)=>{
const up={...workouts};const d=wkDate();
if(!up[d]){up[d]={type:"workout",split:"Custom",exercises:[],notes:"",cardio:[],abs:[]}}
const sets=[];const lastW=getLastWeights(name);
for(let i=0;i<2;i++)sets.push({weight:lastW?lastW[Math.min(i,lastW.length-1)]:"",reps:"",done:false,warmup:false});
if(isCardio(name)){if(!up[d].cardio)up[d].cardio=[];up[d].cardio.push({type:name,minutes:"",distance:"",incline:"",speed:"",calories:"",done:false})}
else if(isTimed(name)){if(!up[d].abs)up[d].abs=[];up[d].abs.push({name,sets:[{duration:"60",reps:"",done:false}]})}
else{up[d].exercises.push({name,split:up[d].split||"Custom",note:note||"",sets})}
setWorkouts(up);svWk(up);setDd(false);setPv(null);showToast("Added "+name)};

const addSet=(exIdx,warmup)=>{
const up=dc(workouts);const d=wkDate();
const last=up[d].exercises[exIdx].sets.slice(-1)[0];
up[d].exercises[exIdx].sets.push({weight:last?.weight||"",reps:last?.reps||"",done:false,warmup:!!warmup});
setWorkouts(up);svWk(up)};

const rmSet=(exIdx,si)=>{
const up=dc(workouts);const d=wkDate();
up[d].exercises[exIdx].sets.splice(si,1);
if(!up[d].exercises[exIdx].sets.length)up[d].exercises.splice(exIdx,1);
if(!up[d].exercises.length&&!up[d].cardio?.length&&!up[d].abs?.length)delete up[d];
setWorkouts(up);svWk(up)};

const updSet=(exIdx,si,field,val)=>{
const up=dc(workouts);const d=wkDate();
up[d].exercises[exIdx].sets[si][field]=val;
setWorkouts(up);svWk(up)};

const togDone=(exIdx,si)=>{
const up=dc(workouts);const d=wkDate();
const was=up[d].exercises[exIdx].sets[si].done;
up[d].exercises[exIdx].sets[si].done=!was;
setWorkouts(up);svWk(up);
if(!was&&!up[d].exercises[exIdx].sets[si].warmup){
setRestTmr({end:Date.now()+restDur*1000,dur:restDur});setRestLeft(restDur)}};

const delEx=exIdx=>{
const up=dc(workouts);const d=wkDate();
up[d].exercises.splice(exIdx,1);
if(!up[d].exercises.length&&!up[d].cardio?.length&&!up[d].abs?.length)delete up[d];
setWorkouts(up);svWk(up);showToast("Removed")};

const moveEx=(exIdx,dir)=>{
const up=dc(workouts);const d=wkDate();
const arr=up[d].exercises;const ni=exIdx+dir;
if(ni<0||ni>=arr.length)return;
[arr[exIdx],arr[ni]]=[arr[ni],arr[exIdx]];
setWorkouts(up);svWk(up)};

// Cardio actions
const updCardio=(ci,field,val)=>{
const up=dc(workouts);up[wkDate()].cardio[ci][field]=val;
setWorkouts(up);svWk(up)};
const togCardio=ci=>{
const up=dc(workouts);up[wkDate()].cardio[ci].done=!up[wkDate()].cardio[ci].done;
setWorkouts(up);svWk(up)};
const rmCardio=ci=>{
const up=dc(workouts);up[wkDate()].cardio.splice(ci,1);
setWorkouts(up);svWk(up)};

// Abs actions
const updAbs=(ai,si,field,val)=>{
const up=dc(workouts);up[wkDate()].abs[ai].sets[si][field]=val;
setWorkouts(up);svWk(up)};
const togAbs=(ai,si)=>{
const up=dc(workouts);up[wkDate()].abs[ai].sets[si].done=!up[wkDate()].abs[ai].sets[si].done;
setWorkouts(up);svWk(up)};

// Body weight
const logBW=val=>{if(!val)return;const up={...bw};up[calSel||today()]=parseFloat(val);setBw(up);svBw(up);showToast("Logged")};
const bwDates=Object.keys(bw).sort((a,b)=>b.localeCompare(a));
const bwTrend=()=>{if(bwDates.length<2)return null;const a=bw[bwDates[0]],b=bw[bwDates[1]];return a>b?"up":a<b?"dn":"eq"};

// Save profile
const saveProfile=p=>{setProfile(p);svProfile(p);if(!p.startWeight&&p.currentWeight)p.startWeight=p.currentWeight;showToast("Profile saved")};

// Calendar helpers
const calDays=()=>{const first=new Date(calY,calM,1);const last=new Date(calY,calM+1,0);const start=first.getDay();const days=[];for(let i=0;i<start;i++)days.push(null);for(let i=1;i<=last.getDate();i++)days.push(i);return days};
const calMonthName=new Date(calY,calM).toLocaleDateString("en-US",{month:"long",year:"numeric"});
const calDateStr=d=>{if(!d)return"";return calY+"-"+String(calM+1).padStart(2,"0")+"-"+String(d).padStart(2,"0")};

// Computed
const d=wkDate();
const dayData=workouts[d];
const todayEx=dayData?.exercises||[];
const totalSets=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done&&!s.warmup).length,0);
const totalVol=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done&&!s.warmup).reduce((b,s)=>b+(+s.weight||0)*(+s.reps||0),0),0);
const sortedDates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));
const streak=getStreak();
const splitNames=Object.keys(splits);

// Group splits for dropdown
const mySplits=["Bis/Chest/Shoulders","Tris/Back/Rear Delts","Legs","SARMS"].filter(s=>splits[s]);
const pplSplits=["Push (PPL)","Pull (PPL)","Legs (PPL)"].filter(s=>splits[s]);
const ulSplits=["Upper","Lower","Full Body"].filter(s=>splits[s]);
const broSplits=["Chest Day","Back Day","Arms Day","Shoulders Day"].filter(s=>splits[s]);
const customSplits=splitNames.filter(s=>!mySplits.includes(s)&&!pplSplits.includes(s)&&!ulSplits.includes(s)&&!broSplits.includes(s));

if(!loaded)return h("div",{style:{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",background:"var(--bg)"}},
h("div",{style:{fontSize:"32px",color:"var(--blu)",animation:"pulse 1.5s infinite"}},"\u25C6"),
h("p",{style:{color:"var(--c4)",fontFamily:"'DM Mono',monospace",letterSpacing:"3px",fontSize:"12px"}},"LOADING"));

// === STYLES ===
const S={
container:{minHeight:"100vh",minHeight:"100dvh",background:"var(--bg)",color:"var(--c1)",fontFamily:"'Outfit',sans-serif",maxWidth:"480px",margin:"0 auto",paddingBottom:"70px",position:"relative"},
toast:{position:"fixed",bottom:"80px",left:"50%",transform:"translateX(-50%)",background:"var(--cd)",border:"1px solid var(--blu)",color:"var(--blu)",padding:"10px 24px",borderRadius:"10px",fontFamily:"'DM Mono',monospace",fontSize:"12px",zIndex:1001,animation:"toast 2.2s ease forwards",whiteSpace:"nowrap"},
overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(4,5,8,.92)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",animation:"fadeIn .2s ease"},
hdr:{background:"var(--hd)",padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--bd)"},
logo:{fontSize:"18px",fontWeight:800,letterSpacing:"3px",color:"var(--c1)",margin:0},
sub:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"var(--c4)",marginTop:"1px"},
pill:{background:"rgba(74,143,255,.08)",borderRadius:"8px",padding:"4px 8px",display:"inline-flex",alignItems:"center",gap:"2px"},
pillN:{fontSize:"13px",fontWeight:700,color:"var(--blu)"},
pillL:{fontSize:"8px",color:"var(--c5)"},
nav:{display:"flex",padding:"6px 10px 8px",gap:"2px",borderTop:"1px solid var(--bd)",position:"fixed",bottom:0,left:0,right:0,background:"var(--bg)",zIndex:100,maxWidth:"480px",margin:"0 auto"},
navBtn:{flex:1,textAlign:"center",padding:"6px 0",cursor:"pointer",borderRadius:"8px"},
navDot:{width:"4px",height:"4px",borderRadius:"50%",margin:"0 auto 3px"},
navLbl:{fontSize:"9px",letterSpacing:"1px",fontFamily:"'DM Mono',monospace"},
content:{padding:"12px 16px"},
card:{background:"var(--cd)",border:"1px solid var(--bd)",borderRadius:"14px",padding:"14px",marginBottom:"10px"},
inp:{background:"var(--ip)",border:"1px solid var(--bd)",borderRadius:"8px",color:"var(--c2)",padding:"10px 12px",fontSize:"14px",fontFamily:"'Outfit',sans-serif",width:"100%"},
inpSm:{background:"var(--ip)",border:"1px solid var(--bd)",borderRadius:"7px",color:"var(--c2)",padding:"7px",fontSize:"13px",fontFamily:"'DM Mono',monospace",textAlign:"center",flex:1,marginRight:"4px"},
sel:{background:"var(--ip)",border:"1px solid var(--bd)",borderRadius:"8px",color:"var(--c2)",padding:"10px 30px 10px 12px",fontSize:"13px",fontFamily:"'Outfit',sans-serif",width:"100%"},
btn:{background:"linear-gradient(135deg,#1a3a7a,#0d2459)",borderRadius:"12px",padding:"14px",textAlign:"center",fontSize:"13px",fontWeight:600,letterSpacing:"2px",color:"#fff",cursor:"pointer",width:"100%",border:"none"},
btnG:{background:"linear-gradient(135deg,var(--grn),#18a050)",borderRadius:"12px",padding:"14px",textAlign:"center",fontSize:"14px",fontWeight:700,letterSpacing:"2px",color:"#fff",cursor:"pointer",width:"100%",border:"none"},
btnBlu:{background:"var(--blu)",border:"none",borderRadius:"8px",color:"#000",padding:"10px 16px",fontSize:"12px",fontWeight:700,cursor:"pointer"},
btnOut:{background:"transparent",border:"1px solid var(--bd)",borderRadius:"8px",color:"var(--c4)",padding:"8px 12px",fontSize:"11px",cursor:"pointer",fontFamily:"'DM Mono',monospace"},
lbl:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"var(--c4)",marginBottom:"5px",display:"block"},
tag:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"var(--blu)",textTransform:"uppercase"},
note:{fontFamily:"'DM Mono',monospace",fontSize:"9px",color:"var(--c5)",background:"var(--ip)",padding:"2px 5px",borderRadius:"3px"},
exName:{fontSize:"15px",fontWeight:700,color:"var(--c1)",marginTop:"2px"},
lastS:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"var(--c5)",marginTop:"2px"},
setHdr:{display:"flex",padding:"4px 0",fontSize:"8px",color:"var(--c6)",fontFamily:"'DM Mono',monospace",letterSpacing:"1px",borderBottom:"1px solid var(--bd)",marginBottom:"2px"},
setRow:{display:"flex",alignItems:"center",padding:"3px 0",borderRadius:"5px"},
setDone:{background:"rgba(74,143,255,.03)"},
setNum:{width:"32px",fontSize:"11px",color:"var(--c5)",fontFamily:"'DM Mono',monospace"},
chkBtn:{width:"28px",height:"28px",borderRadius:"7px",background:"var(--ip)",border:"1px solid var(--bd)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0},
chkDone:{background:"var(--blu)",border:"1px solid var(--blu)"},
warmChk:{background:"rgba(176,128,48,.15)",border:"1px solid rgba(176,128,48,.2)"},
iconBtn:{background:"transparent",border:"1px solid var(--bd)",borderRadius:"5px",width:"22px",height:"22px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,color:"var(--c5)"},
pThumb:{width:"50px",height:"50px",borderRadius:"8px",overflow:"hidden",border:"1px solid var(--bd)",cursor:"pointer",flexShrink:0},
tImg:{width:"100%",height:"100%",objectFit:"cover",display:"block"},
streak:{background:"linear-gradient(135deg,rgba(255,140,40,.06),rgba(255,80,20,.02))",border:"1px solid rgba(255,140,40,.1)",borderRadius:"14px",padding:"12px 14px",display:"flex",alignItems:"center",gap:"12px",marginBottom:"12px"},
streakBox:{width:"48px",height:"48px",borderRadius:"12px",background:"linear-gradient(135deg,rgba(255,160,40,.12),rgba(255,100,20,.06))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"26px"},
finBtn:{flex:1,background:"rgba(34,204,102,.06)",border:"1px solid rgba(34,204,102,.15)",borderRadius:"10px",padding:"10px",textAlign:"center",fontSize:"12px",fontWeight:600,color:"var(--grn)",cursor:"pointer"},
canBtn:{flex:1,background:"rgba(255,85,85,.04)",border:"1px solid rgba(255,85,85,.1)",borderRadius:"10px",padding:"10px",textAlign:"center",fontSize:"12px",color:"var(--red)",cursor:"pointer"},
prItem:{background:"rgba(74,143,255,.04)",borderRadius:"8px",padding:"10px 8px"},
prVal:{fontSize:"18px",fontWeight:700,color:"var(--c1)"},
prLbl:{fontSize:"8px",color:"var(--c5)",letterSpacing:"1px",marginTop:"2px",fontFamily:"'DM Mono',monospace"},
};

// === RENDER HELPERS ===

// Exercise card
const renderExCard=(ex,exIdx,date)=>{
const key=date+":"+exIdx;const exP=photos[key]||[];
const last=getLastSession(ex.name,date);
const avg=getAvgVol(ex.name,date);
const ol=getOverload(ex.name,ex.sets,date);
return h("div",{key:exIdx,style:{...S.card,animation:"slideUp .3s ease"}},
// Header
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}},
h("div",{style:{flex:1}},
h("div",{style:{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}},
h("span",{style:S.tag},ex.split||""),
ex.note&&h("span",{style:S.note},ex.note),
ol==="up"&&h("span",{style:{color:"var(--grn)",display:"flex"},dangerouslySetInnerHTML:{__html:ic("up",12,"var(--grn)")}}),
ol==="dn"&&h("span",{style:{color:"var(--red)",display:"flex"},dangerouslySetInnerHTML:{__html:ic("dn",12,"var(--red)")}})),
h("div",{style:S.exName,onClick:()=>setDrill(ex.name),className:"ab"},ex.name),
last&&h("div",{style:S.lastS},"Last: "+last.sets.map(s=>s.weight+"\u00D7"+s.reps).join(", ")),
avg&&h("div",{style:{...S.lastS,color:"var(--c6)"}},"Avg vol/set: "+avg)),
h("div",{style:{display:"flex",gap:"3px"}},
aw&&h("button",{style:S.iconBtn,onClick:()=>triggerCam(exIdx),dangerouslySetInnerHTML:{__html:ic("cam",11,"var(--c5)")}}),
h("button",{style:{...S.iconBtn,opacity:exIdx===0?.3:1},onClick:()=>moveEx(exIdx,-1)},"\u2191"),
h("button",{style:{...S.iconBtn,opacity:exIdx===todayEx.length-1?.3:1},onClick:()=>moveEx(exIdx,1)},"\u2193"),
h("button",{style:{...S.iconBtn},onClick:()=>delEx(exIdx),dangerouslySetInnerHTML:{__html:ic("x",11,"var(--red)")}}))),
// Photos
exP.length>0&&h("div",{style:{display:"flex",gap:"6px",marginBottom:"10px",overflowX:"auto"}},
exP.map((src,pi)=>h("div",{key:pi,style:S.pThumb,onClick:()=>setViewPhoto({src,key,photoIdx:pi,name:ex.name})},
h("img",{src,alt:"",style:S.tImg}))),
exP.length<3&&h("button",{style:{...S.iconBtn,width:"50px",height:"50px",borderRadius:"8px",border:"1px dashed var(--bd)"},onClick:()=>triggerCam(exIdx),dangerouslySetInnerHTML:{__html:ic("plus",14,"var(--c6)")}})),
// Set header
h("div",{style:S.setHdr},
h("span",{style:{width:"32px"}},"SET"),
h("span",{style:{flex:1,textAlign:"center"}},isTimed(ex.name)?"DURATION":"WEIGHT"),
!isTimed(ex.name)&&h("span",{style:{flex:1,textAlign:"center"}},"REPS"),
h("span",{style:{width:"32px"}})),
// Sets
ex.sets.map((set,si)=>{
const isW=set.warmup;
return h("div",{key:si,style:{...S.setRow,...(set.done?isW?{}:S.setDone:{})}},
h("span",{style:{...S.setNum,color:isW?"var(--gld)":"var(--c5)"}},isW?"W":(si+1-ex.sets.filter((s,i)=>i<si&&s.warmup).length)),
isTimed(ex.name)?
h("input",{type:"text",placeholder:"60s",value:set.duration||"",onChange:e=>updSet(exIdx,si,"duration",e.target.value),style:{...S.inpSm,...(isW?{color:"var(--gld)",borderColor:"rgba(176,128,48,.15)"}:{})}})
:h(React.Fragment,null,
h("input",{type:"number",inputMode:"decimal",placeholder:"0",value:set.weight,onChange:e=>updSet(exIdx,si,"weight",e.target.value),style:{...S.inpSm,...(isW?{color:"var(--gld)",borderColor:"rgba(176,128,48,.15)"}:{})}}),
h("input",{type:"number",inputMode:"numeric",placeholder:"0",value:set.reps,onChange:e=>updSet(exIdx,si,"reps",e.target.value),style:{...S.inpSm,...(isW?{color:"var(--gld)",borderColor:"rgba(176,128,48,.15)"}:{})}})),
h("div",{style:{display:"flex",gap:"3px",flexShrink:0}},
h("button",{style:{...S.chkBtn,...(set.done?isW?S.warmChk:S.chkDone:{})},onClick:()=>togDone(exIdx,si),dangerouslySetInnerHTML:{__html:set.done?ic("chk",11,isW?"var(--gld)":"#000"):""}}),
ex.sets.length>1&&h("button",{style:{...S.iconBtn,width:"20px",height:"28px"},onClick:()=>rmSet(exIdx,si)},"\u2212")))}),
// Add set buttons
h("div",{style:{display:"flex",gap:"5px",marginTop:"6px"}},
h("button",{style:{flex:1,border:"1px dashed var(--bd)",borderRadius:"7px",padding:"6px",textAlign:"center",fontSize:"10px",color:"var(--c5)",background:"transparent",cursor:"pointer",fontFamily:"'DM Mono',monospace"},onClick:()=>addSet(exIdx,false)},"+ Working"),
h("button",{style:{flex:1,border:"1px dashed rgba(176,128,48,.2)",borderRadius:"7px",padding:"6px",textAlign:"center",fontSize:"10px",color:"var(--gld)",background:"transparent",cursor:"pointer",fontFamily:"'DM Mono',monospace"},onClick:()=>addSet(exIdx,true)},"+ Warmup")))};

// --- RENDER ---
return h("div",{style:S.container},
// Hidden inputs
h("input",{ref:fileRef,type:"file",accept:"image/*",onChange:onFile,style:{display:"none"}}),
h("input",{ref:ppRef,type:"file",accept:"image/*",onChange:onPPFile,style:{display:"none"}}),
toast&&h("div",{style:S.toast},toast),

// ===== OVERLAYS =====
// Rest timer
restTmr&&restLeft>0&&h("div",{style:{...S.overlay,zIndex:1002}},
h("div",{style:{textAlign:"center"}},
h("div",{style:{width:"160px",height:"160px",borderRadius:"50%",border:"3px solid var(--bd)",margin:"0 auto 20px",display:"flex",alignItems:"center",justifyContent:"center",animation:"ringPulse 2s infinite"}},
h("div",null,h("div",{style:{fontSize:"48px",fontWeight:700,color:"var(--blu)",fontFamily:"'DM Mono',monospace"}},fmtT(restLeft)),
h("div",{style:{fontSize:"10px",color:"var(--c4)",letterSpacing:"2px",marginTop:"3px"}},"REST"))),
h("div",{style:{display:"flex",gap:"8px"}},
h("button",{className:"ab",style:{...S.btnOut,flex:1,color:"var(--blu)"},onClick:()=>{setRestTmr({end:Date.now()+(restLeft+15)*1000,dur:restTmr.dur});setRestLeft(restLeft+15)}},"+15s"),
h("button",{className:"ab",style:{...S.btnOut,flex:1,color:"var(--blu)"},onClick:()=>{const nl=Math.max(0,restLeft-15);setRestTmr({end:Date.now()+nl*1000,dur:restTmr.dur});setRestLeft(nl)}},"-15s"),
h("button",{className:"ab",style:{...S.btnOut,flex:1,color:"var(--red)",borderColor:"rgba(255,85,85,.2)"},onClick:()=>setRestTmr(null)},"Skip")))),

// Photo viewer
viewPhoto&&h("div",{style:S.overlay,onClick:()=>setViewPhoto(null)},
h("div",{style:{maxWidth:"360px",width:"100%"},onClick:e=>e.stopPropagation()},
h("img",{src:viewPhoto.src,alt:"",style:{width:"100%",maxHeight:"55vh",objectFit:"contain",borderRadius:"12px",border:"1px solid var(--bd)"}}),
h("div",{style:{display:"flex",gap:"8px",marginTop:"12px"}},
h("span",{style:{flex:1,fontSize:"12px",color:"var(--c4)",fontFamily:"'DM Mono',monospace"}},viewPhoto.name),
viewPhoto.photoIdx>=0&&h("button",{className:"ab",style:{...S.btnOut,color:"var(--red)"},onClick:()=>rmPhoto(viewPhoto.key,viewPhoto.photoIdx)},"Delete"),
h("button",{className:"ab",style:S.btnOut,onClick:()=>setViewPhoto(null)},"Close")))),

// Photo menu
photoMenu!==null&&h("div",{style:S.overlay,onClick:()=>setPhotoMenu(null)},
h("div",{style:{...S.card,maxWidth:"280px"},onClick:e=>e.stopPropagation()},
h("div",{style:{fontSize:"11px",letterSpacing:"3px",color:"var(--c4)",textAlign:"center",marginBottom:"10px"}},"ADD PHOTO"),
h("button",{className:"ab",style:{...S.card,padding:"14px",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",marginBottom:"6px",width:"100%",border:"1px solid var(--bd)"},onClick:()=>fileSel("cam")},
h("span",{dangerouslySetInnerHTML:{__html:ic("cam",18,"var(--c3)")}}),h("span",{style:{fontSize:"14px",color:"var(--c2)"}},"Take Photo")),
h("button",{className:"ab",style:{...S.card,padding:"14px",display:"flex",alignItems:"center",gap:"10px",cursor:"pointer",width:"100%",border:"1px solid var(--bd)"},onClick:()=>fileSel("gallery")},
h("span",{style:{fontSize:"18px"}},"Gallery")),
h("button",{style:{background:"transparent",border:"none",color:"var(--c4)",fontSize:"12px",cursor:"pointer",padding:"8px",width:"100%",fontFamily:"'DM Mono',monospace"},onClick:()=>setPhotoMenu(null)},"Cancel"))),

// Rest day picker
rdPick&&h("div",{style:S.overlay,onClick:()=>setRdPick(null)},
h("div",{style:{...S.card,maxWidth:"280px",textAlign:"center"},onClick:e=>e.stopPropagation()},
h("div",{style:{fontSize:"11px",letterSpacing:"2px",color:"var(--c4)",marginBottom:"14px"}},"LOG REST DAY"),
h("div",{style:{fontSize:"12px",color:"var(--c3)",marginBottom:"14px"}},"Keeps your streak alive"),
h("button",{className:"ab",style:{...S.card,padding:"16px",cursor:"pointer",marginBottom:"6px"},onClick:()=>logRestDay(rdPick,"rest")},
h("div",{style:{fontSize:"24px",marginBottom:"3px"}},"\uD83D\uDCA4"),
h("div",{style:{fontSize:"14px",fontWeight:700,color:"var(--c2)"}},"Full Rest"),
h("div",{style:{fontSize:"10px",color:"var(--c4)",marginTop:"2px"}},"No activity — recovering")),
h("button",{className:"ab",style:{...S.card,padding:"16px",cursor:"pointer"},onClick:()=>logRestDay(rdPick,"active")},
h("div",{style:{fontSize:"24px",marginBottom:"3px"}},"\uD83E\uDDD8"),
h("div",{style:{fontSize:"14px",fontWeight:700,color:"var(--c2)"}},"Active Recovery"),
h("div",{style:{fontSize:"10px",color:"var(--c4)",marginTop:"2px"}},"Walk, stretch, yoga")),
h("button",{style:{background:"transparent",border:"none",color:"var(--c4)",fontSize:"12px",cursor:"pointer",padding:"8px",width:"100%"},onClick:()=>setRdPick(null)},"Cancel"))),

// Drill-down
drill&&h("div",{style:{...S.overlay,overflowY:"auto",alignItems:"flex-start",paddingTop:"40px"}},
h("div",{style:{maxWidth:"400px",width:"100%"},onClick:e=>e.stopPropagation()},
(()=>{const hist=getExHistory(drill);
return h("div",null,
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}},
h("div",null,h("div",{style:{fontSize:"18px",fontWeight:800,color:"var(--c1)"}},drill),
h("div",{style:{fontSize:"11px",color:"var(--c4)",marginTop:"2px"}},"Exercise history")),
h("button",{className:"ab",style:S.btnOut,onClick:()=>setDrill(null)},"Close")),
hist?h("div",null,
h("div",{style:{...S.card}},
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"12px"}},
h("div",{style:S.prItem},h("div",{style:S.prVal},hist.maxW,h("span",{style:{fontSize:"10px",color:"var(--c5)",marginLeft:"2px"}},"lb")),h("div",{style:S.prLbl},"MAX WEIGHT")),
h("div",{style:S.prItem},h("div",{style:S.prVal},hist.maxV.toLocaleString()),h("div",{style:S.prLbl},"BEST VOL")),
h("div",{style:S.prItem},h("div",{style:S.prVal},hist.count),h("div",{style:S.prLbl},"SESSIONS"))),
// Volume trend
hist.sessions.length>=2&&h("div",null,
h("div",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--c5)",marginBottom:"6px"}},"VOLUME TREND"),
h("div",{style:{height:"60px"}},
(()=>{const pts=hist.sessions.slice(0,12).reverse();const vols=pts.map(p=>p.vol);const mn=Math.min(...vols),mx=Math.max(...vols),rng=mx-mn||1;const w=100/(pts.length-1||1);
return h("svg",{viewBox:"0 0 100 35",style:{width:"100%",height:"100%"},preserveAspectRatio:"none"},
h("polyline",{points:pts.map((p,i)=>(i*w)+","+(32-((p.vol-mn)/rng)*28)).join(" "),fill:"none",stroke:"var(--blu)",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}),
pts.map((p,i)=>h("circle",{key:i,cx:i*w,cy:32-((p.vol-mn)/rng)*28,r:"2",fill:"var(--blu)"})))})()))),
h("div",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--c5)",marginBottom:"8px",marginTop:"12px"}},"ALL SESSIONS"),
hist.sessions.map((s,i)=>{
const isPR=s.vol===hist.maxV;
return h("div",{key:i,style:{...S.card,animation:"slideUp .3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"3px"}},
h("span",{style:{fontSize:"12px",color:"var(--c3)",fontFamily:"'DM Mono',monospace"}},pDate(s.date)),
h("div",{style:{display:"flex",gap:"5px"}},
isPR&&h("span",{style:{fontSize:"9px",color:"var(--grn)",background:"rgba(34,204,102,.08)",padding:"2px 6px",borderRadius:"4px",fontWeight:600}},"PR"),
h("span",{style:{fontSize:"10px",color:"var(--c4)"}},s.vol.toLocaleString()+" vol"))),
h("div",{style:{fontSize:"12px",color:"var(--c2)",fontFamily:"'DM Mono',monospace"}},s.sets.map(st=>st.weight+"\u00D7"+st.reps).join(", ")))}))
:h("div",{style:{textAlign:"center",padding:"40px",color:"var(--c4)"}},"No history for this exercise"))})())),

// ===== HEADER =====
S.v!=='onboarding'&&view!=="onboarding"&&h("div",{style:S.hdr},
view==="workout"&&aw?
h(React.Fragment,null,
h("div",null,
h("div",{style:{fontSize:"11px",color:"var(--blu)",fontWeight:600}},dayData?.split||"Workout"),
h("div",{style:{fontSize:"10px",color:"var(--c4)",fontFamily:"'DM Mono',monospace"}},fmtDur(elapsed))),
h("div",{style:{display:"flex",gap:"4px"}},
h("div",{style:S.pill},h("span",{style:S.pillN},totalSets),h("span",{style:S.pillL}," sets")),
h("div",{style:S.pill},h("span",{style:S.pillN},totalVol>999?(totalVol/1000).toFixed(1)+"k":totalVol),h("span",{style:S.pillL}," vol"))))
:h(React.Fragment,null,
h("div",null,h("div",{style:S.logo},"RECOMP"),h("div",{style:S.sub},"ABSOLUTE FITNESS")),
h("button",{style:{width:"36px",height:"20px",background:dark?"var(--c5)":"#ddd",borderRadius:"10px",position:"relative",cursor:"pointer",border:"none"},onClick:()=>{const nd=!dark;setDark(nd);db.s("rc-dk",nd)}},
h("div",{style:{width:"16px",height:"16px",borderRadius:"50%",background:dark?"var(--blu)":"#fff",position:"absolute",[dark?"right":"left"]:"2px",top:"2px",transition:"all .2s",boxShadow:dark?"none":"0 1px 3px rgba(0,0,0,.2)"}})))),

// ===== ONBOARDING =====
view==="onboarding"&&h("div",{style:{padding:"24px 20px",textAlign:"center"}},
h("div",{style:{fontSize:"28px",fontWeight:800,letterSpacing:"4px",color:"var(--c1)",marginTop:"12px"}},"RECOMP"),
h("div",{style:{fontSize:"9px",letterSpacing:"3px",color:"var(--c4)",marginTop:"3px"}},"ABSOLUTE FITNESS"),
h("p",{style:{fontSize:"14px",color:"var(--c3)",margin:"22px 0 16px"}},"Set up your profile"),
h("div",{style:{width:"76px",height:"76px",borderRadius:"50%",background:"var(--ip)",border:"2px dashed var(--c5)",margin:"0 auto 6px",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}},
h("span",{dangerouslySetInnerHTML:{__html:ic("user",26,"var(--c5)")}})),
h("p",{style:{fontSize:"10px",color:"var(--c5)",marginBottom:"18px"}},"Add photo"),
h("div",{style:{textAlign:"left",display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.lbl},"NAME"),h("input",{style:S.inp,value:profile.name,onChange:e=>setProfile({...profile,name:e.target.value}),placeholder:"Your name"})),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.lbl},"AGE"),h("input",{style:{...S.inp,textAlign:"center"},type:"number",value:profile.age,onChange:e=>setProfile({...profile,age:e.target.value})})),
h("div",{style:{flex:1}},h("label",{style:S.lbl},"HEIGHT"),h("input",{style:{...S.inp,textAlign:"center"},value:profile.height,onChange:e=>setProfile({...profile,height:e.target.value}),placeholder:"5'10\""}))),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.lbl},"CURRENT LB"),h("input",{style:{...S.inp,textAlign:"center"},type:"number",value:profile.currentWeight,onChange:e=>setProfile({...profile,currentWeight:e.target.value})})),
h("div",{style:{flex:1}},h("label",{style:S.lbl},"GOAL LB"),h("input",{style:{...S.inp,textAlign:"center"},type:"number",value:profile.goalWeight,onChange:e=>setProfile({...profile,goalWeight:e.target.value})})))),
h("button",{className:"ab",style:{...S.btn,marginTop:"18px"},onClick:()=>{const p={...profile,startWeight:profile.currentWeight};saveProfile(p);nav("home")}},
"LET'S GO"),
h("p",{style:{fontSize:"10px",color:"var(--c6)",marginTop:"6px"}},"Edit anytime in Me tab")),

// ===== SUMMARY (after finish) =====
view==="summary"&&h("div",{style:S.content},
h("div",{style:{background:"linear-gradient(180deg,var(--hd),var(--cd))",border:"1px solid var(--bd)",borderRadius:"20px",padding:"22px 18px",textAlign:"center"}},
h("div",{style:{fontSize:"10px",fontWeight:800,letterSpacing:"3px",color:"var(--c6)",marginBottom:"12px"}},"RECOMP"),
h("div",{style:{fontSize:"18px",fontWeight:800,color:"var(--c1)"}},dayData?.split||"Workout"),
h("div",{style:{fontSize:"11px",color:"var(--blu)",margin:"3px 0 16px"}},pDate(d)),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}},
[[(dayData?.duration?fmtDur(dayData.duration):"--"),"DURATION"],[totalSets+"","SETS"],[totalVol.toLocaleString(),"VOLUME"],[(dayData?.cardio?.filter(c=>c.done).length||0)+"","CARDIO"]].map(([v,l],i)=>
h("div",{key:i,style:S.prItem},h("div",{style:{fontSize:"22px",fontWeight:800,color:"var(--blu)"}},v),h("div",{style:S.prLbl},l)))),
// Streak
h("div",{style:{...S.streak,justifyContent:"center",marginTop:"12px"}},
h("span",{style:{fontSize:"22px"}},"\uD83D\uDD25"),
h("div",null,
h("div",{style:{fontSize:"18px",fontWeight:800,color:"var(--fire)"}},streak.current+" Day Streak!"),
h("div",{style:{display:"flex",gap:"2px",marginTop:"4px"}},
"MTWTFSS".split("").map((day,i)=>h("div",{key:i,style:{width:"18px",height:"18px",borderRadius:"5px",background:`rgba(255,140,40,${i<streak.current?.15:.05})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:"var(--fire)",fontWeight:600}},day)))))),
h("button",{className:"ab",style:{...S.btnBlu,width:"100%",padding:"14px",fontSize:"14px",borderRadius:"12px",marginTop:"14px"},onClick:()=>nav("home")},"Done")),

// ===== HOME =====
view==="home"&&!dd&&!pv&&h("div",{style:S.content},
h("p",{style:{fontSize:"12px",color:"var(--c3)",marginBottom:"10px"}},pDate(today())),
// Streak
h("div",{style:S.streak},
h("div",{style:S.streakBox},"\uD83D\uDD25"),
h("div",{style:{flex:1}},
h("div",{style:{display:"flex",alignItems:"baseline",gap:"5px"}},
h("span",{style:{fontSize:"24px",fontWeight:800,color:"var(--fire)"}},streak.current),
h("span",{style:{fontSize:"12px",fontWeight:600,color:"var(--fire)"}},"day streak")),
h("div",{style:{display:"flex",gap:"2px",marginTop:"4px"}},
"MTWTFSS".split("").map((day,i)=>h("div",{key:i,style:{width:"20px",height:"20px",borderRadius:"5px",background:`rgba(255,140,40,${i<Math.min(streak.current,7)?.12:.04})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",color:i<Math.min(streak.current,7)?"var(--fire)":"var(--c5)",fontWeight:600}},day))),
h("div",{style:{fontSize:"9px",color:"var(--c5)",marginTop:"3px"}},"Best: "+streak.best+" days"))),
// Start button
h("button",{className:"ab",style:{...S.btn,padding:"20px",marginBottom:"10px",position:"relative",overflow:"hidden"},onClick:()=>setDd(true)},
h("div",{style:{position:"absolute",top:"-20px",right:"-20px",width:"70px",height:"70px",borderRadius:"50%",background:"rgba(74,143,255,.08)"}}),
h("span",{dangerouslySetInnerHTML:{__html:ic("play",18,"var(--blu)")},style:{marginBottom:"4px",display:"block"}}),
"START WORKOUT",
h("div",{style:{fontSize:"10px",color:"rgba(255,255,255,.35)",marginTop:"3px",fontWeight:400,letterSpacing:"1px"}},"Choose your split")),
// Rest day button
h("button",{className:"ab",style:{...S.card,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",cursor:"pointer",marginBottom:"12px",padding:"11px"},onClick:()=>setRdPick(today())},
h("span",{style:{fontSize:"13px"}},"\uD83D\uDCA4"),
h("span",{style:{fontSize:"12px",color:"var(--c3)"}},"Log Rest Day / Active Recovery"),
h("span",{dangerouslySetInnerHTML:{__html:ic("chev",12,"var(--c5)")}})),
// Recent
h("div",{style:{fontSize:"10px",fontWeight:600,color:"var(--c4)",letterSpacing:"2px",marginBottom:"7px"}},"RECENT"),
h("div",{style:{...S.card,padding:0,overflow:"hidden"}},
sortedDates.slice(0,6).map((dt,i,a)=>{
const wk=workouts[dt];
return h("div",{key:dt,style:{padding:"10px 12px",display:"flex",alignItems:"center",borderBottom:i<a.length-1?"1px solid var(--bd)":"none"}},
wk.type==="rest"?h(React.Fragment,null,
h("div",{style:{width:"30px",height:"30px",borderRadius:"50%",background:"rgba(100,130,200,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,marginRight:"8px"}},"\uD83D\uDCA4"),
h("div",{style:{flex:1}},h("div",{style:{fontSize:"12px",color:"var(--c4)",fontStyle:"italic"}},"Rest Day"),h("div",{style:{fontSize:"10px",color:"var(--c5)"}},sDate(dt))))
:wk.type==="active"?h(React.Fragment,null,
h("div",{style:{width:"30px",height:"30px",borderRadius:"50%",background:"rgba(34,204,102,.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,marginRight:"8px"}},"\uD83E\uDDD8"),
h("div",{style:{flex:1}},h("div",{style:{fontSize:"12px",color:"var(--grn)",fontStyle:"italic"}},"Active Recovery"),h("div",{style:{fontSize:"10px",color:"var(--c5)"}},sDate(dt))))
:h(React.Fragment,null,
h("div",{style:{flex:1}},
h("div",{style:{fontSize:"12px",fontWeight:600,color:"var(--c2)"}},wk.split||"Workout"),
h("div",{style:{fontSize:"10px",color:"var(--c4)"}},sDate(dt)+(wk.duration?" \u00B7 "+fmtDur(wk.duration):""))),
h("button",{className:"ab",style:{background:"rgba(74,143,255,.08)",border:"1px solid rgba(74,143,255,.12)",borderRadius:"6px",padding:"3px 7px",fontSize:"9px",color:"var(--blu)",cursor:"pointer"},onClick:e=>{e.stopPropagation();dupWorkout(dt)}},"REPEAT")))}))),

// ===== DROPDOWN =====
view==="home"&&dd&&h("div",{style:S.content},
h("div",{style:{...S.btn,borderRadius:"14px 14px 0 0",padding:"16px"}},"START WORKOUT"),
h("div",{style:{...S.card,borderRadius:"0 0 14px 14px",borderTop:0,marginTop:0,padding:0,maxHeight:"400px",overflowY:"auto"}},
// My splits
h("div",{style:{padding:"6px 0"}},
h("div",{style:{padding:"4px 14px",fontSize:"9px",color:"var(--c5)",letterSpacing:"2px",fontWeight:600}},"YOUR SPLITS"),
mySplits.map(n=>h("div",{key:n,className:"ab",style:{padding:"10px 14px",fontSize:"13px",color:"var(--c2)",display:"flex",justifyContent:"space-between",cursor:"pointer"},onClick:()=>{setDd(false);setPv(n);setPvExs((splits[n]||[]).map(e=>({...e})))}},n,h("span",{style:{fontSize:"10px",color:"var(--c5)"}},(splits[n]||[]).length+" ex")))),
// PPL
pplSplits.length>0&&h("div",{style:{borderTop:"1px solid var(--bd)",padding:"6px 0"}},
h("div",{style:{padding:"4px 14px",fontSize:"9px",color:"var(--c5)",letterSpacing:"2px",fontWeight:600}},"PUSH PULL LEGS"),
pplSplits.map(n=>h("div",{key:n,className:"ab",style:{padding:"9px 14px",fontSize:"12px",color:"var(--c3)",display:"flex",justifyContent:"space-between",cursor:"pointer"},onClick:()=>{setDd(false);setPv(n);setPvExs((splits[n]||[]).map(e=>({...e})))}},n,h("span",{style:{fontSize:"10px",color:"var(--c6)"}},(splits[n]||[]).length)))),
// Upper/Lower
ulSplits.length>0&&h("div",{style:{borderTop:"1px solid var(--bd)",padding:"6px 0"}},
h("div",{style:{padding:"4px 14px",fontSize:"9px",color:"var(--c5)",letterSpacing:"2px",fontWeight:600}},"UPPER / LOWER / FULL"),
ulSplits.map(n=>h("div",{key:n,className:"ab",style:{padding:"9px 14px",fontSize:"12px",color:"var(--c3)",display:"flex",justifyContent:"space-between",cursor:"pointer"},onClick:()=>{setDd(false);setPv(n);setPvExs((splits[n]||[]).map(e=>({...e})))}},n,h("span",{style:{fontSize:"10px",color:"var(--c6)"}},(splits[n]||[]).length)))),
// Bro
broSplits.length>0&&h("div",{style:{borderTop:"1px solid var(--bd)",padding:"6px 0"}},
h("div",{style:{padding:"4px 14px",fontSize:"9px",color:"var(--c5)",letterSpacing:"2px",fontWeight:600}},"BRO SPLIT"),
broSplits.map(n=>h("div",{key:n,className:"ab",style:{padding:"9px 14px",fontSize:"12px",color:"var(--c3)",display:"flex",justifyContent:"space-between",cursor:"pointer"},onClick:()=>{setDd(false);setPv(n);setPvExs((splits[n]||[]).map(e=>({...e})))}},n,h("span",{style:{fontSize:"10px",color:"var(--c6)"}},(splits[n]||[]).length)))),
// Custom
customSplits.length>0&&h("div",{style:{borderTop:"1px solid var(--bd)",padding:"6px 0"}},
h("div",{style:{padding:"4px 14px",fontSize:"9px",color:"var(--c5)",letterSpacing:"2px",fontWeight:600}},"CUSTOM"),
customSplits.map(n=>h("div",{key:n,className:"ab",style:{padding:"9px 14px",fontSize:"12px",color:"var(--c3)",display:"flex",justifyContent:"space-between",cursor:"pointer"},onClick:()=>{setDd(false);setPv(n);setPvExs((splits[n]||[]).map(e=>({...e})))}},n,h("span",{style:{fontSize:"10px",color:"var(--c6)"}},(splits[n]||[]).length)))),
// Blank
h("div",{style:{borderTop:"1px solid var(--bd)"}},
h("div",{className:"ab",style:{padding:"10px 14px",fontSize:"12px",color:"var(--c4)",textAlign:"center",cursor:"pointer",fontStyle:"italic"},onClick:()=>{setDd(false);setView("workout");startWorkout("Custom")}},"Start blank workout"))),
h("button",{style:{background:"transparent",border:"none",color:"var(--c4)",fontSize:"11px",cursor:"pointer",padding:"8px",width:"100%",marginTop:"6px"},onClick:()=>setDd(false)},"Cancel")),

// ===== PREVIEW =====
view==="home"&&pv&&h("div",{style:S.content},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}},
h("div",null,h("div",{style:{fontSize:"15px",fontWeight:700,color:"var(--c2)"}},pv),h("div",{style:{fontSize:"10px",color:"var(--c4)",marginTop:"2px"}},(splits[pv]||[]).length+" exercises")),
h("button",{className:"ab",style:S.btnOut,onClick:()=>setPv(null)},"Cancel")),
h("div",{style:{...S.card,padding:0,overflow:"hidden"}},
(splits[pv]||[]).map((e,i,a)=>h("div",{key:i,style:{padding:"9px 11px",display:"flex",alignItems:"center",borderBottom:i<a.length-1?"1px solid var(--bd)":"none"}},
h("div",{style:{display:"flex",flexDirection:"column",marginRight:"7px",color:"var(--c5)",fontSize:"8px",lineHeight:1}},h("span",null,"\u25B2"),h("span",null,"\u25BC")),
h("div",{style:{flex:1,fontSize:"12px",fontWeight:600,color:"var(--c2)"}},e.name),
h("span",{style:{fontSize:"10px",color:"var(--c5)",fontFamily:"'DM Mono',monospace",marginRight:"6px"}},e.sets+"s"),
h("button",{style:{...S.iconBtn,width:"20px",height:"20px"},dangerouslySetInnerHTML:{__html:ic("x",10,"var(--c5)")}}))),
h("div",{style:{padding:"8px 11px",borderTop:"1px solid var(--bd)"}},
h("select",{style:S.sel,onChange:e=>{if(e.target.value)addEx(e.target.value,"")},defaultValue:""},
h("option",{value:""},"+ Add exercise from library..."),
Object.entries(EXLIB).map(([cat,exs])=>h("optgroup",{key:cat,label:cat},exs.map(ex=>h("option",{key:ex,value:ex},ex))))))),
// Abs / Cardio toggles
h("div",{style:{display:"flex",gap:"5px",marginBottom:"8px",marginTop:"8px"}},
h("button",{className:"ab",style:{flex:1,background:pvAbs?"rgba(74,143,255,.1)":"var(--cd)",border:"1px solid "+(pvAbs?"var(--blu)":"var(--bd)"),borderRadius:"10px",padding:"10px",textAlign:"center",fontSize:"11px",color:pvAbs?"var(--blu)":"var(--c4)",cursor:"pointer",fontWeight:pvAbs?600:400},onClick:()=>setPvAbs(!pvAbs)},"+ Abs"),
h("button",{className:"ab",style:{flex:1,background:pvCardio?"rgba(34,204,102,.08)":"var(--cd)",border:"1px solid "+(pvCardio?"var(--grn)":"var(--bd)"),borderRadius:"10px",padding:"10px",textAlign:"center",fontSize:"11px",color:pvCardio?"var(--grn)":"var(--c4)",cursor:"pointer",fontWeight:pvCardio?600:400},onClick:()=>setPvCardio(!pvCardio)},"+ Cardio")),
pvAbs&&h("div",{style:{...S.card}},h("div",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--blu)",marginBottom:"5px"}},"ABS"),["Plank (timed)","Cable Crunch","Leg Raise"].map((e,i)=>h("div",{key:i,style:{padding:"4px 0",fontSize:"11px",color:"var(--c3)",borderBottom:"1px solid var(--bd)"}},e))),
pvCardio&&h("div",{style:{...S.card}},h("div",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--grn)",marginBottom:"5px"}},"CARDIO"),h("div",{style:{fontSize:"11px",color:"var(--c3)"}},"Treadmill")),
h("button",{className:"ab",style:S.btnG,onClick:()=>startWorkout(pv)},
h("span",{dangerouslySetInnerHTML:{__html:ic("play",14,"#fff")},style:{display:"inline-block",verticalAlign:"-2px",marginRight:"6px"}}),"START WORKOUT")),

// ===== ACTIVE WORKOUT =====
view==="workout"&&aw&&h("div",{style:S.content},
dayData?.split&&h("div",{style:{textAlign:"center",marginBottom:"10px"}},
h("span",{style:{display:"inline-block",background:"rgba(74,143,255,.08)",border:"1px solid rgba(74,143,255,.2)",color:"var(--blu)",padding:"4px 16px",borderRadius:"14px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px"}},dayData.split.toUpperCase())),
h("div",{style:{display:"flex",gap:"6px",marginBottom:"12px"}},
h("button",{className:"ab",style:S.finBtn,onClick:finishWorkout},h("span",{dangerouslySetInnerHTML:{__html:ic("chk",12,"var(--grn)")},style:{display:"inline-block",verticalAlign:"-2px",marginRight:"4px"}}),"Finish"),
h("button",{className:"ab",style:S.canBtn,onClick:cancelWorkout},h("span",{dangerouslySetInnerHTML:{__html:ic("x",12,"var(--red)")},style:{display:"inline-block",verticalAlign:"-2px",marginRight:"4px"}}),"Cancel")),
// Exercises
todayEx.map((ex,i)=>renderExCard(ex,i,d)),
// Abs section
dayData?.abs?.length>0&&h(React.Fragment,null,
h("div",{style:{display:"flex",alignItems:"center",gap:"8px",margin:"10px 0 6px"}},h("div",{style:{flex:1,height:"1px",background:"var(--bd)"}}),h("span",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--blu)",fontWeight:600}},"ABS"),h("div",{style:{flex:1,height:"1px",background:"var(--bd)"}})),
dayData.abs.map((ab,ai)=>h("div",{key:ai,style:{...S.card}},
h("div",{style:{fontSize:"14px",fontWeight:700,color:"var(--c1)",marginBottom:"6px"}},ab.name),
ab.sets.map((set,si)=>h("div",{key:si,style:{display:"flex",alignItems:"center",gap:"4px"}},
h("span",{style:{width:"30px",fontSize:"11px",color:"var(--c5)",fontFamily:"'DM Mono',monospace"}},(si+1)+""),
h("input",{type:"text",placeholder:isTimed(ab.name)?"60s":"12",value:isTimed(ab.name)?set.duration:set.reps,onChange:e=>updAbs(ai,si,isTimed(ab.name)?"duration":"reps",e.target.value),style:S.inpSm}),
h("button",{style:{...S.chkBtn,...(set.done?S.chkDone:{})},onClick:()=>togAbs(ai,si),dangerouslySetInnerHTML:{__html:set.done?ic("chk",11,"#000"):""}})))))
),
// Cardio section
dayData?.cardio?.length>0&&h(React.Fragment,null,
h("div",{style:{display:"flex",alignItems:"center",gap:"8px",margin:"10px 0 6px"}},h("div",{style:{flex:1,height:"1px",background:"var(--bd)"}}),h("span",{style:{fontSize:"9px",letterSpacing:"2px",color:"var(--grn)",fontWeight:600}},"CARDIO"),h("div",{style:{flex:1,height:"1px",background:"var(--bd)"}})),
dayData.cardio.map((c,ci)=>h("div",{key:ci,style:{...S.card}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}},
h("div",{style:{fontSize:"14px",fontWeight:700,color:"var(--c1)"}},c.type),
h("div",{style:{display:"flex",gap:"4px"}},
h("button",{style:{...S.chkBtn,...(c.done?{background:"var(--grn)",border:"1px solid var(--grn)"}:{})},onClick:()=>togCardio(ci),dangerouslySetInnerHTML:{__html:c.done?ic("chk",11,"#000"):""}}),
h("button",{style:S.iconBtn,onClick:()=>rmCardio(ci),dangerouslySetInnerHTML:{__html:ic("x",11,"var(--red)")}}))),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}},
["minutes","distance","calories"].map(f=>h("div",{key:f},
h("div",{style:{fontSize:"8px",color:"var(--c5)",letterSpacing:"1px",marginBottom:"3px",fontFamily:"'DM Mono',monospace"}},f.toUpperCase().slice(0,4)),
h("input",{type:"text",value:c[f],onChange:e=>updCardio(ci,f,e.target.value),style:S.inpSm,placeholder:"-"})))))))
,
// Add exercise
h("div",{style:{marginTop:"8px"}},
h("select",{style:S.sel,onChange:e=>{if(e.target.value){addEx(e.target.value,"")}},defaultValue:""},
h("option",{value:""},"+ Add exercise..."),
Object.entries(EXLIB).map(([cat,exs])=>h("optgroup",{key:cat,label:cat},exs.map(ex=>h("option",{key:ex,value:ex},ex)))))),
// Notes
h("div",{style:{marginTop:"10px"}},
h("label",{style:S.lbl},"WORKOUT NOTES"),
h("textarea",{value:wkNotes,onChange:e=>setWkNotes(e.target.value),placeholder:"How did it feel?",rows:2,style:{...S.inp,resize:"vertical",minHeight:"50px",fontSize:"13px"}}))),

// ===== CALENDAR =====
view==="calendar"&&h("div",{style:S.content},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}},
h("button",{className:"ab",style:{...S.iconBtn,width:"28px",height:"28px"},onClick:()=>{if(calM===0){setCalM(11);setCalY(calY-1)}else setCalM(calM-1)},dangerouslySetInnerHTML:{__html:ic("chevL",14,"var(--blu)")}}),
h("span",{style:{fontSize:"14px",fontWeight:600,color:"var(--c2)"}},calMonthName),
h("button",{className:"ab",style:{...S.iconBtn,width:"28px",height:"28px"},onClick:()=>{if(calM===11){setCalM(0);setCalY(calY+1)}else setCalM(calM+1)},dangerouslySetInnerHTML:{__html:ic("chev",14,"var(--blu)")}})),
// Day headers
h("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}},
"SMTWTFS".split("").map((day,i)=>h("div",{key:i,style:{textAlign:"center",fontSize:"9px",color:"var(--c6)",padding:"3px",fontWeight:600,fontFamily:"'DM Mono',monospace"}},day))),
// Days
h("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"12px"}},
calDays().map((day,i)=>{
if(!day)return h("div",{key:"e"+i});
const ds=calDateStr(day);
const wk=workouts[ds];
const has=wk?.type==="workout";
const rest=wk?.type==="rest";
const active=wk?.type==="active";
const sel=ds===calSel;
const isToday=ds===today();
const isFuture=ds>today();
return h("div",{key:i,className:"ab",style:{textAlign:"center",padding:"6px 2px",fontSize:"12px",borderRadius:"7px",cursor:"pointer",fontWeight:has||isToday?700:400,
color:isToday?"#000":sel?"var(--blu)":has?"var(--c2)":rest?"#7a8aaa":active?"var(--grn)":"var(--c5)",
background:isToday?"var(--blu)":sel?"rgba(74,143,255,.12)":has?"rgba(74,143,255,.06)":rest?"rgba(100,130,200,.04)":active?"rgba(34,204,102,.04)":"transparent",
border:sel&&!isToday?"1.5px solid var(--blu)":"1.5px solid transparent"},
onClick:()=>{setCalSel(ds);setEditing(false)}},
day,
(has||rest||active)&&h("div",{style:{width:"4px",height:"4px",borderRadius:"50%",background:has?"var(--blu)":rest?"#7a8aaa":"var(--grn)",margin:"1px auto 0"}}))})),
// Legend
h("div",{style:{display:"flex",gap:"10px",justifyContent:"center",marginBottom:"12px",fontSize:"9px",color:"var(--c5)"}},
h("div",{style:{display:"flex",alignItems:"center",gap:"3px"}},h("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:"var(--blu)"}}),"Workout"),
h("div",{style:{display:"flex",alignItems:"center",gap:"3px"}},h("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:"#7a8aaa"}}),"Rest"),
h("div",{style:{display:"flex",alignItems:"center",gap:"3px"}},h("div",{style:{width:"6px",height:"6px",borderRadius:"50%",background:"var(--grn)"}}),"Active")),

// Selected date detail
(()=>{
const wk=workouts[calSel];
const isFuture=calSel>today();
const ppd=pp[calSel];
const bwd=bw[calSel];

if(!wk&&!editing){
// Empty date
return h("div",{style:{...S.card,textAlign:"center"}},
h("div",{style:{fontSize:"14px",fontWeight:600,color:"var(--c2)"}},pDate(calSel)),
isFuture&&h("div",{style:{fontSize:"10px",color:"var(--prp)",margin:"3px 0 10px"}},"Future date"),
!isFuture&&h("div",{style:{fontSize:"11px",color:"var(--c5)",margin:"5px 0 10px"}},"Nothing logged"),
h("button",{className:"ab",style:{...S.btn,marginBottom:"8px"},onClick:()=>{setEditing(true)}},isFuture?"+ PLAN WORKOUT":"+ LOG PAST WORKOUT"),
h("div",{style:{display:"flex",gap:"6px"}},
h("button",{className:"ab",style:{...S.card,flex:1,padding:"9px",textAlign:"center",fontSize:"10px",color:"var(--c4)",cursor:"pointer",marginBottom:0},onClick:()=>setRdPick(calSel)},"+ Rest Day"),
h("button",{className:"ab",style:{...S.card,flex:1,padding:"9px",textAlign:"center",fontSize:"10px",color:"var(--c4)",cursor:"pointer",marginBottom:0}},"+ Photos")))}

if(wk&&wk.type==="rest"&&!editing){
return h("div",{style:{...S.card,textAlign:"center"}},
h("div",{style:{fontSize:"26px",marginBottom:"5px"}},"\uD83D\uDCA4"),
h("div",{style:{fontSize:"15px",fontWeight:700,color:"var(--c3)"}},"Rest Day"),
h("div",{style:{fontSize:"10px",color:"var(--c5)",margin:"3px 0 10px"}},pDate(calSel)),
h("button",{className:"ab",style:{...S.btnOut,width:"100%"},onClick:()=>setEditing(true)},"Change type"))}

if(wk&&wk.type==="active"&&!editing){
return h("div",{style:{...S.card,textAlign:"center"}},
h("div",{style:{fontSize:"26px",marginBottom:"5px"}},"\uD83E\uDDD8"),
h("div",{style:{fontSize:"15px",fontWeight:700,color:"var(--grn)"}},"Active Recovery"),
h("div",{style:{fontSize:"10px",color:"var(--c5)",margin:"3px 0 10px"}},pDate(calSel)),
h("button",{className:"ab",style:{...S.btnOut,width:"100%"},onClick:()=>setEditing(true)},"Change type"))}

if(wk&&wk.type==="workout"&&!editing){
const exs=wk.exercises||[];
return h("div",{style:{...S.card}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}},
h("div",null,
h("div",{style:{fontSize:"15px",fontWeight:700,color:"var(--c2)"}},pDate(calSel)),
h("div",{style:{fontSize:"10px",color:"var(--blu)",marginTop:"1px"}},(wk.split||"")+(wk.duration?" \u00B7 "+fmtDur(wk.duration):""))),
h("button",{className:"ab",style:{...S.btnOut,display:"flex",alignItems:"center",gap:"4px"},onClick:()=>setEditing(true)},
h("span",{dangerouslySetInnerHTML:{__html:ic("edit",11,"var(--blu)")}}),h("span",{style:{color:"var(--blu)"}},"Edit"))),
// Progress photos
ppd&&h("div",{style:{background:"var(--ip)",borderRadius:"10px",padding:"8px",marginBottom:"10px",display:"flex",gap:"4px"}},
["front","side","back"].map(t=>ppd[t]?
h("div",{key:t,style:{flex:1,cursor:"pointer"},onClick:()=>setViewPhoto({src:ppd[t],name:t,key:"",photoIdx:-1})},
h("img",{src:ppd[t],alt:"",style:{width:"100%",height:"60px",objectFit:"cover",borderRadius:"6px"}})):
h("div",{key:t,style:{flex:1,height:"60px",background:"var(--bd)",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",color:"var(--c6)"}},t.toUpperCase()))),
// Body weight
bwd&&h("div",{style:{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--bd)",marginBottom:"6px"}},
h("span",{style:{fontSize:"9px",color:"var(--c4)",fontFamily:"'DM Mono',monospace"}},"WEIGHT"),
h("span",{style:{fontSize:"13px",fontWeight:600,color:"var(--c2)"}},bwd+" lb")),
// Exercises
exs.map((ex,i)=>h("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--bd)"}},
h("span",{style:{fontSize:"12px",color:"var(--blu)",cursor:"pointer",textDecoration:"underline",textDecorationColor:"rgba(74,143,255,.3)"},onClick:()=>setDrill(ex.name)},ex.name),
h("span",{style:{fontSize:"10px",color:"var(--c5)",fontFamily:"'DM Mono',monospace"}},
ex.sets.filter(s=>s.done&&!s.warmup).map(s=>s.weight+"\u00D7"+s.reps).join(", ")||"no sets done"))),
wk.notes&&h("div",{style:{marginTop:"8px",fontSize:"11px",color:"var(--c4)",fontStyle:"italic"}},wk.notes))}

// EDITING MODE
if(editing){
return h("div",{style:{...S.card}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}},
h("div",null,
h("div",{style:{fontSize:"15px",fontWeight:700,color:"var(--c2)"}},(isFuture?"Plan":"Edit")+" "+pDate(calSel)),
wk?.split&&h("div",{style:{fontSize:"10px",color:"var(--blu)",marginTop:"1px"}},wk.split)),
h("button",{className:"ab",style:S.btnOut,onClick:()=>setEditing(false)},"Cancel")),
// Split selector
h("div",{style:{marginBottom:"12px"}},
h("label",{style:S.lbl},"SPLIT"),
h("select",{style:S.sel,value:wk?.split||"",onChange:e=>{
if(!e.target.value)return;
const up=dc(workouts);
if(!up[calSel])up[calSel]={type:"workout",split:e.target.value,exercises:[],notes:"",cardio:[],abs:[]};
else up[calSel].split=e.target.value;
// Load exercises from split if empty
if(!up[calSel].exercises?.length){
(splits[e.target.value]||[]).forEach(preset=>{
const sets=[];const lastW=getLastWeights(preset.name);
for(let i=0;i<(preset.sets||2);i++)sets.push({weight:lastW?lastW[Math.min(i,lastW.length-1)]:"",reps:"",done:false,warmup:false});
up[calSel].exercises.push({name:preset.name,split:e.target.value,note:preset.note||"",sets})})}
setWorkouts(up);svWk(up)}},
h("option",{value:""},"Select split..."),
splitNames.map(n=>h("option",{key:n,value:n},n)))),
// Exercises (editable)
(wk?.exercises||[]).map((ex,i)=>renderExCard(ex,i,calSel)),
// Add exercise
h("select",{style:{...S.sel,marginBottom:"8px"},onChange:e=>{if(e.target.value){
const up=dc(workouts);
if(!up[calSel])up[calSel]={type:"workout",split:"Custom",exercises:[],notes:"",cardio:[],abs:[]};
const sets=[{weight:"",reps:"",done:false,warmup:false},{weight:"",reps:"",done:false,warmup:false}];
up[calSel].exercises.push({name:e.target.value,split:up[calSel].split||"Custom",note:"",sets});
setWorkouts(up);svWk(up)}},defaultValue:""},
h("option",{value:""},"+ Add exercise..."),
Object.entries(EXLIB).map(([cat,exs])=>h("optgroup",{key:cat,label:cat},exs.map(ex=>h("option",{key:ex,value:ex},ex))))),
// Actions
h("div",{style:{display:"flex",gap:"6px",marginTop:"6px"}},
h("button",{className:"ab",style:{...S.btnBlu,flex:1},onClick:()=>setEditing(false)},"Save"),
wk&&h("button",{className:"ab",style:{flex:1,background:"rgba(255,85,85,.06)",border:"1px solid rgba(255,85,85,.12)",borderRadius:"8px",padding:"10px",fontSize:"12px",color:"var(--red)",cursor:"pointer"},onClick:()=>{
if(!confirm("Delete this entry?"))return;
const up=dc(workouts);delete up[calSel];setWorkouts(up);svWk(up);setEditing(false);showToast("Deleted")}},"Delete")))}
})()),

// ===== STATS =====
view==="stats"&&h("div",{style:S.content},
h("div",{style:{fontSize:"10px",letterSpacing:"4px",color:"var(--c5)",marginBottom:"14px",fontFamily:"'DM Mono',monospace"}},"PERSONAL RECORDS"),
(()=>{
const stats={};
Object.entries(workouts).forEach(([date,wk])=>{
if(wk.type!=='workout')return;
(wk.exercises||[]).forEach((ex,i)=>{
if(!stats[ex.name])stats[ex.name]={split:ex.split,records:[],photo:null};
ex.sets.filter(s=>s.done&&!s.warmup&&s.weight&&s.reps).forEach(s=>{
stats[ex.name].records.push({date,weight:+s.weight,reps:+s.reps})});
const key=date+":"+i;if(photos[key]?.length)stats[ex.name].photo=photos[key].slice(-1)[0]})});
const entries=Object.entries(stats).filter(([,v])=>v.records.length>0);
if(!entries.length)return h("div",{style:{textAlign:"center",padding:"40px",color:"var(--c5)"}},"Complete some sets to see stats");
const grouped={};entries.forEach(([n,d])=>{const sp=d.split||"Other";if(!grouped[sp])grouped[sp]=[];grouped[sp].push([n,d])});
return Object.entries(grouped).map(([sp,exs])=>h("div",{key:sp},
h("div",{style:{fontSize:"10px",color:"var(--blu)",letterSpacing:"2px",fontWeight:600,margin:"12px 0 8px",paddingBottom:"6px",borderBottom:"1px solid var(--bd)",fontFamily:"'DM Mono',monospace"}},sp),
exs.map(([n,d])=>{
const mW=Math.max(...d.records.map(r=>r.weight));
const mV=Math.max(...d.records.map(r=>r.weight*r.reps));
const avg=Math.round(d.records.reduce((a,r)=>a+r.weight*r.reps,0)/d.records.length);
return h("div",{key:n,className:"ab",style:{...S.card,cursor:"pointer",animation:"slideUp .3s ease"},onClick:()=>setDrill(n)},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}},
h("div",{style:{fontSize:"14px",fontWeight:700,color:"var(--c1)"}},n),
h("div",{style:{display:"flex",alignItems:"center",gap:"3px",fontSize:"10px",color:"var(--blu)"}},"History",h("span",{dangerouslySetInnerHTML:{__html:ic("chev",10,"var(--blu)")}}))),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px"}},
[["MAX",mW+"lb"],["BEST VOL",mV.toLocaleString()],["AVG VOL",avg.toLocaleString()]].map(([l,v],i)=>
h("div",{key:i,style:S.prItem},h("div",{style:S.prVal},v),h("div",{style:S.prLbl},l)))))})))})()),

// ===== ME =====
view==="me"&&h("div",{style:S.content},
// Profile card
h("div",{style:{...S.card}},
h("div",{style:{display:"flex",alignItems:"center",gap:"12px"}},
h("div",{style:{width:"52px",height:"52px",borderRadius:"50%",background:"linear-gradient(135deg,#1a3a7a,#0d2459)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",fontWeight:800,color:"var(--blu)",flexShrink:0}},profile.name?profile.name[0].toUpperCase():"?"),
h("div",{style:{flex:1}},
h("div",{style:{fontSize:"17px",fontWeight:700,color:"var(--c1)"}},profile.name||"Set up profile"),
h("div",{style:{fontSize:"11px",color:"var(--c4)",marginTop:"1px"}},[profile.age,profile.height].filter(Boolean).join(" \u00B7 ")||"Tap edit")),
h("button",{className:"ab",style:{...S.iconBtn,width:"30px",height:"30px"},onClick:()=>setEditProf(true),dangerouslySetInnerHTML:{__html:ic("edit",13,"var(--c4)")}})),
// Goal progress
profile.goalWeight&&profile.currentWeight&&h("div",{style:{marginTop:"12px",paddingTop:"12px",borderTop:"1px solid var(--bd)"}},
h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"6px"}},
h("span",{style:{fontSize:"10px",color:"var(--c4)",fontFamily:"'DM Mono',monospace"}},"GOAL"),
h("span",{style:{fontSize:"11px",color:"var(--blu)",fontWeight:600}},(bwDates.length?bw[bwDates[0]]:profile.currentWeight)+" \u2192 "+profile.goalWeight+" lb")),
h("div",{style:{width:"100%",height:"6px",background:"var(--ip)",borderRadius:"3px",overflow:"hidden"}},
(()=>{const start=+(profile.startWeight||profile.currentWeight);const goal=+profile.goalWeight;const cur=bwDates.length?bw[bwDates[0]]:+profile.currentWeight;const pct=Math.max(0,Math.min(100,Math.round(Math.abs(start-cur)/Math.abs(start-goal)*100)));
return h("div",{style:{width:pct+"%",height:"100%",background:"linear-gradient(90deg,var(--blu),var(--grn))",borderRadius:"3px"}})})()))),
// Edit profile modal
editProf&&h("div",{style:S.overlay,onClick:()=>setEditProf(false)},
h("div",{style:{...S.card,maxWidth:"320px"},onClick:e=>e.stopPropagation()},
h("div",{style:{fontSize:"16px",fontWeight:700,color:"var(--c2)",marginBottom:"14px"}},"Edit Profile"),
h("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.lbl},"NAME"),h("input",{style:S.inp,value:profile.name,onChange:e=>setProfile({...profile,name:e.target.value})})),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.lbl},"AGE"),h("input",{style:{...S.inp,textAlign:"center"},value:profile.age,onChange:e=>setProfile({...profile,age:e.target.value})})),
h("div",{style:{flex:1}},h("label",{style:S.lbl},"HEIGHT"),h("input",{style:{...S.inp,textAlign:"center"},value:profile.height,onChange:e=>setProfile({...profile,height:e.target.value})}))),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.lbl},"CURRENT LB"),h("input",{style:{...S.inp,textAlign:"center"},value:profile.currentWeight,onChange:e=>setProfile({...profile,currentWeight:e.target.value})})),
h("div",{style:{flex:1}},h("label",{style:S.lbl},"GOAL LB"),h("input",{style:{...S.inp,textAlign:"center"},value:profile.goalWeight,onChange:e=>setProfile({...profile,goalWeight:e.target.value})}))),
h("button",{className:"ab",style:{...S.btnBlu,width:"100%"},onClick:()=>{saveProfile(profile);setEditProf(false)}},"Save")))),

// Body weight
h("div",{style:{fontSize:"10px",color:"var(--blu)",letterSpacing:"2px",fontWeight:600,margin:"14px 0 6px",fontFamily:"'DM Mono',monospace"}},"BODY WEIGHT"),
h("div",{style:{...S.card}},
h("div",{style:{display:"flex",gap:"6px",marginBottom:"8px"}},
h("input",{type:"number",inputMode:"decimal",placeholder:"lbs",style:{...S.inp,textAlign:"center",maxWidth:"100px"},id:"bwInp"}),
h("button",{className:"ab",style:S.btnBlu,onClick:()=>{const v=document.getElementById("bwInp").value;logBW(v);document.getElementById("bwInp").value=""}},"Log")),
bwDates.length>=2&&h("div",{style:{height:"50px",marginBottom:"6px"}},
(()=>{const recent=bwDates.slice(0,14).reverse();const vals=recent.map(dd=>bw[dd]);const mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;const w=100/(recent.length-1||1);
return h("svg",{viewBox:"0 0 100 28",style:{width:"100%",height:"100%"},preserveAspectRatio:"none"},
h("polyline",{points:recent.map((dd,i)=>(i*w)+","+(25-((vals[i]-mn)/rng)*22)).join(" "),fill:"none",stroke:"var(--blu)",strokeWidth:"1.2",strokeLinecap:"round",strokeLinejoin:"round"}),
recent.map((dd,i)=>h("circle",{key:i,cx:i*w,cy:25-((vals[i]-mn)/rng)*22,r:"1.8",fill:"var(--blu)"})))})()),
bwDates.length>0&&h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
h("div",null,h("span",{style:{fontSize:"17px",fontWeight:700,color:"var(--c1)"}},bw[bwDates[0]]),h("span",{style:{fontSize:"10px",color:"var(--c4)"}}," lb")),
bwTrend()==="dn"&&h("div",{style:{display:"flex",alignItems:"center",gap:"2px",background:"rgba(34,204,102,.08)",padding:"3px 7px",borderRadius:"5px"}},h("span",{dangerouslySetInnerHTML:{__html:ic("dn",9,"var(--grn)")}}),h("span",{style:{fontSize:"10px",fontWeight:600,color:"var(--grn)"}},"Down")),
bwTrend()==="up"&&h("div",{style:{display:"flex",alignItems:"center",gap:"2px",background:"rgba(255,85,85,.08)",padding:"3px 7px",borderRadius:"5px"}},h("span",{dangerouslySetInnerHTML:{__html:ic("up",9,"var(--red)")}}),h("span",{style:{fontSize:"10px",fontWeight:600,color:"var(--red)"}},"Up")))),

// Progress Photos
h("div",{style:{fontSize:"10px",color:"var(--blu)",letterSpacing:"2px",fontWeight:600,margin:"14px 0 6px",fontFamily:"'DM Mono',monospace"}},"PROGRESS PHOTOS"),
h("div",{style:{...S.card}},
h("div",{style:{fontSize:"12px",color:"var(--c3)",marginBottom:"10px"}},"Today's check-in"),
h("div",{style:{display:"flex",gap:"5px"}},
["front","side","back"].map(t=>h("div",{key:t,style:{flex:1}},
h("button",{className:"ab",style:{width:"100%",aspectRatio:"3/4",background:pp[today()]?.[t]?"transparent":"var(--ip)",border:"1px "+(pp[today()]?.[t]?"solid var(--blu)":"dashed var(--bd)"),borderRadius:"10px",cursor:"pointer",overflow:"hidden",padding:0,display:"flex",alignItems:"center",justifyContent:"center"},onClick:()=>{setPpUpload(t);setTimeout(()=>ppRef.current?.click(),100)}},
pp[today()]?.[t]?h("img",{src:pp[today()][t],alt:"",style:{width:"100%",height:"100%",objectFit:"cover"}}):
h("span",{dangerouslySetInnerHTML:{__html:ic("plus",16,"var(--c6)")}})),
h("div",{style:{textAlign:"center",fontSize:"8px",color:"var(--c5)",marginTop:"3px",letterSpacing:"1px",fontFamily:"'DM Mono',monospace"}},t.toUpperCase())))),
// History
Object.keys(pp).sort((a,b)=>b.localeCompare(a)).filter(d=>d!==today()).slice(0,5).map(d=>
h("div",{key:d,style:{...S.card,marginTop:"8px"}},
h("div",{style:{fontSize:"11px",color:"var(--c3)",fontFamily:"'DM Mono',monospace",marginBottom:"6px"}},pDate(d)),
h("div",{style:{display:"flex",gap:"4px"}},
["front","side","back"].map(t=>pp[d]?.[t]?
h("div",{key:t,style:{flex:1,cursor:"pointer"},onClick:()=>setViewPhoto({src:pp[d][t],name:t+" - "+pDate(d),key:"",photoIdx:-1})},
h("img",{src:pp[d][t],alt:"",style:{width:"100%",height:"60px",objectFit:"cover",borderRadius:"6px"}})):
h("div",{key:t,style:{flex:1,height:"60px",background:"var(--ip)",borderRadius:"6px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"7px",color:"var(--c6)"}},"\u2014")))))),

// ===== SPLITS =====
view==="splits"&&h("div",{style:S.content},
h("div",{style:{fontSize:"10px",letterSpacing:"4px",color:"var(--c5)",marginBottom:"14px",fontFamily:"'DM Mono',monospace"}},"MY SPLITS"),
splitNames.map(n=>h("div",{key:n,style:{...S.card,animation:"slideUp .3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
h("div",{style:{flex:1}},
h("div",{style:{fontSize:"13px",fontWeight:600,color:"var(--c2)"}},n),
h("div",{style:{fontSize:"10px",color:"var(--c5)"}},(splits[n]||[]).length+" exercises")),
h("span",{dangerouslySetInnerHTML:{__html:ic("chev",14,"var(--c5)")}})))),
// Add new split
h("div",{style:{display:"flex",gap:"6px",marginTop:"12px"}},
h("input",{style:S.inp,placeholder:"New split name...",id:"newSplitInp"}),
h("button",{className:"ab",style:{...S.btnBlu,flexShrink:0},onClick:()=>{
const inp=document.getElementById("newSplitInp");
const name=inp.value.trim();if(!name||splits[name])return;
const up={...splits};up[name]=[];setSplits(up);svSplits(up);inp.value="";showToast("Created")}},h("span",{dangerouslySetInnerHTML:{__html:ic("plus",14,"#000")}}))),
// Rest timer setting
h("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",marginTop:"16px",paddingTop:"12px",borderTop:"1px solid var(--bd)"}},
h("span",{style:{fontSize:"10px",color:"var(--c5)"}},"Rest timer"),
h("button",{className:"ab",style:{...S.iconBtn,width:"26px",height:"26px"},onClick:()=>{const v=Math.max(15,restDur-15);setRestDur(v);db.s("rc-rd",v)}},"-"),
h("span",{style:{fontSize:"14px",fontWeight:700,color:"var(--blu)",fontFamily:"'DM Mono',monospace",minWidth:"36px",textAlign:"center"}},restDur+"s"),
h("button",{className:"ab",style:{...S.iconBtn,width:"26px",height:"26px"},onClick:()=>{const v=restDur+15;setRestDur(v);db.s("rc-rd",v)}},"+")),
// Reset
h("button",{className:"ab",style:{background:"transparent",border:"1px solid rgba(255,85,85,.1)",borderRadius:"8px",color:"rgba(255,85,85,.4)",padding:"12px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",marginTop:"20px"},onClick:()=>{if(!confirm("Reset all splits to defaults?"))return;setSplits(dc(DEF_SPLITS));svSplits(dc(DEF_SPLITS));showToast("Reset")}},"RESET SPLITS TO DEFAULTS")),

// ===== BOTTOM NAV =====
h("div",{style:S.nav},
[{id:"home",lbl:"HOME"},{id:"calendar",lbl:"CAL"},{id:"stats",lbl:"STATS"},{id:"me",lbl:"ME"},{id:"splits",lbl:"SPLITS"}].map(t=>{
const cur=view==="workout"||view==="summary"?"home":view;
const act=cur===t.id;
return h("div",{key:t.id,style:S.navBtn,onClick:()=>{if(aw&&t.id==="home"){setView("workout");return}nav(t.id)}},
h("div",{style:{...S.navDot,background:act?"var(--blu)":"transparent"}}),
h("div",{style:{...S.navLbl,color:act?"var(--blu)":"var(--c6)"}},t.lbl))}))
))}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
