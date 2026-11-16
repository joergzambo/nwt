var KIND='std',STD=true;
/* Paket-Tester */
var TL=[{act:'deny',src:A.host('10.10.20.100')},{act:'permit',src:A.addr('10.10.20.0','0.0.0.255')}],TN=10,TW=new Walker($('twalk'),TL,TN,true);
$('tacl').textContent=TL.map(function(l){return A.lineTxt(l,TN,true);}).join('\n')+'\n! (implizit: deny any)';
var TP0=[['👔 Chef','10.10.20.100'],['👷 Mitarbeiterin','10.10.20.55'],['🧳 Gast-WLAN','192.168.1.23']];
$('tpk').innerHTML=TP0.map(function(p,i){return'<button type="button" class="btn ghost sm" data-t="'+i+'">'+p[0]+'</button>';}).join('');
function trun(name,ip){$('tcard').innerHTML='📦 <b>'+name+'</b> · Quelle <span class="mono">'+ip+'</span>';TW.run({src:ip});}
[].forEach.call(document.querySelectorAll('[data-t]'),function(b){b.onclick=function(){var p=TP0[+b.dataset.t];trun(p[0],p[1]);};});
$('tgo').onclick=function(){var v=$('town').value.trim();if(A.isIp(v))trun('Eigenes Paket',v);};
$('town').addEventListener('keydown',function(e){if(e.key==='Enter')$('tgo').click();});
trun(TP0[0][0],TP0[0][1]);
