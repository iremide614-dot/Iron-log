const{useState,useEffect,useCallback,useRef}=React;
const h=React.createElement;

// SVG Icons
const IC={
cam:h("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round"},h("rect",{x:2,y:6,width:20,height:14,rx:2}),h("path",{d:"M12 10a3 3 0 100 6 3 3 0 000-6z"}),h("path",{d:"M8 2h8l2 4H6l2-4"})),
x:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("path",{d:"M18 6L6 18M6 6l12 12"})),
plus:h("svg",{width:16,height:16,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5},h("path",{d:"M12 5v14M5 12h14"})),
up:h("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5},h("path",{d:"M12 19V5M5 12l7-7 7 7"})),
dn:h("svg",{width:12,height:12,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2.5},h("path",{d:"M12 5v14M19 12l-7 7-7-7"})),
chk:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:3},h("path",{d:"M5 12l5 5L19 7"})),
cal:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("rect",{x:3,y:4,width:18,height:18,rx:2}),h("path",{d:"M16 2v4M8 2v4M3 10h18"})),
user:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("circle",{cx:12,cy:8,r:4}),h("path",{d:"M5 20c0-4 3-7 7-7s7 3 7 7"})),
scale:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("path",{d:"M12 3v18M3 12l4-4 2 3 3-5 3 5 2-3 4 4"})),
gear:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("circle",{cx:12,cy:12,r:3}),h("path",{d:"M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"})),
chart:h("svg",{width:14,height:14,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2},h("path",{d:"M3 20l5-8 4 4 4-8 5 6"})),
};

// Popular exercises by category
const EXERCISE_LIB={
"Chest":["Bench Press","Incline Bench","Dumbbell Fly","Cable Crossover","Chest Press Machine","Chest Fly Machine","Push-Ups","Decline Bench"],
"Back":["Deadlift","Barbell Row","Lat Pulldown","Seated Row","Pull-Ups","T-Bar Row","Cable Row","Machine Row"],
"Shoulders":["Overhead Press","Lateral Raise","Front Raise","Face Pull","Arnold Press","Rear Delt Fly","DB Shoulder Press","Machine Shoulder Press"],
"Arms":["Bicep Curl","Tricep Pushdown","Hammer Curl","Skull Crushers","Preacher Curl","Cable Curl","Tricep Rope","Overhead Tricep Extension","Cable Hammer"],
"Legs":["Squat","Leg Press","Romanian Deadlift","Hamstring Curl","Quad Extension","Calf Raises","Lunges","Bulgarian Split Squat","Hip Thrust"],
"Core":["Plank","Crunches","Russian Twist","Leg Raise","Ab Rollout","Cable Crunch","Hanging Knee Raise"]};
const ALL_EXERCISES=Object.values(EXERCISE_LIB).flat();

const DEFAULT_SPLITS={
"Bis/Chest/Shoulders":[
{name:"Cable Curl",defaultSets:2,note:""},
{name:"Incline Bench",defaultSets:2,note:"3 plates"},
{name:"Cable Hammer",defaultSets:3,note:""},
{name:"Flat Chest Press Machine",defaultSets:2,note:"or Chest Fly"},
{name:"Chest Fly Machine",defaultSets:2,note:""},
{name:"Lateral Raise",defaultSets:2,note:"machine"},
{name:"Preacher Curl",defaultSets:2,note:"machine"}],
"Tris/Back/Rear Delts":[
{name:"Tricep Pushdown",defaultSets:2,note:""},
{name:"Overhead Tricep Extension",defaultSets:2,note:"bar"},
{name:"Lat Pulldown",defaultSets:2,note:""},
{name:"Machine Row",defaultSets:2,note:""},
{name:"Chest Fly Machine",defaultSets:2,note:"pec deck / rear delts"},
{name:"Pull-Ups",defaultSets:2,note:"optional finisher"},
{name:"Tricep Rope",defaultSets:2,note:""}],
"Legs":[
{name:"Squat",defaultSets:3,note:"or Leg Press"},
{name:"Leg Press",defaultSets:3,note:"alt for Squat"},
{name:"Hamstring Curl",defaultSets:3,note:""},
{name:"Quad Extension",defaultSets:3,note:""},
{name:"Calf Raises",defaultSets:3,note:""}],
"SARMS":[
{name:"DB Shoulder Press",defaultSets:2,note:""},
{name:"Lateral Raise",defaultSets:2,note:"drop set"},
{name:"Rear Delt Fly",defaultSets:2,note:""},
{name:"Hammer Curl",defaultSets:2,note:""},
{name:"Cable Curl",defaultSets:2,note:""}],
"Push (PPL)":[
{name:"Bench Press",defaultSets:3,note:""},{name:"Incline Bench",defaultSets:3,note:""},{name:"Overhead Press",defaultSets:3,note:""},{name:"Lateral Raise",defaultSets:3,note:""},{name:"Tricep Pushdown",defaultSets:3,note:""},{name:"Cable Crossover",defaultSets:2,note:""}],
"Pull (PPL)":[
{name:"Deadlift",defaultSets:3,note:""},{name:"Barbell Row",defaultSets:3,note:""},{name:"Lat Pulldown",defaultSets:3,note:""},{name:"Face Pull",defaultSets:3,note:""},{name:"Bicep Curl",defaultSets:3,note:""},{name:"Hammer Curl",defaultSets:2,note:""}],
"Legs (PPL)":[
{name:"Squat",defaultSets:4,note:""},{name:"Romanian Deadlift",defaultSets:3,note:""},{name:"Leg Press",defaultSets:3,note:""},{name:"Hamstring Curl",defaultSets:3,note:""},{name:"Quad Extension",defaultSets:3,note:""},{name:"Calf Raises",defaultSets:4,note:""}],
"Upper":[
{name:"Bench Press",defaultSets:3,note:""},{name:"Barbell Row",defaultSets:3,note:""},{name:"Overhead Press",defaultSets:3,note:""},{name:"Lat Pulldown",defaultSets:3,note:""},{name:"Bicep Curl",defaultSets:2,note:""},{name:"Tricep Pushdown",defaultSets:2,note:""},{name:"Lateral Raise",defaultSets:2,note:""}],
"Lower":[
{name:"Squat",defaultSets:4,note:""},{name:"Romanian Deadlift",defaultSets:3,note:""},{name:"Leg Press",defaultSets:3,note:""},{name:"Hamstring Curl",defaultSets:3,note:""},{name:"Calf Raises",defaultSets:4,note:""}],
"Full Body":[
{name:"Squat",defaultSets:3,note:""},{name:"Bench Press",defaultSets:3,note:""},{name:"Barbell Row",defaultSets:3,note:""},{name:"Overhead Press",defaultSets:2,note:""},{name:"Hamstring Curl",defaultSets:2,note:""},{name:"Bicep Curl",defaultSets:2,note:""}],
"Chest Day":[
{name:"Bench Press",defaultSets:4,note:""},{name:"Incline Bench",defaultSets:3,note:""},{name:"Dumbbell Fly",defaultSets:3,note:""},{name:"Cable Crossover",defaultSets:3,note:""},{name:"Chest Press Machine",defaultSets:2,note:""}],
"Back Day":[
{name:"Deadlift",defaultSets:3,note:""},{name:"Lat Pulldown",defaultSets:3,note:""},{name:"Barbell Row",defaultSets:3,note:""},{name:"Seated Row",defaultSets:3,note:""},{name:"Pull-Ups",defaultSets:2,note:""}],
"Arms Day":[
{name:"Bicep Curl",defaultSets:3,note:""},{name:"Hammer Curl",defaultSets:3,note:""},{name:"Tricep Pushdown",defaultSets:3,note:""},{name:"Skull Crushers",defaultSets:3,note:""},{name:"Preacher Curl",defaultSets:2,note:""},{name:"Overhead Tricep Extension",defaultSets:2,note:""}],
"Shoulders Day":[
{name:"Overhead Press",defaultSets:4,note:""},{name:"Lateral Raise",defaultSets:3,note:""},{name:"Front Raise",defaultSets:3,note:""},{name:"Face Pull",defaultSets:3,note:""},{name:"Rear Delt Fly",defaultSets:2,note:""}],
};

