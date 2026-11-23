const fs = require('fs');
const read = f => fs.readFileSync(f, 'utf8');
const jszip = read('node_modules/jszip/dist/jszip.min.js');
const tplB64 = fs.readFileSync('vorlage.docx').toString('base64');
const engNetz = read('engines/netz.js');
const engSub = read('engines/sub.js');
const engDtp = read('engines/dtp.js');
const engEc = read('engines/ec.js');
const engAcl = read('engines/acl.js');
const engFhrp = read('engines/fhrp.js');
const engZs = read('engines/zs.js');
const engRoute = read('engines/route.js');
const engDomains = read('engines/domains.js');
const engDijk = read('engines/dijk.js');
const engOspfref = read('engines/ospfref.js');
const engWild = read('engines/wild.js');
const engSsh = read('engines/ssh.js');
const engCli = read('engines/cli.js');
const engStpa = read('engines/stpatk.js');
const engRipa = read('engines/ripauth.js');
const docxBrowser = read('docx-browser.js');
// topicdefs: module.exports -> window.__TOPICDEFS
let topicdefs = read('topicdefs.js').replace('module.exports = { build };', 'window.__TOPICDEFS = { build };');
const pool = read('pool.json');

const glue = `
<script>
// ---- Themen zusammenstellen (Generatoren + Fragen-Pool) ----
var LV=['L','M','S'], LVNAME={L:'Leicht',M:'Mittel',S:'Schwer'};
var TOPICS = window.__TOPICDEFS.build({NA:window.NA,SN:window.SN,VD:window.VD,EC:window.EC,ACL:window.ACL,FH:window.FH,ZS:window.ZS,IR:window.IR,DOM:window.DOM,DJ:window.DJ,ORB:window.ORB,WC:window.WC,SSH:window.SSH,CLI:window.CLI,STPA:window.STPA,RIPA:window.RIPA});
function slug(s){return s.toLowerCase().replace(/[äöü]/g,function(c){return {'ä':'ae','ö':'oe','ü':'ue'}[c];}).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
(function(){
  var pool = ${pool};
  var order = pool.order || Object.keys(pool.groups||{});
  order.forEach(function(name){
    var qs=(pool.groups||{})[name]||[]; if(qs.length<2) return;
    var curated=qs.some(function(x){return x.a||x.p;});
    TOPICS['pool-'+slug(name)] = { label:'Fragenkatalog: '+name+' ('+qs.length+' '+(curated?'kuratierter Katalog':'Fragen aus alten Tests')+')', levels:LV, points:{L:2,M:3,S:4},
      gen:function(seed,lvl){ var sub=qs.filter(function(x){return !x.lvl||x.lvl===lvl;}); if(!sub.length) sub=qs;
        var it=sub[((seed%sub.length)+sub.length)%sub.length];
        return {intro:'',lines:[it.q], points:(it.p!=null?it.p:undefined), solution:[it.a?('(Vorschlag) '+it.a):'(offene Frage – Bewertung durch Lehrkraft)']}; } };
  });
})();
function buildMixed(parts, levels){
  var OFF=2003, g1=[],g2=[],s1=[],s2=[], idx=0, seeds=[];
  parts.forEach(function(part){
    var t=TOPICS[part.topic]; if(!t || !(part.count>0)) return;
    var sb=Math.floor(Math.random()*1500)+1; seeds.push(sb);
    var num=function(s,lvl){return t.tag? t.tag+'-'+lvl+'-'+s : null;};
    for(var i=0;i<part.count;i++){ var lvl=levels[idx%levels.length];
      var sa=sb+i, sbb=sb+OFF+i;
      var e1=t.gen(sa,lvl), e2=t.gen(sbb,lvl);
      var n1=num(sa,lvl), n2=num(sbb,lvl);
      var l1=n1?['Übung '+n1].concat(e1.lines):e1.lines, l2=n2?['Übung '+n2].concat(e2.lines):e2.lines;
      g1.push({intro:e1.intro,lines:l1,points:(e1.points!=null?e1.points:t.points[lvl])});
      g2.push({intro:e2.intro,lines:l2,points:(e2.points!=null?e2.points:t.points[lvl])});
      s1.push('A'+(idx+1)+(n1?' ['+n1+']':'')+': '+e1.solution.join(' | '));
      s2.push('A'+(idx+1)+(n2?' ['+n2+']':'')+': '+e2.solution.join(' | ')); idx++; }
  });
  return {total:idx, seeds:seeds, groups:[{examples:g1},{examples:g2}], solutions:[{title:'Gruppe 1',lines:s1},{title:'Gruppe 2',lines:s2}]};
}
function monthNow(){var d=new Date();return String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
// ---- UI ----
var $=function(s){return document.querySelector(s);};
function fillTopics(){
  var ids=Object.keys(TOPICS);
  var calc=ids.filter(function(id){return id.indexOf('pool-')!==0;});
  var pool=ids.filter(function(id){return id.indexOf('pool-')===0;});
  $('#calcTopic').innerHTML = calc.map(function(id){return '<option value="'+id+'">'+TOPICS[id].label+'</option>';}).join('');
  $('#poolTopic').innerHTML = pool.map(function(id){return '<option value="'+id+'">'+TOPICS[id].label.replace('Fragenkatalog: ','')+'</option>';}).join('');
  $('#month').value = monthNow();
}
function msg(t,ok){var m=$('#msg');m.textContent=t;m.className='msg '+(ok?'ok':'err');}
async function go(){
  var levels=[].slice.call(document.querySelectorAll('.lv:checked')).map(function(c){return c.value;});
  if(!levels.length){msg('Bitte mindestens eine Schwierigkeit wählen.',false);return;}
  var calcN=Math.max(0,Math.min(30,+$('#calcCount').value||0));
  var poolN=Math.max(0,Math.min(30,+$('#poolCount').value||0));
  if(calcN+poolN<1){msg('Bitte mindestens eine Frage (Website oder Pool) angeben.',false);return;}
  if(calcN+poolN>30){msg('Zusammen höchstens 30 Fragen.',false);return;}
  var btn=$('#go'); btn.disabled=true; msg('Erzeuge Test …',true);
  try{
    var parts=[{topic:$('#calcTopic').value,count:calcN},{topic:$('#poolTopic').value,count:poolN}];
    var g=buildMixed(parts, levels);
    var blob=await window.buildTestBrowser({month:$('#month').value||monthNow(), groups:g.groups, solutions:$('#sol').checked?g.solutions:null});
    var fn='Test_'+($('#month').value||monthNow()).replace('/','-')+'.docx';
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fn; document.body.appendChild(a); a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href); a.remove();},1000);
    msg('Fertig: '+fn+'  ('+g.total+' Fragen je Gruppe: '+calcN+' Website + '+poolN+' Pool).',true);
  }catch(e){ msg('Fehler: '+(e&&e.message||e),false); }
  finally{ btn.disabled=false; }
}
window.addEventListener('DOMContentLoaded',function(){ fillTopics(); $('#go').addEventListener('click',go); });
</script>`;

