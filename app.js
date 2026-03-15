const{useState,useEffect,useCallback,useRef}=React;
const h=React.createElement;

const DEFAULT_SPLITS={
"Bis/Chest/Shoulders":[
{name:"Cable Curl",defaultSets:2,defaultWeight:"32.5",note:""},
{name:"Incline Bench",defaultSets:2,defaultWeight:"135",note:"3 plates \u00B7 8/6 reps"},
{name:"Cable Hammer",defaultSets:3,defaultWeight:"",note:"2-3 sets"},
{name:"Flat Chest Press Machine",defaultSets:2,defaultWeight:"",note:"or Chest Fly"},
{name:"Chest Fly",defaultSets:2,defaultWeight:"",note:"alt for Chest Press"},
{name:"Shoulder Lateral Raise",defaultSets:2,defaultWeight:"17.5",note:"machine"},
{name:"Machine Preacher",defaultSets:2,defaultWeight:"90",note:"8 reps"}],
"Tris/Back/Rear Delts":[
{name:"Tricep Pushdown",defaultSets:2,defaultWeight:"",note:""},
{name:"Overhead Tricep Extension",defaultSets:2,defaultWeight:"70",note:"bar"},
{name:"Lat Pulldown",defaultSets:2,defaultWeight:"150",note:"8 reps"},
{name:"Machine Row",defaultSets:2,defaultWeight:"130",note:"8 reps"},
{name:"Pec Deck Machine",defaultSets:2,defaultWeight:"100",note:""},
{name:"Pull Ups Finisher",defaultSets:2,defaultWeight:"",note:"optional"},
{name:"Tricep Rope",defaultSets:2,defaultWeight:"80",note:""}],
"Legs":[
{name:"Squat",defaultSets:3,defaultWeight:"",note:"or Leg Press"},
{name:"Leg Press",defaultSets:3,defaultWeight:"",note:"alt for Squat"},
{name:"Hamstring Curl",defaultSets:3,defaultWeight:"",note:""},
{name:"Quad Extension",defaultSets:3,defaultWeight:"",note:""},
{name:"Calf Raises",defaultSets:3,defaultWeight:"",note:""}],
"SARMS":[
{name:"DB Shoulder Press",defaultSets:2,defaultWeight:"",note:""},
{name:"DB Lateral Raise Drop Set",defaultSets:2,defaultWeight:"",note:"drop set"},
{name:"Rear Delts",defaultSets:2,defaultWeight:"",note:""},
{name:"Hammer Curl",defaultSets:2,defaultWeight:"",note:""},
{name:"Cable Curl",defaultSets:2,defaultWeight:"",note:""}]
};

const formatDate=d=>d.toISOString().split("T")[0];
const today=()=>formatDate(new Date());
const prettyDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})};
const fmtTime=s=>{const m=Math.floor(s/60);const sec=s%60;return m+":"+(sec<10?"0":"")+sec};
const fmtDuration=ms=>{const s=Math.floor(ms/1000);const m=Math.floor(s/60);const hr=Math.floor(m/60);if(hr>0)return hr+"h "+((m%60)<10?"0":"")+(m%60)+"m";return m+"m "+(s%60<10?"0":"")+(s%60)+"s"};
const compressImage=(file,max=600)=>new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");let w=img.width,ht=img.height;if(w>ht){if(w>max){ht=(ht*max)/w;w=max}}else{if(ht>max){w=(w*max)/ht;ht=max}}c.width=w;c.height=ht;c.getContext("2d").drawImage(img,0,0,w,ht);res(c.toDataURL("image/jpeg",0.7))};img.src=e.target.result};r.readAsDataURL(file)});
const db={get:k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.error(e)}},rm:k=>localStorage.removeItem(k)};
const deepClone=o=>JSON.parse(JSON.stringify(o));

function App(){
const[splits,setSplits]=useState(DEFAULT_SPLITS);
const[workouts,setWorkouts]=useState({});
const[photos,setPhotos]=useState({});
const[bodyWeights,setBodyWeights]=useState({});
const[selectedDate,setSelectedDate]=useState(today());
const[view,setView]=useState("home");
const[adding,setAdding]=useState(false);
const[selectedSplit,setSelectedSplit]=useState(null);
const[customExercise,setCustomExercise]=useState("");
const[loaded,setLoaded]=useState(false);
const[toast,setToast]=useState(null);
const[viewingPhoto,setViewingPhoto]=useState(null);
const[photoMenuIdx,setPhotoMenuIdx]=useState(null);
const[activeWorkout,setActiveWorkout]=useState(null); // {date, startTime}
const[elapsed,setElapsed]=useState(0);
const[restTimer,setRestTimer]=useState(null); // {end, duration}
const[restLeft,setRestLeft]=useState(0);
const[restDuration,setRestDuration]=useState(90);
const[workoutNotes,setWorkoutNotes]=useState("");
// Splits editor
const[editingSplit,setEditingSplit]=useState(null);
const[newSplitName,setNewSplitName]=useState("");
const[addingExToSplit,setAddingExToSplit]=useState(false);
const[newEx,setNewEx]=useState({name:"",defaultSets:2,defaultWeight:"",note:""});
const[editingExIdx,setEditingExIdx]=useState(null);
const[editExData,setEditExData]=useState({name:"",defaultSets:2,defaultWeight:"",note:""});
const[renamingSplit,setRenamingSplit]=useState(null);
const[renameValue,setRenameValue]=useState("");
// Body weight
const[bwInput,setBwInput]=useState("");
const fileInputRef=useRef(null);
const captureTargetRef=useRef(null);

// Load
useEffect(()=>{
const s=db.get("rc-splits");if(s)setSplits(s);
const w=db.get("rc-workouts");if(w)setWorkouts(w);
const p=db.get("rc-photos");if(p)setPhotos(p);
const bw=db.get("rc-bodyweight");if(bw)setBodyWeights(bw);
const aw=db.get("rc-active");if(aw){setActiveWorkout(aw);setView("workout")}
const rd=db.get("rc-restduration");if(rd)setRestDuration(rd);
setLoaded(true)
},[]);

// Workout duration timer
useEffect(()=>{
if(!activeWorkout)return;
const iv=setInterval(()=>setElapsed(Date.now()-activeWorkout.startTime),1000);
return()=>clearInterval(iv)
},[activeWorkout]);

// Rest timer
useEffect(()=>{
if(!restTimer)return;
const iv=setInterval(()=>{
const left=Math.max(0,Math.ceil((restTimer.end-Date.now())/1000));
setRestLeft(left);
if(left<=0){setRestTimer(null);
try{if(navigator.vibrate)navigator.vibrate([200,100,200])}catch(e){}}
},250);
return()=>clearInterval(iv)
},[restTimer]);

const saveSplits=useCallback(d=>{db.set("rc-splits",d)},[]);
const save=useCallback(d=>{db.set("rc-workouts",d)},[]);
const savePhotos=useCallback(d=>{db.set("rc-photos",d)},[]);
const saveBW=useCallback(d=>{db.set("rc-bodyweight",d)},[]);
const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2000)};
const photoKey=(date,idx)=>date+":"+idx;

