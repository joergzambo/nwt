var KIND='ext',STD=false;
/* Syntax-Grafik */
(function(){var P=[['access-list','t0'],['110','t1'],['permit','t2'],['tcp','t3'],['192.168.10.0 0.0.0.255','t4'],['host 10.1.1.10','t5'],['eq 80','t6'],['log','t7']];
 $('syn').innerHTML=P.map(function(p){return'<span class="'+p[1]+'">'+esc(p[0])+'</span>';}).join(' ');})();
var TL=[{act:'permit',proto:'tcp',src:A.addr('192.168.10.0','0.0.0.255'),dst:A.host('10.1.1.10'),op:{k:'eq',p:80}},
 {act:'permit',proto:'tcp',src:A.addr('192.168.10.0','0.0.0.255'),dst:A.host('10.1.1.10'),op:{k:'eq',p:443}},
 {act:'deny',proto:'tcp',src:A.ANY,dst:A.ANY,op:{k:'eq',p:23}},
 {act:'deny',proto:'icmp',src:A.ANY,dst:A.host('10.1.1.10'),icmp:'echo'},
 {act:'permit',proto:'udp',src:A.addr('192.168.10.0','0.0.0.255'),dst:A.ANY,op:{k:'eq',p:53}}],TN=110,TW=new Walker($('twalk'),TL,TN,false);
$('tacl').textContent=TL.map(function(l){return A.lineTxt(l,TN,false);}).join('\n')+'\n! (implizit: deny any any)';
var TP0=[['🌐 Webseite (HTTPS)',{src:'192.168.10.25',dst:'10.1.1.10',proto:'tcp',port:443}],['🖥 Telnet zum Server',{src:'192.168.10.25',dst:'10.1.1.10',proto:'tcp',port:23}],['📡 Ping zum Server',{src:'192.168.10.25',dst:'10.1.1.10',proto:'icmp',icmp:'echo'}],['🔎 DNS-Anfrage',{src:'192.168.10.25',dst:'8.8.8.8',proto:'udp',port:53}],['🔐 SSH zum Server',{src:'192.168.10.25',dst:'10.1.1.10',proto:'tcp',port:22}]];
$('tpk').innerHTML=TP0.map(function(p,i){return'<button type="button" class="btn ghost sm" data-t="'+i+'">'+p[0]+'</button>';}).join('');
function trun(name,pk){$('tcard').innerHTML='📦 <b>'+name+'</b> · <span class="mono">'+esc(pkTxt(pk,false))+'</span>';TW.run(pk);}
[].forEach.call(document.querySelectorAll('[data-t]'),function(b){b.onclick=function(){var p=TP0[+b.dataset.t];trun(p[0],p[1]);};});
$('bgo').onclick=function(){var pk={src:$('bs').value.trim(),dst:$('bd').value.trim(),proto:$('bp').value,port:parseInt($('bpo').value,10),icmp:$('bp').value==='icmp'?'echo':null};if(!A.isIp(pk.src)||!A.isIp(pk.dst))return;if(pk.proto==='icmp')pk.port=null;trun('Eigenes Paket',pk);};
$('bp').onchange=function(){$('bpo').disabled=this.value==='icmp';};
trun(TP0[0][0],TP0[0][1]);
/* DMZ-Grafik */
(function(){var W=900,H=250,h='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Internet, Router mit ACL 120 inbound, DMZ mit Webserver und internes Netz">';
 h+='<rect x="8" y="8" width="230" height="'+(H-16)+'" fill="#fff3e0" opacity=".6"/><rect x="560" y="8" width="332" height="110" fill="#fff8e1" stroke="#f9a825" stroke-dasharray="6 4"/><rect x="560" y="132" width="332" height="110" fill="#e8f0fe" opacity=".7"/>';
 h+=tx(20,28,'Internet',{a:'start',fs:12,fw:700,c:OR})+tx(880,28,'DMZ 172.16.1.0/24',{a:'end',fs:12,fw:700,c:'#f57f17'})+tx(880,152,'internes Netz 192.168.10.0/24',{a:'end',fs:12,fw:700,c:BL});
 h+='<path d="M162 125H378M422 125L560 63H700M422 125L560 190H700" stroke="'+INK+'" stroke-width="2.2" fill="none"/>';
 h+=at(120,125,cloud())+tx(120,130,'Internet',{fs:11.5,fw:600,c:MU})+at(400,125,rtr())+tx(400,100,'R1',{fs:13,fw:700});
 h+='<rect x="300" y="138" width="78" height="24" rx="12" fill="'+RD+'"/>'+tx(339,155,'ACL 120 in',{fs:11.5,fw:700,c:'#fff'})+tx(335,118,'Gi0/0',{fs:11.5,mono:1,fw:700});
 h+=at(730,63,srv(GR))+tx(760,58,'Webserver',{a:'start',fs:12,fw:700})+tx(760,74,'172.16.1.80 · 80, 443',{a:'start',fs:11.5,mono:1,c:MU});
 h+=at(730,190,pc(BL))+tx(760,186,'Clients',{a:'start',fs:12,fw:700})+tx(760,202,'192.168.10.0/24',{a:'start',fs:11.5,mono:1,c:MU});
 h+=tx(240,215,'✓ Web auf 172.16.1.80 · ✕ alles andere (log)',{a:'start',fs:12.5,fw:700,c:INK});
 $('dmzsvg').innerHTML=h+'</svg>';})();