// Helpers
const formatDate=d=>d.toISOString().split("T")[0];
const today=()=>formatDate(new Date());
const prettyDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})};
const shortDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{month:"short",day:"numeric"})};
const fmtTime=s=>{const m=Math.floor(s/60);const sec=s%60;return m+":"+(sec<10?"0":"")+sec};
const fmtDur=ms=>{const s=Math.floor(ms/1000);const m=Math.floor(s/60);const hr=Math.floor(m/60);if(hr>0)return hr+"h "+(m%60)+"m";return m+"m "+(s%60)+"s"};
const compressImg=(file,max=600)=>new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");let w=img.width,ht=img.height;if(w>ht){if(w>max){ht=(ht*max)/w;w=max}}else{if(ht>max){w=(w*max)/ht;ht=max}}c.width=w;c.height=ht;c.getContext("2d").drawImage(img,0,0,w,ht);res(c.toDataURL("image/jpeg",0.7))};img.src=e.target.result};r.readAsDataURL(file)});
const db={get:k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},rm:k=>localStorage.removeItem(k)};
const dc=o=>JSON.parse(JSON.stringify(o));

function App(){
const[splits,setSplits]=useState(DEFAULT_SPLITS);
const[workouts,setWorkouts]=useState({});
const[photos,setPhotos]=useState({});
const[bodyWeights,setBW]=useState({});
const[progressPics,setProgressPics]=useState({});
const[view,setView]=useState("home");
const[curDate,setCurDate]=useState(today());
const[loaded,setLoaded]=useState(false);
const[toast,setToast]=useState(null);
const[activeWorkout,setActiveWorkout]=useState(null);
const[elapsed,setElapsed]=useState(0);
const[restTimer,setRestTimer]=useState(null);
const[restLeft,setRestLeft]=useState(0);
const[restDuration,setRestDuration]=useState(90);
const[workoutNotes,setWorkoutNotes]=useState("");
const[adding,setAdding]=useState(false);
const[selectedSplit,setSelectedSplit]=useState(null);
const[customExName,setCustomExName]=useState("");
const[viewingPhoto,setViewingPhoto]=useState(null);
const[photoMenuIdx,setPhotoMenuIdx]=useState(null);
const[calMonth,setCalMonth]=useState(new Date().getMonth());
const[calYear,setCalYear]=useState(new Date().getFullYear());
const[editingSplit,setEditingSplit]=useState(null);
const[newSplitName,setNewSplitName]=useState("");
const[addingExToSplit,setAddingExToSplit]=useState(false);
const[newExName,setNewExName]=useState("");
const[newExSets,setNewExSets]=useState("2");
const[newExNote,setNewExNote]=useState("");
const[editingExIdx,setEditingExIdx]=useState(null);
const[editExData,setEditExData]=useState({});
const[renamingSplit,setRenamingSplit]=useState(null);
const[renameVal,setRenameVal]=useState("");
const[bwInput,setBwInput]=useState("");
const[ppType,setPpType]=useState(null);
const[selectedExDD,setSelectedExDD]=useState("");
const fileInputRef=useRef(null);
const ppInputRef=useRef(null);
const captureRef=useRef(null);

useEffect(()=>{
const s=db.get("rc-splits");if(s)setSplits(s);
const w=db.get("rc-workouts");if(w)setWorkouts(w);
const p=db.get("rc-photos");if(p)setPhotos(p);
const bw=db.get("rc-bw");if(bw)setBW(bw);
const pp=db.get("rc-pp");if(pp)setProgressPics(pp);
const aw=db.get("rc-active");if(aw){setActiveWorkout(aw);setView("workout")}
const rd=db.get("rc-rd");if(rd)setRestDuration(rd);
setLoaded(true)
},[]);

useEffect(()=>{if(!activeWorkout)return;const iv=setInterval(()=>setElapsed(Date.now()-activeWorkout.startTime),1000);return()=>clearInterval(iv)},[activeWorkout]);
useEffect(()=>{if(!restTimer)return;const iv=setInterval(()=>{const left=Math.max(0,Math.ceil((restTimer.end-Date.now())/1000));setRestLeft(left);if(left<=0){setRestTimer(null);try{if(navigator.vibrate)navigator.vibrate([200,100,200])}catch(e){}}},250);return()=>clearInterval(iv)},[restTimer]);

const svSplits=useCallback(d=>{db.set("rc-splits",d)},[]);
const sv=useCallback(d=>{db.set("rc-workouts",d)},[]);
const svPhotos=useCallback(d=>{db.set("rc-photos",d)},[]);
const svBW=useCallback(d=>{db.set("rc-bw",d)},[]);
const svPP=useCallback(d=>{db.set("rc-pp",d)},[]);
const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2000)};
const pk=(date,idx)=>date+":"+idx;

// Get last session weights for an exercise (for auto-fill)
const getLastWeights=(exName)=>{
const dates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));
for(const d of dates){const ex=(workouts[d].exercises||[]).find(e=>e.name===exName);
if(ex){const done=ex.sets.filter(s=>s.done&&s.weight);if(done.length>0)return done.map(s=>s.weight)}}
return null};

const getLastSession=(exName,before)=>{
const dates=Object.keys(workouts).filter(d=>d<before).sort((a,b)=>b.localeCompare(a));
for(const d of dates){const ex=(workouts[d].exercises||[]).find(e=>e.name===exName);
if(ex){const done=ex.sets.filter(s=>s.done&&(s.weight||s.reps));if(done.length>0)return{date:d,sets:done}}}
return null};

const getAvgSession=(exName,before)=>{
const all=[];Object.entries(workouts).forEach(([d,day])=>{if(d>=before)return;
const ex=(day.exercises||[]).find(e=>e.name===exName);
if(ex)ex.sets.filter(s=>s.done&&s.weight&&s.reps).forEach(s=>all.push((parseFloat(s.weight)||0)*(parseInt(s.reps)||0)))});
if(all.length===0)return null;
return Math.round(all.reduce((a,b)=>a+b,0)/all.length)};

const getOverload=(exName,sets,before)=>{
const last=getLastSession(exName,before);if(!last)return null;
const lastMax=Math.max(...last.sets.map(s=>(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)));
const curDone=sets.filter(s=>s.done&&(s.weight||s.reps));if(curDone.length===0)return null;
const curMax=Math.max(...curDone.map(s=>(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)));
if(curMax>lastMax)return"up";if(curMax<lastMax)return"dn";return"eq"};

// Photo
const handleCapture=async(exIdx,file)=>{if(!file)return;try{showToast("Processing...");const comp=await compressImg(file);const key=pk(wkDate(),exIdx);const up={...photos};if(!up[key])up[key]=[];up[key].push(comp);if(up[key].length>3)up[key]=up[key].slice(-3);setPhotos(up);svPhotos(up);showToast("Saved!")}catch(e){showToast("Failed")}};
const rmPhoto=(key,i)=>{const up={...photos};if(up[key]){up[key].splice(i,1);if(!up[key].length)delete up[key];setPhotos(up);svPhotos(up);showToast("Removed")}setViewingPhoto(null)};
const triggerCam=i=>{captureRef.current=i;setPhotoMenuIdx(i)};
const fileSel=mode=>{const inp=fileInputRef.current;if(!inp)return;if(mode==="cam")inp.setAttribute("capture","environment");else inp.removeAttribute("capture");inp.click();setPhotoMenuIdx(null)};
const onFile=async e=>{const f=e.target.files?.[0];if(f&&captureRef.current!==null)await handleCapture(captureRef.current,f);e.target.value=""};

// Progress pics
const handlePP=async(type,file)=>{if(!file)return;try{const comp=await compressImg(file,800);const up={...progressPics};const d=today();if(!up[d])up[d]={};up[d][type]=comp;setProgressPics(up);svPP(up);showToast(type+" saved!")}catch(e){showToast("Failed")}setPpType(null)};
const onPPFile=async e=>{const f=e.target.files?.[0];if(f&&ppType)await handlePP(ppType,f);e.target.value=""};

const wkDate=()=>activeWorkout?.date||curDate;
const splitNames=Object.keys(splits);