// Get last session data for an exercise
const getLastSession=(exName,beforeDate)=>{
const dates=Object.keys(workouts).filter(d=>d<beforeDate).sort((a,b)=>b.localeCompare(a));
for(const d of dates){
const day=workouts[d];
const ex=(day.exercises||[]).find(e=>e.name===exName);
if(ex){const doneSets=ex.sets.filter(s=>s.done&&(s.weight||s.reps));
if(doneSets.length>0)return{date:d,sets:doneSets}}}
return null};

// Progressive overload check
const getOverloadStatus=(exName,currentSets,beforeDate)=>{
const last=getLastSession(exName,beforeDate);
if(!last)return null;
const lastMax=Math.max(...last.sets.map(s=>(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)));
const currentDone=currentSets.filter(s=>s.done&&(s.weight||s.reps));
if(currentDone.length===0)return null;
const curMax=Math.max(...currentDone.map(s=>(parseFloat(s.weight)||0)*(parseInt(s.reps)||0)));
if(curMax>lastMax)return"up";
if(curMax<lastMax)return"down";
return"same"};

// Photo handlers
const handlePhotoCapture=async(exIdx,file)=>{if(!file)return;try{showToast("Processing...");const comp=await compressImage(file);const key=photoKey(selectedDate,exIdx);const up={...photos};if(!up[key])up[key]=[];up[key].push(comp);if(up[key].length>3)up[key]=up[key].slice(-3);setPhotos(up);savePhotos(up);showToast("Photo saved!")}catch(e){showToast("Failed")}};
const removePhoto=(key,pIdx)=>{const up={...photos};if(up[key]){up[key].splice(pIdx,1);if(up[key].length===0)delete up[key];setPhotos(up);savePhotos(up);showToast("Removed")}setViewingPhoto(null)};
const triggerCamera=exIdx=>{captureTargetRef.current=exIdx;setPhotoMenuIdx(exIdx)};
const handleFileSelect=mode=>{const input=fileInputRef.current;if(!input)return;if(mode==="camera")input.setAttribute("capture","environment");else input.removeAttribute("capture");input.click();setPhotoMenuIdx(null)};
const onFileChange=async e=>{const file=e.target.files?.[0];if(file&&captureTargetRef.current!==null)await handlePhotoCapture(captureTargetRef.current,file);e.target.value=""};

// Start workout
const startWorkout=(splitName)=>{
const aw={date:today(),startTime:Date.now()};
setActiveWorkout(aw);db.set("rc-active",aw);
setSelectedDate(today());
const up={...workouts};
if(!up[today()])up[today()]={split:splitName,exercises:[],notes:""};
else up[today()].split=splitName;
(splits[splitName]||[]).forEach(preset=>{
const sets=[];for(let i=0;i<(preset.defaultSets||2);i++)sets.push({weight:preset.defaultWeight||"",reps:"",done:false});
up[today()].exercises.push({name:preset.name,split:splitName,note:preset.note||"",sets})});
setWorkouts(up);save(up);setWorkoutNotes("");setView("workout");showToast("Let's go!")};

// Finish workout
const finishWorkout=()=>{
const up={...workouts};
if(up[activeWorkout.date]){up[activeWorkout.date].endTime=Date.now();up[activeWorkout.date].duration=Date.now()-activeWorkout.startTime;up[activeWorkout.date].notes=workoutNotes}
setWorkouts(up);save(up);setActiveWorkout(null);db.rm("rc-active");setRestTimer(null);setView("home");showToast("Workout saved!")};

// Cancel workout
const cancelWorkout=()=>{if(!confirm("Cancel this workout? All data for today will be deleted."))return;
const up={...workouts};delete up[activeWorkout?.date||selectedDate];setWorkouts(up);save(up);
setActiveWorkout(null);db.rm("rc-active");setRestTimer(null);setView("home");showToast("Workout cancelled")};

const splitNames=Object.keys(splits);
const addExercise=preset=>{
const up={...workouts};const d=activeWorkout?.date||selectedDate;
if(!up[d])up[d]={split:selectedSplit,exercises:[],notes:""};
const sets=[];for(let i=0;i<(preset.defaultSets||2);i++)sets.push({weight:preset.defaultWeight||"",reps:"",done:false});
up[d].exercises.push({name:preset.name,split:selectedSplit||"Custom",note:preset.note||"",sets});
setWorkouts(up);save(up);setAdding(false);setSelectedSplit(null);setCustomExercise("");showToast("Added "+preset.name)};

const addSet=exIdx=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;const last=up[d].exercises[exIdx].sets.slice(-1)[0];up[d].exercises[exIdx].sets.push({weight:last?.weight||"",reps:last?.reps||"",done:false});setWorkouts(up);save(up)};
const removeSet=(exIdx,setIdx)=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;up[d].exercises[exIdx].sets.splice(setIdx,1);if(up[d].exercises[exIdx].sets.length===0)up[d].exercises.splice(exIdx,1);if(up[d].exercises.length===0)delete up[d];setWorkouts(up);save(up)};
const updateSet=(exIdx,setIdx,field,val)=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;up[d].exercises[exIdx].sets[setIdx][field]=val;setWorkouts(up);save(up)};
const toggleDone=(exIdx,setIdx)=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;const wasDone=up[d].exercises[exIdx].sets[setIdx].done;up[d].exercises[exIdx].sets[setIdx].done=!wasDone;setWorkouts(up);save(up);
if(!wasDone){setRestTimer({end:Date.now()+restDuration*1000,duration:restDuration});setRestLeft(restDuration)}};
const deleteExercise=exIdx=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;up[d].exercises.splice(exIdx,1);if(up[d].exercises.length===0)delete up[d];setWorkouts(up);save(up);const key=photoKey(d,exIdx);if(photos[key]){const p={...photos};delete p[key];setPhotos(p);savePhotos(p)}showToast("Removed")};
const moveExercise=(exIdx,dir)=>{const up={...workouts};const d=activeWorkout?.date||selectedDate;const arr=up[d].exercises;const ni=exIdx+dir;if(ni<0||ni>=arr.length)return;[arr[exIdx],arr[ni]]=[arr[ni],arr[exIdx]];const p={...photos};const kA=photoKey(d,exIdx);const kB=photoKey(d,ni);const tA=p[kA];const tB=p[kB];if(tA)p[kB]=tA;else delete p[kB];if(tB)p[kA]=tB;else delete p[kA];setPhotos(p);savePhotos(p);setWorkouts(up);save(up)};

