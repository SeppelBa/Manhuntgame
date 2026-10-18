import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import{getAuth,signInAnonymously}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import{getDatabase,ref,get,set,update,onValue}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import{firebaseConfig as FC}from'./firebase-config.js';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={g(k){try{return localStorage.getItem(k)}catch(e){return null}},s(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const L=window.L;let db,uid,S={code:null,meta:null,pl:{},pos:null,un:[],ctr:0,k:-1,end:0,gps:'sucht…',n:0,mk:{}};
const fmt=ms=>{ms=Math.max(0,Math.round(ms/1000));return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0')};
const M=(p,c)=>({x:(p.lng-c.lng)*111320*Math.cos(c.lat*Math.PI/180),y:(p.lat-c.lat)*110540});
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,2800)};
const show=id=>document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id===id));
const R=p=>ref(db,'games/'+S.code+(p?'/'+p:'')),role=id=>(S.pl[id]||{}).role,cau=id=>(S.pl[id]||{}).caught;
const SET=[['nh','Jäger',1,6,1,v=>v],['r0','Spielfeld-Radius',100,3000,50,v=>v+' m'],['step','Kreis schrumpft alle',1,15,1,v=>v+' Min'],['head','Vorsprung Gejagte',0,300,15,v=>v?v+' s':'aus'],['dur','Spieldauer',10,90,5,v=>v+' Min'],['ping','Radar-Ping (Jäger sehen Gejagte)',0,10,1,v=>v?'alle '+v+' Min':'aus']];
const tiles=m=>L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'© OpenStreetMap © CARTO'}).addTo(m);
const ring=(c,r)=>{const o=[];for(let i=0;i<72;i++){const a=i/72*6.2832;o.push([c[0]+Math.sin(a)*r/110540,c[1]+Math.cos(a)*r/(111320*Math.cos(c[0]*Math.PI/180))])}return o};
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function zone(g,now,ko){const el=now-g.startAt-g.head*1000,st=g.step*60000;let k=el<0?0:Math.floor(el/st);if(ko!=null)k=ko;
 const Q=rng(g.seed);let r=g.r0,x=0,y=0;for(let i=0;i<k;i++){const n=Math.max(30,r*.78),a=Q()*6.2832,d=Math.sqrt(Q()*1)*(r-n);x+=Math.cos(a)*d;y+=Math.sin(a)*d;r=n}
 return{x,y,r,k,left:el<0?-el:st-el%st}}
function gps(){if(S.w!=null)return;if(!navigator.geolocation){S.gps='nicht verfügbar';return}
 S.w=navigator.geolocation.watchPosition(p=>{const f=!S.pos;S.pos={lat:p.coords.latitude,lng:p.coords.longitude};S.gps='±'+Math.round(p.coords.accuracy)+' m';if(f)pub()},e=>{S.gps=e.code==1?'verweigert':'Fehler'},{enableHighAccuracy:true,maximumAge:2000,timeout:20000});wake()}
const wake=()=>{try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){wake();pub()}});
const where=()=>new Promise(r=>{const f={lat:51.16,lng:10.45,far:1};if(!navigator.geolocation)return r(f);navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude}),()=>r(f),{timeout:7000,enableHighAccuracy:true})});
const nameOk=()=>{const n=$('#nm').value.trim();if(!n){toast('Bitte Namen eingeben');return 0}S.name=n;LS.s('mh_name',n);return 1};
function enter(c){S.code=c;LS.s('mh_code',c);S.k=-1;S.end=0;S.pl={};S.meta=null;show('wait');
 S.un=[onValue(R('meta'),s=>{S.meta=s.val();render()},e=>toast('Verbindung: '+e.code)),onValue(R('players'),s=>{S.pl=s.val()||{};rPl()},()=>{})];pub()}
function leave(){S.un.forEach(f=>f());S.un=[];S.code=null;S.meta=null;S.pl={};LS.s('mh_code',null);document.body.classList.remove('al');$('#sh').hidden=true;show('home')}
function pub(){if(!S.code||!S.pl[uid])return;const o={t:Date.now()};if(S.pos){o.lat=S.pos.lat;o.lng=S.pos.lng}update(R('players/'+uid),o).catch(()=>{})}
async function create(){const c=[...Array(4)].map(()=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random()*31|0]).join(''),p=await where();
 await set(ref(db,'games/'+c),{meta:{host:uid,status:'lobby',nh:1,r0:p.far?5000:500,step:5,head:60,dur:30,ping:0,center:{lat:p.lat,lng:p.lng}},players:{[uid]:{name:S.name,t:Date.now()}}});enter(c)}