// Start workout
const startWorkout=(splitName)=>{
const aw={date:today(),startTime:Date.now()};setActiveWorkout(aw);db.set("rc-active",aw);setCurDate(today());
const up={...workouts};if(!up[today()])up[today()]={split:splitName,exercises:[],notes:""};else up[today()].split=splitName;
(splits[splitName]||[]).forEach(preset=>{
const sets=[];const lastW=getLastWeights(preset.name);
for(let i=0;i<(preset.defaultSets||2);i++)sets.push({weight:lastW?lastW[Math.min(i,lastW.length-1)]||"":"",reps:"",done:false});
up[today()].exercises.push({name:preset.name,split:splitName,note:preset.note||"",sets})});
setWorkouts(up);sv(up);setWorkoutNotes("");setView("workout");showToast("Let's go!")};

const finishWorkout=()=>{const up={...workouts};if(up[activeWorkout.date]){up[activeWorkout.date].endTime=Date.now();up[activeWorkout.date].duration=Date.now()-activeWorkout.startTime;up[activeWorkout.date].notes=workoutNotes}setWorkouts(up);sv(up);setActiveWorkout(null);db.rm("rc-active");setRestTimer(null);setView("home");showToast("Workout saved!")};
const cancelWorkout=()=>{if(!confirm("Cancel this workout? All data for today will be deleted."))return;const up={...workouts};delete up[activeWorkout?.date||curDate];setWorkouts(up);sv(up);setActiveWorkout(null);db.rm("rc-active");setRestTimer(null);setView("home");showToast("Cancelled")};

const addExercise=(name,note)=>{
const up={...workouts};const d=wkDate();if(!up[d])up[d]={split:selectedSplit||"Custom",exercises:[],notes:""};
const sets=[];const lastW=getLastWeights(name);
for(let i=0;i<2;i++)sets.push({weight:lastW?lastW[Math.min(i,lastW.length-1)]||"":"",reps:"",done:false});
up[d].exercises.push({name,split:selectedSplit||"Custom",note:note||"",sets});
setWorkouts(up);sv(up);setAdding(false);setSelectedSplit(null);setCustomExName("");setSelectedExDD("");showToast("Added "+name)};

const addSet=i=>{const up={...workouts};const d=wkDate();const last=up[d].exercises[i].sets.slice(-1)[0];up[d].exercises[i].sets.push({weight:last?.weight||"",reps:last?.reps||"",done:false});setWorkouts(up);sv(up)};
const rmSet=(i,si)=>{const up={...workouts};const d=wkDate();up[d].exercises[i].sets.splice(si,1);if(!up[d].exercises[i].sets.length)up[d].exercises.splice(i,1);if(!up[d].exercises.length)delete up[d];setWorkouts(up);sv(up)};
const updSet=(i,si,f,v)=>{const up={...workouts};const d=wkDate();up[d].exercises[i].sets[si][f]=v;setWorkouts(up);sv(up)};
const togDone=(i,si)=>{const up={...workouts};const d=wkDate();const was=up[d].exercises[i].sets[si].done;up[d].exercises[i].sets[si].done=!was;setWorkouts(up);sv(up);if(!was){setRestTimer({end:Date.now()+restDuration*1000,duration:restDuration});setRestLeft(restDuration)}};
const delEx=i=>{const up={...workouts};const d=wkDate();up[d].exercises.splice(i,1);if(!up[d].exercises.length)delete up[d];setWorkouts(up);sv(up);showToast("Removed")};
const moveEx=(i,dir)=>{const up={...workouts};const d=wkDate();const arr=up[d].exercises;const ni=i+dir;if(ni<0||ni>=arr.length)return;[arr[i],arr[ni]]=[arr[ni],arr[i]];setWorkouts(up);sv(up)};

// Splits editor
const addSplit=()=>{if(!newSplitName.trim()||splits[newSplitName.trim()])return;const up={...splits};up[newSplitName.trim()]=[];setSplits(up);svSplits(up);setNewSplitName("");setEditingSplit(newSplitName.trim());showToast("Created")};
const delSplit=n=>{if(!confirm("Delete '"+n+"'?"))return;const up={...splits};delete up[n];setSplits(up);svSplits(up);if(editingSplit===n)setEditingSplit(null);showToast("Deleted")};
const renameSplit=()=>{if(!renameVal.trim()||!renamingSplit)return;const up={...splits};const ex=up[renamingSplit];delete up[renamingSplit];up[renameVal.trim()]=ex;setSplits(up);svSplits(up);if(editingSplit===renamingSplit)setEditingSplit(renameVal.trim());setRenamingSplit(null);showToast("Renamed")};
const addExToSplit=()=>{if(!newExName.trim()||!editingSplit)return;const up=dc(splits);up[editingSplit].push({name:newExName.trim(),defaultSets:parseInt(newExSets)||2,note:newExNote});setSplits(up);svSplits(up);setNewExName("");setNewExSets("2");setNewExNote("");setAddingExToSplit(false);showToast("Added")};
const delExFromSplit=(sn,i)=>{const up=dc(splits);up[sn].splice(i,1);setSplits(up);svSplits(up)};
const moveExInSplit=(sn,i,dir)=>{const up=dc(splits);const arr=up[sn];const ni=i+dir;if(ni<0||ni>=arr.length)return;[arr[i],arr[ni]]=[arr[ni],arr[i]];setSplits(up);svSplits(up)};
const saveEditEx=(sn,i)=>{if(!editExData.name?.trim())return;const up=dc(splits);up[sn][i]={...editExData,name:editExData.name.trim(),defaultSets:parseInt(editExData.defaultSets)||2};setSplits(up);svSplits(up);setEditingExIdx(null);showToast("Saved")};

// Body weight
const logBW=()=>{if(!bwInput.trim())return;const up={...bodyWeights};up[today()]=parseFloat(bwInput);setBW(up);svBW(up);setBwInput("");showToast("Logged")};
const bwDates=Object.keys(bodyWeights).sort((a,b)=>b.localeCompare(a));
const bwTrend=()=>{if(bwDates.length<2)return null;const a=bodyWeights[bwDates[0]];const b=bodyWeights[bwDates[1]];if(a>b)return"up";if(a<b)return"dn";return"eq"};

const dayData=workouts[wkDate()];
const todayEx=dayData?.exercises||[];
const totalSets=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
const totalVol=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),0);
const sortedDates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));

// Calendar
const calDays=()=>{const first=new Date(calYear,calMonth,1);const last=new Date(calYear,calMonth+1,0);const startDay=first.getDay();const days=[];for(let i=0;i<startDay;i++)days.push(null);for(let i=1;i<=last.getDate();i++)days.push(i);return days};
const calMonthName=new Date(calYear,calMonth).toLocaleDateString("en-US",{month:"long",year:"numeric"});
const calDateStr=d=>{const mm=String(calMonth+1).padStart(2,"0");const dd=String(d).padStart(2,"0");return calYear+"-"+mm+"-"+dd};

// Progress pics dates
const ppDates=Object.keys(progressPics).sort((a,b)=>b.localeCompare(a));

if(!loaded)return h("div",{style:S.loadWrap},h("div",{style:{fontSize:"32px",color:"#4a8fff",animation:"pulseGlow 1.5s infinite"}},"\u25C6"),h("p",{style:{color:"#3a5a8a",fontFamily:"'DM Mono',monospace",letterSpacing:"3px",fontSize:"12px"}},"LOADING"));

