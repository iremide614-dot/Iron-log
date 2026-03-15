const{useState,useEffect,useCallback,useRef}=React;
const h=React.createElement;

// Default splits (user's original)
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

// Helpers
const formatDate=d=>d.toISOString().split("T")[0];
const today=()=>formatDate(new Date());
const prettyDate=ds=>{const[y,m,d]=ds.split("-");return new Date(y,m-1,d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})};
const compressImage=(file,max=600)=>new Promise(res=>{const r=new FileReader();r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas");let w=img.width,ht=img.height;if(w>ht){if(w>max){ht=(ht*max)/w;w=max}}else{if(ht>max){w=(w*max)/ht;ht=max}}c.width=w;c.height=ht;c.getContext("2d").drawImage(img,0,0,w,ht);res(c.toDataURL("image/jpeg",0.7))};img.src=e.target.result};r.readAsDataURL(file)});
const db={get:k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.error(e)}},rm:k=>localStorage.removeItem(k)};
const deepClone=o=>JSON.parse(JSON.stringify(o));

function App(){
const[splits,setSplits]=useState(DEFAULT_SPLITS);
const[workouts,setWorkouts]=useState({});
const[photos,setPhotos]=useState({});
const[selectedDate,setSelectedDate]=useState(today());
const[view,setView]=useState("log");
const[adding,setAdding]=useState(false);
const[selectedSplit,setSelectedSplit]=useState(null);
const[customExercise,setCustomExercise]=useState("");
const[loaded,setLoaded]=useState(false);
const[toast,setToast]=useState(null);
const[viewingPhoto,setViewingPhoto]=useState(null);
const[photoMenuIdx,setPhotoMenuIdx]=useState(null);
// Splits editor state
const[editingSplit,setEditingSplit]=useState(null);
const[newSplitName,setNewSplitName]=useState("");
const[addingExToSplit,setAddingExToSplit]=useState(false);
const[newEx,setNewEx]=useState({name:"",defaultSets:2,defaultWeight:"",note:""});
const[renamingSplit,setRenamingSplit]=useState(null);
const[renameValue,setRenameValue]=useState("");
const[editingExIdx,setEditingExIdx]=useState(null);
const[editExData,setEditExData]=useState({name:"",defaultSets:2,defaultWeight:"",note:""});

const fileInputRef=useRef(null);
const captureTargetRef=useRef(null);

useEffect(()=>{
const s=db.get("ironlog-splits");if(s)setSplits(s);
const w=db.get("ironlog-workouts");if(w)setWorkouts(w);
const p=db.get("ironlog-photos");if(p)setPhotos(p);
setLoaded(true);
},[]);

const saveSplits=useCallback(d=>{db.set("ironlog-splits",d)},[]);
const save=useCallback(d=>{db.set("ironlog-workouts",d)},[]);
const savePhotos=useCallback(d=>{db.set("ironlog-photos",d)},[]);
const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2000)};
const photoKey=(date,idx)=>date+":"+idx;

// Photo handlers
const handlePhotoCapture=async(exIdx,file)=>{
if(!file)return;try{showToast("Processing...");
const comp=await compressImage(file);const key=photoKey(selectedDate,exIdx);
const up={...photos};if(!up[key])up[key]=[];up[key].push(comp);
if(up[key].length>3)up[key]=up[key].slice(-3);
setPhotos(up);savePhotos(up);showToast("Photo saved!")}catch(e){showToast("Failed")}};
const removePhoto=(key,pIdx)=>{const up={...photos};if(up[key]){up[key].splice(pIdx,1);if(up[key].length===0)delete up[key];setPhotos(up);savePhotos(up);showToast("Photo removed")}setViewingPhoto(null)};
const triggerCamera=exIdx=>{captureTargetRef.current=exIdx;setPhotoMenuIdx(exIdx)};
const handleFileSelect=mode=>{const input=fileInputRef.current;if(!input)return;if(mode==="camera")input.setAttribute("capture","environment");else input.removeAttribute("capture");input.click();setPhotoMenuIdx(null)};
const onFileChange=async e=>{const file=e.target.files?.[0];if(file&&captureTargetRef.current!==null)await handlePhotoCapture(captureTargetRef.current,file);e.target.value=""};

// Workout handlers
const splitNames=Object.keys(splits);
const addExercise=preset=>{
const up={...workouts};if(!up[selectedDate])up[selectedDate]={split:selectedSplit,exercises:[]};
const sets=[];for(let i=0;i<(preset.defaultSets||2);i++)sets.push({weight:preset.defaultWeight||"",reps:"",done:false});
up[selectedDate].exercises.push({name:preset.name,split:selectedSplit,note:preset.note||"",sets});
setWorkouts(up);save(up);setAdding(false);setSelectedSplit(null);setCustomExercise("");showToast("Added "+preset.name)};

const quickLoadSplit=splitName=>{
const up={...workouts};if(!up[selectedDate])up[selectedDate]={split:splitName,exercises:[]};else up[selectedDate].split=splitName;
(splits[splitName]||[]).forEach(preset=>{
const sets=[];for(let i=0;i<(preset.defaultSets||2);i++)sets.push({weight:preset.defaultWeight||"",reps:"",done:false});
up[selectedDate].exercises.push({name:preset.name,split:splitName,note:preset.note||"",sets})});
setWorkouts(up);save(up);setAdding(false);showToast("Loaded "+splitName)};