async function join(c){c=c.toUpperCase();const m=(await get(ref(db,`games/${c}/meta`))).val();if(!m)return toast('Code nicht gefunden');if(m.status==='end')return toast('Das Spiel ist schon vorbei');
 const pl=(await get(ref(db,`games/${c}/players`))).val()||{};
 if(!pl[uid]){const old=Object.entries(pl).find(([k,p])=>p.name.toLowerCase()===S.name.toLowerCase());
  if(m.status==='lobby'){if(old)return toast('Dieser Name ist schon vergeben');await set(ref(db,`games/${c}/players/${uid}`),{name:S.name,t:Date.now()})}
  else if(old)await update(ref(db,`games/${c}/players`),{[uid]:{...old[1],t:Date.now()},[old[0]]:null});
  else return toast('Spiel läuft schon. Zum Zurückkehren exakt den alten Namen nutzen.')}
 enter(c)}
async function resume(){const c=LS.g('mh_code');if(!c)return;const m=(await get(ref(db,`games/${c}/meta`))).val(),me=(await get(ref(db,`games/${c}/players/${uid}`))).val();
 if(m&&m.status!=='end'&&me){S.name=me.name;enter(c);toast('Willkommen zurück im Spiel!')}else LS.s('mh_code',null)}
$('#mk').onclick=async()=>{if(!nameOk())return;gps();try{await create()}catch(e){toast('Fehler: '+e.code)}};
$('#jn').onclick=async()=>{if(!nameOk())return;const c=$('#cd').value.trim();if(c.length<4)return toast('Code mit 4 Zeichen eingeben');gps();try{await join(c)}catch(e){toast('Fehler: '+e.code)}};
$('#lv').onclick=$('#lv2').onclick=leave;
function render(){const m=S.meta;if(!S.code)return;if(!m){show('wait');return}
 if(m.status==='lobby'){show('lobby');rLobby()}else if(m.status==='run'){if(!$('#game').classList.contains('on')){show('game');startGame()}}else{show('end');rEnd()}}
function rLobby(){const m=S.meta,h=m.host===uid,c=[m.center.lat,m.center.lng];$('#lc').textContent=S.code;
 if(!S.lm){S.lm=L.map('lm',{zoomControl:false}).setView(c,15);tiles(S.lm);S.lc=L.circle(c,{color:'#ff2d55',fillOpacity:.12,weight:3}).addTo(S.lm);S.lk=L.circleMarker(c,{radius:6,color:'#19e6ff',fillOpacity:1}).addTo(S.lm);
  S.lm.on('click',e=>{if(S.meta.host===uid)update(R('meta'),{center:{lat:e.latlng.lat,lng:e.latlng.lng}})})}
 S.lc.setLatLng(c).setRadius(m.r0);S.lk.setLatLng(c);setTimeout(()=>{S.lm.invalidateSize();S.lm.fitBounds(L.latLngBounds(ring(c,m.r0)),{padding:[16,16]})},60);
 $('#lh').textContent=h?'Tippe auf die Karte, um den Mittelpunkt des Spielfelds zu setzen.':'Der Host legt das Spielfeld fest.';$('#me').hidden=!h;
 $('#st').innerHTML=SET.map(([k,l,a,b,s,f])=>`<div class="sr"><span>${l}</span><b id="v_${k}">${f(m[k])}</b></div>`+(h?`<input type="range" data-k="${k}" min="${a}" max="${b}" step="${s}" value="${m[k]}">`:'')).join('');
 $('#st').querySelectorAll('input').forEach(i=>{const k=i.dataset.k,f=SET.find(x=>x[0]===k)[5];i.oninput=()=>{$('#v_'+k).textContent=f(+i.value);if(k==='r0')S.lc.setRadius(+i.value)};i.onchange=()=>update(R('meta'),{[k]:+i.value})});
 $('#go').hidden=!h;rPl()}
$('#me').onclick=()=>S.pos?update(R('meta'),{center:S.pos}):toast('Warte auf GPS…');
function rPl(){const m=S.meta;if(!m||m.status!=='lobby')return;const l=Object.values(S.pl);$('#pc').textContent='('+l.length+')';
 $('#pls').innerHTML=l.map(p=>`<div class="sr"><span>${esc(p.name)}${p.name&&S.pl[m.host]===p?' 👑':''}</span><span class="mu">${p.lat!=null?'GPS ✓':'sucht GPS…'}</span></div>`).join('');$('#go').disabled=l.length<2}