// === Exercise card renderer ===
const renderExCard=(ex,exIdx,date)=>{
const key=pk(date,exIdx);const exP=photos[key]||[];const last=getLastSession(ex.name,date);const avg=getAvgSession(ex.name,date);const ol=getOverload(ex.name,ex.sets,date);
return h("div",{key:exIdx,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("div",{style:S.exHeader},h("div",{style:{flex:1}},
h("div",{style:{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}},
h("span",{style:S.splitTag},ex.split),ex.note&&h("span",{style:S.noteTag},ex.note),
ol==="up"&&h("span",{style:{color:"#22cc66",display:"flex",alignItems:"center"}},IC.up),
ol==="dn"&&h("span",{style:{color:"#ff5555",display:"flex",alignItems:"center"}},IC.dn),
ol==="eq"&&h("span",{style:{color:"#4a5a8a",fontSize:"10px"}},"=")),
h("h3",{style:S.exName},ex.name),
last&&h("div",{style:S.lastSesh},"Last: "+last.sets.map(s=>s.weight+"\u00D7"+s.reps).join(", ")),
avg&&h("div",{style:{...S.lastSesh,color:"#1a3a5a"}},"Avg vol/set: "+avg+" lb")),
h("div",{style:S.exActions},
activeWorkout&&h("button",{onClick:()=>triggerCam(exIdx),style:S.iconBtn},IC.cam),
h("button",{onClick:()=>moveEx(exIdx,-1),style:{...S.iconBtn,opacity:exIdx===0?.25:1}},"\u2191"),
h("button",{onClick:()=>moveEx(exIdx,1),style:{...S.iconBtn,opacity:exIdx===todayEx.length-1?.25:1}},"\u2193"),
h("button",{onClick:()=>delEx(exIdx),style:{...S.iconBtn,color:"#ff5555"}},IC.x))),
exP.length>0&&h("div",{style:S.photoStrip},exP.map((src,pi)=>h("div",{key:pi,style:S.pThumb,onClick:()=>setViewingPhoto({src,key,photoIdx:pi,name:ex.name})},h("img",{src,alt:"",style:S.tImg}))),exP.length<3&&h("button",{onClick:()=>triggerCam(exIdx),style:S.pAdd},IC.plus)),
h("div",{style:S.setHdr},h("span",{style:{...S.setCol,flex:"0 0 30px"}},"SET"),h("span",{style:S.setCol},"WEIGHT"),h("span",{style:S.setCol},"REPS"),h("span",{style:{...S.setCol,flex:"0 0 64px"}})),
ex.sets.map((set,si)=>h("div",{key:si,style:{...S.setRow,...(set.done?S.setDone:{})}},
h("span",{style:S.setNum},si+1),
h("input",{type:"number",inputMode:"decimal",placeholder:"0",value:set.weight,onChange:e=>updSet(exIdx,si,"weight",e.target.value),style:S.inp}),
h("input",{type:"number",inputMode:"numeric",placeholder:"0",value:set.reps,onChange:e=>updSet(exIdx,si,"reps",e.target.value),style:S.inp}),
h("div",{style:S.setAct},h("button",{onClick:()=>togDone(exIdx,si),style:{...S.chkBtn,...(set.done?S.chkDone:{})}},set.done?IC.chk:"\u25CB"),
ex.sets.length>1&&h("button",{onClick:()=>rmSet(exIdx,si),style:S.miniDel},"\u2212")))),
h("button",{onClick:()=>addSet(exIdx),style:S.addSetBtn},"+ Add Set"))};

// === Add exercise with dropdown ===
const renderAddEx=()=>h("div",null,
adding&&!selectedSplit&&h("div",{style:{...S.card,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.mTitle},"SELECT SPLIT"),h("div",{style:{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px",maxHeight:"250px",overflowY:"auto"}},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>setSelectedSplit(sp),style:S.exBtn},sp))),h("button",{onClick:()=>{setAdding(false);setSelectedSplit(null)},style:S.cancelBtn},"Cancel")),
adding&&selectedSplit&&h("div",{style:{...S.card,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.mTitle},selectedSplit.toUpperCase()),
h("div",{style:{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"12px",maxHeight:"200px",overflowY:"auto"}},(splits[selectedSplit]||[]).map((ex,i)=>h("button",{key:i,className:"hov-btn",onClick:()=>addExercise(ex.name,ex.note),style:S.exBtn},h("span",{style:{fontSize:"13px"}},ex.name),ex.note&&h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#3a4a6a"}},ex.note)))),
h("div",{style:{borderTop:"1px solid #111828",paddingTop:"12px",marginBottom:"12px"}},
h("label",{style:S.fieldLbl},"OR CHOOSE FROM LIBRARY"),
h("select",{value:selectedExDD,onChange:e=>{if(e.target.value)addExercise(e.target.value,"")},style:S.select},h("option",{value:""},"Select exercise..."),Object.entries(EXERCISE_LIB).map(([cat,exs])=>h("optgroup",{key:cat,label:cat},exs.map(ex=>h("option",{key:ex,value:ex},ex)))))),
h("div",{style:{display:"flex",gap:"8px"}},h("input",{placeholder:"Or type custom name...",value:customExName,onChange:e=>setCustomExName(e.target.value),onKeyDown:e=>{if(e.key==="Enter"&&customExName.trim())addExercise(customExName.trim(),"")},style:S.input2}),h("button",{onClick:()=>customExName.trim()&&addExercise(customExName.trim(),""),style:S.addBtn,disabled:!customExName.trim()},IC.plus)),
h("button",{onClick:()=>setSelectedSplit(null),style:{...S.cancelBtn,marginTop:"8px"}},"\u2190 Back")));

return h("div",{style:S.container},
h("input",{ref:fileInputRef,type:"file",accept:"image/*",onChange:onFile,style:{display:"none"}}),
h("input",{ref:ppInputRef,type:"file",accept:"image/*",onChange:onPPFile,style:{display:"none"}}),
toast&&h("div",{style:S.toast},toast),

// Rest timer
restTimer&&restLeft>0&&h("div",{style:S.restOL},h("div",{style:S.restCard},
h("p",{style:{fontSize:"11px",letterSpacing:"3px",color:"#4a5a8a",marginBottom:"12px"}},"REST TIMER"),
h("p",{style:{fontSize:"48px",fontWeight:700,color:"#4a8fff",fontFamily:"'DM Mono',monospace",animation:"timerPulse 2s infinite"}},fmtTime(restLeft)),
h("div",{style:{width:"100%",height:"4px",background:"#111828",borderRadius:"2px",marginTop:"16px",overflow:"hidden"}},h("div",{style:{width:(restLeft/restTimer.duration*100)+"%",height:"100%",background:"#4a8fff",borderRadius:"2px",transition:"width 0.3s"}})),
h("div",{style:{display:"flex",gap:"8px",marginTop:"16px"}},
h("button",{onClick:()=>{setRestTimer({end:Date.now()+(restLeft+15)*1000,duration:restTimer.duration+15});setRestLeft(restLeft+15)},style:S.rBtn},"+15s"),
h("button",{onClick:()=>{setRestTimer({end:Date.now()+Math.max(0,restLeft-15)*1000,duration:restTimer.duration});setRestLeft(Math.max(0,restLeft-15))},style:S.rBtn},"-15s"),
h("button",{onClick:()=>setRestTimer(null),style:{...S.rBtn,color:"#ff5555",borderColor:"#331111"}},"Skip")))),

// Photo lightbox
viewingPhoto&&h("div",{style:S.overlay,onClick:()=>setViewingPhoto(null)},h("div",{style:{maxWidth:"400px",width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"},onClick:e=>e.stopPropagation()},
h("img",{src:viewingPhoto.src,alt:"",style:{width:"100%",maxHeight:"60vh",objectFit:"contain",borderRadius:"12px",border:"1px solid #1a2d5a"}}),
h("div",{style:{display:"flex",gap:"10px",width:"100%"}},h("span",{style:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#4a5a8a"}},viewingPhoto.name),
viewingPhoto.photoIdx>=0&&h("button",{onClick:()=>rmPhoto(viewingPhoto.key,viewingPhoto.photoIdx),style:{...S.rBtn,color:"#ff5555"}},"Delete"),
h("button",{onClick:()=>setViewingPhoto(null),style:S.rBtn},"Close")))),

// Photo menu
photoMenuIdx!==null&&h("div",{style:S.overlay,onClick:()=>setPhotoMenuIdx(null)},h("div",{style:S.modal,onClick:e=>e.stopPropagation()},h("h3",{style:S.mTitle},"ADD PHOTO"),
h("button",{onClick:()=>fileSel("cam"),className:"hov-btn",style:S.mBtn},IC.cam," Take Photo"),
h("button",{onClick:()=>fileSel("gallery"),className:"hov-btn",style:S.mBtn},"Choose from Gallery"),
h("button",{onClick:()=>setPhotoMenuIdx(null),style:S.cancelBtn},"Cancel"))),

// Rename modal
renamingSplit&&h("div",{style:S.overlay,onClick:()=>setRenamingSplit(null)},h("div",{style:S.modal,onClick:e=>e.stopPropagation()},h("h3",{style:S.mTitle},"RENAME SPLIT"),h("input",{value:renameVal,onChange:e=>setRenameVal(e.target.value),onKeyDown:e=>e.key==="Enter"&&renameSplit(),style:{...S.input2,marginBottom:"12px"}}),h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setRenamingSplit(null),style:S.cancelFull},"Cancel"),h("button",{onClick:renameSplit,style:S.confirmBtn},"Rename")))),

// HEADER
h("div",{style:S.header},h("div",null,h("h1",{style:S.logo},"RECOMP"),h("p",{style:S.subtitle},"ABSOLUTE FITNESS")),
activeWorkout?h("div",{style:{display:"flex",gap:"6px"}},
h("div",{style:{...S.pill,animation:"timerPulse 3s infinite"}},h("span",{style:S.pillNum},fmtDur(elapsed)),h("span",{style:S.pillLbl},"TIME")),
h("div",{style:S.pill},h("span",{style:S.pillNum},totalSets),h("span",{style:S.pillLbl},"SETS")),
h("div",{style:S.pill},h("span",{style:S.pillNum},totalVol>999?(totalVol/1000).toFixed(1)+"k":totalVol),h("span",{style:S.pillLbl},"VOL")))
:h("div",{style:S.pill},h("span",{style:S.pillNum},sortedDates.length),h("span",{style:S.pillLbl},"WORKOUTS"))),

// NAV
h("div",{style:S.nav},[
{id:"home",icon:"\u25C6",label:"HOME"},
{id:"calendar",icon:IC.cal,label:"CAL"},
{id:"stats",icon:IC.chart,label:"STATS"},
{id:"progress",icon:IC.user,label:"PICS"},
{id:"weight",icon:IC.scale,label:"WEIGHT"},
{id:"splits",icon:IC.gear,label:"SPLITS"}].map(v=>
h("button",{key:v.id,onClick:()=>{if(activeWorkout&&v.id==="home"){setView("workout");return}setView(v.id);setEditingSplit(null)},
style:{...S.navBtn,...((view===v.id||(view==="workout"&&v.id==="home"))?S.navAct:{})}},typeof v.icon==="string"?v.icon:v.icon," ",v.label))),

// ===== HOME =====
view==="home"&&!activeWorkout&&h("div",{style:S.content},
h("div",{style:{textAlign:"center",marginBottom:"16px"}},h("p",{style:{fontSize:"12px",color:"#4a5a8a",letterSpacing:"1px",fontFamily:"'DM Mono',monospace"}},prettyDate(today()).toUpperCase())),
h("div",{style:S.startBox},h("div",{style:{fontSize:"24px",color:"#4a8fff",marginBottom:"6px"}},"\u25C6"),h("p",{style:{fontSize:"16px",fontWeight:700,letterSpacing:"3px",color:"#e8e8e8"}},"START WORKOUT"),h("p",{style:{fontSize:"11px",color:"#3a5a8a",marginTop:"6px"}},"Choose your split below")),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"16px"}},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>startWorkout(sp),style:S.splitSelBtn},sp))),
h("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",margin:"12px 0"}},h("span",{style:{fontSize:"10px",color:"#2a3a5a",fontFamily:"'DM Mono',monospace"}},"REST:"),h("button",{onClick:()=>{const v=Math.max(15,restDuration-15);setRestDuration(v);db.set("rc-rd",v)},style:S.tinyBtn},"-"),h("span",{style:{fontSize:"13px",color:"#4a8fff",fontFamily:"'DM Mono',monospace"}},restDuration+"s"),h("button",{onClick:()=>{const v=restDuration+15;setRestDuration(v);db.set("rc-rd",v)},style:S.tinyBtn},"+")),
h("div",{style:{fontSize:"9px",letterSpacing:"3px",color:"#1a2d5a",margin:"20px 0 10px"}},"RECENT WORKOUTS"),
sortedDates.length===0&&h("p",{style:{color:"#1a2d5a",fontSize:"13px",textAlign:"center",padding:"20px"}},"No workouts yet"),
sortedDates.slice(0,8).map(d=>{const day=workouts[d];return h("div",{key:d,className:"hov-btn",onClick:()=>{setCurDate(d);setView("calendar")},style:{...S.histRow,animation:"slideUp 0.3s ease"}},h("div",null,h("span",{style:{fontSize:"12px",color:"#6a7a9a",fontFamily:"'DM Mono',monospace"}},shortDate(d)),day.split&&h("span",{style:{color:"#4a8fff",fontSize:"10px",fontFamily:"'DM Mono',monospace",marginLeft:"8px"}},day.split)),h("div",{style:{display:"flex",gap:"10px"}},day.duration&&h("span",{style:{fontSize:"10px",color:"#1a3a5a",fontFamily:"'DM Mono',monospace"}},fmtDur(day.duration)),h("span",{style:{fontSize:"10px",color:"#1a3a5a",fontFamily:"'DM Mono',monospace"}},(day.exercises||[]).reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0)+" sets")))})),

// ===== ACTIVE WORKOUT =====
view==="workout"&&activeWorkout&&h("div",{style:S.content},
dayData?.split&&h("div",{style:{textAlign:"center",marginBottom:"12px"}},h("span",{style:S.badge},dayData.split.toUpperCase())),
h("div",{style:{display:"flex",gap:"6px",marginBottom:"14px"}},h("button",{onClick:finishWorkout,style:S.finBtn},IC.chk," FINISH"),h("button",{onClick:cancelWorkout,style:S.canBtn},IC.x," CANCEL")),
todayEx.map((ex,i)=>renderExCard(ex,i,wkDate())),
renderAddEx(),
!adding&&h("button",{onClick:()=>setAdding(true),style:S.primaryBtn},"+ ADD EXERCISE"),
h("div",{style:{marginTop:"14px"}},h("label",{style:S.fieldLbl},"WORKOUT NOTES"),h("textarea",{value:workoutNotes,onChange:e=>setWorkoutNotes(e.target.value),placeholder:"How did it feel?",rows:3,style:S.ta}))),

// ===== CALENDAR =====
view==="calendar"&&h("div",{style:S.content},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}},
h("button",{onClick:()=>{if(calMonth===0){setCalMonth(11);setCalYear(calYear-1)}else setCalMonth(calMonth-1)},style:S.tinyBtn},"\u2039"),
h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"14px",color:"#8a9aba",letterSpacing:"1px"}},calMonthName),
h("button",{onClick:()=>{if(calMonth===11){setCalMonth(0);setCalYear(calYear+1)}else setCalMonth(calMonth+1)},style:S.tinyBtn},"\u203A")),
h("div",{style:{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"16px"}},
["S","M","T","W","T","F","S"].map((d,i)=>h("div",{key:i,style:{textAlign:"center",fontSize:"10px",color:"#2a3a5a",fontFamily:"'DM Mono',monospace",padding:"4px"}},d)),
calDays().map((d,i)=>{if(!d)return h("div",{key:"e"+i});const ds=calDateStr(d);const hasWk=!!workouts[ds];const isToday=ds===today();const isSel=ds===curDate;
return h("div",{key:i,onClick:()=>{setCurDate(ds)},style:{textAlign:"center",padding:"8px 2px",borderRadius:"8px",fontSize:"13px",fontWeight:hasWk?600:400,color:isToday?"#000":hasWk?"#4a8fff":"#3a4a6a",background:isSel?"rgba(74,143,255,0.15)":isToday?"#4a8fff":hasWk?"rgba(74,143,255,0.06)":"transparent",cursor:"pointer",border:isSel?"1px solid #4a8fff":"1px solid transparent",transition:"all 0.15s"}},d)})),
// Selected date detail
workouts[curDate]?(()=>{const day=workouts[curDate];const exs=day.exercises||[];
return h("div",null,h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}},
h("div",null,h("span",{style:{fontSize:"14px",fontWeight:600,color:"#8a9aba"}},prettyDate(curDate)),day.split&&h("span",{style:{color:"#4a8fff",fontSize:"11px",fontFamily:"'DM Mono',monospace",marginLeft:"8px"}},day.split)),
day.duration&&h("span",{style:{fontSize:"11px",color:"#3a5a8a",fontFamily:"'DM Mono',monospace"}},fmtDur(day.duration))),
exs.map((ex,i)=>h("div",{key:i,style:S.card},h("div",{style:{display:"flex",justifyContent:"space-between",marginBottom:"6px"}},h("span",{style:{fontSize:"14px",fontWeight:600,color:"#8a9aba"}},ex.name),h("span",{style:{fontSize:"11px",color:"#3a5a8a",fontFamily:"'DM Mono',monospace"}},ex.sets.filter(s=>s.done).length+"/"+ex.sets.length+" sets")),ex.sets.filter(s=>s.done).map((s,si)=>h("div",{key:si,style:{fontSize:"12px",color:"#4a5a8a",fontFamily:"'DM Mono',monospace"}},"Set "+(si+1)+": "+s.weight+" lb \u00D7 "+s.reps+" reps")))),
day.notes&&h("div",{style:{...S.card,background:"#080d1a"}},h("p",{style:{fontSize:"12px",color:"#3a5a8a",fontStyle:"italic"}},day.notes)))})()
:h("p",{style:{color:"#1a2d5a",textAlign:"center",padding:"30px",fontSize:"13px"}},"No workout on "+prettyDate(curDate))),