const addSet=exIdx=>{const up={...workouts};const last=up[selectedDate].exercises[exIdx].sets.slice(-1)[0];up[selectedDate].exercises[exIdx].sets.push({weight:last?.weight||"",reps:last?.reps||"",done:false});setWorkouts(up);save(up)};
const removeSet=(exIdx,setIdx)=>{const up={...workouts};up[selectedDate].exercises[exIdx].sets.splice(setIdx,1);if(up[selectedDate].exercises[exIdx].sets.length===0)up[selectedDate].exercises.splice(exIdx,1);if(up[selectedDate].exercises.length===0)delete up[selectedDate];setWorkouts(up);save(up)};
const updateSet=(exIdx,setIdx,field,val)=>{const up={...workouts};up[selectedDate].exercises[exIdx].sets[setIdx][field]=val;setWorkouts(up);save(up)};
const toggleDone=(exIdx,setIdx)=>{const up={...workouts};up[selectedDate].exercises[exIdx].sets[setIdx].done=!up[selectedDate].exercises[exIdx].sets[setIdx].done;setWorkouts(up);save(up)};
const deleteExercise=exIdx=>{const up={...workouts};up[selectedDate].exercises.splice(exIdx,1);if(up[selectedDate].exercises.length===0)delete up[selectedDate];setWorkouts(up);save(up);const key=photoKey(selectedDate,exIdx);if(photos[key]){const p={...photos};delete p[key];setPhotos(p);savePhotos(p)}showToast("Removed")};
const moveExercise=(exIdx,dir)=>{const up={...workouts};const arr=up[selectedDate].exercises;const ni=exIdx+dir;if(ni<0||ni>=arr.length)return;[arr[exIdx],arr[ni]]=[arr[ni],arr[exIdx]];const p={...photos};const kA=photoKey(selectedDate,exIdx);const kB=photoKey(selectedDate,ni);const tA=p[kA];const tB=p[kB];if(tA)p[kB]=tA;else delete p[kB];if(tB)p[kA]=tB;else delete p[kA];setPhotos(p);savePhotos(p);setWorkouts(up);save(up)};

// Splits editor handlers
const handleAddSplit=()=>{if(!newSplitName.trim())return;const name=newSplitName.trim();if(splits[name]){showToast("Split already exists");return}
const up={...splits};up[name]=[];setSplits(up);saveSplits(up);setNewSplitName("");showToast("Created "+name);setEditingSplit(name)};
const handleDeleteSplit=name=>{if(!confirm("Delete '"+name+"' split?"))return;const up={...splits};delete up[name];setSplits(up);saveSplits(up);if(editingSplit===name)setEditingSplit(null);showToast("Deleted")};
const handleRenameSplit=()=>{if(!renameValue.trim()||!renamingSplit)return;const up={...splits};const exercises=up[renamingSplit];delete up[renamingSplit];up[renameValue.trim()]=exercises;setSplits(up);saveSplits(up);if(editingSplit===renamingSplit)setEditingSplit(renameValue.trim());setRenamingSplit(null);setRenameValue("");showToast("Renamed")};
const handleAddExToSplit=()=>{if(!newEx.name.trim()||!editingSplit)return;const up=deepClone(splits);up[editingSplit].push({...newEx,name:newEx.name.trim(),defaultSets:parseInt(newEx.defaultSets)||2});setSplits(up);saveSplits(up);setNewEx({name:"",defaultSets:2,defaultWeight:"",note:""});setAddingExToSplit(false);showToast("Added")};
const handleDeleteExFromSplit=(splitName,idx)=>{const up=deepClone(splits);up[splitName].splice(idx,1);setSplits(up);saveSplits(up);showToast("Removed")};
const handleMoveExInSplit=(splitName,idx,dir)=>{const up=deepClone(splits);const arr=up[splitName];const ni=idx+dir;if(ni<0||ni>=arr.length)return;[arr[idx],arr[ni]]=[arr[ni],arr[idx]];setSplits(up);saveSplits(up)};
const handleStartEditEx=(splitName,idx)=>{setEditingExIdx(idx);setEditExData({...splits[splitName][idx]})};
const handleSaveEditEx=(splitName,idx)=>{if(!editExData.name.trim())return;const up=deepClone(splits);up[splitName][idx]={...editExData,name:editExData.name.trim(),defaultSets:parseInt(editExData.defaultSets)||2};setSplits(up);saveSplits(up);setEditingExIdx(null);showToast("Updated")};
const handleResetSplits=()=>{if(!confirm("Reset all splits to defaults? Your workout history stays."))return;setSplits(deepClone(DEFAULT_SPLITS));saveSplits(deepClone(DEFAULT_SPLITS));setEditingSplit(null);showToast("Reset to defaults")};

const dayData=workouts[selectedDate];
const todayEx=dayData?.exercises||[];
const todaySplit=dayData?.split||null;
const totalSets=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0);
const totalVol=todayEx.reduce((a,e)=>a+e.sets.filter(s=>s.done).reduce((b,s)=>b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),0);
const sortedDates=Object.keys(workouts).sort((a,b)=>b.localeCompare(a));

const getStats=()=>{const stats={};Object.entries(workouts).forEach(([date,day])=>{(day.exercises||[]).forEach((ex,exIdx)=>{if(!stats[ex.name])stats[ex.name]={split:ex.split,records:[],latestPhoto:null};ex.sets.filter(s=>s.done&&s.weight&&s.reps).forEach(s=>{stats[ex.name].records.push({date,weight:parseFloat(s.weight),reps:parseInt(s.reps)})});const pk=photoKey(date,exIdx);if(photos[pk]?.length>0)stats[ex.name].latestPhoto=photos[pk][photos[pk].length-1]})});return stats};
const navDate=dir=>{const d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()+dir);setSelectedDate(formatDate(d))};

if(!loaded)return h("div",{style:S.loadingWrap},h("div",{style:S.loadingPulse},"\u25C6"),h("p",{style:{color:"#8a8a8a",fontFamily:"'DM Mono',monospace",letterSpacing:"3px",fontSize:"12px"}},"LOADING"));

