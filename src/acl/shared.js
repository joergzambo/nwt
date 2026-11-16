var $=function(i){return document.getElementById(i);},A=window.ACL,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var MONO='ui-monospace,Menlo,Consolas,monospace',SANS='Open Sans,Arial,sans-serif',INK='#1c2b33',MU='#546e7a',BL='#1565c0',GR='#2e7d32',OR='#e65100',RD='#c62828',PU='#6a1b9a';
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function tx(x,y,t,o){o=o||{};return'<text x="'+x+'" y="'+y+'" text-anchor="'+(o.a||'middle')+'" font-size="'+(o.fs||13)+'" font-weight="'+(o.fw||400)+'" fill="'+(o.c||INK)+'"'+(o.op!=null?' opacity="'+o.op+'"':'')+' font-family="'+(o.mono?MONO:SANS)+'">'+esc(t)+'</text>';}
function at(x,y,g){return'<g transform="translate('+x+' '+y+')">'+g+'</g>';}
function pc(col,s){s=s||1;return'<g transform="scale('+s+')"><rect x="-20" y="-16" width="40" height="28" rx="3" fill="#fff" stroke="'+col+'" stroke-width="2.5"/><rect x="-15" y="-12" width="30" height="19" fill="'+col+'" opacity=".16"/><path d="M-8 15h16M0 12v3" stroke="'+col+'" stroke-width="2.5"/></g>';}
function rtr(){return'<ellipse cx="0" cy="7" rx="22" ry="8" fill="#1f5872"/><rect x="-22" y="-7" width="44" height="14" fill="#2f7392"/><ellipse cx="0" cy="-7" rx="22" ry="8" fill="#5a9dbb" stroke="#1f5872"/><path d="M-11 -7h7M4 -7h7M-1 -12v4M-1 -5v4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>';}
function sw(){return'<path d="M-30 -5l10 -10h48l-10 10z" fill="#6aaecb" stroke="#1f5872"/><path d="M-30 -5h48v16h-48z" fill="#2f7392"/><path d="M18 -5l10 -10v16l-10 10z" fill="#1f5872"/><path d="M-22 1h10M-6 1h10M-18 6h10M-2 6h10" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>';}
function srv(col){return'<rect x="-15" y="-22" width="30" height="44" rx="3" fill="#fff" stroke="'+col+'" stroke-width="2.5"/><path d="M-9 -13h18M-9 -5h18M-9 3h18" stroke="'+col+'" stroke-width="2.5" stroke-linecap="round"/><circle cx="7" cy="13" r="2.4" fill="'+col+'"/>';}
function cloud(){return'<path d="M-34 14a16 16 0 0 1 2 -31a22 22 0 0 1 41 -6a17 17 0 0 1 25 18a12 12 0 0 1 -4 19z" fill="#eef2f5" stroke="#78909c" stroke-width="2"/>';}

/* ===== Topologie „Access List Placement“ ===== */
var TP={R:A.TOPO.routers,SWP:{A:[130,205],C:[735,215],D:[390,350],E:[175,585],F:[760,585]},CS:{G:[520,295],K:[760,315]},
 HP:{Ricky:[85,285],Jenny:[175,285],George:[520,370],Carrol:[680,395],Kathy:[760,395],Amanda:[840,395],Jeff:[440,425],Jim:[345,425],Linda:[130,660],Sarah:[220,660],Jackie:[715,660],Melvin:[805,660]}};
function hostSw(p){var L=A.lanOf(p);if(L.r==='C')return p==='George'?TP.CS.G:TP.CS.K;return TP.SWP[L.r];}
function ifPos(rn,ifc){var R=TP.R[rn],N=null;A.TOPO.links.forEach(function(k){if(k[0]===rn&&k[1]===ifc)N=TP.R[k[2]];if(k[2]===rn&&k[3]===ifc)N=TP.R[k[0]];});if(!N)N=TP.SWP[rn];
 var dx=N[0]-R[0],dy=N[1]-R[1],l=Math.hypot(dx,dy);return{x:R[0]+dx/l*40,y:R[1]+dy/l*40,dx:dx/l,dy:dy/l};}