// ===== STATS =====
view==="stats"&&h("div",{style:S.content},h("h2",{style:S.vTitle},"PERSONAL RECORDS"),
(()=>{const stats={};Object.entries(workouts).forEach(([date,day])=>{(day.exercises||[]).forEach((ex,i)=>{if(!stats[ex.name])stats[ex.name]={split:ex.split,records:[],photo:null};ex.sets.filter(s=>s.done&&s.weight&&s.reps).forEach(s=>{stats[ex.name].records.push({date,weight:parseFloat(s.weight),reps:parseInt(s.reps)})});const key=pk(date,i);if(photos[key]?.length)stats[ex.name].photo=photos[key].slice(-1)[0]})});
const entries=Object.entries(stats).filter(([,v])=>v.records.length>0);
if(!entries.length)return h("p",{style:{color:"#1a2d5a",textAlign:"center",padding:"40px"}},"Complete some sets to see stats");
const grouped={};entries.forEach(([n,d])=>{const sp=d.split||"Other";if(!grouped[sp])grouped[sp]=[];grouped[sp].push([n,d])});
return Object.entries(grouped).map(([sp,exs])=>h("div",{key:sp},h("h3",{style:S.grpTitle},sp),
exs.map(([n,d])=>{const mW=Math.max(...d.records.map(r=>r.weight));const mV=Math.max(...d.records.map(r=>r.weight*r.reps));const best=d.records.find(r=>r.weight*r.reps===mV);const avgV=Math.round(d.records.reduce((a,r)=>a+r.weight*r.reps,0)/d.records.length);
return h("div",{key:n,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"}},h("h3",{style:{fontSize:"15px",fontWeight:600,color:"#dde"}},n),d.photo&&h("div",{style:{...S.pThumb,width:"40px",height:"40px",borderRadius:"8px"},onClick:()=>setViewingPhoto({src:d.photo,name:n,key:"",photoIdx:-1})},h("img",{src:d.photo,alt:"",style:S.tImg}))),
h("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}},
h("div",{style:S.prItem},h("span",{style:S.prVal},mW,h("span",{style:S.prUnit},"lb")),h("span",{style:S.prLbl},"MAX")),
h("div",{style:S.prItem},h("span",{style:S.prVal},mV.toLocaleString()),h("span",{style:S.prLbl},"BEST VOL")),
h("div",{style:S.prItem},h("span",{style:S.prVal},avgV.toLocaleString()),h("span",{style:S.prLbl},"AVG VOL")),
h("div",{style:S.prItem},h("span",{style:S.prVal},best?best.weight+"\u00D7"+best.reps:"\u2014"),h("span",{style:S.prLbl},"BEST SET")),
h("div",{style:S.prItem},h("span",{style:S.prVal},d.records.length),h("span",{style:S.prLbl},"SETS")),
h("div",{style:S.prItem},h("span",{style:S.prVal},new Set(d.records.map(r=>r.date)).size),h("span",{style:S.prLbl},"SESSIONS"))))})))})()),

// ===== PROGRESS PICS =====
view==="progress"&&h("div",{style:S.content},h("h2",{style:S.vTitle},"PROGRESS PHOTOS"),
h("div",{style:S.card},h("p",{style:{fontSize:"13px",color:"#6a7a9a",marginBottom:"12px"}},"Take your progress pics for today"),
h("div",{style:{display:"flex",gap:"8px"}},["front","side","back"].map(t=>h("div",{key:t,style:{flex:1,textAlign:"center"}},
h("button",{onClick:()=>{setPpType(t);setTimeout(()=>ppInputRef.current?.click(),100)},className:"hov-btn",style:{...S.ppBtn,...(progressPics[today()]?.[t]?{border:"1px solid #4a8fff"}:{})}},
progressPics[today()]?.[t]?h("img",{src:progressPics[today()][t],alt:"",style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"8px"}}):h("span",{style:{color:"#2a3a5a",fontSize:"24px"}},IC.plus)),
h("p",{style:{fontSize:"10px",color:"#3a5a8a",fontFamily:"'DM Mono',monospace",marginTop:"6px",textTransform:"uppercase",letterSpacing:"1px"}},t))))),
ppDates.length>0&&h("div",{style:{marginTop:"16px"}},h("div",{style:{fontSize:"9px",letterSpacing:"3px",color:"#1a2d5a",marginBottom:"12px"}},"HISTORY"),
ppDates.map(d=>h("div",{key:d,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("p",{style:{fontSize:"12px",color:"#6a7a9a",fontFamily:"'DM Mono',monospace",marginBottom:"10px"}},prettyDate(d)),
h("div",{style:{display:"flex",gap:"8px"}},["front","side","back"].map(t=>progressPics[d]?.[t]?h("div",{key:t,style:{flex:1,cursor:"pointer"},onClick:()=>setViewingPhoto({src:progressPics[d][t],name:t+" - "+prettyDate(d),key:"",photoIdx:-1})},
h("img",{src:progressPics[d][t],alt:"",style:{width:"100%",height:"80px",objectFit:"cover",borderRadius:"8px",border:"1px solid #111828"}}),
h("p",{style:{fontSize:"9px",color:"#2a3a5a",textAlign:"center",marginTop:"4px",textTransform:"uppercase"}},t)):h("div",{key:t,style:{flex:1,height:"80px",background:"#080d1a",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:"#1a2d5a"}},"\u2014"))))))),

// ===== WEIGHT =====
view==="weight"&&h("div",{style:S.content},h("h2",{style:S.vTitle},"BODY WEIGHT"),
h("div",{style:S.card},h("label",{style:S.fieldLbl},"LOG TODAY'S WEIGHT"),
h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}},h("input",{type:"number",inputMode:"decimal",placeholder:"lbs",value:bwInput,onChange:e=>setBwInput(e.target.value),onKeyDown:e=>e.key==="Enter"&&logBW(),style:{...S.input2,textAlign:"center",maxWidth:"120px"}}),h("button",{onClick:logBW,style:S.addBtn},"Log"),
bwTrend()==="up"&&h("span",{style:{color:"#ff5555",display:"flex",alignItems:"center",gap:"4px",fontSize:"12px"}},IC.up," Up"),
bwTrend()==="dn"&&h("span",{style:{color:"#22cc66",display:"flex",alignItems:"center",gap:"4px",fontSize:"12px"}},IC.dn," Down"),
bwTrend()==="eq"&&h("span",{style:{color:"#4a5a8a",fontSize:"12px"}},"= Same")),
bodyWeights[today()]&&h("p",{style:{fontSize:"12px",color:"#3a5a8a",marginTop:"8px",fontFamily:"'DM Mono',monospace"}},"Today: "+bodyWeights[today()]+" lb")),
bwDates.length>=2&&h("div",{style:{...S.card,padding:"16px",position:"relative",height:"120px"}},
(()=>{const recent=bwDates.slice(0,14).reverse();const vals=recent.map(d=>bodyWeights[d]);const mn=Math.min(...vals);const mx=Math.max(...vals);const rng=mx-mn||1;const w=100/(recent.length-1||1);
return h("svg",{viewBox:"0 0 100 50",style:{width:"100%",height:"100%"},preserveAspectRatio:"none"},
h("polyline",{points:recent.map((d,i)=>(i*w)+","+(50-((vals[i]-mn)/rng)*45)).join(" "),fill:"none",stroke:"#4a8fff",strokeWidth:"1.5",strokeLinejoin:"round"}),
recent.map((d,i)=>h("circle",{key:i,cx:i*w,cy:50-((vals[i]-mn)/rng)*45,r:"1.5",fill:"#4a8fff"})))})()),
bwDates.length>0&&h("div",{style:{marginTop:"12px"}},bwDates.slice(0,20).map(d=>h("div",{key:d,style:{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #0d1220"}},h("span",{style:{fontSize:"12px",color:"#4a5a8a"}},prettyDate(d)),h("span",{style:{fontSize:"13px",fontWeight:600,color:"#e8e8e8",fontFamily:"'DM Mono',monospace"}},bodyWeights[d]+" lb"))))),

// ===== SPLITS =====
view==="splits"&&h("div",{style:S.content},h("h2",{style:S.vTitle},"MY SPLITS"),
!editingSplit?h("div",null,
splitNames.map(n=>h("div",{key:n,style:{...S.card,animation:"slideUp 0.3s ease"}},h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
h("div",{style:{cursor:"pointer",flex:1},onClick:()=>{setEditingSplit(n);setEditingExIdx(null);setAddingExToSplit(false)}},h("h3",{style:{fontSize:"14px",fontWeight:600,color:"#8a9aba"}},n),h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#2a3a5a"}},(splits[n]||[]).length+" exercises")),
h("div",{style:{display:"flex",gap:"4px"}},h("button",{onClick:()=>{setRenamingSplit(n);setRenameVal(n)},style:S.smBtn},"Rename"),h("button",{onClick:()=>delSplit(n),style:{...S.smBtn,color:"#ff5555"}},"Delete"))))),
h("div",{style:{...S.card,marginTop:"12px"}},h("h3",{style:S.mTitle},"ADD NEW SPLIT"),h("div",{style:{display:"flex",gap:"8px"}},h("input",{placeholder:"e.g. Push Day",value:newSplitName,onChange:e=>setNewSplitName(e.target.value),onKeyDown:e=>e.key==="Enter"&&addSplit(),style:S.input2}),h("button",{onClick:addSplit,style:S.addBtn,disabled:!newSplitName.trim()},IC.plus))),
h("button",{onClick:()=>{if(!confirm("Reset all splits to defaults?"))return;setSplits(dc(DEFAULT_SPLITS));svSplits(dc(DEFAULT_SPLITS));showToast("Reset")},style:S.dangerBtn},"RESET TO DEFAULTS"))
:h("div",null,h("button",{onClick:()=>{setEditingSplit(null);setEditingExIdx(null);setAddingExToSplit(false)},style:{...S.cancelBtn,marginBottom:"12px"}},"\u2190 All splits"),h("h3",{style:{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#4a8fff",letterSpacing:"2px",marginBottom:"12px"}},editingSplit),
(splits[editingSplit]||[]).map((ex,i)=>editingExIdx===i?
h("div",{key:i,style:{...S.card,borderColor:"#4a8fff"}},h("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}},
h("div",null,h("label",{style:S.fieldLbl},"NAME"),h("select",{value:editExData.name||"",onChange:e=>setEditExData({...editExData,name:e.target.value}),style:S.select},h("option",{value:""},"Select..."),ALL_EXERCISES.map(ex=>h("option",{key:ex,value:ex},ex)),editExData.name&&!ALL_EXERCISES.includes(editExData.name)&&h("option",{value:editExData.name},editExData.name))),
h("div",{style:{display:"flex",gap:"8px"}},h("div",{style:{flex:1}},h("label",{style:S.fieldLbl},"SETS"),h("input",{type:"number",value:editExData.defaultSets,onChange:e=>setEditExData({...editExData,defaultSets:e.target.value}),style:S.input2})),h("div",{style:{flex:1}},h("label",{style:S.fieldLbl},"NOTE"),h("input",{value:editExData.note||"",onChange:e=>setEditExData({...editExData,note:e.target.value}),style:S.input2}))),
h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setEditingExIdx(null),style:S.cancelFull},"Cancel"),h("button",{onClick:()=>saveEditEx(editingSplit,i),style:S.confirmBtn},"Save"))))
:h("div",{key:i,style:{...S.splitExRow,animation:"slideUp 0.2s ease"}},
h("div",{style:{display:"flex",gap:"3px",marginRight:"6px"}},h("button",{onClick:()=>moveExInSplit(editingSplit,i,-1),style:{...S.iconBtn,opacity:i===0?.25:1}},"\u2191"),h("button",{onClick:()=>moveExInSplit(editingSplit,i,1),style:{...S.iconBtn,opacity:i===(splits[editingSplit]||[]).length-1?.25:1}},"\u2193")),
h("div",{style:{flex:1,cursor:"pointer"},onClick:()=>{setEditingExIdx(i);setEditExData({...ex})}},h("span",{style:{fontSize:"13px",color:"#6a7a9a"}},ex.name),ex.note&&h("span",{style:{fontSize:"10px",color:"#2a3a5a",fontFamily:"'DM Mono',monospace",marginLeft:"6px"}},ex.note)),
h("button",{onClick:()=>delExFromSplit(editingSplit,i),style:{...S.iconBtn,color:"#ff5555"}},IC.x))),
!addingExToSplit?h("button",{onClick:()=>setAddingExToSplit(true),style:{...S.primaryBtn,marginTop:"10px"}},"+ ADD EXERCISE")
:h("div",{style:{...S.card,marginTop:"10px"}},h("h4",{style:S.mTitle},"NEW EXERCISE"),
h("div",{style:{display:"flex",flexDirection:"column",gap:"8px"}},
h("div",null,h("label",{style:S.fieldLbl},"NAME"),h("select",{value:newExName,onChange:e=>setNewExName(e.target.value),style:S.select},h("option",{value:""},"Select exercise..."),Object.entries(EXERCISE_LIB).map(([cat,exs])=>h("optgroup",{key:cat,label:cat},exs.map(e=>h("option",{key:e,value:e},e))))),h("input",{placeholder:"Or type custom...",value:newExName,onChange:e=>setNewExName(e.target.value),style:{...S.input2,marginTop:"6px"}})),
h("div",{style:{display:"flex",gap:"8px"}},h("div",{style:{flex:1}},h("label",{style:S.fieldLbl},"SETS"),h("input",{type:"number",value:newExSets,onChange:e=>setNewExSets(e.target.value),style:S.input2})),h("div",{style:{flex:1}},h("label",{style:S.fieldLbl},"NOTE"),h("input",{value:newExNote,onChange:e=>setNewExNote(e.target.value),placeholder:"optional",style:S.input2}))),
h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setAddingExToSplit(false),style:S.cancelFull},"Cancel"),h("button",{onClick:addExToSplit,style:S.confirmBtn,disabled:!newExName.trim()},"Add"))))))
)}

