/* NWT · Netzwerksicherheit: HSRP-Hijacking mit Yersinia.
   Wahl-Modell (Priorität/Preempt/IP), Coup-Paket, Wireshark-Mitschnitt, Aufgaben-Generator.
   Browser: window.HS · Node: globalThis.HS */
(function (G) {
'use strict';
var LVNAME = {L: 'Leicht', M: 'Mittel', S: 'Schwer'};
var LVCODE = {L: 3, M: 4, S: 5};
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function ri(r,a,b){return a+Math.floor(r()*(b-a+1));}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function hex(r,n){var s='';for(var i=0;i<n;i++)s+='0123456789abcdef'[Math.floor(r()*16)];return s;}

/* Virtuelle MAC HSRPv1: 0000.0c07.acXX, XX = Gruppennummer (hex) */
function vmac(group){var g=('0'+group.toString(16)).slice(-2);return '0000.0c07.ac'+g;}

/* ---------- Wahl-Modell ----------
   Active = höchste Priorität; bei Gleichstand höchste IP. Standby = Zweitbester.
   Angreifer kündigt attPrio an und hat die höchste IP (gewinnt also Gleichstände).
   auth: 'none' | 'plain' (Klartext, Standard 'cisco' – wird von Yersinia mitgeschickt) | 'md5'.
   Übernahme gelingt, wenn der Angreifer die Wahl gewinnt UND die Authentifizierung nicht MD5 ist. */
function winner(list){
  // list: [{name, prio, ip}] -> gewinnt höchste prio, dann höchste ip
  return list.slice().sort(function(a,b){return b.prio-a.prio || ipn(b.ip)-ipn(a.ip);})[0];
}
function ipn(ip){var p=ip.split('.');return ((+p[0])<<24|(+p[1])<<16|(+p[2])<<8|(+p[3]))>>>0;}

function simulate(s){
  var routers=[{name:'R1',prio:s.r1.prio,ip:s.r1.ip},{name:'R2',prio:s.r2.prio,ip:s.r2.ip}];
  var activeBefore=winner(routers), standbyBefore=routers.filter(function(x){return x.name!==activeBefore.name;})[0];
  // Mindest-Priorität des Angreifers, um Active zu werden:
  // Angreifer-IP ist die höchste -> bei Gleichstand gewinnt er -> es genügt prio == aktive prio.
  var minPrio=activeBefore.prio;
  // Yersinia-Standard: Prio 255, höchste IP -> gewinnt die Wahl immer.
  var attWins = (s.att.prio>activeBefore.prio) || (s.att.prio===activeBefore.prio && ipn(s.att.ip)>ipn(activeBefore.ip));
  var takeover = attWins && s.auth!=='md5';
  var stop = s.auth==='md5' ? 'md5' : 'none';
  return {
    activeBefore: activeBefore.name, activeBeforePrio: activeBefore.prio,
    standbyBefore: standbyBefore.name, minPrio: minPrio,
    attWins: attWins, takeover: takeover, stop: stop
  };
}

/* ---------- Wireshark-Mitschnitt ----------
   HSRPv1: UDP 1985, Ziel-Multicast 224.0.0.2, virtuelle MAC als Quelle der Hellos.
   Zeigt: normale Hellos (Active/Standby), dann Coup + Hello des Angreifers (Prio 255, Active). */
function capture(r, s, n){
  var rows=[], t=0, no=1, mc='224.0.0.2';
  function add(src, info, bad, coup){rows.push({no:no++,t:(t+=1+r()*1.8).toFixed(3),src:src,dst:mc,proto:'HSRP',info:info,bad:!!bad,coup:!!coup});}
  var vm=vmac(s.group), ap=s.auth==='plain'?'  Auth: cisco':s.auth==='md5'?'  Auth: MD5':'';
  var hellos=Math.max(2,Math.min(n||4,6));
  for(var i=0;i<hellos;i++){
    add(s.r1.ip, 'Hello  (state '+(s.res.activeBefore==='R1'?'Active':'Standby')+', group '+s.group+', prio '+s.r1.prio+', vIP '+s.vip+')'+ap);
    add(s.r2.ip, 'Hello  (state '+(s.res.activeBefore==='R2'?'Active':'Standby')+', group '+s.group+', prio '+s.r2.prio+', vIP '+s.vip+')'+ap);
  }
  // Angriff
  add(s.att.ip, 'Coup   (group '+s.group+', prio '+s.att.prio+', vIP '+s.vip+')'+(s.auth==='plain'?'  Auth: cisco':s.auth==='md5'?'  Auth: MD5 (falsch!)':''), true, true);
  if(s.res.takeover){
    for(var j=0;j<2;j++){
      add(s.att.ip, 'Hello  (state Active, group '+s.group+', prio '+s.att.prio+', vIP '+s.vip+')'+(s.auth==='plain'?'  Auth: cisco':''), true);
      add(s.res.activeBefore==='R1'?s.r1.ip:s.r2.ip, 'Hello  (state Speak, group '+s.group+', prio '+s.res.activeBeforePrio+', vIP '+s.vip+')'+ap, false);
    }
  } else {
    add(s.att.ip, 'Coup   (group '+s.group+', prio '+s.att.prio+')  → verworfen (MD5 schlägt fehl)', true, true);
  }
  return rows;
}

/* ---------- Generator ---------- */
function build(r, lvl){
  var group=pick(r,[1,2,5,10,20]);
  var sub=ri(r,1,40);
  var r1ip='10.0.'+sub+'.'+pick(r,[1,2,3]);
  var r2ip='10.0.'+sub+'.'+pick(r,[4,5,6]);
  var vip='10.0.'+sub+'.254';          // virtuelle IP
  var attIp='10.0.'+sub+'.'+pick(r,[200,210,250,253]); // Angreifer, hohe IP
  // Prioritäten: Standard 100; ein Router oft höher gesetzt
  var p1=pick(r,[100,110,120,150,90]), p2=pick(r,[100,105,120,90,80]);
  if(p1===p2) p2=p1+pick(r,[-10,10,-5,5]);
  // Angreifer: Yersinia-Standard 255 (manchmal knapp darüber als Variante)
  var attPrio=lvl==='S'?pick(r,[255,255,200]):255;
  var auth=lvl==='L'?'none':lvl==='M'?pick(r,['none','plain','plain']):pick(r,['plain','md5','md5','none']);
  var s={group:group, vip:vip, r1:{ip:r1ip,prio:p1,preempt:false}, r2:{ip:r2ip,prio:p2,preempt:false},
    att:{ip:attIp,prio:attPrio}, auth:auth};
  s.res=simulate(s);
  return s;
}
function makeTask(seed, lvl){
  if(!LVCODE[lvl]||!(seed>=1)) return null;
  var r=mulberry32((seed*7919+LVCODE[lvl]*1000003+9173)>>>0);
  var s=build(r,lvl);
  s.level=lvl; s.code=lvl+'-'+seed;
  return s;
}

G.HS={LVNAME:LVNAME, simulate:simulate, capture:capture, makeTask:makeTask, mulberry32:mulberry32, vmac:vmac, ipn:ipn};
})(typeof window!=='undefined'?window:globalThis);
