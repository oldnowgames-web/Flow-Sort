const CAP=4, MAXL=40;
const COL=[['#e5484d','●'],['#3e8ee8','▲'],['#4cb050','■'],['#f2b134','◆'],['#9b59d0','★'],['#f2799c','♥'],['#27b9b0','✚'],['#f07a2a','☾'],['#8a8f98','✿'],['#7a4a2a','♣']];
const $=s=>document.querySelector(s);
let save={u:1,s:{}};
try{const r=JSON.parse(localStorage.getItem('woody-sort'));if(r&&r.u)save=r}catch(e){}
if(!save.skin)save.skin='liquid';
const store=()=>{try{localStorage.setItem('woody-sort',JSON.stringify(save))}catch(e){}};
let snd=true,AC=null;
function beep(f,d=.08,t='sine'){if(!snd)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(.12,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}

function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));if(id==='lvls')buildGrid();if(id==='skins')buildSkins();if(id==='game')fit()}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{beep(420);show(b.dataset.go)});



let L=1,T=[],sel=-1,hist=[],moves=0,hints=3,cols=3,hm=null,busy=false,ht=0;
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gen(n){
  cols=Math.min(3+Math.floor((n-1)/4),10);
  const empties=n>20?1+(n%2):2, r=rng(n*7919);
  for(let tries=0;;tries++){
    const pool=[];for(let c=0;c<cols;c++)for(let k=0;k<CAP;k++)pool.push(c);
    for(let i=pool.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    const t=[];for(let i=0;i<cols;i++)t.push(pool.slice(i*CAP,i*CAP+CAP));
    for(let i=0;i<empties;i++)t.push([]);
    if(!t.some(x=>x.length&&x.every(v=>v===x[0]))||tries>20)return t;
  }
}
function start(n){
  L=n;T=gen(n);sel=-1;hist=[];moves=0;hints=3;hm=null;busy=false;
  $('#win').classList.remove('on');
  $('#gt').firstChild.nodeValue='Fase '+n;
  show('game');draw();
}
function fit(){
  const b=$('#board');if(!b.clientWidth)return;
  const n=T.length||5, W=b.clientWidth-16, H=b.clientHeight-16;
  let best=30;
  for(let s=64;s>=26;s-=2){
    const tw=s*1.28,gap=s*.4,th=s*4.45,rg=s*.5;
    const per=Math.max(1,Math.floor((W+gap)/(tw+gap)));
    const rows=Math.ceil(n/per);
    if(rows*(th+rg)-rg<=H){best=s;break}
  }
  document.documentElement.style.setProperty('--s',best+'px');
}
function paint(c,k){const h=COL[c][0];if(k==='ball')return `radial-gradient(circle at 32% 28%,rgba(255,255,255,.95) 0 7%,rgba(255,255,255,.3) 8% 20%,rgba(255,255,255,0) 36%),radial-gradient(circle at 42% 38%,${h},${h} 48%,rgba(0,0,0,.5) 135%),${h}`;return k==='liquid'?`linear-gradient(90deg,rgba(255,255,255,.3),rgba(255,255,255,0) 35%,rgba(0,0,0,.25)),${h}`:`radial-gradient(circle at 35% 30%,${h},${h} 55%,rgba(0,0,0,.35) 140%),${h}`}
function draw(){
  const b=$('#board');b.innerHTML='';b.className='skin-'+save.skin;
  T.forEach((t,i)=>{
    const d=document.createElement('div');
    const lf=i===sel||(hm&&i===hm.a);
    let run=0;if(lf&&t.length){const c=t[t.length-1];while(run<t.length&&t[t.length-1-run]===c)run++}
    d.className='tube'+(i===sel?' sel':'')+(hm&&i===hm.a?' ha':'')+(hm&&i===hm.b?' hb':'')+(isDone(t)?' done':'');
    d.dataset.i=i;
    t.forEach((c,k)=>{
      const e=document.createElement('div');
      e.className='it'+(k>=t.length-run?' lift':'');
      e.style.background=paint(c,save.skin);
      e.textContent=save.skin==='blocos'?COL[c][1]:'';
      d.appendChild(e);
    });
    d.onclick=()=>tap(i);
    b.appendChild(d);
  });
  $('#gm').textContent=moves+(moves===1?' jogada':' jogadas');
  $('#undo').disabled=!hist.length;
  $('#hint').textContent='Dica ('+hints+')';
  $('#hint').disabled=hints<=0||busy;
  fit();
}
const isDone=t=>t.length===CAP&&t.every(v=>v===t[0]);
function pour(a,b,n){
  sel=-1;busy=true;draw();
  const src=document.querySelector(`.tube[data-i="${a}"]`),dst=document.querySelector(`.tube[data-i="${b}"]`);
  const ne=[...dst.querySelectorAll('.it')].slice(-n),H=ne.map(e=>e.getBoundingClientRect().height);
  const surf=ne[n-1].getBoundingClientRect().top;
  const cl=[...ne].reverse().map(e=>{const c=e.cloneNode(true);src.appendChild(c);return c});
  const sr=src.getBoundingClientRect(),dr=dst.getBoundingClientRect();
  const w=sr.width,h=sr.height,dir=dr.left>sr.left?1:-1;
  const scx=sr.left+w/2,scy=sr.top+h/2;
  const lx=scx+dir*(.25*w+.433*h),ly=scy+.433*w-.25*h;
  const lipX=dr.left+dr.width/2-dir*w*.1,lipY=dr.top-14;
  const tx=lipX-lx,ty=lipY-ly,D=1100;
  const hex=COL[T[b][T[b].length-1]][0],sw=Math.max(5,w*.14);
  const st=document.createElement('div');
  st.style.cssText=`position:fixed;z-index:25;pointer-events:none;border-radius:0 0 ${sw}px ${sw}px;transform-origin:top;left:${lipX-sw/2}px;top:${lipY}px;width:${sw}px;height:${Math.max(4,surf-lipY)}px;background:${hex}`;
  document.body.appendChild(st);
  src.classList.add('pour');
  src.animate([{transform:'none'},{transform:`translate(${tx}px,${ty}px) rotate(${dir*58}deg)`,offset:.28},{transform:`translate(${tx}px,${ty}px) rotate(${dir*70}deg)`,offset:.78},{transform:'none'}],{duration:D,easing:'ease-in-out'});
  st.animate([{transform:'scaleY(0)',opacity:1},{transform:'scaleY(1)',opacity:1,offset:.12},{transform:'scaleY(1)',opacity:1,offset:.88},{transform:'scaleY(1)',opacity:0}],{duration:D*.5,delay:D*.28,easing:'linear',fill:'both'});
  st.style.opacity=0;
  const t0=D*.3,tt=D*.45;
  ne.forEach((e,k)=>{
    const d=t0+k*tt/n,du=tt/n;
    e.animate([{height:'0px'},{height:H[k]+'px'}],{duration:du,delay:d,fill:'both',easing:'linear'});
    cl[n-1-k].animate([{height:H[k]+'px'},{height:'0px'}],{duration:du,delay:d,fill:'both',easing:'linear'});
  });
  [420,390,360,330].forEach((f,i)=>setTimeout(()=>beep(f,.12),D*.3+i*110));
  setTimeout(()=>{st.remove();busy=false;draw();if(T.every(x=>!x.length||isDone(x)))win()},D+60);
}
function clearHint(){hm=null;clearTimeout(ht)}
function tap(i){
  if(busy)return;
  clearHint();
  const t=T[i];
  if(sel<0){if(t.length){sel=i;beep(520)}draw();return}
  if(sel===i){sel=-1;beep(380);draw();return}
  const a=sel,sEls=[...document.querySelectorAll(`.tube[data-i="${a}"] .it`)];
  const r=move(a,i);
  if(!r){
    beep(160,.15,'square');
    sel=t.length?i:-1;draw();
    const el=document.querySelector(`.tube[data-i="${i}"]`);if(el){el.classList.add('bad');setTimeout(()=>el.classList.remove('bad'),300)}
    return;
  }
  flyMove(sEls,i,r,a);
}
function flyMove(sEls,b,n,a){
  if(save.skin==='liquid')return pour(a,b,n);
  const from=sEls.slice(-n).map(e=>e.getBoundingClientRect());
  sel=-1;busy=true;draw();
  [...document.querySelectorAll(`.tube[data-i="${b}"] .it`)].slice(-n).forEach((e,k)=>{
    const to=e.getBoundingClientRect(),f=from[n-1-k];
    const dx=f.left-to.left,dy=f.top-to.top;
    e.classList.add('fly');
    const an=e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:`translate(${dx*.5}px,${dy*.5-34}px) scale(1.1)`,offset:.5},{transform:'none'}],{duration:440,delay:k*70,easing:'ease-in-out',fill:'backwards'});
    an.onfinish=()=>e.classList.remove('fly');
  });
  setTimeout(()=>{busy=false;draw();if(T.every(x=>!x.length||isDone(x)))win()},440+n*70+40);
}
function move(a,b){
  const f=T[a],t=T[b];if(!f.length)return false;
  const c=f[f.length-1];
  if(t.length&&t[t.length-1]!==c)return false;
  let k=0;while(k<f.length&&f[f.length-1-k]===c)k++;
  const n=Math.min(k,CAP-t.length);if(n<=0)return false;
  hist.push(JSON.stringify(T));
  for(let i=0;i<n;i++)t.push(f.pop());
  moves++;beep(600+n*60);return n;
}
function win(){
  const s=moves<=cols*4?3:moves<=cols*7?2:1;
  save.s[L]=Math.max(save.s[L]||0,s);
  if(L>=save.u&&L<MAXL)save.u=L+1;store();
  [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,.18,'triangle'),i*110));
  setTimeout(()=>{
    $('#st').textContent='★'.repeat(s)+'☆'.repeat(3-s);
    $('#wm').textContent=moves+' jogadas';
    $('#next').style.display=L>=MAXL?'none':'';
    $('#win').classList.add('on');
  },450);
}
$('#undo').onclick=()=>{if(!hist.length||busy)return;T=JSON.parse(hist.pop());moves=Math.max(0,moves-1);sel=-1;beep(300);draw()};
$('#rs').onclick=()=>{beep(300);start(L)};
function findHint(){
  const key=s=>s.map(t=>t.join('')).join('|');
  const mv=s=>{const r=[];s.forEach((f,a)=>{if(!f.length)return;const c=f[f.length-1],uni=f.every(v=>v===c);s.forEach((t,b)=>{if(a===b||t.length>=CAP)return;if(t.length?t[t.length-1]!==c:uni)return;r.push([a,b])})});return r};
  const ap=(s,a,b)=>{const n=s.map(t=>t.slice()),f=n[a],t=n[b],c=f[f.length-1];while(f.length&&f[f.length-1]===c&&t.length<CAP)t.push(f.pop());return n};
  const h=s=>s.reduce((x,t)=>x+t.reduce((y,v,i)=>y+(i&&t[i-1]===v?0:1),0),0);
  const solved=s=>s.every(t=>!t.length||isDone(t));
  const seen=new Set([key(T)]),bk=[];let cnt=0;
  const push=n=>{const v=h(n.s);(bk[v]=bk[v]||[]).push(n)};
  push({s:T,first:null});
  while(cnt<8000){
    let v=0;while(v<bk.length&&!(bk[v]&&bk[v].length))v++;
    if(v>=bk.length)break;
    const n=bk[v].pop();cnt++;
    for(const [a,b] of mv(n.s)){
      const s2=ap(n.s,a,b),k=key(s2);if(seen.has(k))continue;seen.add(k);
      const first=n.first||[a,b];
      if(solved(s2))return first;
      push({s:s2,first});
    }
  }
  const m=mv(T);return m.length?m[0]:null;
}
$('#hint').onclick=()=>{
  if(busy||hints<=0)return;
  const m=findHint();if(!m){beep(160,.15,'square');return}
  hints--;sel=-1;hm={a:m[0],b:m[1]};beep(700);draw();
  clearTimeout(ht);ht=setTimeout(()=>{hm=null;draw()},2600);
};
$('#next').onclick=()=>start(L+1);
$('#again').onclick=()=>start(L);
$('#play').onclick=()=>{beep(520);start(Math.min(save.u,MAXL))};
$('#levels').onclick=()=>{beep(420);show('lvls')};
$('#howb').onclick=()=>{beep(420);show('how')};
const sndTxt=()=>{const t='Som: '+(snd?'ligado':'desligado');$('#snd').textContent=t;$('#psn').textContent=t};
$('#snd').onclick=$('#psn').onclick=()=>{snd=!snd;sndTxt();beep(480)};
const closeP=()=>$('#pause').classList.remove('on');
$('#pb').onclick=()=>{if(busy)return;beep(420);$('#pause').classList.add('on')};
$('#resume').onclick=()=>{beep(520);closeP()};
$('#prs').onclick=()=>{closeP();beep(300);start(L)};
$('#plv').onclick=()=>{closeP();beep(420);show('lvls')};
$('#pmn').onclick=()=>{closeP();beep(420);show('menu')};
function buildGrid(){
  const g=$('#grid');g.innerHTML='';
  for(let n=1;n<=MAXL;n++){
    const b=document.createElement('button');
    const ok=n<=save.u;
    b.className='lv'+(ok?'':' lock');
    b.innerHTML=ok?`${n}<small>${'★'.repeat(save.s[n]||0)||'&nbsp;'}</small>`:'🔒';
    if(ok)b.onclick=()=>{beep(520);start(n)};
    g.appendChild(b);
  }
}
const SK=[['liquid','Líquidos'],['ball','Bolinhas'],['blocos','Peças']];
function buildSkins(){
  const g=$('#sks');g.innerHTML='';
  SK.forEach(([k,n])=>{
    const b=document.createElement('button');b.className='sk'+(save.skin===k?' on':'');
    b.innerHTML=`<div class="pv skin-${k}"><div class="tube" style="--s:30px;transform:none">${[0,1,2].map(c=>`<div class="it" style="background:${paint(c,k)}">${k==='blocos'?COL[c][1]:''}</div>`).join('')}</div></div>${n}`;
    b.onclick=()=>{save.skin=k;store();beep(560);buildSkins()};
    g.appendChild(b);
  });
}
$('#skb').onclick=()=>{beep(420);show('skins')};
addEventListener('resize',fit);
addEventListener('orientationchange',()=>setTimeout(fit,200));