// UI-HTML (aus public/index.html der Body-Teil, leicht angepasst)
const bodyHtml = `
<div class="wrap">
  <h1>NWT-Testgenerator</h1>
  <p class="sub">Läuft komplett in diesem Browser-Tab – zwei komplementäre Gruppen in deiner Wdh-NWT-Vorlage, mit Lösungsblatt. Du kannst Rechenaufgaben und Theoriefragen frei mischen.</p>
  <div class="card">
    <div class="block">
      <div class="block-h"><span class="tag tag-web">Website</span> Rechenaufgaben (mit Lösung)</div>
      <div class="row">
        <div style="flex:2"><label for="calcTopic">Thema</label><select id="calcTopic"></select></div>
        <div style="flex:1"><label for="calcCount">Anzahl</label><input type="number" id="calcCount" min="0" max="30" value="3"></div>
      </div>
    </div>
    <div class="block">
      <div class="block-h"><span class="tag tag-pool">Pool</span> Theoriefragen (aus alten Tests)</div>
      <div class="row">
        <div style="flex:2"><label for="poolTopic">Thema</label><select id="poolTopic"></select></div>
        <div style="flex:1"><label for="poolCount">Anzahl</label><input type="number" id="poolCount" min="0" max="30" value="2"></div>
      </div>
    </div>
    <p class="hint">Setze eine Anzahl auf 0, wenn du nur einen Bereich willst. Zusammen höchstens 30 Fragen je Gruppe.</p>
    <label>Schwierigkeit (Rechenaufgaben; beim Pool nur für die Punkte)</label>
    <div class="lvls">
      <label><input type="checkbox" class="lv" value="L"> Leicht</label>
      <label><input type="checkbox" class="lv" value="M" checked> Mittel</label>
      <label><input type="checkbox" class="lv" value="S"> Schwer</label>
    </div>
    <div class="row">
      <div><label for="month">Monat (Kopfzeile)</label><input type="text" id="month" placeholder="11/2026"></div>
      <div style="display:flex;align-items:flex-end"><label class="chk" style="margin:0"><input type="checkbox" id="sol" checked> Lösungsblatt anhängen</label></div>
    </div>
    <button id="go">Test erzeugen &amp; herunterladen</button>
    <div class="legend"><span><span class="dot" style="background:#ED7D31"></span>Gruppe 1</span><span><span class="dot" style="background:#7030A0"></span>Gruppe 2</span></div>
    <div class="msg" id="msg"></div>
  </div>
</div>`;

let css = read('public/index.html').match(/<style>[\s\S]*?<\/style>/)[0];
css = css.replace('</style>', `
  .block{border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin-top:14px;background:#fcfcfd}
  .block-h{font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px}
  .tag{font-size:11px;font-weight:700;color:#fff;border-radius:6px;padding:2px 7px}
  .tag-web{background:#2563eb}.tag-pool{background:#7030A0}
</style>`);

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>NWT-Testgenerator</title>
${css}
</head><body>
${bodyHtml}
<script>${jszip}</script>
<script>window.__TEMPLATE_B64__="${tplB64}";</script>
<script>${engNetz}</script>
<script>${engSub}</script>
<script>${engDtp}</script>
<script>${engEc}</script>
<script>${engAcl}</script>
<script>${engFhrp}</script>
<script>${engZs}</script>
<script>${engRoute}</script>
<script>${engDomains}</script>
<script>${engDijk}</script>
<script>${engOspfref}</script>
<script>${engWild}</script>
<script>${engSsh}</script>
<script>${engCli}</script>
<script>${engStpa}</script>
<script>${engRipa}</script>
<script>${topicdefs}</script>
<script>${docxBrowser}</script>
${glue}
</body></html>`;

fs.writeFileSync('dist/NWT-Testgenerator.html', html);
console.log('standalone HTML:', (html.length/1024).toFixed(0)+' KB');
