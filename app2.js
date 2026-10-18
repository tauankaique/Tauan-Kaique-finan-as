function donut(cats,tot){
  const R=104,C=2*Math.PI*R;let acc=0,s='<circle cx="130" cy="130" r="'+R+'" fill="none" stroke="var(--line)" stroke-width="28"/>';
  if(tot.r>0||tot.d>0){const lr=(tot.r>0?Math.min(1,tot.d/tot.r):1)*C;s+='<circle cx="130" cy="130" r="'+R+'" fill="none" stroke="'+(tot.r>0?'var(--green)':'var(--red)')+'" stroke-width="28"/>';if(lr>0&&tot.r>0)s+='<circle cx="130" cy="130" r="'+R+'" fill="none" stroke="var(--red)" stroke-width="28" stroke-dasharray="'+lr+' '+(C-lr)+'"/>'}
  return'<svg viewBox="0 0 260 260">'+s+'</svg>';
}

function render(){
  const nome=new Date(cur.y,cur.m,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  $('mes').textContent=nome;
  const tot=soma(cur.y,cur.m),saldo=tot.r-tot.d;
  const cats=CATS.map(c=>({nome:c[1],cor:c[2],v:S.tx.filter(t=>t.tipo==='d'&&t.cat===c[0]&&noMes(t,cur.y,cur.m)).reduce((a,t)=>a+t.valor,0)}));
  const txt=(saldo>=0?'+':'−')+brl(Math.abs(saldo));
  const fs=txt.length>13?20:txt.length>10?24:28;
  const gasto=tot.r>0?Math.round(Math.max(0,tot.r-tot.d)/tot.r*100)+'% do salário economizado':tot.d>0?'Sem receita no mês':'Sem movimentos';
  $('p1').innerHTML=alerta()+
    '<div class="donut">'+donut(cats,tot)+'<div class="centro"><small>Saldo do mês</small><b style="font-size:'+fs+'px;color:var(--'+(saldo>=0?'green':'red')+')">'+txt+'</b><small>'+gasto+'</small></div></div>'+
    '<div class="acoes"><button class="b g" onclick="addTx(\'r\')">+ Receita</button><button class="b r" onclick="addTx(\'d\')">− Despesa</button></div>'+
    '<div class="leg">'+cats.map(c=>'<div class="li'+(c.v?'':' zero')+'"><span class="dot" style="background:'+c.cor+'"></span><span class="n">'+c.nome+'</span><span class="v">'+brl(c.v)+'</span><span class="p">'+(tot.d?Math.round(c.v/tot.d*100):0)+'%</span></div>').join('')+'</div>';

  const ant=new Date(cur.y,cur.m-1,1),pa=soma(ant.getFullYear(),ant.getMonth());
  let comp;
  if(!pa.d)comp=tot.d?'Sem gastos no mês anterior para comparar.':'Ainda sem gastos para comparar.';
  else{const p=Math.round((tot.d-pa.d)/pa.d*100);comp=p===0?'Gastos iguais ao mês anterior.':'Você gastou '+Math.abs(p)+'% '+(p>0?'a mais':'a menos')+' que no mês anterior.'}
  const hist=S.tx.filter(t=>noMes(t,cur.y,cur.m)).sort((a,b)=>a.data<b.data?1:-1).slice(0,20);
  const metas=S.metas.map(m=>{const p=Math.min(100,Math.round(m.atual/m.alvo*100));return'<div class="card"><div class="top"><b>'+esc(m.nome)+'</b><span class="mute">'+p+'%</span></div><div class="big">'+brl(m.atual)+'</div><div class="mute">de '+brl(m.alvo)+' — '+(m.atual>=m.alvo?'meta concluída ✓':'faltam '+brl(m.alvo-m.atual))+'</div><div class="bar"><i style="width:'+p+'%"></i></div><div class="mini"><button onclick="aporte(\''+m.id+'\')">Guardar valor</button><button class="x" onclick="del(\'metas\',\''+m.id+'\')">Apagar</button></div></div>'}).join('')||'<div class="vazio">Nenhuma meta ainda. Toque em Nova meta.</div>';
  const contas=S.contas.slice().sort((a,b)=>a.venc<b.venc?-1:1).map(c=>{const d=dias(c.venc);return'<div class="card'+(c.paga?' paga':'')+'"><div class="top"><b>'+esc(c.nome)+'</b><span class="big" style="font-size:20px">'+brl(c.valor)+'</span></div><div class="mute venc'+(!c.paga&&d<0?' atraso':'')+'">'+(c.paga?'Paga':'Vence em '+fmtD(c.venc))+'</div><div class="mini"><button onclick="pagar(\''+c.id+'\')">'+(c.paga?'Desfazer':'Marcar como paga')+'</button><button class="x" onclick="del(\'contas\',\''+c.id+'\')">Apagar</button></div></div>'}).join('')||'<div class="vazio">Nenhuma conta cadastrada.</div>';
  $('p2').innerHTML=alerta()+
    '<div class="resumo"><div class="card"><div class="mute">Entradas do mês</div><div class="big" style="color:var(--green)">+'+brl(tot.r)+'</div></div><div class="card"><div class="mute">Saídas do mês</div><div class="big" style="color:var(--red)">−'+brl(tot.d)+'</div></div></div>'+
    '<h2>Metas <button onclick="addMeta()">Nova meta</button></h2>'+metas+
    '<h2>Contas a pagar <button onclick="addConta()">Nova conta</button></h2>'+contas+
    '<h2>Mês a mês</h2><div class="card comp">'+comp+'</div>'+
    '<h2>Últimas transações</h2>'+(hist.map(t=>{const c=CATS.find(x=>x[0]===t.cat);return'<div class="tx"><span class="dot" style="background:'+(t.tipo==='r'?'var(--green)':c?c[2]:'#9aa0a6')+'"></span><div class="d"><div>'+esc(t.desc||(t.tipo==='r'?'Receita':c?c[1]:'Despesa'))+'</div><div class="mute">'+fmtD(t.data)+(c?' · '+c[1]:'')+'</div></div><span class="v" style="color:var(--'+(t.tipo==='r'?'green':'red')+')">'+(t.tipo==='r'?'+':'−')+brl(t.valor)+'</span><button class="x" onclick="del(\'tx\',\''+t.id+'\')" aria-label="Apagar">×</button></div>'}).join('')||'<div class="vazio">Sem transações neste mês.</div>');
  const av=$('av');
  if(S.foto){av.style.backgroundImage='url('+S.foto+')';av.innerHTML=''}
  else{av.style.backgroundImage='';av.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>'}
}
$('av').onclick=()=>$('file').click();
$('file').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const img=new Image();
  img.onload=()=>{const c=document.createElement('canvas');c.width=c.height=96;const s=Math.min(img.width,img.height);c.getContext('2d').drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,96,96);S.foto=c.toDataURL('image/jpeg',.8);save();render()};
  img.src=URL.createObjectURL(f);
};
render();