// Splits editor
const handleAddSplit=()=>{if(!newSplitName.trim())return;const name=newSplitName.trim();if(splits[name]){showToast("Already exists");return}const up={...splits};up[name]=[];setSplits(up);saveSplits(up);setNewSplitName("");showToast("Created");setEditingSplit(name)};
const handleDeleteSplit=name=>{if(!confirm("Delete '"+name+"'?"))return;const up={...splits};delete up[name];setSplits(up);saveSplits(up);if(editingSplit===name)setEditingSplit(null);showToast("Deleted")};
const handleRenameSplit=()=>{if(!renameValue.trim()||!renamingSplit)return;const up={...splits};const ex=up[renamingSplit];delete up[renamingSplit];up[renameValue.trim()]=ex;setSplits(up);saveSplits(up);if(editingSplit===renamingSplit)setEditingSplit(renameValue.trim());setRenamingSplit(null);setRenameValue("");showToast("Renamed")};
const handleAddExToSplit=()=>{if(!newEx.name.trim()||!editingSplit)return;const up=deepClone(splits);up[editingSplit].push({...newEx,name:newEx.name.trim(),defaultSets:parseInt(newEx.defaultSets)||2});setSplits(up);saveSplits(up);setNewEx({name:"",defaultSets:2,defaultWeight:"",note:""});setAddingExToSplit(false);showToast("Added")};
const handleDeleteExFromSplit=(sn,idx)=>{const up=deepClone(splits);up[sn].splice(idx,1);setSplits(up);saveSplits(up)};
const handleMoveExInSplit=(sn,idx,dir)=>{const up=deepClone(splits);const arr=up[sn];const ni=idx+dir;if(ni<0||ni>=arr.length)return;[arr[idx],arr[ni]]=[arr[ni],arr[idx]];setSplits(up);saveSplits(up)};
const handleSaveEditEx=(sn,idx)=>{if(!editExData.name.trim())return;const up=deepClone(splits);up[sn][idx]={...editExData,name:editExData.name.trim(),defaultSets:parseInt(editExData.defaultSets)||2};setSplits(up);saveSplits(up);setEditingExIdx(null);showToast("Updated")};

// Body weight
const saveBWEntry=()=>{if(!bwInput.trim())return;const up={...bodyWeights};up[today()]=parseFloat(bwInput);setBodyWeights(up);saveBW(up);setBwInput("");showToast("Weight logged")};
const bwDates=Object.keys(bodyWeights).sort((a,b)=>b.localeCompare(a));

const curDate=activeWorkout?.date||selectedDate;
const dayData=workouts[curDate];
const todayEx=dayData?.exercises||[];
const todaySplit=dayData?.split||null;
const totalSets=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
const totalVol=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),0);
const sortedDates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));
const getStats=()=>{const stats={};Object.entries(workouts).forEach(([date,day])=>{(day.exercises||[]).forEach((ex,exIdx)=>{if(!stats[ex.name])stats[ex.name]={split:ex.split,records:[],latestPhoto:null};ex.sets.filter(s=>s.done&&s.weight&&s.reps).forEach(s=>{stats[ex.name].records.push({date,weight:parseFloat(s.weight),reps:parseInt(s.reps)})});const pk=photoKey(date,exIdx);if(photos[pk]?.length>0)stats[ex.name].latestPhoto=photos[pk][photos[pk].length-1]})});return stats};

if(!loaded)return h("div",{style:S.loadingWrap},h("div",{style:S.loadingPulse},"\u25C6"),h("p",{style:{color:"#4a5a8a",fontFamily:"'DM Mono',monospace",letterSpacing:"3px",fontSize:"12px"}},"LOADING"));

return h("div",{style:S.container},
h("input",{ref:fileInputRef,type:"file",accept:"image/*",onChange:onFileChange,style:{display:"none"}}),
toast&&h("div",{style:S.toast},toast),

// Rest Timer Overlay
restTimer&&restLeft>0&&h("div",{style:S.restOverlay},
h("div",{style:S.restCard},
h("p",{style:{fontSize:"11px",letterSpacing:"3px",color:"#4a5a8a",marginBottom:"12px"}},"REST TIMER"),
h("p",{style:{fontSize:"48px",fontWeight:700,color:"#4a8fff",fontFamily:"'DM Mono',monospace",animation:"timerPulse 2s infinite"}},fmtTime(restLeft)),
h("div",{style:{width:"100%",height:"4px",background:"#111828",borderRadius:"2px",marginTop:"16px",overflow:"hidden"}},
h("div",{style:{width:(restLeft/restTimer.duration*100)+"%",height:"100%",background:"#4a8fff",borderRadius:"2px",transition:"width 0.3s"}})),
h("div",{style:{display:"flex",gap:"8px",marginTop:"16px"}},
h("button",{onClick:()=>{setRestTimer({end:Date.now()+(restLeft+15)*1000,duration:restTimer.duration+15});setRestLeft(restLeft+15)},style:S.restBtn},"+15s"),
h("button",{onClick:()=>{setRestTimer({end:Date.now()+(restLeft-15)*1000,duration:restTimer.duration-15});setRestLeft(Math.max(0,restLeft-15))},style:S.restBtn},"-15s"),
h("button",{onClick:()=>setRestTimer(null),style:{...S.restBtn,color:"#ff5555",borderColor:"#331111"}},"Skip")))),

// Photo lightbox
viewingPhoto&&h("div",{style:S.overlay,onClick:()=>setViewingPhoto(null)},h("div",{style:{maxWidth:"400px",width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"},onClick:e=>e.stopPropagation()},h("img",{src:viewingPhoto.src,alt:"",style:S.lightboxImg}),h("div",{style:{display:"flex",gap:"10px",alignItems:"center",width:"100%"}},h("span",{style:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#4a5a8a"}},viewingPhoto.name),viewingPhoto.photoIdx>=0&&h("button",{onClick:()=>removePhoto(viewingPhoto.key,viewingPhoto.photoIdx),style:{background:"#1a1020",border:"1px solid #2a1535",borderRadius:"8px",color:"#ff5555",padding:"10px 16px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer"}},"DELETE"),h("button",{onClick:()=>setViewingPhoto(null),style:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",color:"#8aa",padding:"10px 16px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer"}},"CLOSE")))),

// Photo menu
photoMenuIdx!==null&&h("div",{style:S.overlay,onClick:()=>setPhotoMenuIdx(null)},h("div",{style:S.modal,onClick:e=>e.stopPropagation()},h("h3",{style:S.modalTitle},"ADD PHOTO"),h("button",{onClick:()=>handleFileSelect("camera"),className:"hov-btn",style:S.modalBtn},"\uD83D\uDCF7 Take Photo"),h("button",{onClick:()=>handleFileSelect("gallery"),className:"hov-btn",style:S.modalBtn},"\uD83D\uDDBC Choose from Gallery"),h("button",{onClick:()=>setPhotoMenuIdx(null),style:S.cancelBtn},"Cancel"))),

// Rename modal
renamingSplit&&h("div",{style:S.overlay,onClick:()=>setRenamingSplit(null)},h("div",{style:S.modal,onClick:e=>e.stopPropagation()},h("h3",{style:S.modalTitle},"RENAME SPLIT"),h("input",{value:renameValue,onChange:e=>setRenameValue(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleRenameSplit(),placeholder:"New name...",style:{...S.input2,marginBottom:"12px"}}),h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setRenamingSplit(null),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:handleRenameSplit,style:S.confirmBtn},"Rename")))),

// HEADER
h("div",{style:S.header},h("div",null,h("h1",{style:S.logo},"RECOMP"),h("p",{style:S.subtitle},"ABSOLUTE FITNESS")),
activeWorkout?h("div",{style:{display:"flex",gap:"8px",alignItems:"center"}},
h("div",{style:S.timerPill},h("span",{style:{fontSize:"14px",fontWeight:700,color:"#4a8fff",fontFamily:"'DM Mono',monospace"}},fmtDuration(elapsed)),h("span",{style:{fontSize:"7px",letterSpacing:"2px",color:"#3a5a8a"}},"DURATION")),
h("div",{style:S.statPill},h("span",{style:S.statNum},totalSets),h("span",{style:S.statLabel},"SETS")),
h("div",{style:S.statPill},h("span",{style:S.statNum},totalVol>999?(totalVol/1000).toFixed(1)+"k":totalVol),h("span",{style:S.statLabel},"VOL")))
:h("div",{style:S.statPill},h("span",{style:S.statNum},sortedDates.length),h("span",{style:S.statLabel},"WORKOUTS"))),

// NAV
h("div",{style:S.nav},["home","stats","weight","splits"].map(v=>
h("button",{key:v,onClick:()=>{if(activeWorkout&&v==="home"){setView("workout");return}setView(v);setEditingSplit(null)},
style:{...S.navBtn,...((view===v||(view==="workout"&&v==="home"))?S.navBtnActive:{})}},
(v==="home"?"\u25C6":v==="stats"?"\u25B3":v==="weight"?"\u2696":"\u2699")+" "+v.toUpperCase()))),

// ===== HOME VIEW =====
view==="home"&&!activeWorkout&&h("div",{style:S.content},
h("div",{style:{textAlign:"center",marginBottom:"20px"}},h("p",{style:{fontSize:"12px",color:"#4a5a8a",letterSpacing:"1px",fontFamily:"'DM Mono',monospace"}},prettyDate(today()).toUpperCase())),

h("div",{style:S.startBtn,onClick:()=>{}},h("div",{style:{fontSize:"28px",marginBottom:"8px",color:"#4a8fff"}},"\u25C6"),h("p",{style:{fontSize:"16px",fontWeight:700,letterSpacing:"3px",color:"#e8e8e8"}},"START WORKOUT"),h("p",{style:{fontSize:"11px",color:"#3a5a8a",marginTop:"8px"}},"Choose your split")),

h("div",{style:S.splitSelectGrid},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>startWorkout(sp),style:S.splitSelectBtn},sp))),