return h("div",{style:S.container},
h("input",{ref:fileInputRef,type:"file",accept:"image/*",onChange:onFileChange,style:{display:"none"}}),
toast&&h("div",{style:S.toast},toast),

// Photo lightbox
viewingPhoto&&h("div",{style:S.overlay,onClick:()=>setViewingPhoto(null)},h("div",{style:S.lightboxInner,onClick:e=>e.stopPropagation()},h("img",{src:viewingPhoto.src,alt:"",style:S.lightboxImg}),h("div",{style:S.lightboxActions},h("span",{style:S.lightboxLabel},viewingPhoto.name),viewingPhoto.photoIdx>=0&&h("button",{onClick:()=>removePhoto(viewingPhoto.key,viewingPhoto.photoIdx),style:S.lightboxDelete},"DELETE"),h("button",{onClick:()=>setViewingPhoto(null),style:S.lightboxClose},"CLOSE")))),

// Photo source menu
photoMenuIdx!==null&&h("div",{style:S.overlay,onClick:()=>setPhotoMenuIdx(null)},h("div",{style:S.photoMenu,onClick:e=>e.stopPropagation()},h("h3",{style:S.menuTitle},"ADD PHOTO"),h("button",{onClick:()=>handleFileSelect("camera"),className:"hov-btn",style:S.menuBtn},h("span",{style:{fontSize:"20px"}},"\uD83D\uDCF7")," Take Photo"),h("button",{onClick:()=>handleFileSelect("gallery"),className:"hov-btn",style:S.menuBtn},h("span",{style:{fontSize:"20px"}},"\uD83D\uDDBC")," Choose from Gallery"),h("button",{onClick:()=>setPhotoMenuIdx(null),style:S.cancelBtn},"Cancel"))),

// Rename modal
renamingSplit&&h("div",{style:S.overlay,onClick:()=>setRenamingSplit(null)},h("div",{style:S.modalCard,onClick:e=>e.stopPropagation()},h("h3",{style:S.menuTitle},"RENAME SPLIT"),h("input",{value:renameValue,onChange:e=>setRenameValue(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleRenameSplit(),placeholder:"New name...",style:{...S.customInput,marginBottom:"12px"}}),h("div",{style:{display:"flex",gap:"8px"}},h("button",{onClick:()=>setRenamingSplit(null),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:handleRenameSplit,style:S.confirmYes},"Rename")))),

// HEADER
h("div",{style:S.header},h("div",null,h("h1",{style:S.logo},"IRON",h("span",{style:{color:"#ff4d4d"}},"LOG")),h("p",{style:S.subtitle},"TRACK \u00B7 PUSH \u00B7 GROW")),h("div",{style:S.headerStats},h("div",{style:S.statPill},h("span",{style:S.statNum},totalSets),h("span",{style:S.statLabel},"SETS")),h("div",{style:S.statPill},h("span",{style:S.statNum},totalVol.toLocaleString()),h("span",{style:S.statLabel},"VOL")))),

// NAV
h("div",{style:S.nav},["log","history","stats","splits"].map(v=>h("button",{key:v,onClick:()=>{setView(v);if(v!=="splits"){setEditingSplit(null);setAddingExToSplit(false);setEditingExIdx(null)}},style:{...S.navBtn,...(view===v?S.navBtnActive:{})}},
(v==="log"?"\u25C6":v==="history"?"\u2261":v==="stats"?"\u25B3":"\u2699")+" "+v.toUpperCase()))),

// Date selector
view==="log"&&h("div",{style:S.dateNav},h("button",{onClick:()=>navDate(-1),style:S.dateArrow},"\u2039"),h("div",{style:S.dateCenter},h("span",{style:S.dateText},prettyDate(selectedDate)),selectedDate===today()&&h("span",{style:S.todayBadge},"TODAY")),h("button",{onClick:()=>navDate(1),style:S.dateArrow},"\u203A")),
view==="log"&&todaySplit&&h("div",{style:S.splitBadgeWrap},h("div",{style:S.splitBadge},todaySplit.toUpperCase())),

// ===== LOG VIEW =====
view==="log"&&h("div",{style:S.content},
todayEx.length===0&&!adding&&h("div",{style:S.emptyState},h("div",{style:S.emptyIcon},"\u25C7"),h("p",{style:S.emptyText},"No exercises yet"),h("p",{style:S.emptySubtext},"Quick-load a split or add individually"),
h("div",{style:S.quickLoadWrap},h("p",{style:S.quickLoadLabel},"QUICK LOAD SPLIT"),h("div",{style:S.quickLoadGrid},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>quickLoadSplit(sp),style:S.quickLoadBtn},sp)))),
h("button",{onClick:()=>setAdding(true),style:{...S.addExBtn,marginTop:"16px"}},"+  ADD SINGLE EXERCISE")),