function hostPath(a,b){
 var la=A.lanOf(a),lb=A.lanOf(b),P=[TP.HP[a],hostSw(a)];if(la.r==='C')P.push(TP.SWP.C);
 if(la===lb){if(la.r==='C')P.push(hostSw(b));P.push(TP.HP[b]);return P;}
 A.rpath(la.r,lb.r).forEach(function(rn){P.push(TP.R[rn]);});if(lb.r==='C')P.push(TP.SWP.C);P.push(hostSw(b),TP.HP[b]);return P;}
function topoSvg(o){
 o=o||{};var W=900,H=700,h='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Netzplan mit Router A bis F">';
 if(o.path)h+='<polyline points="'+o.path.map(function(p){return p.join(',');}).join(' ')+'" fill="none" stroke="#fff176" stroke-width="16" stroke-linejoin="round" stroke-linecap="round"/>';
 function ln(a,b,ser){if(ser){var mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*7,ny=dx/l*7;return'<path d="M'+a[0]+' '+a[1]+'L'+(mx-dx/l*6+nx)+' '+(my-dy/l*6+ny)+'L'+(mx+dx/l*6-nx)+' '+(my+dy/l*6-ny)+'L'+b[0]+' '+b[1]+'" fill="none" stroke="'+RD+'" stroke-width="2.2"/>';}return'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+INK+'" stroke-width="2"/>';}
 A.TOPO.links.forEach(function(k){h+=ln(TP.R[k[0]],TP.R[k[2]],true);});
 A.TOPO.lans.forEach(function(L){h+=ln(TP.R[L.r],TP.SWP[L.r]);});
 h+=ln(TP.SWP.C,TP.CS.G)+ln(TP.SWP.C,TP.CS.K);
 Object.keys(TP.HP).forEach(function(p){h+=ln(hostSw(p),TP.HP[p]);});
 /* Interfaces */
 A.TOPO.links.forEach(function(k){[[k[0],k[1]],[k[2],k[3]]].forEach(function(q){var p=ifPos(q[0],q[1]);h+=tx(p.x-p.dy*14,p.y+p.dx*14+4,q[1],{fs:11.5,fw:700,mono:1,c:'#37474f'});});});
 A.TOPO.lans.forEach(function(L){var p=ifPos(L.r,L.ifc);h+=tx(p.x-p.dy*16,p.y+p.dx*16+4,L.ifc,{fs:11.5,fw:700,mono:1,c:'#37474f'});});
 Object.keys(TP.SWP).forEach(function(k){h+=at(TP.SWP[k][0],TP.SWP[k][1],sw());});
 h+=at(TP.CS.G[0],TP.CS.G[1],sw())+at(TP.CS.K[0],TP.CS.K[1],sw());
 var RL={A:[0,-22,'middle'],B:[0,-22,'middle'],C:[30,-12,'start'],D:[-32,4,'end'],E:[0,38,'middle'],F:[30,-16,'start']};
 Object.keys(TP.R).forEach(function(rn){var p=TP.R[rn],o2=RL[rn];h+=at(p[0],p[1],rtr())+tx(p[0]+o2[0],p[1]+o2[1],'Router '+rn,{fs:13,fw:700,a:o2[2]});});
 Object.keys(TP.HP).forEach(function(p){var q=TP.HP[p],c=p===o.src?BL:p===o.dst?GR:'#607d8b';h+=at(q[0],q[1],pc(c,.8))+tx(q[0],q[1]+26,p,{fs:12,fw:p===o.src||p===o.dst?700:600,c:p===o.src?BL:p===o.dst?GR:INK});});
 if(o.src)h+=tx(TP.HP[o.src][0],TP.HP[o.src][1]-20,'Quelle',{fs:11,fw:700,c:BL});
 if(o.dst)h+=tx(TP.HP[o.dst][0],TP.HP[o.dst][1]-20,'Ziel',{fs:11,fw:700,c:GR});
 if(o.acl&&!o.acl.none){var q=ifPos(o.acl.router,o.acl.ifc),bx=q.x+q.dx*30+q.dy*22,by=q.y+q.dy*30-q.dx*22;h+='<g><rect x="'+(bx-34)+'" y="'+(by-13)+'" width="68" height="24" rx="12" fill="'+RD+'" stroke="#fff" stroke-width="2"/>'+tx(bx,by+4,'ACL '+o.acl.dir,{fs:11.5,fw:700,c:'#fff'})+'</g>';}
 return h+'</svg>';
}
function placeText(pl,src,dst,std){
 if(pl.none)return src+' und '+dst+' hängen im <b>selben LAN</b> (hinter Router '+A.lanOf(src).r+' '+A.lanOf(src).ifc+'). Ihr Verkehr geht über Switches, aber über <b>keinen Router</b> – eine Router-ACL kann ihn gar nicht filtern.';
 return std?'Eine Standard-ACL kennt nur die <b>Quelle</b>. Darum so <b>nahe am Ziel</b> wie möglich: am Router von '+dst+', Interface <b>'+pl.ifc+'</b> (Richtung '+dst+'), <b>outbound</b>. So betrifft die Regel wirklich nur den Verkehr zu '+dst+' – '+src+' kann alles andere weiter erreichen.'
  :'Eine Extended-ACL kennt Quelle <b>und</b> Ziel. Darum so <b>nahe an der Quelle</b> wie möglich: am Router von '+src+', Interface <b>'+pl.ifc+'</b> (dort, wo '+src+'s Pakete hereinkommen), <b>inbound</b>. Unerwünschter Verkehr wird so gleich am Anfang verworfen und belastet keine Leitung.';
}

/* ===== Paket-Tester: Zeile für Zeile ===== */
function walkHTML(lines,num,pk,std,upto,showRes){
 var res=A.evaluate(lines,pk,std),h='<table class="walk"><tr><th>#</th><th>ACL '+num+'</th><th>Prüfung</th></tr>';
 lines.forEach(function(l,i){var c=A.check(l,pk,std),cls=i<upto?(c.all?'hit':'miss'):i===upto?'cur':'';var checks='';
  if(i<=upto){checks=std?(c.src?'Quelle ✓':'Quelle ✗'):[['Protokoll',c.proto],['Quelle',c.src],['Ziel',c.dst],['Port',c.port&&c.icmp]].map(function(x){return'<span class="'+(x[1]?'y':'n')+'">'+x[0]+' '+(x[1]?'✓':'✗')+'</span>';}).join(' ');if(std)checks='<span class="'+(c.src?'y':'n')+'">'+checks+'</span>';}
  if(i===upto&&c.all)cls='hit cur';
  h+='<tr class="'+cls+'"><td>'+(i+1)+'</td><td class="mono">'+esc(A.lineTxt(l,num,std).replace(/^access-list \d+ /,''))+'</td><td>'+checks+'</td></tr>';});
 var impl=upto>=lines.length;
 h+='<tr class="impl'+(impl?' cur hit':'')+'"><td>–</td><td class="mono">deny any'+(std?'':' any')+'  <i>(implizit, unsichtbar)</i></td><td>'+(impl?'<span class="n">greift immer</span>':'')+'</td></tr></table>';
 return h;
}
function pkTxt(pk,std){return std?'Quelle '+pk.src:pk.src+' → '+pk.dst+' · '+(pk.proto==='icmp'?'ICMP '+(pk.icmp||''):pk.proto.toUpperCase()+' Port '+pk.port);}
function Walker(el,lines,num,std){
 this.el=el;this.lines=lines;this.num=num;this.std=std;this.t=0;
}
Walker.prototype.run=function(pk,done){
 var self=this,res=A.evaluate(this.lines,pk,this.std),stop=res.line<0?this.lines.length:res.line,i=0;clearTimeout(this.t);
 function step(){self.el.innerHTML=walkHTML(self.lines,self.num,pk,self.std,i)+(i>=stop?'<p class="verdict '+(res.act==='permit'?'ok':'no')+'">'+(res.act==='permit'?'✓ permit – das Paket darf weiter':'✕ deny – das Paket wird verworfen')+(res.line<0?' (keine Zeile passt → implizites deny)':' (Zeile '+(res.line+1)+' passt – danach wird nicht mehr weitergesucht)')+'</p>':'');
  if(i<stop){i++;self.t=setTimeout(step,reduce?0:900);}else if(done)done(res);}
 step();
};