// Rest duration setting
h("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",margin:"16px 0"}},
h("span",{style:{fontSize:"11px",color:"#3a4a6a",fontFamily:"'DM Mono',monospace"}},"REST TIMER:"),
h("button",{onClick:()=>{const v=Math.max(15,restDuration-15);setRestDuration(v);db.set("rc-restduration",v)},style:S.tinyBtn},"-"),
h("span",{style:{fontSize:"14px",color:"#4a8fff",fontFamily:"'DM Mono',monospace",minWidth:"40px",textAlign:"center"}},restDuration+"s"),
h("button",{onClick:()=>{const v=restDuration+15;setRestDuration(v);db.set("rc-restduration",v)},style:S.tinyBtn},"+")),

h("div",{style:{fontSize:"9px",letterSpacing:"3px",color:"#2a3a5a",margin:"24px 0 12px"}},"RECENT WORKOUTS"),
sortedDates.length===0&&h("p",{style:{color:"#2a3a5a",fontSize:"13px",textAlign:"center",padding:"20px"}},"No workouts yet. Start your first one above!"),
sortedDates.slice(0,8).map(date=>{const day=workouts[date];const exs=day.exercises||[];
return h("div",{key:date,className:"hov-btn",onClick:()=>{setSelectedDate(date);setView("history")},style:{...S.histItem,animation:"slideUp 0.3s ease"}},
h("div",null,h("span",{style:S.histDate},prettyDate(date)),day.split&&h("span",{style:S.histSplit}," "+day.split)),
h("div",{style:{display:"flex",gap:"12px"}},
day.duration&&h("span",{style:S.histMeta},fmtDuration(day.duration)),
h("span",{style:S.histMeta},exs.length+" ex"),
h("span",{style:S.histMeta},exs.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0)+" sets")))})),