todayEx.map((ex,exIdx)=>{const pk=photoKey(selectedDate,exIdx);const exPhotos=photos[pk]||[];
return h("div",{key:exIdx,style:{...S.exCard,animation:"slideUp 0.3s ease"}},
h("div",{style:S.exHeader},h("div",{style:{flex:1}},h("div",{style:S.exTopRow},h("span",{style:S.splitTag},ex.split),ex.note&&h("span",{style:S.noteTag},ex.note)),h("h3",{style:S.exName},ex.name)),
h("div",{style:S.exActions},h("button",{onClick:()=>triggerCamera(exIdx),style:S.camBtn},"\uD83D\uDCF7"),h("button",{onClick:()=>moveExercise(exIdx,-1),style:{...S.moveBtn,opacity:exIdx===0?.25:1}},"\u2191"),h("button",{onClick:()=>moveExercise(exIdx,1),style:{...S.moveBtn,opacity:exIdx===todayEx.length-1?.25:1}},"\u2193"),h("button",{onClick:()=>deleteExercise(exIdx),style:S.deleteBtn},"\u2715"))),
exPhotos.length>0&&h("div",{style:S.photoStrip},exPhotos.map((src,pIdx)=>h("div",{key:pIdx,className:"photo-thumb",style:S.photoThumb,onClick:()=>setViewingPhoto({src,key:pk,photoIdx:pIdx,name:ex.name})},h("img",{src,alt:"",style:S.thumbImg}))),exPhotos.length<3&&h("button",{onClick:()=>triggerCamera(exIdx),style:S.photoAddBtn},"+")),
h("div",{style:S.setHeader},h("span",{style:{...S.setCol,flex:"0 0 36px"}},"SET"),h("span",{style:S.setCol},"WEIGHT"),h("span",{style:S.setCol},"REPS"),h("span",{style:{...S.setCol,flex:"0 0 68px"}})),
ex.sets.map((set,si)=>h("div",{key:si,style:{...S.setRow,...(set.done?S.setDone:{})}},h("span",{style:S.setNum},si+1),h("input",{type:"number",inputMode:"decimal",placeholder:"0",value:set.weight,onChange:e=>updateSet(exIdx,si,"weight",e.target.value),style:S.input}),h("input",{type:"number",inputMode:"numeric",placeholder:"0",value:set.reps,onChange:e=>updateSet(exIdx,si,"reps",e.target.value),style:S.input}),h("div",{style:S.setActions},h("button",{onClick:()=>toggleDone(exIdx,si),style:{...S.checkBtn,...(set.done?S.checkDone:{})}},set.done?"\u2713":"\u25CB"),ex.sets.length>1&&h("button",{onClick:()=>removeSet(exIdx,si),style:S.miniDel},"\u2212")))),
h("button",{onClick:()=>addSet(exIdx),style:S.addSetBtn},"+ Add Set"))}),

// Add exercise picker
adding&&!selectedSplit&&h("div",{style:{...S.pickerCard,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.menuTitle},"SELECT SPLIT DAY"),h("div",{style:S.groupGrid},splitNames.map(sp=>h("button",{key:sp,className:"hov-btn",onClick:()=>setSelectedSplit(sp),style:S.groupBtn},sp))),h("button",{onClick:()=>{setAdding(false);setSelectedSplit(null)},style:S.cancelBtn},"Cancel")),
adding&&selectedSplit&&h("div",{style:{...S.pickerCard,animation:"fadeIn 0.2s ease"}},h("h3",{style:S.menuTitle},selectedSplit.toUpperCase()),h("div",{style:S.exList},(splits[selectedSplit]||[]).map((ex,i)=>h("button",{key:i,className:"hov-btn",onClick:()=>addExercise(ex),style:S.exBtn},h("span",{style:S.exBtnName},ex.name),h("span",{style:S.exBtnMeta},ex.defaultSets+"s"+(ex.defaultWeight?" \u00B7 "+ex.defaultWeight+"lb":"")+(ex.note?" \u00B7 "+ex.note:""))))),
h("div",{style:S.customRow},h("input",{placeholder:"Custom exercise...",value:customExercise,onChange:e=>setCustomExercise(e.target.value),onKeyDown:e=>{if(e.key==="Enter"&&customExercise.trim())addExercise({name:customExercise.trim(),defaultSets:2,defaultWeight:""})},style:S.customInput}),h("button",{onClick:()=>customExercise.trim()&&addExercise({name:customExercise.trim(),defaultSets:2,defaultWeight:""}),style:S.customAddBtn,disabled:!customExercise.trim()},"+")),
h("button",{onClick:()=>setSelectedSplit(null),style:S.cancelBtn},"\u2190 Back")),

todayEx.length>0&&!adding&&h("button",{onClick:()=>setAdding(true),style:S.addExBtn},"+ ADD EXERCISE")),

// ===== HISTORY VIEW =====
view==="history"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"WORKOUT HISTORY"),
sortedDates.length===0&&h("div",{style:S.emptyState},h("div",{style:S.emptyIcon},"\u2261"),h("p",{style:S.emptyText},"No history yet")),
sortedDates.map(date=>{const day=workouts[date];const exs=day.exercises||[];const dayP=[];exs.forEach((ex,i)=>{const pk=photoKey(date,i);if(photos[pk]?.length>0)dayP.push({src:photos[pk][0],name:ex.name,key:pk,photoIdx:0})});
return h("div",{key:date,style:{...S.histCard,animation:"slideUp 0.3s ease"}},
h("div",{style:S.histHeader},h("div",{style:{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}},h("span",{style:S.histDate},prettyDate(date)),day.split&&h("span",{style:S.histSplit},day.split),date===today()&&h("span",{style:S.todayBadge},"TODAY")),h("button",{onClick:()=>{setSelectedDate(date);setView("log")},style:S.viewDayBtn},"VIEW \u2192")),
dayP.length>0&&h("div",{style:{...S.photoStrip,marginBottom:"10px"}},dayP.map((p,i)=>h("div",{key:i,className:"photo-thumb",style:{...S.photoThumb,width:"44px",height:"44px"},onClick:()=>setViewingPhoto(p)},h("img",{src:p.src,alt:"",style:S.thumbImg})))),
h("div",{style:S.histExList},exs.map((ex,i)=>h("div",{key:i,style:S.histEx},h("div",{style:{display:"flex",alignItems:"center",gap:"6px"}},photos[photoKey(date,i)]?.length>0&&h("span",{style:{fontSize:"12px",opacity:.5}},"\uD83D\uDCF7"),h("span",{style:S.histExName},ex.name)),h("span",{style:S.histExDetail},ex.sets.filter(x=>x.done).length+"/"+ex.sets.length+" sets"+(ex.sets.some(x=>x.weight)?" \u00B7 "+Math.max(...ex.sets.filter(x=>x.weight).map(x=>parseFloat(x.weight)||0))+"lb":""))))),
h("div",{style:S.histStats},h("span",null,exs.length+" exercises"),h("span",null,exs.reduce((a,e)=>a+e.sets.filter(x=>x.done).length,0)+" sets done")))})),

