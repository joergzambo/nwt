/* ===== Arbeitsblatt ===== */
function sheetTasks(lvl,seed,n){var out=[];for(var i=0;i<n;i++){var l=lvl==='X'?(i%2?'S':'M'):lvl;out.push(NAx.makeTask(seed+i,l));}return out;}
function sheetHTML(group,tasks,head){
 var h='<section class="paper"><header class="ph"><div><b>IP-Adressierung – Netzadresse</b>'+(group?' · Gruppe '+group:'')+'</div><div class="mute">Blatt '+head+'</div></header><div class="namel"><span>Name: ____________________________</span><span>Klasse: ________</span><span>Datum: ____________</span></div>';
 tasks.forEach(function(s,k){var d=s.d,q=s.q;
  h+='<div class="wt"><h4>Aufgabe '+(k+1)+' <span class="mute">('+s.code+')</span></h4><p><b>a) Errechne die Netzadresse der folgenden IP! (Rechenweg angeben!)</b></p>'+
   '<div class="wgrid"><div>'+dialog(d.ip,d.mask,d.gw)+'</div><div class="lines"></div></div>'+
   '<p><b>b) Liegt das Standardgateway im selben Netz? Begründe!</b></p><div class="lines sm"></div>'+
   '<p><b>c) Sind beide Geräte im gleichen Netz?</b><br>'+q.a+' und '+q.b+' mit der Subnetzmaske '+q.mask+'</p><div class="lines"></div></div>';});
 return h+'</section>';
}
function solSheet(group,tasks,head){
 var h='<section class="paper solp"><header class="ph"><div><b>Lösungen</b>'+(group?' · Gruppe '+group:'')+'</div><div class="mute">Blatt '+head+'</div></header>';
 tasks.forEach(function(s,k){var d=s.d,q=s.q;
  h+='<div class="wt"><h4>Aufgabe '+(k+1)+' <span class="mute">('+s.code+')</span></h4><p><b>a)</b> '+d.ip+' / '+d.mask+'</p>'+rechenweg(d.ip,d.mask)+
   '<p><b>b)</b> '+gwText(d)+'</p><p><b>c)</b> '+q.a+' → '+q.na+' · '+q.b+' → '+q.nb+' · <b>'+(q.same?'gleiches Netz':'verschiedene Netze')+'</b></p></div>';});
 return h+'</section>';
}
var sheetReady=false;
function makeSheet(){
 var lvl=$('wlvl').value,n=+$('wn').value,code=$('wcode').value.trim(),seed,m=/^\s*([LMSX])\s*-?\s*(\d{1,6})\s*$/i.exec(code);
 if(code&&!m){$('wmsg').textContent='Blatt-Nummer bitte wie M-123 eingeben.';return;}
 if(m){lvl=m[1].toUpperCase();seed=+m[2];$('wlvl').value=lvl;}else seed=1+Math.floor(Math.random()*90000);
 var head=lvl+'-'+seed,A=sheetTasks(lvl,seed,n),html=sheetHTML($('wab').checked?'A':'',A,head),sol=$('wsol').checked?solSheet($('wab').checked?'A':'',A,head):'';
 if($('wab').checked){var B=sheetTasks(lvl,seed+5000,n);html+=sheetHTML('B',B,head);if($('wsol').checked)sol+=solSheet('B',B,head);}
 $('sheet').innerHTML=html+sol;$('wcode').value=head;$('wprint').disabled=false;sheetReady=true;
 $('wmsg').innerHTML='Blatt <b>'+head+'</b> erstellt – mit dieser Nummer bekommst du es jederzeit wieder. Vorschau unten, Drucken druckt nur das Blatt'+($('wsol').checked?' (Lösungen auf eigener Seite)':'')+'.';
}
$('wgo').onclick=makeSheet;
$('wprint').onclick=function(){if(!sheetReady)return;document.body.classList.add('printing');window.print();setTimeout(function(){document.body.classList.remove('printing');},500);};
window.addEventListener('afterprint',function(){document.body.classList.remove('printing');});
window.__sheet=makeSheet;