$('#go').onclick=()=>{const ids=Object.keys(S.pl).sort(()=>Math.random()-.5),nh=Math.min(S.meta.nh,ids.length-1),u={'meta/status':'run','meta/startAt':Date.now()+5000,'meta/seed':Math.random()*1e9|0};
 ids.forEach((k,i)=>u['players/'+k+'/role']=i<nh?'h':'g');update(R(),u)};
function startGame(){const m=S.meta,c=[m.center.lat,m.center.lng];$('#ac').textContent=role(uid)==='h'?'🎯 Fangen':'🏳 Aufgeben';
 if(!S.gm){S.gm=L.map('gm',{zoomControl:false}).setView(c,15);tiles(S.gm);S.dim=L.polygon([],{stroke:false,fillColor:'#ff2d55',fillOpacity:.18}).addTo(S.gm);
  S.zn=L.circle(c,{color:'#19e6ff',weight:2,dashArray:'8 6',fill:false}).addTo(S.gm);S.zc=L.circle(c,{color:'#ff2d55',weight:3,fill:false}).addTo(S.gm)}
 setTimeout(()=>{S.gm.invalidateSize();S.gm.fitBounds(L.latLngBounds(ring(c,m.r0)),{padding:[10,10]})},80)}
function visible(){const m=S.meta,now=Date.now(),mr=role(uid),o=[];
 for(const[id,p]of Object.entries(S.pl)){if(p.lat==null||id===uid)continue;const ping=m.ping>0&&mr==='h'&&p.role==='g'&&now>m.startAt+m.head*1000&&(now-m.startAt)%(m.ping*60000)<10000;
  if(p.role===mr||ping||m.status==='end')o.push({...p,uid:id,r:p.role,ping,stale:now-p.t>30000})}return o}
const ic=(c,n,pg,st)=>L.divIcon({className:'',iconSize:[14,14],iconAnchor:[7,7],html:`<div class="dot ${c}${pg?' pg':''}" style="opacity:${st?.4:1}"></div><span class="lb">${esc(n||'')}</span>`});
function drawMap(z,zn){const m=S.meta,c=m.center,ll=o=>[c.lat+o.y/110540,c.lng+o.x/(111320*Math.cos(c.lat*Math.PI/180))],zc=ll(z);
 S.zc.setLatLng(zc).setRadius(z.r);S.zn.setLatLng(ll(zn)).setRadius(zn.r);S.dim.setLatLngs([[[85,-180],[85,180],[-85,180],[-85,-180]],ring(zc,z.r)]);
 const seen={},l=visible();if(S.pos)l.push({uid,me:1,lat:S.pos.lat,lng:S.pos.lng,r:role(uid)});
 for(const p of l){seen[p.uid]=1;const cls=p.me?'me '+p.r:cau(p.uid)?'x':p.r,i=ic(cls,p.me?'':p.name,p.ping,p.stale);
  if(!S.mk[p.uid])S.mk[p.uid]=L.marker([p.lat,p.lng],{icon:i,zIndexOffset:p.me?1000:0}).addTo(S.gm);S.mk[p.uid].setLatLng([p.lat,p.lng]).setIcon(i)}
 for(const k in S.mk)if(!seen[k]){S.gm.removeLayer(S.mk[k]);delete S.mk[k]}
 if(S.ctr&&S.pos)S.gm.panTo([S.pos.lat,S.pos.lng])}
$('#ct').onclick=()=>{S.ctr=!S.ctr;$('#ct').style.color=S.ctr?'var(--cy)':''};
$('#ac').onclick=()=>{const m=S.meta,sh=$('#sh'),cl=()=>sh.hidden=true;
 if(role(uid)!=='h'){sh.innerHTML='<b>Wirklich aufgeben?</b><div class="row"><button id="y">Ja, gefangen</button><button class="g" id="n">Abbrechen</button></div>';sh.hidden=false;$('#y').onclick=()=>{update(R('players/'+uid),{caught:true});cl()};$('#n').onclick=cl;return}
 const me=S.pos&&M(S.pos,m.center),near=Object.entries(S.pl).filter(([id,p])=>p.role==='g'&&!p.caught&&p.lat!=null&&me&&Math.hypot(M(p,m.center).x-me.x,M(p,m.center).y-me.y)<=40);
 sh.innerHTML='<b>Gejagte in 40 m Reichweite</b>'+(near.length?near.map(([id,p])=>`<button class="c" data-u="${id}">${esc(p.name)} fangen</button>`).join(''):'<div class="mu">Niemand in Reichweite.</div>')+'<button class="g" id="n">Schließen</button>';sh.hidden=false;
 sh.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{update(R('players/'+b.dataset.u),{caught:true});cl()});$('#n').onclick=cl};
