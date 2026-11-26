/* Füllt die Wdh-NWT-Vorlage (vorlage.docx) mit beliebig vielen Beispielen je Gruppe.
   - Gruppe 1 orange (ED7D31), Gruppe 2 lila (7030A0), ganzer Text eingefärbt.
   - Jede Gruppe ist ein eigener Abschnitt mit fixer Fußzeile "Gruppe: N"
     (statt des PAGE-Feldes der Vorlage), damit die Gruppennummer auch dann
     stimmt, wenn eine Gruppe über mehrere Seiten geht.
   - Optionales Lösungsblatt als dritter Abschnitt. */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const OR = 'ED7D31', PU = '7030A0';
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function para(text, opt){
  opt = opt || {};
  const rpr = (opt.italic?'<w:i/>':'') + (opt.bold?'<w:b/>':'') + (opt.color?'<w:color w:val="'+opt.color+'"/>':'') + (opt.sz?'<w:sz w:val="'+opt.sz+'"/>':'');
  const after = opt.after==null?60:opt.after;
  const pr = rpr?'<w:rPr>'+rpr+'</w:rPr>':'';
  return '<w:p><w:pPr><w:spacing w:after="'+after+'" w:line="240" w:lineRule="auto"/>'+(opt.pageBreak?'<w:pageBreakBefore/>':'')+pr+'</w:pPr>'
    + '<w:r>'+pr+'<w:t xml:space="preserve">'+esc(text)+'</w:t></w:r></w:p>';
}
// Inline-Bild (PNG) als eigener Absatz. w,h in px (96 dpi) -> EMU.
function imgDrawing(rid, w, h, id, name){
  const cx = Math.round(w*9525), cy = Math.round(h*9525);
  return '<w:p><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:drawing>'
    + '<wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">'
    + '<wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
    + '<wp:docPr id="'+id+'" name="'+name+'"/>'
    + '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
    + '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    + '<pic:nvPicPr><pic:cNvPr id="'+id+'" name="'+name+'"/><pic:cNvPicPr/></pic:nvPicPr>'
    + '<pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    + '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm>'
    + '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
    + '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
}
function cellContent(ex, color){
  let out = '';
  if(ex.intro) out += para(ex.intro,{color:color,italic:true,after:120});
  (ex.lines||[]).forEach(function(ln){
    if(typeof ln==='string') out += para(ln,{color:color,after:160});
    else if(ln.drawing) out += ln.drawing;
    else out += para(ln.text,{color:color,after:ln.after==null?160:ln.after,bold:ln.bold,sz:ln.sz,pageBreak:ln.pageBreak});
  });
  return out;
}

function buildRow(rowTpl, num, points, contentXml){
  let row = rowTpl;
  // Zeile nie über Seitengrenze trennen -> passt sie unten nicht, rutscht sie ganz auf die nächste Seite
  if(/<w:trPr>/.test(row)){ if(!/<w:cantSplit\/>/.test(row)) row = row.replace('<w:trPr>','<w:trPr><w:cantSplit/>'); }
  else row = row.replace('<w:tc>','<w:trPr><w:cantSplit/></w:trPr><w:tc>');
  // große Nummer (Run mit sz 96)
  row = row.replace(/(<w:sz w:val="96"\/>[\s\S]*?<w:t[^>]*>)\d(<\/w:t>)/, (m,a,b)=>a+num+b);
  // doppelte "Punkte"-Absätze entfernen (manche Zeilen haben mehrere)
  let seen=false;
  row = row.replace(/<w:p\b(?:(?!<\/w:p>)[\s\S])*?\d+ Punkte(?:(?!<\/w:p>)[\s\S])*?<\/w:p>/g,(m)=>{ if(seen) return ''; seen=true; return m; });
  // Punkte setzen – Variante A: "N Punkte" in EINEM Run
  let pdone=false;
  row = row.replace(/(<w:t[^>]*>)\s*\d+ Punkte(<\/w:t>)/, (m,a,b)=>{ pdone=true; return a+points+' Punkte'+b; });
  // Variante B: Ziffer-Run direkt vor einem " Punkte"-Run (getrennt, wie in Gruppe 1)
  if(!pdone){
    row = row.replace(/(<w:t[^>]*>)\s*\d+(<\/w:t>\s*<\/w:r>\s*<w:r\b[\s\S]*?<w:t[^>]*>)\s*Punkte(<\/w:t>)/, (m,a,mid,c)=>a+points+mid+' Punkte'+c);
  }
  // Inhaltszelle (8359) füllen
  row = row.replace(/(<w:tc>(?:(?!<\/w:tc>)[\s\S])*?w:w="8359"[\s\S]*?<\/w:tcPr>)([\s\S]*?)(<\/w:tc>)/, (m,a,mid,c)=>a+contentXml+c);
  return row;
}
function fillTable(tableXml, examples, color){
  const rowTpl = tableXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/)[0];
  const rows = examples.map((ex,i)=>buildRow(rowTpl, i+1, ex.points, cellContent(ex,color))).join('');
  const before = tableXml.slice(0, tableXml.indexOf('<w:tr'));
  return before + rows + '</w:tbl>';
}

// sectPr mit eigener Fußzeile (headerRef bleibt die Standard-Kopfzeile)
function sectPr(footerRid){
  return '<w:sectPr>'
    + '<w:headerReference w:type="default" r:id="rId7"/>'
    + '<w:footerReference w:type="default" r:id="'+footerRid+'"/>'
    + '<w:pgSz w:w="11906" w:h="16838"/>'
    + '<w:pgMar w:top="1077" w:right="1077" w:bottom="1440" w:left="1077" w:header="709" w:footer="709" w:gutter="0"/>'
    + '<w:cols w:space="720"/><w:docGrid w:linePitch="299"/></w:sectPr>';
}
function sectBreakPara(footerRid){ return '<w:p><w:pPr>'+sectPr(footerRid)+'</w:pPr></w:p>'; }

