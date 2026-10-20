import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import{getAuth,signInAnonymously}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import{getDatabase,ref,get,set,update,onValue,push,query,limitToLast}from'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';
import{firebaseConfig as FC}from'./firebase-config.js';
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={g(k){try{return localStorage.getItem(k)}catch(e){return null}},s(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const L=window.L;let db,uid,S={code:null,meta:null,pl:{},pos:null,un:[],ctr:0,k:-1,end:0,gps:'sucht…',n:0,mk:{}};
S.adm=(()=>{try{return JSON.parse(LS.g('mh_adm')||'{}')}catch(e){return{}}})();const saveAdm=()=>LS.s('mh_adm',JSON.stringify(S.adm));
const fmt=ms=>{ms=Math.max(0,Math.round(ms/1000));return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0')};
const M=(p,c)=>({x:(p.lng-c.lng)*111320*Math.cos(c.lat*Math.PI/180),y:(p.lat-c.lat)*110540});
const toast=t=>{const e=$('#toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,2800)};
const show=id=>document.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id===id));
const R=p=>ref(db,'games/'+S.code+(p?'/'+p:'')),role=id=>(S.pl[id]||{}).role,cau=id=>{const p=S.pl[id]||{};return p.caught&&p.role==='g'};
const SET=[['nh','Jäger',1,6,1,v=>v],['r0','Spielfeld-Radius',100,3000,50,v=>v+' m'],['step','Kreis schrumpft alle',1,15,1,v=>v+' Min'],['shr','Schrumpfdauer (live)',10,120,5,v=>v+' s'],['head','Vorsprung Gejagte',0,300,15,v=>v?v+' s':'aus'],['dur','Spieldauer',10,90,5,v=>v+' Min'],['ping','Radar-Ping (Jäger sehen Gejagte)',0,10,1,v=>v?'alle '+v+' Min':'aus'],['pts','★ Punkte für Gejagte (Aufgabe)',0,20,1,v=>v?v+' Stück':'aus'],['alarm','Nähe-Alarm (Gejagte)',0,1,1,v=>v?'an':'aus'],['free','Befreien (nur ohne Infektion)',0,1,1,v=>v?'an':'aus'],['inf','Infektionsmodus (Gefangene werden Jäger)',0,1,1,v=>v?'an':'aus']];
const tiles=m=>L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,className:'dk',attribution:'© OpenStreetMap'}).addTo(m);
document.head.insertAdjacentHTML('beforeend','<style>.dk{filter:invert(1) hue-rotate(180deg) brightness(.9) contrast(.9) saturate(.7)}.pt{width:14px;height:14px;background:#ffe14d;transform:rotate(45deg);border-radius:3px;box-shadow:0 0 12px #ffe14d}body.nh::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:1400;box-shadow:inset 0 0 60px 8px #ffb020;animation:bl var(--nd,1s) infinite}</style>');
const ring=(c,r)=>{const o=[];for(let i=0;i<72;i++){const a=i/72*6.2832;o.push([c[0]+Math.sin(a)*r/110540,c[1]+Math.cos(a)*r/(111320*Math.cos(c[0]*Math.PI/180))])}return o};
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function circ(g,k){const Q=rng(g.seed);let r=g.r0,x=0,y=0;for(let i=0;i<k;i++){const n=Math.max(30,r*.78),a=Q()*6.2832,d=Math.sqrt(Q())*(r-n);x+=Math.cos(a)*d;y+=Math.sin(a)*d;r=n}return{x,y,r}}
function zone(g,now){const el=now-g.startAt-g.head*1000,st=g.step*60000,sh=Math.min((g.shr||30)*1000,st*.8),k=el<0?0:Math.floor(el/st),w=el<0?0:el%st,a=circ(g,k),b=circ(g,k+1);
 if(el<0)return{...a,k,n:b,sh:0,left:-el};
 if(w<st-sh)return{...a,k,n:b,sh:0,left:st-sh-w};
 const t=(w-(st-sh))/sh;return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,r:a.r+(b.r-a.r)*t,k,n:b,sh:1,left:st-w}}
function gps(){if(S.w!=null)return;if(!navigator.geolocation){S.gps='nicht verfügbar';return}
 S.w=navigator.geolocation.watchPosition(p=>{if(S.adm.fake)return;const f=!S.pos;const np={lat:p.coords.latitude,lng:p.coords.longitude};if(!S.lp)S.lp=np;{const q=M(np,S.lp),d=Math.hypot(q.x,q.y);if(d>=4){if(d<150&&S.meta&&S.meta.status==='run'&&p.coords.accuracy<=40)S.dist=(S.dist||0)+d;S.lp=np}}S.pos=np;S.gps='±'+Math.round(p.coords.accuracy)+' m';if(f)pub()},e=>{S.gps=e.code==1?'verweigert':'Fehler'},{enableHighAccuracy:true,maximumAge:2000,timeout:20000});wake()}