// ===== WORKOUT VIEW (active) =====
view==="workout"&&activeWorkout&&h("div",{style:S.content},
todaySplit&&h("div",{style:S.splitBadgeWrap},h("div",{style:S.splitBadge},todaySplit.toUpperCase())),

// Edit / Cancel / Finish bar
h("div",{style:{display:"flex",gap:"6px",marginBottom:"16px"}},
h("button",{onClick:finishWorkout,style:S.finishBtn},"\u2713 FINISH"),
h("button",{onClick:cancelWorkout,style:S.cancelWorkoutBtn},"\u2715 CANCEL")),

todayEx.map((ex,exIdx)=>{const pk=photoKey(curDate,exIdx);const exPhotos=photos[pk]||[];
const lastSesh=getLastSession(ex.name,curDate);
const overload=getOverloadStatus(ex.name,ex.sets,curDate);
return h("div",{key:exIdx,style:{...S.exCard,animation:"slideUp 0.3s ease"}},
h("div",{style:S.exHeader},h("div",{style:{flex:1}},
h("div",{style:S.exTopRow},h("span",{style:S.splitTag},ex.split),ex.note&&h("span",{style:S.noteTag},ex.note),
overload==="up"&&h("span",{style:{color:"#22cc66",fontSize:"13px",marginLeft:"4px"}},"\u25B2"),
overload==="down"&&h("span",{style:{color:"#ff5555",fontSize:"13px",marginLeft:"4px"}},"\u25BC"),
overload==="same"&&h("span",{style:{color:"#4a5a8a",fontSize:"11px",marginLeft:"4px"}},"=")),
h("h3",{style:S.exName},ex.name),
lastSesh&&h("div",{style:S.lastSession},"Last: "+lastSesh.sets.map(s=>s.weight+"\u00D7"+s.reps).join(", "))),
h("div",{style:S.exActions},
h("button",{onClick:()=>triggerCamera(exIdx),style:S.camBtn},"\uD83D\uDCF7"),
h("button",{onClick:()=>moveExercise(exIdx,-1),style:{...S.moveBtn,opacity:exIdx===0?.25:1}},"\u2191"),
h("button",{onClick:()=>moveExercise(exIdx,1),style:{...S.moveBtn,opacity:exIdx===todayEx.length-1?.25:1}},"\u2193"),
h("button",{onClick:()=>deleteExercise(exIdx),style:S.deleteBtn},"\u2715"))),
exPhotos.length>0&&h("div",{style:S.photoStrip},exPhotos.map((src,pIdx)=>h("div",{key:pIdx,className:"photo-thumb",style:S.photoThumb,onClick:()=>setViewingPhoto({src,key:pk,photoIdx:pIdx,name:ex.name})},h("img",{src,alt:"",style:S.thumbImg}))),exPhotos.length<3&&h("button",{onClick:()=>triggerCamera(exIdx),style:S.photoAddBtn},"+")),
h("div",{style:S.setHeader},h("span",{style:{...S.setCol,flex:"0 0 32px"}},"SET"),h("span",{style:S.setCol},"WEIGHT"),h("span",{style:S.setCol},"REPS"),h("span",{style:{...S.setCol,flex:"0 0 68px"}})),
ex.sets.map((set,si)=>h("div",{key:si,style:{...S.setRow,...(set.done?S.setDone:{})}},
h("span",{style:S.setNum},si+1),
h("input",{type:"number",inputMode:"decimal",placeholder:"0",value:set.weight,onChange:e=>updateSet(exIdx,si,"weight",e.target.value),style:S.inp}),
h("input",{type:"number",inputMode:"numeric",placeholder:"0",value:set.reps,onChange:e=>updateSet(exIdx,si,"reps",e.target.value),style:S.inp}),
h("div",{style:S.setActions},h("button",{onClick:()=>toggleDone(exIdx,si),style:{...S.checkBtn,...(set.done?S.checkDone:{})}},set.done?"\u2713":"\u25CB"),
ex.sets.length>1&&h("button",{onClick:()=>removeSet(exIdx,si),style:S.miniDel},"\u2212")))),
h("button",{onClick:()=>addSet(exIdx),style:S.addSetBtn},"+ Add Set"))}),

// Add exercise
adding&&!selectedSplit&&h("div",{style:{...S.card,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.modalTitle},"SELECT SPLIT"),h("div",{style:S.splitGrid},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>setSelectedSplit(sp),style:S.splitBtn},sp))),h("button",{onClick:()=>{setAdding(false);setSelectedSplit(null)},style:S.cancelBtn},"Cancel")),
adding&&selectedSplit&&h("div",{style:{...S.card,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.modalTitle},selectedSplit.toUpperCase()),h("div",{style:{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"16px"}},(splits[selectedSplit]||[]).map((ex,i)=>h("button",{key:i,className:"hov-btn",onClick:()=>addExercise(ex),style:S.exBtn},h("span",{style:{fontSize:"14px",fontWeight:500}},ex.name),h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#3a5a8a"}},ex.defaultSets+"s"+(ex.defaultWeight?" \u00B7 "+ex.defaultWeight+"lb":"")+(ex.note?" \u00B7 "+ex.note:""))))),h("div",{style:{display:"flex",gap:"8px",marginBottom:"12px"}},h("input",{placeholder:"Custom exercise...",value:customExercise,onChange:e=>setCustomExercise(e.target.value),onKeyDown:e=>{if(e.key==="Enter"&&customExercise.trim())addExercise({name:customExercise.trim(),defaultSets:2,defaultWeight:""})},style:S.input2}),h("button",{onClick:()=>customExercise.trim()&&addExercise({name:customExercise.trim(),defaultSets:2,defaultWeight:""}),style:S.addBtn,disabled:!customExercise.trim()},"+")),h("button",{onClick:()=>setSelectedSplit(null),style:S.cancelBtn},"\u2190 Back")),

!adding&&h("button",{onClick:()=>setAdding(true),style:S.primaryBtn},"+ ADD EXERCISE"),

// Workout Notes
h("div",{style:{marginTop:"16px"}},h("label",{style:S.fieldLabel},"WORKOUT NOTES"),h("textarea",{value:workoutNotes,onChange:e=>setWorkoutNotes(e.target.value),placeholder:"How did it feel? Any notes...",rows:3,style:S.textarea}))),

// ===== HISTORY VIEW =====
view==="history"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"WORKOUT HISTORY"),
sortedDates.length===0&&h("p",{style:{color:"#2a3a5a",textAlign:"center",padding:"40px"}},"No workouts yet"),
sortedDates.map(date=>{const day=workouts[date];const exs=day.exercises||[];
return h("div",{key:date,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}},
h("div",{style:{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}},h("span",{style:S.histDate},prettyDate(date)),day.split&&h("span",{style:S.histSplit},day.split),date===today()&&h("span",{style:S.todayBadge},"TODAY")),
day.duration&&h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#3a5a8a"}},fmtDuration(day.duration))),
h("div",{style:{display:"flex",flexDirection:"column",gap:"4px",marginBottom:"10px"}},exs.map((ex,i)=>h("div",{key:i,style:{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #0d1220"}},h("span",{style:{fontSize:"13px",color:"#8a9aba"}},ex.name),h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#3a5a8a"}},ex.sets.filter(x=>x.done).length+"/"+ex.sets.length+" sets"+(ex.sets.some(x=>x.weight)?" \u00B7 "+Math.max(...ex.sets.filter(x=>x.weight).map(x=>parseFloat(x.weight)||0))+"lb":""))))),
day.notes&&h("div",{style:{background:"#080d1a",borderRadius:"6px",padding:"8px 10px",marginBottom:"8px"}},h("p",{style:{fontSize:"12px",color:"#4a5a8a",fontStyle:"italic"}},day.notes)),
h("div",{style:{display:"flex",justifyContent:"space-between",fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#1a2d5a"}},h("span",null,exs.length+" exercises"),h("span",null,exs.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0)+" sets")))})),

// ===== STATS VIEW =====
view==="stats"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"PERSONAL RECORDS"),
(()=>{const stats=getStats();const entries=Object.entries(stats).filter(([,v])=>v.records.length>0);
if(entries.length===0)return h("p",{style:{color:"#2a3a5a",textAlign:"center",padding:"40px"}},"Complete some sets to see stats");
const grouped={};entries.forEach(([name,data])=>{const sp=data.split||"Other";if(!grouped[sp])grouped[sp]=[];grouped[sp].push([name,data])});
return Object.entries(grouped).map(([split,exs])=>h("div",{key:split},h("h3",{style:S.statsGroupTitle},split),
exs.map(([name,data])=>{const mW=Math.max(...data.records.map(r=>r.weight));const mV=Math.max(...data.records.map(r=>r.weight*r.reps));const best=data.records.find(r=>r.weight*r.reps===mV);
return h("div",{key:name,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}},h("h3",{style:S.statExName},name),data.latestPhoto&&h("div",{style:{...S.photoThumb,width:"44px",height:"44px",borderRadius:"8px",flexShrink:0},onClick:()=>setViewingPhoto({src:data.latestPhoto,name,key:"",photoIdx:-1})},h("img",{src:data.latestPhoto,alt:"",style:S.thumbImg}))),
h("div",{style:S.prGrid},
h("div",{style:S.prItem},h("span",{style:S.prValue},mW,h("span",{style:S.prUnit},"lb")),h("span",{style:S.prLabel},"MAX WEIGHT")),
h("div",{style:S.prItem},h("span",{style:S.prValue},mV.toLocaleString(),h("span",{style:S.prUnit},"lb")),h("span",{style:S.prLabel},"BEST VOL")),
h("div",{style:S.prItem},h("span",{style:S.prValue},data.records.length),h("span",{style:S.prLabel},"SETS")),
h("div",{style:S.prItem},h("span",{style:S.prValue},best?best.weight+"\u00D7"+best.reps:"\u2014"),h("span",{style:S.prLabel},"BEST SET"))))})))})()),

// ===== WEIGHT VIEW =====
view==="weight"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"BODY WEIGHT"),
h("div",{style:S.card},h("label",{style:S.fieldLabel},"LOG TODAY'S WEIGHT"),
h("div",{style:{display:"flex",gap:"8px"}},h("input",{type:"number",inputMode:"decimal",placeholder:"lbs",value:bwInput,onChange:e=>setBwInput(e.target.value),onKeyDown:e=>e.key==="Enter"&&saveBWEntry(),style:{...S.input2,textAlign:"center"}}),h("button",{onClick:saveBWEntry,style:S.addBtn},"Log")),
bodyWeights[today()]&&h("p",{style:{fontSize:"12px",color:"#3a5a8a",marginTop:"8px",fontFamily:"'DM Mono',monospace"}},"Today: "+bodyWeights[today()]+" lb")),

// Weight history
bwDates.length>0&&h("div",{style:{marginTop:"16px"}},h("div",{style:{fontSize:"9px",letterSpacing:"3px",color:"#2a3a5a",marginBottom:"12px"}},"HISTORY"),
// Mini chart
bwDates.length>=2&&h("div",{style:{background:"#0d1220",borderRadius:"10px",padding:"16px",marginBottom:"16px",position:"relative",height:"120px"}},
(()=>{const recent=bwDates.slice(0,14).reverse();const vals=recent.map(d=>bodyWeights[d]);const min=Math.min(...vals);const max=Math.max(...vals);const range=max-min||1;const w=100/(recent.length-1||1);
return h("svg",{viewBox:"0 0 100 50",style:{width:"100%",height:"100%"},preserveAspectRatio:"none"},
h("polyline",{points:recent.map((d,i)=>(i*w)+","+(50-((vals[i]-min)/range)*45)).join(" "),fill:"none",stroke:"#4a8fff",strokeWidth:"1.5",strokeLinejoin:"round"}),
recent.map((d,i)=>h("circle",{key:i,cx:i*w,cy:50-((vals[i]-min)/range)*45,r:"1.5",fill:"#4a8fff"})))})()),

bwDates.slice(0,20).map(d=>h("div",{key:d,style:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #0d1220"}},
h("span",{style:{fontSize:"13px",color:"#6a7a9a"}},prettyDate(d)),
h("span",{style:{fontSize:"14px",fontWeight:600,color:"#e8e8e8",fontFamily:"'DM Mono',monospace"}},bodyWeights[d]+" lb"))))),

// ===== SPLITS VIEW =====
view==="splits"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"MY SPLITS"),h("p",{style:{color:"#2a3a5a",fontSize:"12px",marginBottom:"20px",fontFamily:"'DM Mono',monospace"}},"Customize your workout splits"),
!editingSplit?h("div",null,
splitNames.map(name=>h("div",{key:name,style:{...S.card,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
h("div",{style:{cursor:"pointer",flex:1},onClick:()=>{setEditingSplit(name);setEditingExIdx(null);setAddingExToSplit(false)}},h("h3",{style:{fontSize:"15px",fontWeight:600,color:"#e0e0e0"}},name),h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#3a5a8a"}},(splits[name]||[]).length+" exercises")),
h("div",{style:{display:"flex",gap:"6px"}},h("button",{onClick:()=>{setRenamingSplit(name);setRenameValue(name)},style:S.smallBtn},"Rename"),h("button",{onClick:()=>handleDeleteSplit(name),style:{...S.smallBtn,color:"#ff5555",borderColor:"#1a1020"}},"Delete"))))),
h("div",{style:{...S.card,marginTop:"16px"}},h("h3",{style:S.modalTitle},"ADD NEW SPLIT"),h("div",{style:{display:"flex",gap:"8px"}},h("input",{placeholder:"e.g. Push Day",value:newSplitName,onChange:e=>setNewSplitName(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleAddSplit(),style:S.input2}),h("button",{onClick:handleAddSplit,style:S.addBtn,disabled:!newSplitName.trim()},"+"))),
h("button",{onClick:()=>{if(!confirm("Reset to defaults?"))return;setSplits(deepClone(DEFAULT_SPLITS));saveSplits(deepClone(DEFAULT_SPLITS));showToast("Reset")},style:S.dangerBtn},"RESET TO DEFAULTS"))

:h("div",null,
h("button",{onClick:()=>{setEditingSplit(null);setEditingExIdx(null);setAddingExToSplit(false)},style:{...S.cancelBtn,marginBottom:"16px"}},"\u2190 All splits"),
h("h3",{style:{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#4a8fff",letterSpacing:"2px",marginBottom:"16px"}},editingSplit.toUpperCase()),
(splits[editingSplit]||[]).map((ex,idx)=>
editingExIdx===idx?h("div",{key:idx,style:{...S.card,borderColor:"#4a8fff",animation:"fadeIn 0.2s ease"}},
h("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.fieldLabel},"NAME"),h("input",{value:editExData.name,onChange:e=>setEditExData({...editExData,name:e.target.value}),style:S.input2})),
h("div",{style:{display:"flex",gap:"8px"}},h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"SETS"),h("input",{type:"number",value:editExData.defaultSets,onChange:e=>setEditExData({...editExData,defaultSets:e.target.value}),style:S.input2})),h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"WEIGHT"),h("input",{value:editExData.defaultWeight,onChange:e=>setEditExData({...editExData,defaultWeight:e.target.value}),style:S.input2}))),
h("div",null,h("label",{style:S.fieldLabel},"NOTE"),h("input",{value:editExData.note,onChange:e=>setEditExData({...editExData,note:e.target.value}),placeholder:"optional",style:S.input2})),
h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setEditingExIdx(null),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:()=>handleSaveEditEx(editingSplit,idx),style:S.confirmBtn},"Save"))))
:h("div",{key:idx,style:{...S.splitExRow,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",gap:"4px",marginRight:"8px"}},h("button",{onClick:()=>handleMoveExInSplit(editingSplit,idx,-1),style:{...S.moveBtn,opacity:idx===0?.25:1}},"\u2191"),h("button",{onClick:()=>handleMoveExInSplit(editingSplit,idx,1),style:{...S.moveBtn,opacity:idx===(splits[editingSplit]||[]).length-1?.25:1}},"\u2193")),
h("div",{style:{flex:1,cursor:"pointer"},onClick:()=>{setEditingExIdx(idx);setEditExData({...ex})}},h("span",{style:{fontSize:"13px",color:"#8a9aba"}},ex.name),h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#3a4a6a",marginLeft:"6px"}},ex.defaultSets+"s"+(ex.defaultWeight?" \u00B7 "+ex.defaultWeight+"lb":"")+(ex.note?" \u00B7 "+ex.note:""))),
h("button",{onClick:()=>handleDeleteExFromSplit(editingSplit,idx),style:{...S.deleteBtn,color:"#ff5555"}},"\u00D7"))),

!addingExToSplit?h("button",{onClick:()=>setAddingExToSplit(true),style:{...S.primaryBtn,marginTop:"12px"}},"+  ADD EXERCISE")
:h("div",{style:{...S.card,borderColor:"#1a2d5a",marginTop:"12px",animation:"fadeIn 0.2s ease"}},h("h4",{style:S.modalTitle},"NEW EXERCISE"),
h("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.fieldLabel},"NAME"),h("input",{value:newEx.name,onChange:e=>setNewEx({...newEx,name:e.target.value}),placeholder:"e.g. Bench Press",style:S.input2})),
h("div",{style:{display:"flex",gap:"8px"}},h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"SETS"),h("input",{type:"number",value:newEx.defaultSets,onChange:e=>setNewEx({...newEx,defaultSets:e.target.value}),style:S.input2})),h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"WEIGHT (lb)"),h("input",{value:newEx.defaultWeight,onChange:e=>setNewEx({...newEx,defaultWeight:e.target.value}),style:S.input2}))),
h("div",null,h("label",{style:S.fieldLabel},"NOTE"),h("input",{value:newEx.note,onChange:e=>setNewEx({...newEx,note:e.target.value}),placeholder:"optional",style:S.input2})),
h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setAddingExToSplit(false),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:handleAddExToSplit,style:S.confirmBtn,disabled:!newEx.name.trim()},"Add"))))))
)}