const S={
container:{minHeight:"100vh",background:"#0a0a0f",color:"#e8e8e8",fontFamily:"'Outfit',sans-serif",maxWidth:"480px",margin:"0 auto",padding:"0 0 100px 0",position:"relative"},
loadWrap:{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"},
toast:{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:"#0d1b3a",border:"1px solid #1a2d5a",color:"#4a8fff",padding:"10px 24px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"12px",zIndex:999,animation:"toast 2s ease forwards"},
overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(5,5,10,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"},
restOL:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(5,5,10,0.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:"20px"},
restCard:{background:"#0d1220",border:"1px solid #1a2d5a",borderRadius:"16px",padding:"32px",maxWidth:"300px",width:"100%",textAlign:"center"},
rBtn:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",color:"#4a8fff",padding:"10px 14px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer",flex:1,textAlign:"center"},
modal:{background:"#0d1220",border:"1px solid #1a2d5a",borderRadius:"16px",padding:"24px",maxWidth:"320px",width:"100%",display:"flex",flexDirection:"column",gap:"10px"},
mTitle:{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"3px",color:"#4a5a8a",marginBottom:"6px",textAlign:"center"},
mBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"10px",color:"#8a9aba",padding:"14px",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"10px",fontFamily:"'Outfit',sans-serif"},
header:{padding:"20px 16px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid #0d1220"},
logo:{fontSize:"24px",fontWeight:800,letterSpacing:"4px",color:"#e8e8e8",margin:0},
subtitle:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"3px",color:"#2a4a6a",marginTop:"2px"},
pill:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",padding:"5px 8px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:"44px"},
pillNum:{fontSize:"14px",fontWeight:700,color:"#4a8fff",fontFamily:"'DM Mono',monospace"},
pillLbl:{fontFamily:"'DM Mono',monospace",fontSize:"7px",letterSpacing:"1px",color:"#2a4a6a"},
nav:{display:"flex",padding:"8px 12px",gap:"3px",borderBottom:"1px solid #0d1220",overflowX:"auto"},
navBtn:{background:"transparent",border:"1px solid #0d1220",color:"#1a3a5a",padding:"8px 4px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"1px",cursor:"pointer",flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",minWidth:"52px",whiteSpace:"nowrap"},
navAct:{background:"#0d1b3a",border:"1px solid #1a2d5a",color:"#4a8fff"},
content:{padding:"14px 16px"},
startBox:{background:"linear-gradient(135deg,#0d2459,#1a3a7a)",border:"1px solid #2a4a9a",borderRadius:"14px",padding:"24px",textAlign:"center",marginBottom:"14px"},
splitSelBtn:{background:"#0d1220",border:"1px solid #111828",borderRadius:"10px",color:"#6a7a9a",padding:"12px 8px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s"},
tinyBtn:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"6px",color:"#4a8fff",width:"28px",height:"28px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
histRow:{background:"#0d1220",border:"1px solid #111828",borderRadius:"10px",padding:"10px 12px",marginBottom:"5px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"},
badge:{display:"inline-block",background:"rgba(74,143,255,0.08)",border:"1px solid rgba(74,143,255,0.2)",color:"#4a8fff",padding:"4px 16px",borderRadius:"14px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px"},
finBtn:{flex:1,background:"rgba(74,143,255,0.1)",border:"1px solid rgba(74,143,255,0.2)",borderRadius:"8px",padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#4a8fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"},
canBtn:{flex:1,background:"rgba(255,60,60,0.06)",border:"1px solid rgba(255,60,60,0.15)",borderRadius:"8px",padding:"10px",fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#ff5555",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"6px"},
card:{background:"#0d1220",border:"1px solid #111828",borderRadius:"12px",padding:"14px",marginBottom:"8px"},
exHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"},
splitTag:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#4a8fff",textTransform:"uppercase"},
noteTag:{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"#2a3a5a",background:"#111828",padding:"1px 5px",borderRadius:"3px"},
exName:{fontSize:"15px",fontWeight:600,marginTop:"2px",color:"#dde"},
lastSesh:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#2a4a6a",marginTop:"2px"},
exActions:{display:"flex",gap:"3px",alignItems:"center"},
iconBtn:{background:"transparent",border:"1px solid #111828",borderRadius:"4px",color:"#2a3a5a",fontSize:"11px",width:"24px",height:"24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0},
photoStrip:{display:"flex",gap:"6px",marginBottom:"10px",overflowX:"auto"},
pThumb:{width:"50px",height:"50px",borderRadius:"8px",overflow:"hidden",border:"1px solid #1a2540",cursor:"pointer",flexShrink:0},
tImg:{width:"100%",height:"100%",objectFit:"cover",display:"block"},
pAdd:{width:"50px",height:"50px",borderRadius:"8px",border:"1px dashed #1a2540",background:"transparent",color:"#1a2d5a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
setHdr:{display:"flex",padding:"0 4px 4px",borderBottom:"1px solid #111828",marginBottom:"2px"},
setCol:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#1a2d5a"},
setRow:{display:"flex",alignItems:"center",padding:"3px 4px",borderRadius:"5px"},
setDone:{background:"rgba(74,143,255,0.03)"},
setNum:{flex:"0 0 30px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#1a2d5a"},
inp:{flex:1,background:"#111828",border:"1px solid #1a2540",borderRadius:"6px",color:"#ccc",padding:"7px",fontSize:"13px",fontFamily:"'DM Mono',monospace",marginRight:"4px",textAlign:"center"},
setAct:{display:"flex",gap:"3px",flex:"0 0 64px",justifyContent:"flex-end"},
chkBtn:{background:"#111828",border:"1px solid #1a2d5a",borderRadius:"6px",width:"28px",height:"28px",color:"#1a2d5a",fontSize:"12px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0},
chkDone:{background:"#4a8fff",border:"1px solid #4a8fff",color:"#000"},
miniDel:{background:"transparent",border:"1px solid #111828",borderRadius:"6px",width:"24px",height:"28px",color:"#2a3a5a",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
addSetBtn:{background:"transparent",border:"1px dashed #1a2540",borderRadius:"6px",color:"#1a2d5a",padding:"6px",width:"100%",marginTop:"5px",fontFamily:"'DM Mono',monospace",fontSize:"10px",cursor:"pointer"},
exBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#6a7a9a",padding:"10px 12px",textAlign:"left",cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"},
input2:{flex:1,background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#ccc",padding:"10px 12px",fontSize:"13px",fontFamily:"'Outfit',sans-serif",width:"100%"},
select:{width:"100%",background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#ccc",padding:"10px 12px",fontSize:"13px",fontFamily:"'Outfit',sans-serif",paddingRight:"30px"},
addBtn:{background:"#4a8fff",border:"none",borderRadius:"8px",color:"#000",width:"44px",fontSize:"18px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
cancelBtn:{background:"transparent",border:"none",color:"#3a5a8a",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer",padding:"6px 0"},
cancelFull:{flex:1,background:"transparent",border:"1px solid #1a2540",borderRadius:"8px",color:"#4a5a8a",padding:"10px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"11px",textAlign:"center"},
confirmBtn:{flex:1,background:"#4a8fff",border:"none",borderRadius:"8px",color:"#000",padding:"10px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"11px",fontWeight:700,textAlign:"center"},
primaryBtn:{background:"linear-gradient(135deg,#1a3a7a,#0d2459)",border:"none",borderRadius:"10px",color:"#fff",padding:"14px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",cursor:"pointer",marginTop:"6px"},
dangerBtn:{background:"transparent",border:"1px solid #1a1020",borderRadius:"8px",color:"#442222",padding:"12px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px",cursor:"pointer",marginTop:"24px"},
vTitle:{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"4px",color:"#1a2d5a",marginBottom:"14px"},
grpTitle:{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"3px",color:"#4a8fff",marginBottom:"8px",marginTop:"14px",paddingBottom:"6px",borderBottom:"1px solid #111828"},
prItem:{background:"#080d1a",border:"1px solid #111828",borderRadius:"6px",padding:"8px",display:"flex",flexDirection:"column"},
prVal:{fontSize:"15px",fontWeight:700,color:"#e8e8e8"},
prUnit:{fontSize:"9px",color:"#2a4a6a",marginLeft:"2px"},
prLbl:{fontFamily:"'DM Mono',monospace",fontSize:"7px",letterSpacing:"1px",color:"#1a2d5a",marginTop:"2px"},
fieldLbl:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#2a4a6a",marginBottom:"5px",display:"block"},
ta:{width:"100%",background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#6a7a9a",padding:"10px",fontSize:"13px",fontFamily:"'Outfit',sans-serif",resize:"vertical",minHeight:"60px"},
smBtn:{background:"transparent",border:"1px solid #1a2540",borderRadius:"6px",color:"#3a5a8a",padding:"4px 8px",fontFamily:"'DM Mono',monospace",fontSize:"9px",cursor:"pointer"},
splitExRow:{background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",padding:"9px",marginBottom:"4px",display:"flex",alignItems:"center"},
ppBtn:{width:"100%",aspectRatio:"3/4",background:"#111828",border:"1px solid #1a2540",borderRadius:"10px",cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",padding:0},
};

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