const wake=()=>{try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden){wake();pub()}});
const where=()=>new Promise(r=>{const f={lat:51.16,lng:10.45,far:1};if(!navigator.geolocation)return r(f);navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lng:p.coords.longitude}),()=>r(f),{timeout:7000,enableHighAccuracy:true})});
const rd=p=>new Promise((ok,no)=>onValue(ref(db,p),ok,no,{onlyOnce:true}));
const nameOk=()=>{const n=$('#nm').value.trim();if(!n){toast('Bitte Namen eingeben');return 0}S.name=n;LS.s('mh_name',n);return 1};
function enter(c){S.code=c;LS.s('mh_code',c);S.k=-1;S.end=0;S.pl={};S.meta=null;S.chat={};S.cinit=0;S.cn=0;S.ck=null;S.so='';show('wait');
 S.un=[onValue(R('meta'),s=>{S.meta=s.val();render()},e=>toast('Verbindung: '+e.code)),onValue(R('players'),s=>{S.pl=s.val()||{};rPl();rChat()},()=>{}),onValue(query(R('chat'),limitToLast(60)),s=>{S.chat=s.val()||{};rChat()},()=>{})];pub()}
function leave(){S.un.forEach(f=>f());S.un=[];S.code=null;S.meta=null;S.pl={};LS.s('mh_code',null);$('#cbtn').hidden=true;$('#abtn').hidden=true;$('#adm').classList.remove('on');$('#chat').classList.remove('on');document.body.classList.remove('al');$('#sh').hidden=true;show('home')}
function pub(){if(!S.code||!S.pl[uid])return;const o={t:Date.now(),dist:Math.round(S.dist||0)};if(S.pos){o.lat=S.pos.lat;o.lng=S.pos.lng}update(R('players/'+uid),o).catch(()=>{})}
async function create(){const c=[...Array(4)].map(()=>'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.random()*31|0]).join(''),p=await where();
 await set(ref(db,'games/'+c),{meta:{host:uid,status:'lobby',nh:1,r0:p.far?5000:500,step:5,shr:30,head:60,dur:30,ping:0,pts:8,alarm:1,free:1,inf:0,center:{lat:p.lat,lng:p.lng}},players:{[uid]:{name:S.name,t:Date.now()}}});enter(c);if(S.adm.auto)addBots(3,p)}
async function join(c){c=c.toUpperCase();const m=(await rd(`games/${c}/meta`)).val();if(!m)return toast('Code nicht gefunden');
 const pl=(await rd(`games/${c}/players`)).val()||{};
 if(!pl[uid]){const old=Object.entries(pl).find(([k,p])=>(p.name||'').toLowerCase()===S.name.toLowerCase());
  if(m.status==='lobby'){if(old)return toast('Dieser Name ist schon vergeben');await set(ref(db,`games/${c}/players/${uid}`),{name:S.name,t:Date.now()})}
  else if(old)await update(ref(db,`games/${c}/players`),{[uid]:{...old[1],t:Date.now()},[old[0]]:null});
  else return toast('Spiel läuft schon. Zum Zurückkehren exakt den alten Namen nutzen.')}
 enter(c)}
async function resume(){const c=LS.g('mh_code');if(!c)return;const m=(await rd(`games/${c}/meta`)).val(),me=(await rd(`games/${c}/players/${uid}`)).val();
 if(m&&me){S.name=me.name;enter(c);toast('Willkommen zurück im Spiel!')}else LS.s('mh_code',null)}
$('#mk').onclick=async()=>{if(!nameOk())return;gps();try{await create()}catch(e){toast('Fehler: '+(e.code||e.message))}};
$('#jn').onclick=async()=>{if(!nameOk())return;const c=$('#cd').value.trim();if(c.length<4)return toast('Code mit 4 Zeichen eingeben');gps();try{await join(c)}catch(e){toast('Fehler: '+(e.code||e.message))}};
$('#lv').onclick=$('#lv2').onclick=leave;
function render(){const m=S.meta;if(!S.code)return;if(!m){show('wait');return}$('#cbtn').hidden=false;$('#abtn').hidden=!S.adm.on;
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
$('#go').onclick=()=>nextRound();
const reset=x=>{const u={...x,'meta/got':null,'meta/winner':null};Object.keys(S.pl).forEach(k=>{u['players/'+k+'/caught']=null;u['players/'+k+'/rev']=null;u['players/'+k+'/by']=null;u['players/'+k+'/role']=null;u['players/'+k+'/dist']=0;u['players/'+k+'/frt']=null});return u};
const nextRound=()=>{const m=S.meta,ids=Object.keys(S.pl).sort(()=>Math.random()-.5),nh=Math.min(m.nh,ids.length-1),rn=Object.keys(m.hist||{}).length+1,u=reset({'meta/status':'run','meta/startAt':Date.now()+5000,'meta/seed':Math.random()*1e9|0,'meta/round':rn});
 ids.forEach((k,i)=>{const r=i<nh?'h':'g';u['players/'+k+'/role']=r;u['players/'+k+'/rh/'+rn]=r});update(R(),u)};
const toLobby=()=>update(R(),reset({'meta/status':'lobby'}));
function startGame(){const m=S.meta,c=[m.center.lat,m.center.lng];$('#ac').textContent=role(uid)==='h'?'🎯 Fangen':'🏳 Aufgeben';S.end=0;S.dist=0;S.pr=null;S.fr=null;S.fs={};S.fl={};S.fa=0;S.lw=0;S.shr=0;S.wk=-1;document.body.classList.remove('al','nh');setTimeout(pub,300);S.pts=genPts(m);S.pd={};Object.values(S.pm||{}).forEach(k=>S.gm&&S.gm.removeLayer(k));S.pm={};
 if(m.pts)setTimeout(()=>toast(role(uid)==='g'?'Sammle alle ★ Punkte, ohne gefangen zu werden!':'Verhindere, dass die Gejagten alle ★ Punkte holen!'),1500);
 if(!S.gm){S.gm=L.map('gm',{zoomControl:false}).setView(c,15);S.gm.on('click',e=>{if(S.adm.fake){S.pos={lat:e.latlng.lat,lng:e.latlng.lng};S.gps='Fake-GPS';S.lp=S.pos;pub()}});tiles(S.gm);S.dim=L.polygon([],{stroke:false,fillColor:'#ff2d55',fillOpacity:.18}).addTo(S.gm);
  S.zn=L.circle(c,{color:'#19e6ff',weight:2,dashArray:'8 6',fill:false}).addTo(S.gm);S.zc=L.circle(c,{color:'#ff2d55',weight:3,fill:false}).addTo(S.gm)}
 setTimeout(()=>{S.gm.invalidateSize();S.gm.fitBounds(L.latLngBounds(ring(c,m.r0)),{padding:[10,10]})},80)}
function visible(){const m=S.meta,now=Date.now(),mr=role(uid),o=[];
 for(const[id,p]of Object.entries(S.pl)){if(p.lat==null||id===uid)continue;const ping=(mr==='h'&&p.role==='g'&&(p.rev||0)>now)||(m.ping>0&&mr==='h'&&p.role==='g'&&now>m.startAt+m.head*1000&&(now-m.startAt)%(m.ping*60000)<10000);
  if(p.role===mr||ping||m.status==='end')o.push({...p,uid:id,r:p.role,ping,stale:now-p.t>30000})}return o}
const PT=L.divIcon({className:'',iconSize:[14,14],iconAnchor:[7,7],html:'<div class="pt"></div>'});
function genPts(m){const Q=rng((m.seed||1)+777),c=circ(m,2),o=[];for(let i=0;i<(m.pts||0);i++){const a=Q()*6.2832,d=Math.sqrt(Q())*c.r*.92;o.push({x:c.x+Math.cos(a)*d,y:c.y+Math.sin(a)*d})}return o}
const ic=(c,n,pg,st)=>L.divIcon({className:'',iconSize:[14,14],iconAnchor:[7,7],html:`<div class="dot ${c}${pg?' pg':''}" style="opacity:${st?.4:1}"></div><span class="lb">${esc(n||'')}</span>`});
function drawMap(z,zn){const m=S.meta,c=m.center,ll=o=>[c.lat+o.y/110540,c.lng+o.x/(111320*Math.cos(c.lat*Math.PI/180))],zc=ll(z);
 S.zc.setLatLng(zc).setRadius(z.r);S.zn.setLatLng(ll(zn)).setRadius(zn.r);S.dim.setLatLngs([[[85,-180],[85,180],[-85,180],[-85,-180]],ring(zc,z.r)]);
 const seen={},l=visible();if(S.pos)l.push({uid,me:1,lat:S.pos.lat,lng:S.pos.lng,r:role(uid)});
 for(const p of l){seen[p.uid]=1;const cls=p.me?'me '+p.r:cau(p.uid)?'x':p.r,i=ic(cls,p.me?'':p.name,p.ping,p.stale);
  if(!S.mk[p.uid])S.mk[p.uid]=L.marker([p.lat,p.lng],{icon:i,zIndexOffset:p.me?1000:0}).addTo(S.gm);S.mk[p.uid].setLatLng([p.lat,p.lng]).setIcon(i)}
 for(const k in S.mk)if(!seen[k]){S.gm.removeLayer(S.mk[k]);delete S.mk[k]}

 const got=m.got||{},sg=role(uid)==='g';(S.pts||[]).forEach((p,i)=>{const on=sg&&!got[i];if(on&&!S.pm[i])S.pm[i]=L.marker(ll(p),{icon:PT,interactive:false}).addTo(S.gm);if(!on&&S.pm[i]){S.gm.removeLayer(S.pm[i]);delete S.pm[i]}});
 if(S.ctr&&S.pos)S.gm.panTo([S.pos.lat,S.pos.lng])}
$('#ct').onclick=()=>{S.ctr=!S.ctr;$('#ct').style.color=S.ctr?'var(--cy)':''};
$('#ac').onclick=()=>{const m=S.meta,sh=$('#sh'),cl=()=>sh.hidden=true;
 if(role(uid)!=='h'){sh.innerHTML='<b>Wirklich aufgeben?</b><div class="row"><button id="y">Ja, gefangen</button><button class="g" id="n">Abbrechen</button></div>';sh.hidden=false;$('#y').onclick=()=>{update(R('players/'+uid),{caught:true,by:'self',...(m.inf?{role:'h'}:{})});cl()};$('#n').onclick=cl;return}
 const me=S.pos&&M(S.pos,m.center),near=Object.entries(S.pl).filter(([id,p])=>p.role==='g'&&!p.caught&&p.lat!=null&&me&&Math.hypot(M(p,m.center).x-me.x,M(p,m.center).y-me.y)<=40);
 sh.innerHTML='<b>Gejagte in 40 m Reichweite</b>'+(near.length?near.map(([id,p])=>`<button class="c" data-u="${id}">${esc(p.name)} fangen</button>`).join(''):'<div class="mu">Niemand in Reichweite.</div>')+'<button class="g" id="n">Schließen</button>';sh.hidden=false;
 sh.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{update(R('players/'+b.dataset.u),{caught:true,by:uid,...(m.inf?{role:'h'}:{})});cl()});$('#n').onclick=cl};
function tick(){const m=S.meta;if(!m||m.status!=='run'||!S.gm)return;const now=Date.now(),z=zone(m,now),zn=z.n,mr=role(uid),end=m.startAt+m.dur*60000,hd=m.startAt+m.head*1000-now,out=now>=m.startAt;
 let mg=null;if(S.pos){const p=M(S.pos,m.center);mg=z.r-Math.hypot(p.x-z.x,p.y-z.y)}
 const bad=out&&mg!=null&&mg<0;document.body.classList.toggle('al',bad);if(bad&&navigator.vibrate)navigator.vibrate(150);
 if(z.sh&&!S.shr)toast('⚠ Der Kreis schrumpft! Lauf in den neuen Kreis!');S.shr=z.sh;if(out&&!z.sh&&z.left<=15000&&S.wk!==z.k){S.wk=z.k;toast('Kreis schrumpft in 15 s')}
 $('#hud').innerHTML=`<div class="st ${mr==='h'?'rd':'cy'}">${mr==='h'?'JÄGER':'GEJAGTER'}</div><div class="st"><small>Restzeit</small>${fmt(end-now)}</div><div class="st ${z.sh?'rd':''}"><small>${z.sh?'Schrumpft noch':'Schrumpft in'}</small>${fmt(z.left)}</div><div class="st ${bad?'rd':''}"><small>Rand</small>${mg==null?'–':Math.round(mg)+' m'}</div>`;
 $('#ac').hidden=!!cau(uid);$('#ac').textContent=mr==='h'?'🎯 Fangen':'🏳 Aufgeben';if(S.pr==='g'&&mr==='h')toast('🦠 Du wurdest infiziert, jetzt jagst du!');S.pr=mr;
 const b=$('#ban');b.hidden=false;
 if(cau(uid)){b.textContent=m.free&&!m.inf?'Gefangen! Bleib stehen: Ein Teammitglied kann dich in 10 s befreien.':'Du wurdest gefangen und bist raus. Du siehst weiter dein Team.'}
 else if(!out)b.textContent='Spiel startet gleich…';
 else if(hd>0)b.textContent=mr==='h'?'Jäger warten noch '+fmt(hd)+'. Die Gejagten rennen!':'LOS! Vorsprung noch '+fmt(hd);
 else b.hidden=true;
 const me=S.pos&&M(S.pos,m.center);
 if(mr==='g'&&!cau(uid)&&out&&me&&S.pts&&S.pd)S.pts.forEach((p,i)=>{if(!(m.got||{})[i]&&!S.pd[i]&&Math.hypot(p.x-me.x,p.y-me.y)<=25){S.pd[i]=1;update(R(),{['meta/got/'+i]:uid,['players/'+uid+'/rev']:now+10000});toast('✓ Punkt! Die Jäger sehen dich 10 s')}});
 if(mr==='h'){let ac=0;for(const[id,p]of Object.entries(S.pl)){if(p.frt&&S.fs[id]!==p.frt){S.fs[id]=p.frt;S.fl[id]=now}if(S.fl[id]&&now-S.fl[id]<5000)ac=1}if(ac&&!S.fa)toast('⚠ Jemand wird gerade befreit!');S.fa=ac}else S.fa=0;
 let nd=null;if(m.alarm&&mr==='g'&&!cau(uid)&&me&&out)for(const p of Object.values(S.pl)){if(p.role==='h'&&p.lat!=null&&now-p.t<30000){const q=M(p,m.center),d=Math.hypot(q.x-me.x,q.y-me.y);if(nd==null||d<nd)nd=d}}
 const nr=nd!=null&&nd<=50;document.body.classList.toggle('nh',nr);if(nr){document.body.style.setProperty('--nd',(.25+nd/80)+'s');if(navigator.vibrate)navigator.vibrate(nd<25?[120,60,120]:80)}
 S.frm='';if(m.free&&!m.inf&&mr==='g'&&!cau(uid)&&me){let f=null;for(const[id,p]of Object.entries(S.pl))if(id!==uid&&cau(id)&&p.lat!=null){const q=M(p,m.center);if(Math.hypot(q.x-me.x,q.y-me.y)<=12){f=[id,p.name];break}}
  if(f){if(!S.fr||S.fr.id!==f[0])S.fr={id:f[0],t:now};const sc=Math.ceil((10000-(now-S.fr.t))/1000);if(sc<=0){update(R(),{['players/'+f[0]+'/caught']:null,['players/'+f[0]+'/by']:null,['players/'+uid+'/frt']:null});S.fr=null;S.lw=0;toast('✓ '+f[1]+' befreit!')}else{S.frm='Befreie '+f[1]+' … '+sc+' s';if(now-(S.lw||0)>2000){S.lw=now;update(R('players/'+uid),{frt:now})}}}else S.fr=null}else S.fr=null;
 if(!S.fr&&S.lw){S.lw=0;update(R('players/'+uid),{frt:null})}
 $('#tm').innerHTML='<span class="chip">GPS '+S.gps+'</span>'+(S.fa?'<span class="chip rd">⚠ Jemand wird befreit!</span>':'')+(nd!=null&&nd<=80?'<span class="chip rd">⚠ Jäger ~'+Math.round(nd/5)*5+' m</span>':'')+(S.frm?'<span class="chip cy">'+esc(S.frm)+'</span>':'')+(m.pts?'<span class="chip cy">★ Punkte '+Object.keys(m.got||{}).length+'/'+m.pts+'</span>':'')+visible().map(p=>{const q=M(p,m.center);return`<span class="chip ${p.r==='h'?'rd':'cy'}">${esc(p.name)}${me?' '+Math.round(Math.hypot(q.x-me.x,q.y-me.y))+' m':''}</span>`}).join('');
 drawMap(z,zn);
 const pl=Object.values(S.pl),all=now>m.startAt+1500&&pl.some(p=>p.role)&&!pl.some(p=>p.role==='g'&&!p.caught);
 const pc=m.pts||0,ap=pc>0&&Object.keys(m.got||{}).length>=pc;if(!S.end&&(all||ap||now>end)){S.end=1;const W=all?'h':ap?'g':(pc>0?'h':'g');update(R('meta'),{status:'end',winner:W,['hist/'+(m.round||1)]:W}).catch(()=>{})}
}
function rEnd(){const m=S.meta,w=m.winner==='h',h=m.host===uid,rn=m.round||1;pub();document.body.classList.remove('al','nh');
 $('#wn').textContent=(w?'JÄGER GEWINNEN':'GEJAGTE GEWINNEN')+' · Runde '+rn;$('#wn').style.color=w?'var(--rd)':'var(--cy)';
 const E=Object.entries(S.pl),hist=m.hist||{},km=d=>d>=1000?(d/1000).toFixed(2)+' km':(d||0)+' m',best=E.reduce((a,b)=>(b[1].dist||0)>(a[1].dist||0)?b:a,E[0]);
 $('#rs').innerHTML=(best&&best[1].dist?`<div class="sr"><span>🏃 Meiste Strecke</span><b>${esc(best[1].name)} · ${km(best[1].dist)}</b></div>`:'')+E.map(([id,p])=>{
  const wins=Object.keys(hist).filter(r=>(p.rh||{})[r]===hist[r]).length,n=Object.values(m.got||{}).filter(u=>u===id).length,c=E.filter(([k,q])=>q.by===id).length,tag=p.role==='h'?(p.caught?'infiziert':'Jäger'):(p.caught?'gefangen':'entkommen');
  return`<div class="card" style="padding:8px 10px;margin-top:6px"><div class="sr"><b>${esc(p.name)}</b><span class="${p.role==='h'?'rd':'cy'}">${tag}</span></div><div class="mu" style="font-size:13px">🏃 ${km(p.dist)}${m.pts?' · ★ '+n:''} · 🎯 ${c} Fänge · 🏆 ${wins} Siege</div></div>`}).join('')+(h?'':'<div class="mu" style="margin-top:8px">Der Host startet die nächste Runde…</div>');
 if(!$('#nx')){const mk=(id,t,f,c)=>{const b=document.createElement('button');b.id=id;b.textContent=t;if(c)b.className=c;b.onclick=f;$('#lv2').before(b)};mk('nx','▶ Nächste Runde',nextRound);mk('cs','⚙ Einstellungen ändern',toLobby,'c');$('#lv2').textContent='Verlassen';$('#lv2').className='g'}
 $('#nx').hidden=$('#cs').hidden=!h}
document.head.insertAdjacentHTML('beforeend','<style>#cbtn{position:fixed;right:12px;top:calc(118px + env(safe-area-inset-top,0px));z-index:1300;width:48px;height:48px;padding:0;font-size:22px;border-radius:50%}#cbd{position:absolute;top:-4px;right:-4px;background:var(--rd);border-radius:10px;font:700 12px system-ui;padding:1px 6px;font-style:normal}#chat{position:fixed;left:10px;right:10px;top:calc(60px + env(safe-area-inset-top,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:1600;display:none;flex-direction:column;gap:8px;box-shadow:0 0 30px #000}#chat.on{display:flex}#clist{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px}.cm{background:#0c0c14;border:1px solid var(--ln);border-radius:12px;padding:6px 10px;max-width:85%;align-self:flex-start;overflow-wrap:anywhere}.cm.me{align-self:flex-end;border-color:var(--cy)}#chat select{padding:12px;border-radius:12px;background:#0c0c14;color:var(--tx);border:1px solid var(--ln);font-size:15px}</style>');
document.body.insertAdjacentHTML('beforeend','<button id="cbtn" class="c" hidden>💬<i id="cbd" hidden></i></button><div id="chat" class="card"><div class="row" style="flex:none"><b style="flex:3;align-self:center">💬 Chat</b><button id="ccl" class="g" style="flex:1;padding:8px">✕</button></div><div id="clist"></div><select id="cto"></select><div class="row" style="flex:none"><input id="cin" type="text" maxlength="200" placeholder="Nachricht…" style="flex:4"><button id="csd" style="flex:1">➤</button></div></div>');
const cvis=()=>Object.entries(S.chat||{}).sort((a,b)=>a[0]<b[0]?-1:1).filter(([k,c])=>c.to==='all'||c.from===uid||c.to===uid||(c.to==='team'&&c.team===(role(uid)||'')&&c.rd===((S.meta&&S.meta.round)||0)));
function rChat(){const l=cvis(),op=$('#chat').classList.contains('on'),last=l[l.length-1];
 if(!S.cinit){S.cinit=1;S.cn=l.length;S.ck=last&&last[0]}
 else if(last&&last[0]!==S.ck){S.ck=last[0];if(!op&&last[1].from!==uid)toast('💬 '+last[1].name+': '+String(last[1].text).slice(0,40))}
 if(op)S.cn=l.length;const un=op?0:l.slice(S.cn).filter(([k,c])=>c.from!==uid).length;$('#cbd').hidden=!un;$('#cbd').textContent=un;
 const o=[['team','Team'],['all','Alle'],...Object.entries(S.pl||{}).filter(([k])=>k!==uid).map(([k,p])=>[k,'→ '+p.name])],sg=JSON.stringify(o);
 if(S.so!==sg){S.so=sg;const cu=$('#cto').value;$('#cto').innerHTML=o.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');if(o.some(x=>x[0]===cu))$('#cto').value=cu}
 if(op){$('#clist').innerHTML=l.map(([k,c])=>`<div class="cm${c.from===uid?' me':''}"><small class="${c.team==='h'?'rd':c.team==='g'?'cy':'mu'}"><b>${esc(c.name)}</b> · ${c.to==='all'?'Alle':c.to==='team'?'Team':c.from===uid?'→ '+esc((S.pl[c.to]||{}).name||'?'):'privat'}</small><div>${esc(c.text)}</div></div>`).join('');$('#clist').scrollTop=$('#clist').scrollHeight}}
$('#cbtn').onclick=()=>{$('#chat').classList.add('on');rChat()};
$('#ccl').onclick=()=>{$('#chat').classList.remove('on');S.cn=cvis().length;rChat()};
const sendC=()=>{const t=$('#cin').value.trim();if(!t||!S.code)return;push(R('chat'),{from:uid,name:S.name,to:$('#cto').value||'team',team:role(uid)||'',rd:(S.meta&&S.meta.round)||0,text:t.slice(0,200),t:Date.now()}).catch(()=>toast('Senden fehlgeschlagen'));$('#cin').value=''};
$('#csd').onclick=sendC;$('#cin').onkeydown=e=>{if(e.key==='Enter')sendC()};
document.head.insertAdjacentHTML('beforeend','<style>#home h1{touch-action:manipulation;user-select:none;-webkit-user-select:none}#abtn{position:fixed;left:12px;top:calc(118px + env(safe-area-inset-top,0px));z-index:1300;width:48px;height:48px;padding:0;font-size:22px;border-radius:50%}#adm{position:fixed;inset:0;z-index:2500;display:none;flex-direction:column;gap:10px;overflow-y:auto;border-radius:0;padding-top:calc(14px + env(safe-area-inset-top,0px))}#adm.on{display:flex}</style>');
document.body.insertAdjacentHTML('beforeend','<button id="abtn" class="g" hidden>🛠</button><div id="adm" class="card"><div class="row" style="flex:none"><b style="flex:3;align-self:center">🛠 Admin / Test</b><button data-a="x" class="g" style="flex:1;padding:8px">✕</button></div><div id="ast" class="mu" style="font-size:13px"></div><div id="abs" style="display:flex;flex-direction:column;gap:8px"></div></div>');
function admRender(){const B=(a,t,c)=>`<button data-a="${a}"${c?` class="${c}"`:''}>${t}</button>`;
 $('#abs').innerHTML=B('fake','Fake-GPS: '+(S.adm.fake?'AN (im Spiel auf die Karte tippen)':'aus'),'c')+B('auto','Beim Erstellen automatisch 3 Bots: '+(S.adm.auto?'an':'aus'),'c')+`<div class="row">${B('b1','+1 Bot')}${B('b3','+3 Bots')}</div>`+B('bme','Bots zu mir holen (15–35 m)')+B('role','Meine Rolle wechseln')+`<div class="row">${B('t1','⏩ +1 Min')}${B('t5','⏩ +5 Min')}</div><div class="row">${B('wh','Jäger gewinnen')}${B('wg','Gejagte gewinnen')}</div>`+B('rb','Alle Bots entfernen','g')+'<div class="mu" style="font-size:12px">Bots werden von diesem Handy gesteuert und laufen nur, solange die Seite offen ist.</div>';
 $('#ast').textContent=S.code?`Spiel ${S.code} · ${Object.keys(S.pl).length} Spieler · ${Object.values(S.pl).filter(p=>p.bot).length} Bots`:'Kein Spiel aktiv. Erstelle ein Spiel, dann gehen Bots, Zeit und Rolle.'}
const openAdm=()=>{admRender();$('#adm').classList.add('on')};
$('#abtn').onclick=openAdm;
{let tp=0,tt=0;$('#home h1').addEventListener('click',()=>{const n=Date.now();tp=n-tt<1500?tp+1:1;tt=n;if(tp>=12){tp=0;S.adm.on=1;saveAdm();openAdm()}})}
function addBots(n,c){const m=S.meta||{},pl=Object.values(S.pl||{}),run=m.status==='run',ex=pl.filter(p=>p.bot).length,u={};let nh=pl.filter(p=>p.role==='h').length,ng=pl.filter(p=>p.role==='g').length;
 c=c||(run&&S.pos?S.pos:m.center)||{lat:51.16,lng:10.45};
 for(let i=0;i<n;i++){const a=Math.random()*6.28,d=run?30+Math.random()*120:10+Math.random()*80,o={name:'Bot '+(ex+i+1),bot:true,owner:uid,t:Date.now(),lat:c.lat+Math.sin(a)*d/110540,lng:c.lng+Math.cos(a)*d/(111320*Math.cos(c.lat*Math.PI/180))};
  if(run){const r=nh>ng?'g':'h';r==='h'?nh++:ng++;o.role=r;o.rh={[m.round||1]:r}}
  u['players/bot_'+Date.now().toString(36)+i]=o}update(R(),u)}
$('#adm').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,m=S.meta;
 if(a==='x'){$('#adm').classList.remove('on');return}
 if(a==='fake'){S.adm.fake=S.adm.fake?0:1;if(S.adm.fake){S.pos=S.pos||(m&&m.center)||{lat:51.16,lng:10.45};S.gps='Fake-GPS'}saveAdm()}
 else if(a==='auto'){S.adm.auto=S.adm.auto?0:1;saveAdm()}
 else if(!S.code||!m)toast('Erst ein Spiel erstellen');
 else if(a==='b1'||a==='b3')addBots(a==='b1'?1:3);
 else if(a==='bme'){if(!S.pos)toast('Keine Position');else{const u={};for(const[id,p]of Object.entries(S.pl))if(p.bot){const t=Math.random()*6.28,d=15+Math.random()*20;u['players/'+id+'/lat']=S.pos.lat+Math.sin(t)*d/110540;u['players/'+id+'/lng']=S.pos.lng+Math.cos(t)*d/(111320*Math.cos(S.pos.lat*Math.PI/180))}update(R(),u)}}
 else if(a==='role')update(R('players/'+uid),{role:role(uid)==='h'?'g':'h',caught:null});
 else if(a==='t1'||a==='t5'){if(m.status==='run')update(R('meta'),{startAt:m.startAt-(a==='t1'?60000:300000)});else toast('Nur im laufenden Spiel')}
 else if(a==='wh'||a==='wg'){if(m.status==='run'){const W=a==='wh'?'h':'g';update(R('meta'),{status:'end',winner:W,['hist/'+(m.round||1)]:W})}else toast('Nur im laufenden Spiel')}
 else if(a==='rb'){const u={};for(const[id,p]of Object.entries(S.pl))if(p.bot)u['players/'+id]=null;update(R(),u)}
 admRender()};
function botTick(){const m=S.meta;if(!S.code||!m)return;const now=Date.now(),u={},pl=S.pl,run=m.status==='run'&&now>=m.startAt,z=run?zone(m,now):null,c=m.center;
 for(const[id,b]of Object.entries(pl)){if(!b.bot||b.owner!==uid)continue;u['players/'+id+'/t']=now;
  if(!run||b.lat==null||(b.caught&&b.role==='g')||(b.role==='h'&&now<m.startAt+m.head*1000))continue;
  const P=M(b,c),act=Object.entries(pl).filter(([k,p])=>p.lat!=null&&k!==id);let tx=null,ty=null,sp=2.2;
  if(b.role==='h'){let best=null,bd=1e9;for(const[k,p]of act)if(p.role==='g'&&!p.caught){const q=M(p,c),d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;best=[k,q]}}
   if(best){tx=best[1].x;ty=best[1].y;if(bd<5)sp=0;if(bd<12&&Math.random()<.25){u['players/'+best[0]+'/caught']=true;u['players/'+best[0]+'/by']=id;if(m.inf)u['players/'+best[0]+'/role']='h'}}}
  else{let hb=null,hd=1e9;for(const[k,p]of act)if(p.role==='h'){const q=M(p,c),d=Math.hypot(q.x-P.x,q.y-P.y);if(d<hd){hd=d;hb=q}}
   if(hb&&hd<70){tx=P.x+(P.x-hb.x);ty=P.y+(P.y-hb.y);sp=2.6}
   else{let np=null,nd=1e9;(S.pts||[]).forEach((q,i)=>{if(!(m.got||{})[i]){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<nd){nd=d;np=[i,q]}}});
    if(np){tx=np[1].x;ty=np[1].y;if(nd<20)u['meta/got/'+np[0]]=id}else{const a=Math.random()*6.28;tx=P.x+Math.cos(a)*20;ty=P.y+Math.sin(a)*20}}}
  if(z&&Math.hypot(P.x-z.x,P.y-z.y)>z.r*.9){tx=z.x;ty=z.y}
  if(tx!=null){const dx=tx-P.x,dy=ty-P.y,d=Math.hypot(dx,dy)||1,st=Math.min(sp,d);if(st>0){u['players/'+id+'/lat']=c.lat+(P.y+dy/d*st)/110540;u['players/'+id+'/lng']=c.lng+(P.x+dx/d*st)/(111320*Math.cos(c.lat*Math.PI/180));u['players/'+id+'/dist']=Math.round((b.dist||0)+st)}}}
 if(Object.keys(u).length)update(R(),u).catch(()=>{})}
(async()=>{$('#nm').value=LS.g('mh_name')||'';S.name=$('#nm').value;
 if(!FC.apiKey||FC.apiKey.startsWith('DEIN')){$('#err').textContent='Firebase ist noch nicht eingerichtet (siehe README.md, Schritt 1).';$('#mk').disabled=$('#jn').disabled=true;return}
 try{const app=initializeApp(FC),au=getAuth(app);db=getDatabase(app);await au.authStateReady();uid=au.currentUser?au.currentUser.uid:(await signInAnonymously(au)).user.uid}
 catch(e){$('#err').textContent='Anmeldung fehlgeschlagen: '+(e.code||e.message);return}
 gps();setInterval(tick,500);setInterval(pub,4000);setInterval(botTick,1000);try{await resume()}catch(e){}})();