// ===== STATS VIEW =====
view==="stats"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"PERSONAL RECORDS"),
(()=>{const stats=getStats();const entries=Object.entries(stats).filter(([,v])=>v.records.length>0);
if(entries.length===0)return h("div",{style:S.emptyState},h("div",{style:S.emptyIcon},"\u25B3"),h("p",{style:S.emptyText},"Complete some sets to see stats"));
const grouped={};entries.forEach(([name,data])=>{const sp=data.split||"Other";if(!grouped[sp])grouped[sp]=[];grouped[sp].push([name,data])});
return Object.entries(grouped).map(([split,exs])=>h("div",{key:split},h("h3",{style:S.statsGroupTitle},split),
exs.map(([name,data])=>{const mW=Math.max(...data.records.map(r=>r.weight));const mV=Math.max(...data.records.map(r=>r.weight*r.reps));const best=data.records.find(r=>r.weight*r.reps===mV);
return h("div",{key:name,style:{...S.statCard,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}},h("h3",{style:{...S.statExName,marginBottom:0}},name),data.latestPhoto&&h("div",{style:{...S.photoThumb,width:"48px",height:"48px",borderRadius:"8px",flexShrink:0},onClick:()=>setViewingPhoto({src:data.latestPhoto,name,key:"",photoIdx:-1})},h("img",{src:data.latestPhoto,alt:"",style:S.thumbImg}))),
h("div",{style:S.prGrid},
h("div",{style:S.prItem},h("span",{style:S.prValue},mW,h("span",{style:S.prUnit},"lb")),h("span",{style:S.prLabel},"MAX WEIGHT")),
h("div",{style:S.prItem},h("span",{style:S.prValue},mV.toLocaleString(),h("span",{style:S.prUnit},"lb")),h("span",{style:S.prLabel},"BEST VOLUME")),
h("div",{style:S.prItem},h("span",{style:S.prValue},data.records.length),h("span",{style:S.prLabel},"TOTAL SETS")),
h("div",{style:S.prItem},h("span",{style:S.prValue},best?best.weight+"\u00D7"+best.reps:"\u2014"),h("span",{style:S.prLabel},"BEST SET"))))})))})(),
h("button",{onClick:()=>{if(confirm("Clear ALL data and photos?")){setWorkouts({});setPhotos({});db.rm("ironlog-workouts");db.rm("ironlog-photos");showToast("All data cleared")}},style:S.resetBtn},"RESET ALL DATA")),