// === STYLES ===
const S={
container:{minHeight:"100vh",background:"#0a0a0f",color:"#e8e8e8",fontFamily:"'Outfit',sans-serif",maxWidth:"480px",margin:"0 auto",padding:"0 0 100px 0",position:"relative"},
loadingWrap:{minHeight:"100vh",background:"#0a0a0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"},
loadingPulse:{fontSize:"32px",color:"#4a8fff",animation:"pulseGlow 1.5s infinite"},
toast:{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:"#0d1b3a",border:"1px solid #1a2d5a",color:"#4a8fff",padding:"10px 24px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"12px",letterSpacing:"1px",zIndex:999,animation:"toast 2s ease forwards"},
overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(5,5,10,0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px",animation:"fadeIn 0.2s ease"},
restOverlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(5,5,10,0.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:"20px"},
restCard:{background:"#0d1220",border:"1px solid #1a2d5a",borderRadius:"16px",padding:"32px",maxWidth:"300px",width:"100%",textAlign:"center"},
restBtn:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",color:"#4a8fff",padding:"10px 16px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer",flex:1},
modal:{background:"#0d1220",border:"1px solid #1a2d5a",borderRadius:"16px",padding:"24px",maxWidth:"320px",width:"100%",display:"flex",flexDirection:"column",gap:"10px",animation:"photoIn 0.2s ease"},
modalTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",color:"#4a5a8a",marginBottom:"8px",textAlign:"center"},
modalBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"10px",color:"#8a9aba",padding:"16px",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s"},
lightboxImg:{width:"100%",maxHeight:"60vh",objectFit:"contain",borderRadius:"12px",border:"1px solid #1a2d5a",animation:"photoIn 0.3s ease"},
photoStrip:{display:"flex",gap:"8px",marginBottom:"12px",overflowX:"auto",paddingBottom:"4px"},
photoThumb:{width:"56px",height:"56px",borderRadius:"10px",overflow:"hidden",border:"2px solid #1a2540",cursor:"pointer",flexShrink:0,opacity:.9},
thumbImg:{width:"100%",height:"100%",objectFit:"cover",display:"block"},
photoAddBtn:{width:"56px",height:"56px",borderRadius:"10px",border:"2px dashed #1a2540",background:"transparent",color:"#2a3a5a",fontSize:"22px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
camBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"6px",width:"28px",height:"28px",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
header:{padding:"24px 20px 14px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid #0d1220"},
logo:{fontSize:"26px",fontWeight:800,letterSpacing:"4px",color:"#e8e8e8",margin:0},
subtitle:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"3px",color:"#3a5a8a",marginTop:"3px"},
statPill:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",padding:"6px 10px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:"48px"},
timerPill:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"8px",padding:"6px 10px",display:"flex",flexDirection:"column",alignItems:"center",animation:"timerPulse 3s infinite"},
statNum:{fontSize:"16px",fontWeight:700,color:"#4a8fff"},
statLabel:{fontFamily:"'DM Mono',monospace",fontSize:"7px",letterSpacing:"2px",color:"#3a5a8a",marginTop:"1px"},
headerStats:{display:"flex",gap:"8px"},
nav:{display:"flex",padding:"10px 20px",gap:"5px",borderBottom:"1px solid #0d1220"},
navBtn:{flex:1,background:"transparent",border:"1px solid #0d1220",color:"#2a3a5a",padding:"9px 2px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"1px",cursor:"pointer",transition:"all 0.2s"},
navBtnActive:{background:"#0d1b3a",border:"1px solid #1a2d5a",color:"#4a8fff"},
content:{padding:"16px 20px"},
startBtn:{background:"linear-gradient(135deg,#0d2459,#1a3a7a)",border:"1px solid #2a4a9a",borderRadius:"14px",padding:"28px 20px",textAlign:"center",marginBottom:"16px",cursor:"pointer"},
splitSelectGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"},
splitSelectBtn:{background:"#0d1220",border:"1px solid #1a2040",borderRadius:"10px",color:"#8a9aba",padding:"14px 10px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s"},
tinyBtn:{background:"#0d1b3a",border:"1px solid #1a2d5a",borderRadius:"6px",color:"#4a8fff",width:"28px",height:"28px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
histItem:{background:"#0d1220",border:"1px solid #111828",borderRadius:"10px",padding:"12px",marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",transition:"all 0.15s"},
histDate:{fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#6a7a9a",letterSpacing:"1px"},
histSplit:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#4a8fff",letterSpacing:"1px"},
histMeta:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#2a3a5a"},
splitBadgeWrap:{textAlign:"center",marginBottom:"14px"},
splitBadge:{display:"inline-block",background:"rgba(74,143,255,0.08)",border:"1px solid rgba(74,143,255,0.2)",color:"#4a8fff",padding:"5px 18px",borderRadius:"16px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"2px"},
finishBtn:{flex:1,background:"rgba(74,143,255,0.1)",border:"1px solid rgba(74,143,255,0.2)",borderRadius:"8px",padding:"10px",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",color:"#4a8fff",cursor:"pointer"},
cancelWorkoutBtn:{flex:1,background:"rgba(255,60,60,0.06)",border:"1px solid rgba(255,60,60,0.15)",borderRadius:"8px",padding:"10px",textAlign:"center",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",color:"#ff5555",cursor:"pointer"},
exCard:{background:"#0d1220",border:"1px solid #111828",borderRadius:"12px",padding:"14px",marginBottom:"10px",transition:"border-color 0.2s"},
exHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"10px"},
exTopRow:{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"},
splitTag:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#4a8fff",textTransform:"uppercase"},
noteTag:{fontFamily:"'DM Mono',monospace",fontSize:"8px",color:"#3a4a6a",background:"#111828",padding:"2px 5px",borderRadius:"3px"},
exName:{fontSize:"16px",fontWeight:600,marginTop:"3px",color:"#dde"},
lastSession:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#2a4a6a",marginTop:"3px"},
exActions:{display:"flex",gap:"3px",alignItems:"center"},
moveBtn:{background:"transparent",border:"1px solid #111828",borderRadius:"4px",color:"#2a3a5a",fontSize:"11px",width:"22px",height:"22px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
deleteBtn:{background:"transparent",border:"none",color:"#2a3a5a",fontSize:"13px",cursor:"pointer",padding:"3px 5px"},
setHeader:{display:"flex",alignItems:"center",padding:"0 4px 5px",borderBottom:"1px solid #111828",marginBottom:"3px"},
setCol:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#2a3a5a"},
setRow:{display:"flex",alignItems:"center",padding:"4px 4px",borderRadius:"5px",transition:"background 0.2s"},
setDone:{background:"rgba(74,143,255,0.04)"},
setNum:{flex:"0 0 32px",fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#2a3a5a",fontWeight:500},
inp:{flex:1,background:"#111828",border:"1px solid #1a2540",borderRadius:"6px",color:"#ccc",padding:"7px",fontSize:"14px",fontFamily:"'DM Mono',monospace",marginRight:"5px",textAlign:"center",transition:"border-color 0.2s"},
setActions:{display:"flex",gap:"4px",flex:"0 0 68px",justifyContent:"flex-end"},
checkBtn:{background:"#111828",border:"1px solid #1a2d5a",borderRadius:"6px",width:"30px",height:"30px",color:"#2a3a5a",fontSize:"13px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
checkDone:{background:"#4a8fff",border:"1px solid #4a8fff",color:"#000",fontWeight:700},
miniDel:{background:"transparent",border:"1px solid #111828",borderRadius:"6px",width:"26px",height:"30px",color:"#2a3a5a",fontSize:"15px",cursor:"pointer"},
addSetBtn:{background:"transparent",border:"1px dashed #1a2540",borderRadius:"6px",color:"#2a3a5a",padding:"7px",width:"100%",marginTop:"6px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",cursor:"pointer"},
card:{background:"#0d1220",border:"1px solid #111828",borderRadius:"12px",padding:"16px",marginBottom:"10px"},
splitGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"},
splitBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#8a9aba",padding:"12px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"'Outfit',sans-serif"},
exBtn:{background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#8a9aba",padding:"11px 12px",textAlign:"left",cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"},
input2:{flex:1,background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#ccc",padding:"11px 12px",fontSize:"14px",fontFamily:"'Outfit',sans-serif",width:"100%"},
addBtn:{background:"#4a8fff",border:"none",borderRadius:"8px",color:"#000",width:"48px",fontSize:"20px",fontWeight:700,cursor:"pointer",flexShrink:0},
cancelBtn:{background:"transparent",border:"none",color:"#3a5a8a",fontFamily:"'DM Mono',monospace",fontSize:"12px",letterSpacing:"1px",cursor:"pointer",padding:"8px 0"},
cancelBtnFull:{flex:1,background:"transparent",border:"1px solid #1a2540",borderRadius:"8px",color:"#5a6a8a",padding:"11px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"12px",textAlign:"center"},
confirmBtn:{flex:1,background:"#4a8fff",border:"none",borderRadius:"8px",color:"#000",padding:"11px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:700,textAlign:"center"},
primaryBtn:{background:"linear-gradient(135deg,#1a3a7a,#0d2459)",border:"none",borderRadius:"10px",color:"#fff",padding:"14px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:500,letterSpacing:"3px",cursor:"pointer",marginTop:"6px"},
dangerBtn:{background:"transparent",border:"1px solid #1a1020",borderRadius:"8px",color:"#553333",padding:"12px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"2px",cursor:"pointer",marginTop:"30px"},
viewTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"4px",color:"#2a3a5a",marginBottom:"16px"},
todayBadge:{background:"#4a8fff",color:"#000",fontSize:"8px",fontWeight:700,letterSpacing:"2px",padding:"2px 7px",borderRadius:"4px",fontFamily:"'DM Mono',monospace"},
statsGroupTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",color:"#4a8fff",marginBottom:"10px",marginTop:"16px",paddingBottom:"6px",borderBottom:"1px solid #111828"},
statExName:{fontSize:"15px",fontWeight:600,color:"#dde",marginBottom:"10px"},
prGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"},
prItem:{background:"#080d1a",border:"1px solid #111828",borderRadius:"8px",padding:"9px",display:"flex",flexDirection:"column"},
prValue:{fontSize:"17px",fontWeight:700,color:"#e8e8e8"},
prUnit:{fontSize:"10px",color:"#3a5a8a",marginLeft:"2px"},
prLabel:{fontFamily:"'DM Mono',monospace",fontSize:"7px",letterSpacing:"2px",color:"#2a3a5a",marginTop:"2px"},
fieldLabel:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"#3a5a8a",marginBottom:"6px",display:"block"},
textarea:{width:"100%",background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",color:"#8a9aba",padding:"10px 12px",fontSize:"13px",fontFamily:"'Outfit',sans-serif",resize:"vertical",minHeight:"60px"},
smallBtn:{background:"transparent",border:"1px solid #1a2540",borderRadius:"6px",color:"#5a6a8a",padding:"5px 10px",fontFamily:"'DM Mono',monospace",fontSize:"9px",cursor:"pointer"},
splitExRow:{background:"#111828",border:"1px solid #1a2540",borderRadius:"8px",padding:"10px",marginBottom:"5px",display:"flex",alignItems:"center"},
};

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
