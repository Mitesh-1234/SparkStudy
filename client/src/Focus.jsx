import React,{useRef,useState,useEffect} from 'react';
export default function Focus({save}){const video=useRef(),overlay=useRef(),run=useRef(null),mounted=useRef(true),audio=useRef(null),alarm=useRef(null),reminderRef=useRef(null);const [status,S]=useState('Ready'),[live,L]=useState(false),[busy,B]=useState(false),[seconds,T]=useState(0),[error,E]=useState(''),[reminder,R]=useState(null);
function stopAlarm(){if(alarm.current){clearInterval(alarm.current);alarm.current=null;}}
function playAlarmTone(){try{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;const ctx=audio.current||new AudioContext();audio.current=ctx;if(ctx.state==='suspended')ctx.resume();[0,.18,.36].forEach((delay,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='square';oscillator.frequency.value=[620,820,620][i];gain.gain.setValueAtTime(.0001,ctx.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.09,ctx.currentTime+delay+.012);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+.14);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(ctx.currentTime+delay);oscillator.stop(ctx.currentTime+delay+.15);});}catch{}}
function startAlarm(reason){const next={reason,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};reminderRef.current=next;R(next);playAlarmTone();if(!alarm.current)alarm.current=setInterval(playAlarmTone,900);}
function wakeup(){stopAlarm();reminderRef.current=null;R(null);}
function cleanup(r){if(!r)return;r.active=false;clearInterval(r.clock);clearTimeout(r.loop);r.stream?.getTracks().forEach(t=>t.stop());if(!r.infer){r.face?.close();r.phone?.dispose();}if(video.current)video.current.srcObject=null;if(overlay.current){const context=overlay.current.getContext('2d');context?.clearRect(0,0,overlay.current.width,overlay.current.height);}reminderRef.current=null;}
function eyesClosed(result,face){
 const blendshapes=result?.faceBlendshapes?.[0]?.categories||[];
 if(blendshapes.length){
  const left=blendshapes.find(item=>item.categoryName==='eyeBlinkLeft')?.score||0;
  const right=blendshapes.find(item=>item.categoryName==='eyeBlinkRight')?.score||0;
  if(left>.55||right>.55)return true;
 }
 if(!face)return false;
 const eyeRatio=(top,bottom,left,right)=>{
  const vertical=Math.abs(top.y-bottom.y);
  const horizontal=Math.max(Math.abs(left.x-right.x),.01);
  return vertical/horizontal;
 };
 const leftRatio=eyeRatio(face[159],face[145],face[33],face[133]);
 const rightRatio=eyeRatio(face[386],face[374],face[362],face[263]);
 return leftRatio<.16&&rightRatio<.16;
}
function drawDetections(canvas,videoElement,objects){
 if(!canvas||!videoElement?.videoWidth)return;
 canvas.width=videoElement.videoWidth;
 canvas.height=videoElement.videoHeight;
 const context=canvas.getContext('2d');
 context.clearRect(0,0,canvas.width,canvas.height);
 context.lineWidth=Math.max(3,canvas.width/160);
 context.font=`${Math.max(16,canvas.width/32)}px system-ui`;
 objects.filter(object=>object.class==='cell phone'&&object.score>=.15).forEach(object=>{
  const [left,top,width,height]=object.bbox;
  context.strokeStyle='#ff4d8d';
  context.fillStyle='#ff4d8d';
  context.strokeRect(left,top,width,height);
  context.fillRect(left,Math.max(0,top-30),Math.min(width,180),30);
  context.fillStyle='#ffffff';
  context.fillText(`Phone ${Math.round(object.score*100)}%`,left+6,Math.max(20,top-8));
 });
}
useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stopAlarm();cleanup(run.current)}},[]);
async function start(camera){const r={active:true,start:Date.now(),observed:0,clear:0,events:0,last:null,streak:0};run.current=r;B(true);E('');T(0);try{if(camera){S('Loading detection models…');if(!navigator.mediaDevices?.getUserMedia)throw Error('Use localhost or HTTPS for camera access.');const {FaceLandmarker,FilesetResolver}=await import('@mediapipe/tasks-vision');r.face=await FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'),{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true});try{const tf=await import('@tensorflow/tfjs');await tf.ready();const coco=await import('@tensorflow-models/coco-ssd');r.phone=await coco.load({base:'lite_mobilenet_v2'});}catch(phoneError){r.phone=null;E('Phone model unavailable: '+phoneError.message);}if(!r.active){cleanup(r);return;}r.stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:'user'},audio:false});if(!r.active){cleanup(r);return;}video.current.srcObject=r.stream;await video.current.play();}if(!r.active)return;r.start=Date.now();L(true);S(camera?'Monitoring · face and phone':'Manual timer · no camera analysis');r.clock=setInterval(()=>T(Math.floor((Date.now()-r.start)/1000)),250);if(camera){let previous=performance.now();const scan=async()=>{if(!r.active)return;r.infer=true;try{if(video.current.readyState<2||document.hidden){S('Monitoring paused · frame unavailable');r.streak=0;r.last=null;}else{const now=performance.now(),faceResult=r.face.detectForVideo(video.current,now),face=faceResult.faceLandmarks[0],objects=r.phone?await r.phone.detect(video.current,20,.15):[];if(!r.active)return;drawDetections(overlay.current,video.current,objects);let reason='No visible distraction';if(objects.some(o=>o.class==='cell phone'&&o.score>=.15))reason='Phone visible';else if(!face)reason='Face not visible';else if(eyesClosed(faceResult,face))reason='Eyes closed';else {const span=Math.max(Math.abs(face[454].x-face[234].x),.01),offset=(face[1].x-(face[454].x+face[234].x)/2)/span;if(Math.abs(offset)>.16)reason='Head turned sideways';}const dt=Math.min(1,(now-previous)/1000);r.observed+=dt;if(reason==='No visible distraction')r.clear+=dt;if(reason===r.last)r.streak+=dt;else{r.streak=0;r.last=reason;}if(reason!=='No visible distraction'&&r.streak>=3&&!r.warned){r.events++;r.warned=true;S('Reminder · '+reason);startAlarm(reason);}else if(reason==='No visible distraction'){r.warned=false;stopAlarm();if(reminderRef.current){reminderRef.current=null;R(null);}S(reason);}else if(r.streak<3){r.warned=false;S('Checking · '+reason);}else S('Reminder · '+reason);previous=now;}}catch(e){S('Detection error · monitoring unavailable');E(e.message);r.active=false;clearInterval(r.clock);r.stream?.getTracks().forEach(t=>t.stop());}finally{r.infer=false;if(r.active)r.loop=setTimeout(scan,650);else{r.face?.close();r.phone?.dispose();r.face=null;r.phone=null;}}};scan();}}catch(e){cleanup(r);if(mounted.current){E(e.message);S('Camera/model unavailable. Try manual timer.');}}finally{if(mounted.current)B(false);}}
async function stop(){const r=run.current;if(!r)return;stopAlarm();cleanup(r);L(false);R(null);const seconds=Math.floor((Date.now()-r.start)/1000),observed=Math.min(seconds,Math.floor(r.observed));S('Session ended');try{await save({seconds,observed,clear:Math.min(observed,Math.floor(r.clear)),events:r.events});}catch(e){E('Could not save: '+e.message);}}
return <><div className="heading"><small>FOCUS / 02</small><h1>Focus Guard</h1><p>Private, on-device visual checks during your study session.</p></div><div className="split"><section className="panel"><div className="camera"><video ref={video} muted playsInline autoPlay style={{visibility:live?'visible':'hidden'}}/><canvas ref={overlay} style={{position:'absolute',width:'100%',height:'100%',objectFit:'contain',transform:'scaleX(-1)',pointerEvents:'none'}}/>{!live&&<span>Camera off</span>}</div><div className="actions"><button disabled={busy||live} onClick={()=>start(true)}>Start camera session</button><button disabled={busy||live} className="secondary" onClick={()=>start(false)}>Manual timer</button><button disabled={!live} className="secondary" onClick={stop}>Stop & save</button></div>{error&&<p className="error">{error}</p>}</section><section className="panel"><small>SESSION TIME</small><h1 className="clock">{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</h1><div className="notice" role="status">{status}</div>{reminder&&<div className="focus-notification" role="alert"><div><strong>Focus alarm</strong><p>{reminder.reason}. Wake up and return to your study session.</p><small>{reminder.time}</small></div><button type="button" aria-label="Stop alarm and dismiss" onClick={wakeup}>×</button></div>}<p>Face landmarks estimate sideways head turns and eye closure. COCO-SSD detects visible phones and draws a red tracking box. Warnings require about 3 seconds of repeated observations.</p><p>Neither model measures attention. Lighting, camera angle and occlusion affect results. No video or audio is uploaded. Models require internet on first load.</p></section></div></>;}