// Fußzeile mit statischem Text statt PAGE-Feld
function makeFooter(base, mode, n){
  let f = base.replace(/<w:sdt>[\s\S]*<\/w:sdt>/,'');
  if(mode==='gruppe'){
    f = f.replace(/(<w:t[^>]*>)\s*Punkte?\s*(<\/w:t>)/,'$1$2'); // no-op Schutz
    f = f.replace(/(<w:t xml:space="preserve">)Gruppe: (<\/w:t>)/,'$1Gruppe: '+n+'$2');
  } else { // loesung
    f = f.replace(/(<w:t xml:space="preserve">)Gruppe: (<\/w:t>)/,'$1Lösungen – nur für die Lehrkraft$2');
  }
  return f;
}

async function buildTest(opts){
  // opts: {month:'11/2026', groups:[{examples:[{intro,lines,points}]},...], solutions:[{title,lines}]}
  const zip = await JSZip.loadAsync(fs.readFileSync(path.join(__dirname,'vorlage.docx')));
  let doc = await zip.file('word/document.xml').async('string');
  const footerBase = await zip.file('word/footer1.xml').async('string');

  // Bilder einsammeln und als Inline-Grafik in die Zeilen setzen (vor dem Tabellenfüllen)
  const images = []; let imgN = 0;
  (opts.groups||[]).forEach(function(g){ (g.examples||[]).forEach(function(ex){ (ex.lines||[]).forEach(function(ln){
    if(ln && ln.img){ imgN++; const rid='rIdImg'+imgN, media='media/img'+imgN+'.png';
      images.push({rid:rid, media:media, path:ln.img.path});
      ln.drawing = imgDrawing(rid, ln.img.w||520, ln.img.h||182, 100+imgN, 'Topologie '+imgN); }
  }); }); });

  // Tabellen füllen
  const tbls = [...doc.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)];
  const t0 = fillTable(tbls[0][0], opts.groups[0].examples, OR);
  const t1 = fillTable(tbls[1][0], (opts.groups[1]||opts.groups[0]).examples, PU);

  // Lösungsabsätze
  let sol = '';
  const hasSol = opts.solutions && opts.solutions.length;
  if(hasSol){
    sol += para('Lösungen (nur für die Lehrkraft)',{bold:true,sz:30,after:120});
    opts.solutions.forEach(function(s){
      sol += para(s.title,{bold:true,after:40});
      (s.lines||[]).forEach(function(ln){ sol += para(ln,{after:40}); });
    });
  }

  // Seitenumbruch-Absatz: erzwingt neue Seite (liegt im folgenden Abschnitt -> dessen Fußzeile)
  const pb = '<w:p><w:pPr><w:pageBreakBefore/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:p>';

  // Body neu zusammensetzen: [vor table0][t0][sect g1][pb][t1][sect g2]( [pb][sol][final sect sol] )
  const pre = doc.slice(0, tbls[0].index);
  if(hasSol){
    doc = pre + t0 + sectBreakPara('rId901') + pb + t1 + sectBreakPara('rId902') + pb + sol + sectPr('rId903') + '</w:body></w:document>';
  } else {
    doc = pre + t0 + sectBreakPara('rId901') + pb + t1 + sectPr('rId902') + '</w:body></w:document>';
  }

  zip.file('word/document.xml', doc);

  // Bild-Dateien einbetten
  images.forEach(function(im){ zip.file('word/'+im.media, fs.readFileSync(im.path)); });

  // Fußzeilen anlegen
  zip.file('word/footer_g1.xml', makeFooter(footerBase,'gruppe','1'));
  zip.file('word/footer_g2.xml', makeFooter(footerBase,'gruppe','2'));
  if(hasSol) zip.file('word/footer_sol.xml', makeFooter(footerBase,'loesung'));

  // Relationships
  let rels = await zip.file('word/_rels/document.xml.rels').async('string');
  const addRel = (id,target)=>'<Relationship Id="'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="'+target+'"/>';
  const addImgRel = (id,target)=>'<Relationship Id="'+id+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="'+target+'"/>';
  let extra = addRel('rId901','footer_g1.xml')+addRel('rId902','footer_g2.xml')+(hasSol?addRel('rId903','footer_sol.xml'):'')
            + images.map(function(im){return addImgRel(im.rid, im.media);}).join('');
  rels = rels.replace('</Relationships>', extra+'</Relationships>');
  zip.file('word/_rels/document.xml.rels', rels);

  // Content-Types Overrides
  let ct = await zip.file('[Content_Types].xml').async('string');
  const ov = (p)=>'<Override PartName="/word/'+p+'" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>';
  let ovs = ov('footer_g1.xml')+ov('footer_g2.xml')+(hasSol?ov('footer_sol.xml'):'');
  if(images.length && !/Extension="png"/.test(ct)) ovs += '<Default Extension="png" ContentType="image/png"/>';
  ct = ct.replace('</Types>', ovs+'</Types>');
  zip.file('[Content_Types].xml', ct);

  // Kopfzeile: Monat setzen
  if(opts.month){
    const mm = opts.month.split('/')[0];
    for(const hf of ['word/header1.xml','word/header2.xml']){
      const f = zip.file(hf); if(!f) continue;
      let h = await f.async('string');
      h = h.replace(/(<w:t[^>]*>)\s*10\s*(<\/w:t>)/, (m,a,b)=>a+mm+b);
      zip.file(hf, h);
    }
  }
  return zip.generateAsync({type:'nodebuffer'});
}
module.exports = { buildTest, OR, PU };