// ===== SPLITS EDITOR VIEW =====
view==="splits"&&h("div",{style:S.content},h("h2",{style:S.viewTitle},"MY SPLITS"),h("p",{style:{...S.emptySubtext,textAlign:"left",marginBottom:"20px"}},"Customize your workout splits. Each person using this app gets their own."),

!editingSplit?h("div",null,
// List of splits
splitNames.map(name=>h("div",{key:name,style:{...S.splitEditorCard,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"}},
h("div",{style:{cursor:"pointer",flex:1},onClick:()=>{setEditingSplit(name);setEditingExIdx(null);setAddingExToSplit(false)}},h("h3",{style:S.splitEditorName},name),h("span",{style:S.splitEditorMeta},(splits[name]||[]).length+" exercises")),
h("div",{style:{display:"flex",gap:"6px"}},
h("button",{onClick:()=>{setRenamingSplit(name);setRenameValue(name)},style:S.smallBtn},"Rename"),
h("button",{onClick:()=>handleDeleteSplit(name),style:{...S.smallBtn,color:"#ff4d4d",borderColor:"#331111"}},"Delete"))))),

// Add new split
h("div",{style:{...S.pickerCard,marginTop:"16px"}},h("h3",{style:S.menuTitle},"ADD NEW SPLIT"),
h("div",{style:S.customRow},h("input",{placeholder:"Split name (e.g. Push Day)...",value:newSplitName,onChange:e=>setNewSplitName(e.target.value),onKeyDown:e=>e.key==="Enter"&&handleAddSplit(),style:S.customInput}),h("button",{onClick:handleAddSplit,style:S.customAddBtn,disabled:!newSplitName.trim()},"+"))),

h("button",{onClick:handleResetSplits,style:{...S.resetBtn,marginTop:"20px"}},"RESET SPLITS TO DEFAULTS"))

// Editing a specific split
:h("div",null,
h("button",{onClick:()=>{setEditingSplit(null);setEditingExIdx(null);setAddingExToSplit(false)},style:{...S.cancelBtn,marginBottom:"16px"}},"\u2190 Back to all splits"),
h("h3",{style:{...S.viewTitle,fontSize:"14px",color:"#ff4d4d",marginBottom:"16px"}},editingSplit.toUpperCase()),

// Exercise list in this split
(splits[editingSplit]||[]).map((ex,idx)=>
editingExIdx===idx?
// Editing an exercise
h("div",{key:idx,style:{...S.exCard,borderColor:"#ff4d4d",animation:"fadeIn 0.2s ease"}},
h("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.fieldLabel},"NAME"),h("input",{value:editExData.name,onChange:e=>setEditExData({...editExData,name:e.target.value}),style:S.customInput})),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"SETS"),h("input",{type:"number",value:editExData.defaultSets,onChange:e=>setEditExData({...editExData,defaultSets:e.target.value}),style:S.customInput})),
h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"DEFAULT WEIGHT"),h("input",{value:editExData.defaultWeight,onChange:e=>setEditExData({...editExData,defaultWeight:e.target.value}),style:S.customInput}))),
h("div",null,h("label",{style:S.fieldLabel},"NOTE"),h("input",{value:editExData.note,onChange:e=>setEditExData({...editExData,note:e.target.value}),placeholder:"e.g. machine, drop set, optional...",style:S.customInput})),
h("div",{style:{display:"flex",gap:"8px",marginTop:"4px"}},h("button",{onClick:()=>setEditingExIdx(null),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:()=>handleSaveEditEx(editingSplit,idx),style:S.confirmYes},"Save"))))

// Normal display
:h("div",{key:idx,style:{...S.splitExRow,animation:"slideUp 0.3s ease"}},
h("div",{style:{display:"flex",gap:"6px",alignItems:"center",marginRight:"8px"}},
h("button",{onClick:()=>handleMoveExInSplit(editingSplit,idx,-1),style:{...S.moveBtn,opacity:idx===0?.25:1}},"\u2191"),
h("button",{onClick:()=>handleMoveExInSplit(editingSplit,idx,1),style:{...S.moveBtn,opacity:idx===(splits[editingSplit]||[]).length-1?.25:1}},"\u2193")),
h("div",{style:{flex:1,cursor:"pointer"},onClick:()=>handleStartEditEx(editingSplit,idx)},
h("span",{style:{fontSize:"14px",color:"#ccc"}},ex.name),
h("span",{style:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#555",marginLeft:"8px"}},ex.defaultSets+"s"+(ex.defaultWeight?" \u00B7 "+ex.defaultWeight+"lb":"")+(ex.note?" \u00B7 "+ex.note:""))),
h("button",{onClick:()=>handleDeleteExFromSplit(editingSplit,idx),style:{...S.deleteBtn,color:"#ff4d4d"}},"×"))),

// Add exercise to split
!addingExToSplit?h("button",{onClick:()=>setAddingExToSplit(true),style:{...S.addExBtn,marginTop:"12px"}},"+  ADD EXERCISE TO SPLIT")
:h("div",{style:{...S.exCard,borderColor:"#333",marginTop:"12px",animation:"fadeIn 0.2s ease"}},
h("h4",{style:S.menuTitle},"NEW EXERCISE"),
h("div",{style:{display:"flex",flexDirection:"column",gap:"10px"}},
h("div",null,h("label",{style:S.fieldLabel},"NAME"),h("input",{value:newEx.name,onChange:e=>setNewEx({...newEx,name:e.target.value}),placeholder:"e.g. Bench Press",style:S.customInput})),
h("div",{style:{display:"flex",gap:"8px"}},
h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"SETS"),h("input",{type:"number",value:newEx.defaultSets,onChange:e=>setNewEx({...newEx,defaultSets:e.target.value}),style:S.customInput})),
h("div",{style:{flex:1}},h("label",{style:S.fieldLabel},"DEFAULT WEIGHT (lb)"),h("input",{value:newEx.defaultWeight,onChange:e=>setNewEx({...newEx,defaultWeight:e.target.value}),style:S.customInput}))),
h("div",null,h("label",{style:S.fieldLabel},"NOTE"),h("input",{value:newEx.note,onChange:e=>setNewEx({...newEx,note:e.target.value}),placeholder:"optional",style:S.customInput})),
h("div",{style:{display:"flex",gap:"8px",marginTop:"4px"}},h("button",{onClick:()=>setAddingExToSplit(false),style:S.cancelBtnFull},"Cancel"),h("button",{onClick:handleAddExToSplit,style:S.confirmYes,disabled:!newEx.name.trim()},"Add"))))))
)}

