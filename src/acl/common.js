/* ===== Platzierungs-Trainer ===== */
(function(){
 var opts=A.PEOPLE.map(function(p){return'<option>'+p+'</option>';}).join('');$('ps').innerHTML=opts;$('pd').innerHTML=opts;$('ps').value=STD?'Ricky':'Jeff';$('pd').value=STD?'Jeff':'George';
 function go(){var s=$('ps').value,d=$('pd').value;if(s===d){$('ptxt').innerHTML='Quelle und Ziel sind gleich – bitte zwei verschiedene Computer wählen.';return;}
  var pl=A.placement(s,d,STD);$('psvg').innerHTML=topoSvg({src:s,dst:d,path:hostPath(s,d),acl:pl});
  $('ptxt').innerHTML=(pl.none?'<b>Keine Router-ACL möglich.</b> ':'<b>Router '+pl.router+', Interface '+pl.ifc+', '+pl.dir+'</b> – ')+placeText(pl,s,d,STD);}
 $('pgo').onclick=go;$('ps').onchange=go;$('pd').onchange=go;go();
})();


/* ===== Platzierung üben ===== */
(function(){
 /* Fragen aus dem Arbeitsblatt „Access List Placement“ (Ziele mit mehreren Computern liegen im selben LAN) */
 var WS={std:[['permit','Ricky',['Jeff']],['deny','Melvin',['Jenny']],['deny','Sarah',['Carrol']],['permit','Ricky',['Jeff']],['deny','Amanda',['Jeff','Jim']],['permit','Jackie',['Linda']],['permit','George',['Carrol','Amanda']],['deny','Jackie',['Jenny']],['permit','George',['Linda','Sarah']],['deny','Jeff',['George']],['deny','Ricky',['Sarah']],['deny','Linda',['Jackie']]],
  ext:[['deny','Jeff',['George']],['permit','Jackie',['Linda']],['deny','Ricky',['Carrol']],['deny','Jackie',['Sarah']],['permit','Carrol',['Jeff']],['deny','Melvin',['Jeff','Jim']],['permit','George',['Jeff']],['permit','Jim',['Carrol','Amanda']],['deny','Linda',['Kathy']],['deny','Sarah',['Jenny']],['permit','George',['Linda','Sarah']],['deny','Linda',['Jenny']]]};
 var mode='rand',kind=STD?'std':'ext',cur=null,pick=null,dir=null,none=false,done=false,ok=0,tot=0,streak=0,wsi=0,WSL=[];
 WS.std.forEach(function(q,i){WSL.push({k:'std',n:i+1,act:q[0],src:q[1],dst:q[2]});});WS.ext.forEach(function(q,i){WSL.push({k:'ext',n:i+1,act:q[0],src:q[1],dst:q[2]});});
 function rnd(a){return a[Math.floor(Math.random()*a.length)];}
 function nextQ(){
  if(mode==='ws'){var L=WSL.filter(function(q){return kind==='mix'||q.k===kind;});cur=L[wsi%L.length];wsi++;}
  else{var k=kind==='mix'?rnd(['std','ext']):kind,a=rnd(A.PEOPLE),b;do{b=rnd(A.PEOPLE);}while(b===a||(cur&&cur.src===a&&cur.dst[0]===b));cur={k:k,act:rnd(['permit','deny']),src:a,dst:[b]};}
  pick=null;dir=null;none=false;done=false;render();$('trfb').hidden=true;
 }
 function names(d){return d.length>1?d.slice(0,-1).join('s, ')+'s und '+d[d.length-1]+'s Computer':d[0]+'s Computer';}
 function render(fbAns){
  var std=cur.k==='std';
  $('trq').innerHTML=(mode==='ws'?'<span class="tag">Arbeitsblatt '+(std?'Standard':'Extended')+' Nr. '+cur.n+'</span> ':'')+'Wo platzierst du eine <b class="'+(std?'kstd':'kext')+'">'+(std?'Standard':'Extended')+'-ACL</b>, die den Verkehr von <b>'+cur.src+'s Computer</b> zu <b>'+names(cur.dst)+'</b> '+(cur.act==='permit'?'<b>erlaubt</b>':'<b>sperrt</b>')+'?';
  var o={hot:!done,pick:pick?{r:pick.r,i:pick.i}:null};
  if(done){o.src=cur.src;o.dst=cur.dst[0];o.path=hostPath(cur.src,cur.dst[0]);o.acl=fbAns;o.pickOk=fbAns&&!fbAns.none&&pick&&pick.r===fbAns.router&&pick.i===fbAns.ifc;}
  $('trsvg').innerHTML=topoSvg(o);
  [].forEach.call(document.querySelectorAll('#trdir button'),function(b){b.classList.toggle('on',b.dataset.d===dir);b.disabled=done||none;});
  $('trnone').classList.toggle('on',none);$('trnone').disabled=done;$('trcheck').disabled=done;
  $('trpick').innerHTML=none?'Deine Antwort: <b>keine Router-ACL</b>':pick?'Deine Wahl: <b>Router '+pick.r+', '+pick.i+(dir?', '+dir:'')+'</b>':'Noch kein Interface gewählt.';
  $('trscore').innerHTML=tot?'<b>'+ok+'</b> von '+tot+' richtig'+(streak>1?' · 🔥 '+streak+' in Folge':''):'';
  [].forEach.call(document.querySelectorAll('#trmode button'),function(b){b.classList.toggle('on',b.dataset.m===mode);});
  [].forEach.call(document.querySelectorAll('#trkind button'),function(b){b.classList.toggle('on',b.dataset.k===kind);});
 }
 $('trsvg').addEventListener('click',function(e){if(done)return;var g=e.target.closest('.hot');if(!g)return;pick={r:g.dataset.r,i:g.dataset.i};none=false;render();});
 $('trsvg').addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var g=e.target.closest&&e.target.closest('.hot');if(g){e.preventDefault();g.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
 [].forEach.call(document.querySelectorAll('#trdir button'),function(b){b.onclick=function(){dir=b.dataset.d;none=false;render();};});
 $('trnone').onclick=function(){none=!none;if(none){pick=null;dir=null;}render();};
 $('trcheck').onclick=function(){
  if(!none&&(!pick||!dir)){$('trfb').hidden=false;$('trfb').innerHTML='<p>Bitte zuerst ein Interface anklicken und die Richtung wählen – oder „keine Router-ACL möglich“.</p>';return;}
  var std=cur.k==='std',ans=A.placement(cur.src,cur.dst[0],std),good=ans.none?none:(!none&&pick.r===ans.router&&pick.i===ans.ifc&&dir===ans.dir);
  done=true;tot++;if(good){ok++;streak++;}else streak=0;render(ans);
  var why='';if(!good&&!ans.none&&!none){if(pick.r!==ans.router||pick.i!==ans.ifc)why=std?'Eine Standard-ACL gehört <b>nahe ans Ziel</b>, nicht an '+(pick.r===A.lanOf(cur.src).r?'den Router der Quelle':'einen Router unterwegs')+'.':'Eine Extended-ACL gehört <b>nahe an die Quelle</b> – dort, wo die Pakete ins Netz eintreten.';else why='Das Interface stimmt, aber die Richtung nicht: '+(std?'Die Pakete <b>verlassen</b> hier den Router Richtung Ziel → <b>out</b>.':'Die Pakete <b>kommen</b> hier von der Quelle in den Router → <b>in</b>.');}
  if(!good&&none&&!ans.none)why='Quelle und Ziel liegen in <b>verschiedenen</b> Netzen – dazwischen liegt mindestens ein Router.';
  
  $('trfb').hidden=false;$('trfb').innerHTML='<p class="verdict '+(good?'ok':'no')+'">'+(good?'✓ Richtig!':'✕ Leider falsch.')+' Lösung: <b>'+(ans.none?'keine Router-ACL möglich':'Router '+ans.router+', '+ans.ifc+', '+ans.dir)+'</b></p>'+(why?'<p>'+why+'</p>':'')+'<p>'+placeText(ans,cur.src,cur.dst[0],std)+'</p>';
 };
 $('trnext').onclick=nextQ;
 [].forEach.call(document.querySelectorAll('#trmode button'),function(b){b.onclick=function(){mode=b.dataset.m;wsi=0;nextQ();};});
 [].forEach.call(document.querySelectorAll('#trkind button'),function(b){b.onclick=function(){kind=b.dataset.k;wsi=0;nextQ();};});
 nextQ();
 window.__tr={cur:function(){return cur;},state:function(){return{ok:ok,tot:tot};}};
})();

/* ===== Wildcard-Rechner (nur Standard-Seite) ===== */
if($('wout')){
 $('wp').innerHTML='<option value="">–</option>'+[8,16,20,21,22,23,24,25,26,27,28,29,30,32].map(function(p){return'<option value="'+p+'">/'+p+'</option>';}).join('');
 function bin8(o){return('0000000'+o.toString(2)).slice(-8);}
 function wrender(){
  var a=$('wa').value.trim(),w=$('ww').value.trim(),t=$('wt').value.trim();
  if(!A.isIp(a)||!A.isIp(w)){$('wout').innerHTML='<p class="err">Bitte Adresse und Wildcard im Format a.b.c.d eingeben.</p>';return;}
  var r=A.range(a,w),wo=A.octs(w),cont=wo.map(bin8).join('').replace(/^0*/,'').indexOf('0')<0,n=wo.reduce(function(s,o){return s*(o+1);},1);
  var h='<div class="scroll"><table class="rw"><tr><th></th><th>1. Oktett</th><th>2. Oktett</th><th>3. Oktett</th><th>4. Oktett</th></tr>';
  h+='<tr><th>Adresse</th>'+A.octs(a).map(function(o,i){return'<td>'+o+'<br><small class="mono">'+bin8(o)+'</small></td>';}).join('')+'</tr>';
  h+='<tr><th>Wildcard</th>'+wo.map(function(o){return'<td>'+o+'<br><small class="mono">'+bin8(o).split('').map(function(b){return'<i class="'+(b==='1'?'eg':'mu')+'">'+b+'</i>';}).join('')+'</small></td>';}).join('')+'</tr></table></div>';
  h+='<p class="res">'+(w==='0.0.0.0'?'Genau ein Host: <b>'+a+'</b> (= <code>host '+a+'</code>)':w==='255.255.255.255'?'<b>Jede</b> Adresse (= <code>any</code>)':'Getroffen werden <b>'+r.first+'</b> bis <b>'+r.last+'</b> – '+n.toLocaleString('de-AT')+' Adressen.')+(cont?'':' <span class="no">Achtung: keine zusammenhängende Wildcard – trifft verstreute Adressen.</span>')+'</p>';
  if(A.isIp(t))h+='<p class="verdict '+(A.wmatch(t,a,w)?'ok':'no')+'">'+t+(A.wmatch(t,a,w)?' passt ✓ – alle Bits, wo die Wildcard 0 hat, stimmen überein.':' passt nicht ✕ – mindestens ein Bit, das übereinstimmen muss (Wildcard 0), ist anders.')+'</p>';
  $('wout').innerHTML=h;
 }
 ['wa','ww','wt'].forEach(function(id){$(id).addEventListener('input',wrender);});
 $('wp').onchange=function(){if(!this.value)return;var p=+this.value,m=A.octs(A.maskOfP(p));$('ww').value=A.wcOfP(p);if(A.isIp($('wa').value.trim()))$('wa').value=A.octs($('wa').value.trim()).map(function(o,i){return o&m[i];}).join('.');wrender();};
 wrender();
}

/* ===== Quiz ===== */
var Q=STD?[
 ['Was prüft eine Standard-ACL?',['Quelle und Ziel','Nur die Quell-IP-Adresse','Nur den Port','Die MAC-Adresse'],1,'Standard-ACLs kennen nur die Quell-Adresse. Alles andere können erst Extended-ACLs.'],
 ['Welche Nummern sind Standard-ACLs?',['1–99 und 1300–1999','100–199 und 2000–2699','200–299','beliebig'],0,'100–199 und 2000–2699 sind Extended-ACLs.'],
 ['Eine ACL hat nur die Zeile „access-list 1 deny host 10.0.0.5“. Was passiert mit einem Paket von 10.0.0.9?',['Es darf durch','Es wird verworfen – implizites deny any','Es wird an 10.0.0.5 umgeleitet','Fehlermeldung'],1,'Keine Zeile passt → das unsichtbare deny any am Ende greift. Man bräuchte noch permit any.'],
 ['Zeile 1: permit 10.1.1.0 0.0.0.255 · Zeile 2: deny host 10.1.1.7. Was passiert mit 10.1.1.7?',['deny','permit – Zeile 1 passt zuerst','beides','implizites deny'],1,'First Match: Zeile 1 trifft schon zu, Zeile 2 wird nie erreicht. Die genauere Zeile gehört nach oben.'],
 ['Welche Wildcard gehört zu 255.255.255.240?',['0.0.0.15','0.0.0.16','255.255.255.15','0.0.0.240'],0,'255 − 240 = 15.'],
 ['Was bedeutet „192.168.1.0 0.0.0.255“?',['Nur 192.168.1.0','192.168.1.0 bis 192.168.1.255','192.168.0.0 bis 192.168.255.255','Nichts'],1,'Die letzten 8 Bit sind egal (255), die ersten 24 müssen passen.'],
 ['Wo platziert man eine Standard-ACL?',['Möglichst nahe an der Quelle, inbound','Möglichst nahe am Ziel','Immer am Router zum Internet','Auf dem Switch'],1,'Weil sie nur die Quelle kennt – nahe an der Quelle würde sie die Quelle von allem aussperren.'],
 ['Mit welchem Befehl schützt man die VTY-Leitungen eines Routers?',['ip access-group 5 in','access-class 5 in','access-list 5 vty','ip vty 5'],1,'An Interfaces: ip access-group. An line vty: access-class.']]:[
 ['Was kann eine Extended-ACL zusätzlich zur Standard-ACL prüfen?',['Nur die Quelle','Protokoll, Ziel und Ports','Die MAC-Adresse','Die Uhrzeit des Absenders'],1,'Extended: Protokoll, Quelle, Ziel, Ports (bei TCP/UDP), ICMP-Typ.'],
 ['Welche Nummern sind Extended-ACLs?',['1–99','100–199 und 2000–2699','1300–1999','300–399'],1,'1–99 und 1300–1999 sind Standard-ACLs.'],
 ['Welcher Port gehört zu HTTPS?',['80','443','22','53'],1,'HTTP 80, HTTPS 443, SSH 22, DNS 53.'],
 ['„deny ip any any“ – was wird gesperrt?',['nur TCP','nur Ping','alle IP-Pakete (TCP, UDP, ICMP …)','nichts'],2,'ip umfasst alle Protokolle.'],
 ['„permit tcp any host 10.1.1.10 eq 80“ – welcher Port ist gemeint?',['Quell-Port 80','Ziel-Port 80, also der Webserver-Dienst','beide','irgendeiner'],1,'Die Port-Angabe steht hinter dem Ziel → Ziel-Port.'],
 ['Wo platziert man eine Extended-ACL?',['Möglichst nahe am Ziel','Möglichst nahe an der Quelle, inbound','Nur am Internet-Router','Auf jedem Router'],1,'Sie kennt Quelle und Ziel – unerwünschter Verkehr kann gleich am Anfang verworfen werden.'],
 ['Was bewirkt „established“?',['Es erlaubt nur neue Verbindungen','Es lässt nur TCP-Pakete bestehender Verbindungen durch (ACK/RST gesetzt)','Es protokolliert','Es gilt nur für UDP'],1,'Damit lassen sich Antworten auf Verbindungen von innen erlauben, ohne neue Verbindungen von außen zu öffnen.'],
 ['Was ist bei named ACLs mit Sequenznummern möglich?',['Nichts Besonderes','Einzelne Zeilen löschen und dazwischen einfügen','Mehrere ACLs pro Interface und Richtung','IPv4 und IPv6 mischen'],1,'z. B. „15 deny …“ fügt zwischen 10 und 20 ein, „no 20“ löscht Zeile 20.']];
$('qz').innerHTML=Q.map(function(q,n){return'<div class="q" data-n="'+n+'"><p>'+(n+1)+'. '+q[0]+'</p><div class="opts col">'+q[1].map(function(o,j){return'<label><input type="radio" name="q'+n+'" value="'+j+'"> '+esc(o)+'</label>';}).join('')+'</div><div class="ex">'+q[3]+'</div></div>';}).join('')+
 '<div class="acts"><button class="btn" type="button" id="qcheck">Prüfen</button><span class="fb" id="qfb" aria-live="polite"></span></div>';
$('qcheck').onclick=function(){var ok=0;Q.forEach(function(q,n){var box=document.querySelector('.q[data-n="'+n+'"]'),c=box.querySelector('input:checked');box.querySelectorAll('label').forEach(function(l){var v=+l.querySelector('input').value;l.classList.remove('right','wrong','missed');if(c&&+c.value===v)l.classList.add(v===q[2]?'right':'wrong');else if(v===q[2]&&c)l.classList.add('missed');});if(c){box.querySelector('.ex').classList.add('open');if(+c.value===q[2])ok++;}});
 var fb=$('qfb');fb.className='fb '+(ok===Q.length?'good':'bad');fb.textContent=ok+' von '+Q.length+' richtig'+(ok===Q.length?' ✓':'.');};

/* ===== Übungen ===== */
var cache={};
function mk(code){var m=code.split('-');return A.makeTask(+m[1],m[0],KIND);}
function taskOf(card){var c=card.dataset.code;if(!cache[c])cache[c]=mk(c);return cache[c];}
function placeQ(s,id,no){
 var p=s.place,h='<p class="qh">'+no+'. Wo platzierst du eine '+(STD?'Standard':'Extended')+'-ACL, die den Verkehr von <b>'+p.src+'s</b> Computer zu <b>'+p.dst+'s</b> Computer '+(p.act==='permit'?'erlaubt':'sperrt')+'?</p>';
 h+='<div class="inrow"><label>Router <select class="one pr"><option value="">–</option>'+['A','B','C','D','E','F'].map(function(r){return'<option>'+r+'</option>';}).join('')+'<option value="none">keiner (gleiches LAN)</option></select></label><label>Interface <select class="one pi"><option value="">–</option></select></label><label>Richtung <select class="one pdir"><option value="">–</option><option>in</option><option>out</option></select></label></div>';
 return h;
}
function evalQ(s,no){
 var a=s.acl,h='<p class="qh">'+no+'. Die ACL '+a.num+' ist aktiv. Was passiert mit diesen Paketen?</p><pre class="cli">'+esc(a.lines.map(function(l){return A.lineTxt(l,a.num,STD);}).join('\n'))+'</pre><div class="scroll"><table class="cmp evt"><tr><th>Paket</th><th>Ergebnis</th><th>durch Zeile</th></tr>';
 a.tests.forEach(function(t,k){h+='<tr><td class="mono">'+esc(pkTxt(t,STD))+'</td><td><select class="one ea" data-k="'+k+'"><option value="">–</option><option>permit</option><option>deny</option></select></td><td><select class="one el" data-k="'+k+'"><option value="">–</option>'+a.lines.map(function(l,i){return'<option value="'+i+'">Zeile '+(i+1)+'</option>';}).join('')+'<option value="-1">implizites deny</option></select></td></tr>';});
 return h+'</table></div>';
}
function taskHTML(s,id,label){
 var h='<div class="card task" id="'+id+'" data-code="'+s.code+'"><h3>'+label+' <span class="tag">'+A.LVNAME[s.level]+'</span><span class="tag">Nr. '+s.code+'</span></h3>';
 if(STD){var w=s.wild;h+='<p class="qh">1. Welche Quell-Adressen trifft <span class="mono">access-list 1 permit '+esc(w.txt)+'</span>?</p><div class="inrow"><label>von <input class="one w1" size="15" autocomplete="off"></label><label>bis <input class="one w2" size="15" autocomplete="off"></label></div>'+evalQ(s,2)+placeQ(s,id,3);}
 else{var b=s.build;h+=evalQ(s,1);
  h+='<p class="qh">2. Baue die Zeile für access-list 150: '+esc(b.ask)+'</p><div class="inrow bld"><select class="one b1"><option value="">Aktion</option><option>permit</option><option>deny</option></select><select class="one b2"><option value="">Protokoll</option><option>ip</option><option>tcp</option><option>udp</option><option>icmp</option></select><select class="one b3"><option value="">Quelle</option><option>any</option><option>'+b.lan+'.0 0.0.0.255</option><option>'+b.lan+'.0 255.255.255.0</option><option>host '+b.lan+'.0</option></select><select class="one b4"><option value="">Ziel</option><option>host '+b.srv+'</option><option>'+b.srv+' 255.255.255.255</option><option>any</option></select><select class="one b5"><option value="">Port</option>'+A.SVC.map(function(x){return'<option>eq '+x[1]+'</option>';}).join('')+'<option value="none">(kein Port)</option></select></div>'+placeQ(s,id,3);}
 return h+'<div class="acts"><button class="btn" type="button" data-act="check">Prüfen</button><button class="btn ghost" type="button" data-act="sol">Lösung anzeigen</button><span class="fb" aria-live="polite"></span></div><div class="sol"></div></div>';
}
document.addEventListener('change',function(e){var t=e.target;if(!t.classList||!t.classList.contains('pr'))return;var card=t.closest('.task'),pi=card.querySelector('.pi');pi.innerHTML='<option value="">–</option>'+(t.value&&t.value!=='none'?A.ifaces(t.value).map(function(i){return'<option>'+i+'</option>';}).join(''):'');pi.disabled=pi.parentNode.parentNode.querySelector('.pdir').disabled=t.value==='none';});
function mark(el,ok){el.classList.remove('right','wrong');if(ok!==null)el.classList.add(ok?'right':'wrong');}
function check(card){
 var s=taskOf(card),ok=0,tot=0;
 function q(el,want){tot++;var v=el.value;mark(el,v===''?null:v===String(want));if(v===String(want))ok++;}
 if(STD){tot+=1;var w1=card.querySelector('.w1'),w2=card.querySelector('.w2'),g=w1.value.trim()===s.wild.first&&w2.value.trim()===s.wild.last;mark(w1,w1.value===''?null:w1.value.trim()===s.wild.first);mark(w2,w2.value===''?null:w2.value.trim()===s.wild.last);if(g)ok++;}
 s.acl.tests.forEach(function(t,k){q(card.querySelector('.ea[data-k="'+k+'"]'),t.res.act);q(card.querySelector('.el[data-k="'+k+'"]'),t.res.line);});
 if(!STD){var b=s.build;tot+=1;var vals=['.b1','.b2','.b3','.b4','.b5'].map(function(c){return card.querySelector(c);}),want=[b.act,b.proto,b.src,b.dst,b.port],all=true;vals.forEach(function(el,i){var g=el.value===want[i];mark(el,el.value===''?null:g);if(!g)all=false;});if(all)ok++;}
 var pl=s.place.ans,pr=card.querySelector('.pr'),pi=card.querySelector('.pi'),pd=card.querySelector('.pdir');tot+=1;
 if(pl.none){mark(pr,pr.value===''?null:pr.value==='none');if(pr.value==='none')ok++;}
 else{var g1=pr.value===pl.router,g2=pi.value===pl.ifc,g3=pd.value===pl.dir;mark(pr,pr.value===''?null:g1);mark(pi,pi.value===''?null:g2);mark(pd,pd.value===''?null:g3);if(g1&&g2&&g3)ok++;}
 var fb=card.querySelector('.fb'),all2=ok===tot;fb.className='fb '+(all2?'good':'bad');fb.textContent=all2?'Alles richtig! ✓':ok+' von '+tot+' richtig.';if(all2)card.dataset.solved='1';markToc();
}
function solHTML(s){
 var h='<h3 style="font:400 20px var(--head);margin:0">Lösung</h3><ul class="slist">',n=1;
 if(STD){var w=s.wild;h+='<li><b>1. '+w.first+' bis '+w.last+'</b><br><span class="hint">'+(w.p===32?'host = genau eine Adresse.':'Wildcard '+w.wc+' = Präfix /'+w.p+': Die letzten '+(32-w.p)+' Bit sind egal. Kleinste Adresse: alle egal-Bits 0, größte: alle egal-Bits 1.')+'</span></li>';n=2;}
 var a=s.acl;h+='<li><b>'+n+'. Auswertung</b> <span class="hint">(First Match – die erste passende Zeile entscheidet)</span><ul>';
 a.tests.forEach(function(t){h+='<li class="mono">'+esc(pkTxt(t,STD))+' → <b class="'+(t.res.act==='permit'?'ok':'no')+'">'+t.res.act+'</b> '+(t.res.line<0?'(keine Zeile passt → implizites deny)':'(Zeile '+(t.res.line+1)+')')+'</li>';});
 h+='</ul></li>';
 if(!STD){var b=s.build;h+='<li><b>2. access-list 150 '+b.act+' '+b.proto+' '+b.src+' '+b.dst+' '+b.port+'</b><br><span class="hint">'+b.svc[2]+' läuft über '+b.svc[0].toUpperCase()+' Port '+b.svc[1]+'. Netz mit <b>Wildcard</b> (nicht Subnetzmaske), einzelner Server mit <code>host</code>, Port hinter dem Ziel.</span></li>';}
 var p=s.place,pl=p.ans;h+='<li><b>3. '+(pl.none?'Keiner – gleiches LAN':'Router '+pl.router+', '+pl.ifc+', '+pl.dir)+'</b><br><span class="hint">'+placeText(pl,p.src,p.dst,STD)+'</span><div class="miniTopo">'+topoSvg({src:p.src,dst:p.dst,path:hostPath(p.src,p.dst),acl:pl})+'</div></li>';
 return h+'</ul>';
}
document.addEventListener('click',function(e){var t=e.target.closest&&e.target.closest('[data-act]');if(!t)return;var card=t.closest('.task');if(!card)return;
 if(t.dataset.act==='check')check(card);
 if(t.dataset.act==='sol'){var so=card.querySelector('.sol');if(!so.innerHTML)so.innerHTML=solHTML(taskOf(card));var o=so.classList.toggle('open');t.textContent=o?'Lösung ausblenden':'Lösung anzeigen';}});