function tick(){const m=S.meta;if(!m||m.status!=='run'||!S.gm)return;const now=Date.now(),z=zone(m,now),zn=zone(m,now,z.k+1),mr=role(uid),end=m.startAt+m.dur*60000,hd=m.startAt+m.head*1000-now,out=now>=m.startAt;
 let mg=null;if(S.pos){const p=M(S.pos,m.center);mg=z.r-Math.hypot(p.x-z.x,p.y-z.y)}
 const bad=out&&mg!=null&&mg<0;document.body.classList.toggle('al',bad);if(bad&&navigator.vibrate)navigator.vibrate(150);
 if(S.k>=0&&z.k>S.k)toast('⚠ Der Kreis wurde verkleinert!');S.k=z.k;
 $('#hud').innerHTML=`<div class="st ${mr==='h'?'rd':'cy'}">${mr==='h'?'JÄGER':'GEJAGTER'}</div><div class="st"><small>Restzeit</small>${fmt(end-now)}</div><div class="st"><small>Kreis in</small>${fmt(z.left)}</div><div class="st ${bad?'rd':''}"><small>Rand</small>${mg==null?'–':Math.round(mg)+' m'}</div>`;
 const b=$('#ban');b.hidden=false;
 if(cau(uid)){b.textContent='Du wurdest gefangen und bist raus. Du siehst weiter dein Team.';$('#ac').hidden=true}
 else if(!out)b.textContent='Spiel startet gleich…';
 else if(hd>0)b.textContent=mr==='h'?'Jäger warten noch '+fmt(hd)+'. Die Gejagten rennen!':'LOS! Vorsprung noch '+fmt(hd);
 else b.hidden=true;
 const me=S.pos&&M(S.pos,m.center);
 $('#tm').innerHTML='<span class="chip">GPS '+S.gps+'</span>'+visible().map(p=>{const q=M(p,m.center);return`<span class="chip ${p.r==='h'?'rd':'cy'}">${esc(p.name)}${me?' '+Math.round(Math.hypot(q.x-me.x,q.y-me.y))+' m':''}</span>`}).join('');
 drawMap(z,zn);
 const gs=Object.values(S.pl).filter(p=>p.role==='g'),all=gs.length&&gs.every(p=>p.caught);
 if(!S.end&&(all||now>end)){S.end=1;update(R('meta'),{status:'end',winner:all?'h':'g'}).catch(()=>{})}
}
function rEnd(){const m=S.meta,w=m.winner==='h';$('#wn').textContent=w?'JÄGER GEWINNEN':'GEJAGTE GEWINNEN';$('#wn').style.color=w?'var(--rd)':'var(--cy)';
 $('#rs').innerHTML=Object.values(S.pl).map(p=>`<div class="sr"><span>${esc(p.name)}</span><span class="${p.role==='h'?'rd':'cy'}">${p.role==='h'?'Jäger':p.caught?'gefangen':'entkommen'}</span></div>`).join('');document.body.classList.remove('al')}
(async()=>{$('#nm').value=LS.g('mh_name')||'';S.name=$('#nm').value;
 if(!FC.apiKey||FC.apiKey.startsWith('DEIN')){$('#err').textContent='Firebase ist noch nicht eingerichtet (siehe README.md, Schritt 1).';$('#mk').disabled=$('#jn').disabled=true;return}
 try{const app=initializeApp(FC),au=getAuth(app);db=getDatabase(app);await au.authStateReady();uid=au.currentUser?au.currentUser.uid:(await signInAnonymously(au)).user.uid}
 catch(e){$('#err').textContent='Anmeldung fehlgeschlagen: '+(e.code||e.message);return}
 gps();setInterval(tick,1000);setInterval(pub,4000);try{await resume()}catch(e){}})();