// Styles
const S={
container:{minHeight:"100vh",background:"#0a0a0a",color:"#e8e8e8",fontFamily:"'Outfit',sans-serif",maxWidth:"480px",margin:"0 auto",padding:"0 0 100px 0",position:"relative"},
loadingWrap:{minHeight:"100vh",background:"#0a0a0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px"},
loadingPulse:{fontSize:"32px",color:"#ff4d4d",animation:"pulseGlow 1.5s infinite"},
toast:{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:"#1a1a1a",border:"1px solid #ff4d4d",color:"#ff4d4d",padding:"10px 24px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"12px",letterSpacing:"1px",zIndex:999,animation:"toast 2s ease forwards"},
overlay:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px",animation:"fadeIn 0.2s ease"},
lightboxInner:{maxWidth:"400px",width:"100%",display:"flex",flexDirection:"column",alignItems:"center",gap:"16px"},
lightboxImg:{width:"100%",maxHeight:"60vh",objectFit:"contain",borderRadius:"12px",border:"1px solid #222",animation:"photoIn 0.3s ease"},
lightboxActions:{display:"flex",gap:"10px",alignItems:"center",width:"100%"},
lightboxLabel:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"12px",color:"#888",letterSpacing:"1px"},
lightboxDelete:{background:"#2a1111",border:"1px solid #442222",borderRadius:"8px",color:"#ff4d4d",padding:"10px 16px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer"},
lightboxClose:{background:"#1a1a1a",border:"1px solid #333",borderRadius:"8px",color:"#aaa",padding:"10px 16px",fontFamily:"'DM Mono',monospace",fontSize:"11px",cursor:"pointer"},
photoMenu:{background:"#141414",border:"1px solid #222",borderRadius:"16px",padding:"24px",maxWidth:"300px",width:"100%",display:"flex",flexDirection:"column",gap:"10px",animation:"photoIn 0.2s ease"},
modalCard:{background:"#141414",border:"1px solid #222",borderRadius:"16px",padding:"24px",maxWidth:"340px",width:"100%",animation:"photoIn 0.2s ease"},
menuTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",color:"#666",marginBottom:"12px",textAlign:"center"},
menuBtn:{background:"#1a1a1a",border:"1px solid #222",borderRadius:"10px",color:"#ccc",padding:"16px",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s"},
photoStrip:{display:"flex",gap:"8px",marginBottom:"12px",overflowX:"auto",paddingBottom:"4px"},
photoThumb:{width:"56px",height:"56px",borderRadius:"10px",overflow:"hidden",border:"2px solid #222",cursor:"pointer",flexShrink:0,transition:"border-color 0.15s",opacity:.9},
thumbImg:{width:"100%",height:"100%",objectFit:"cover",display:"block"},
photoAddBtn:{width:"56px",height:"56px",borderRadius:"10px",border:"2px dashed #2a2a2a",background:"transparent",color:"#444",fontSize:"22px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
camBtn:{background:"#1a1a1a",border:"1px solid #222",borderRadius:"6px",width:"28px",height:"28px",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
header:{padding:"28px 20px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid #1a1a1a"},
logo:{fontSize:"28px",fontWeight:800,letterSpacing:"4px",color:"#e8e8e8",margin:0},
subtitle:{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"4px",color:"#555",marginTop:"4px"},
headerStats:{display:"flex",gap:"10px",marginTop:"4px"},
statPill:{background:"#141414",border:"1px solid #222",borderRadius:"8px",padding:"8px 12px",display:"flex",flexDirection:"column",alignItems:"center",minWidth:"56px"},
statNum:{fontSize:"18px",fontWeight:700,color:"#ff4d4d"},
statLabel:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#666",marginTop:"2px"},
nav:{display:"flex",padding:"12px 20px",gap:"6px",borderBottom:"1px solid #141414"},
navBtn:{flex:1,background:"transparent",border:"1px solid #1a1a1a",color:"#555",padding:"10px 4px",borderRadius:"8px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",cursor:"pointer",transition:"all 0.2s"},
navBtnActive:{background:"#141414",border:"1px solid #333",color:"#ff4d4d"},
dateNav:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid #111"},
dateArrow:{background:"#141414",border:"1px solid #222",color:"#888",width:"36px",height:"36px",borderRadius:"8px",fontSize:"20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
dateCenter:{display:"flex",alignItems:"center",gap:"10px"},
dateText:{fontFamily:"'DM Mono',monospace",fontSize:"14px",letterSpacing:"1px",color:"#ccc"},
todayBadge:{background:"#ff4d4d",color:"#000",fontSize:"9px",fontWeight:700,letterSpacing:"2px",padding:"3px 8px",borderRadius:"4px",fontFamily:"'DM Mono',monospace"},
splitBadgeWrap:{padding:"10px 20px 0",display:"flex",justifyContent:"center"},
splitBadge:{background:"rgba(255,77,77,0.08)",border:"1px solid rgba(255,77,77,0.2)",color:"#ff4d4d",padding:"6px 20px",borderRadius:"20px",fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",fontWeight:500},
content:{padding:"16px 20px"},
emptyState:{textAlign:"center",padding:"40px 20px",animation:"fadeIn 0.5s ease"},
emptyIcon:{fontSize:"48px",color:"#222",marginBottom:"16px"},
emptyText:{color:"#555",fontSize:"16px",fontWeight:500},
emptySubtext:{color:"#333",fontSize:"13px",marginTop:"8px",fontFamily:"'DM Mono',monospace"},
quickLoadWrap:{marginTop:"32px"},
quickLoadLabel:{fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"3px",color:"#444",marginBottom:"12px"},
quickLoadGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"},
quickLoadBtn:{background:"#141414",border:"1px solid #222",borderRadius:"10px",color:"#ccc",padding:"16px 12px",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s"},
exCard:{background:"#111",border:"1px solid #1c1c1c",borderRadius:"12px",padding:"16px",marginBottom:"12px",transition:"border-color 0.2s"},
exHeader:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"},
exTopRow:{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"},
splitTag:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"#ff4d4d",textTransform:"uppercase"},
noteTag:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"1px",color:"#666",background:"#1a1a1a",padding:"2px 6px",borderRadius:"4px"},
exName:{fontSize:"17px",fontWeight:600,marginTop:"4px",color:"#e0e0e0"},
exActions:{display:"flex",gap:"3px",alignItems:"center"},
moveBtn:{background:"transparent",border:"1px solid #1a1a1a",borderRadius:"4px",color:"#444",fontSize:"12px",width:"24px",height:"24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
deleteBtn:{background:"transparent",border:"none",color:"#333",fontSize:"14px",cursor:"pointer",padding:"4px 6px"},
setHeader:{display:"flex",alignItems:"center",padding:"0 4px 6px",borderBottom:"1px solid #1a1a1a",marginBottom:"4px"},
setCol:{flex:1,fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"#444"},
setRow:{display:"flex",alignItems:"center",padding:"5px 4px",borderRadius:"6px",transition:"background 0.2s"},
setDone:{background:"rgba(255,77,77,0.06)"},
setNum:{flex:"0 0 36px",fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#555",fontWeight:500},
input:{flex:1,background:"#1a1a1a",border:"1px solid #222",borderRadius:"6px",color:"#e0e0e0",padding:"8px",fontSize:"14px",fontFamily:"'DM Mono',monospace",marginRight:"6px",textAlign:"center",transition:"border-color 0.2s"},
setActions:{display:"flex",gap:"4px",flex:"0 0 68px",justifyContent:"flex-end"},
checkBtn:{background:"#1a1a1a",border:"1px solid #333",borderRadius:"6px",width:"32px",height:"32px",color:"#555",fontSize:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
checkDone:{background:"#ff4d4d",border:"1px solid #ff4d4d",color:"#000",fontWeight:700},
miniDel:{background:"transparent",border:"1px solid #222",borderRadius:"6px",width:"28px",height:"32px",color:"#444",fontSize:"16px",cursor:"pointer"},
addSetBtn:{background:"transparent",border:"1px dashed #222",borderRadius:"6px",color:"#555",padding:"8px",width:"100%",marginTop:"8px",fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"1px",cursor:"pointer"},
pickerCard:{background:"#111",border:"1px solid #1c1c1c",borderRadius:"12px",padding:"20px",marginBottom:"12px"},
groupGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"},
groupBtn:{background:"#1a1a1a",border:"1px solid #222",borderRadius:"8px",color:"#ccc",padding:"14px",fontSize:"13px",fontWeight:500,cursor:"pointer",transition:"all 0.15s",fontFamily:"'Outfit',sans-serif"},
exList:{display:"flex",flexDirection:"column",gap:"6px",marginBottom:"16px"},
exBtn:{background:"#1a1a1a",border:"1px solid #222",borderRadius:"8px",color:"#ccc",padding:"12px 14px",textAlign:"left",cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"border-color 0.15s",display:"flex",justifyContent:"space-between",alignItems:"center"},
exBtnName:{fontSize:"14px",fontWeight:500},
exBtnMeta:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#555"},
customRow:{display:"flex",gap:"8px",marginBottom:"12px"},
customInput:{flex:1,background:"#1a1a1a",border:"1px solid #222",borderRadius:"8px",color:"#e0e0e0",padding:"12px 14px",fontSize:"14px",fontFamily:"'Outfit',sans-serif",width:"100%"},
customAddBtn:{background:"#ff4d4d",border:"none",borderRadius:"8px",color:"#000",width:"44px",fontSize:"20px",fontWeight:700,cursor:"pointer"},
cancelBtn:{background:"transparent",border:"none",color:"#555",fontFamily:"'DM Mono',monospace",fontSize:"12px",letterSpacing:"1px",cursor:"pointer",padding:"8px 0"},
cancelBtnFull:{flex:1,background:"transparent",border:"1px solid #222",borderRadius:"8px",color:"#888",padding:"12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"12px",textAlign:"center"},
confirmYes:{flex:1,background:"#ff4d4d",border:"none",borderRadius:"8px",color:"#000",padding:"12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:"1px",textAlign:"center"},
addExBtn:{background:"linear-gradient(135deg,#ff4d4d,#cc0000)",border:"none",borderRadius:"10px",color:"#fff",padding:"16px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"13px",fontWeight:500,letterSpacing:"3px",cursor:"pointer",marginTop:"8px"},
viewTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"4px",color:"#444",marginBottom:"20px"},
histCard:{background:"#111",border:"1px solid #1c1c1c",borderRadius:"12px",padding:"16px",marginBottom:"10px"},
histHeader:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"},
histDate:{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:"#aaa",letterSpacing:"1px"},
histSplit:{fontFamily:"'DM Mono',monospace",fontSize:"10px",color:"#ff4d4d",letterSpacing:"1px"},
viewDayBtn:{background:"transparent",border:"1px solid #222",borderRadius:"6px",color:"#ff4d4d",padding:"4px 12px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",cursor:"pointer",flexShrink:0},
histExList:{display:"flex",flexDirection:"column",gap:"4px",marginBottom:"10px"},
histEx:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #161616"},
histExName:{fontSize:"13px",color:"#ccc"},
histExDetail:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#555"},
histStats:{display:"flex",justifyContent:"space-between",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",color:"#333",paddingTop:"6px"},
statsGroupTitle:{fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"3px",color:"#ff4d4d",marginBottom:"10px",marginTop:"20px",paddingBottom:"8px",borderBottom:"1px solid #1a1a1a"},
statCard:{background:"#111",border:"1px solid #1c1c1c",borderRadius:"12px",padding:"16px",marginBottom:"10px"},
statExName:{fontSize:"16px",fontWeight:600,color:"#e0e0e0",marginBottom:"12px"},
prGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"},
prItem:{background:"#0e0e0e",border:"1px solid #1a1a1a",borderRadius:"8px",padding:"10px",display:"flex",flexDirection:"column"},
prValue:{fontSize:"18px",fontWeight:700,color:"#e8e8e8"},
prUnit:{fontSize:"11px",color:"#666",marginLeft:"2px"},
prLabel:{fontFamily:"'DM Mono',monospace",fontSize:"8px",letterSpacing:"2px",color:"#444",marginTop:"3px"},
resetBtn:{background:"transparent",border:"1px solid #2a1a1a",borderRadius:"8px",color:"#662222",padding:"12px",width:"100%",fontFamily:"'DM Mono',monospace",fontSize:"11px",letterSpacing:"2px",cursor:"pointer",marginTop:"40px"},
// Splits editor
splitEditorCard:{background:"#111",border:"1px solid #1c1c1c",borderRadius:"12px",padding:"16px",marginBottom:"10px"},
splitEditorName:{fontSize:"16px",fontWeight:600,color:"#e0e0e0"},
splitEditorMeta:{fontFamily:"'DM Mono',monospace",fontSize:"11px",color:"#555",marginTop:"4px"},
smallBtn:{background:"transparent",border:"1px solid #222",borderRadius:"6px",color:"#888",padding:"6px 12px",fontFamily:"'DM Mono',monospace",fontSize:"10px",letterSpacing:"1px",cursor:"pointer"},
splitExRow:{background:"#141414",border:"1px solid #1a1a1a",borderRadius:"8px",padding:"12px",marginBottom:"6px",display:"flex",alignItems:"center"},
fieldLabel:{fontFamily:"'DM Mono',monospace",fontSize:"9px",letterSpacing:"2px",color:"#555",marginBottom:"4px",display:"block"},
};

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
