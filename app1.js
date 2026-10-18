const CATS=[['alimentacao','Alimentação','#f28c28'],['transporte','Transporte','#2f7de1'],['moradia','Moradia','#8a5cf6'],['lazer','Lazer','#f2c230'],['saude','Saúde','#ec5c9e'],['outros','Outros','#9aa0a6']];
let S={tx:[],metas:[],contas:[],foto:''};
try{const r=localStorage.getItem('fin1');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem('fin1',JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const isoLocal=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const fmtD=s=>{const a=s.split('-');return a[2]+'/'+a[1]};
const hoje=new Date();
let cur={y:hoje.getFullYear(),m:hoje.getMonth()};
const noMes=(t,y,m)=>{const a=t.data.split('-');return +a[0]===y&&+a[1]-1===m};
const num=s=>{s=String(s).trim();if(!s)return NaN;return s.includes(',')?parseFloat(s.replace(/\./g,'').replace(',','.')):parseFloat(s)};
const soma=(y,m)=>{let r=0,d=0;S.tx.forEach(t=>{if(noMes(t,y,m)){t.tipo==='r'?r+=t.valor:d+=t.valor}});return{r,d}};

function mudaMes(n){const d=new Date(cur.y,cur.m+n,1);cur={y:d.getFullYear(),m:d.getMonth()};render()}
function vai(i){const p=$('pager');p.scrollTo({left:i*p.clientWidth,behavior:'smooth'})}
$('pager').addEventListener('scroll',()=>{const i=Math.round($('pager').scrollLeft/$('pager').clientWidth);$('t0').classList.toggle('on',i===0);$('t1').classList.toggle('on',i===1)});

function sheet(title,fields,ok,label){
  const o=document.createElement('div');o.className='ov';
  o.innerHTML='<div class="sh"><h3>'+title+'</h3>'+fields.map((f,i)=>'<label>'+f.l+(f.opts?'<select id="f'+i+'">'+f.opts.map(x=>'<option value="'+x[0]+'"'+(x[0]===f.v?' selected':'')+'>'+x[1]+'</option>').join('')+'</select>':'<input id="f'+i+'" class="'+(f.big?'gr':'')+'" type="'+(f.t||'text')+'" inputmode="'+(f.m||'text')+'" value="'+(f.v||'')+'" placeholder="'+(f.p||'')+'">')+'</label>').join('')+'<p class="er"></p><div class="row"><button class="b ghost" id="fc">Cancelar</button><button class="b dark" id="fs">'+(label||'Salvar')+'</button></div></div>';
  document.body.appendChild(o);
  const close=()=>o.remove();
  o.onclick=e=>{if(e.target===o)close()};
  o.querySelector('#fc').onclick=close;
  o.querySelector('#fs').onclick=()=>{const v=fields.map((f,i)=>o.querySelector('#f'+i).value);if(ok(v)===false){o.querySelector('.er').textContent='Confira os campos e tente de novo.'}else close()};
  const first=o.querySelector('input');if(first&&first.type!=='date')first.focus();
}

function addTx(tipo,pre){pre=pre||{};
  const d=(cur.y===hoje.getFullYear()&&cur.m===hoje.getMonth())?isoLocal(hoje):cur.y+'-'+pad(cur.m+1)+'-01';
  const f=[{l:'Valor (R$)',m:'decimal',p:'0,00',v:pre.v||'',big:true},{l:'Descrição',p:tipo==='r'?'Ex.: salário':'Ex.: almoço',v:esc(pre.d||'')}];
  if(tipo==='d')f.push({l:'Categoria',opts:CATS.map(c=>[c[0],c[1]]),v:pre.cat});
  f.push({l:'Data',t:'date',v:d});
  sheet(tipo==='r'?'Nova receita':'Nova despesa',f,v=>{
    const n=num(v[0]),dt=v[tipo==='d'?3:2];
    if(!(n>0)||!dt)return false;
    S.tx.push({id:uid(),tipo:tipo,valor:n,desc:v[1].trim(),cat:tipo==='d'?v[2]:'',data:dt});
    const a=dt.split('-');cur={y:+a[0],m:+a[1]-1};save();render();
  });
}
function addMeta(){sheet('Nova meta',[{l:'Objetivo',p:'Ex.: viagem'},{l:'Valor da meta (R$)',m:'decimal',p:'0,00'}],v=>{const n=num(v[1]);if(!v[0].trim()||!(n>0))return false;S.metas.push({id:uid(),nome:v[0].trim(),alvo:n,atual:0});save();render()})}
function aporte(id){sheet('Guardar valor',[{l:'Valor (R$)',m:'decimal',p:'0,00'}],v=>{const n=num(v[0]);if(!(n>0))return false;S.metas.find(x=>x.id===id).atual+=n;save();render()},'Guardar')}
function addConta(){sheet('Nova conta a pagar',[{l:'Nome',p:'Ex.: internet'},{l:'Valor (R$)',m:'decimal',p:'0,00'},{l:'Vencimento',t:'date',v:isoLocal(hoje)}],v=>{const n=num(v[1]);if(!v[0].trim()||!(n>0)||!v[2])return false;S.contas.push({id:uid(),nome:v[0].trim(),valor:n,venc:v[2],paga:false});save();render()})}
function del(k,id){if(!confirm('Apagar este item?'))return;S[k]=S[k].filter(x=>x.id!==id);save();render()}
function pagar(id){const c=S.contas.find(x=>x.id===id);c.paga=!c.paga;save();render()}

const dias=s=>Math.round((new Date(s+'T00:00:00')-new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()))/864e5);
function proximas(){return S.contas.filter(c=>!c.paga&&dias(c.venc)<=3).sort((a,b)=>a.venc<b.venc?-1:1)}
function alerta(){
  const l=proximas();if(!l.length)return'';
  return'<div class="alerta">'+l.map(c=>{const d=dias(c.venc);return'<div><b>'+esc(c.nome)+'</b> '+brl(c.valor)+' — '+(d<0?'venceu em '+fmtD(c.venc):d===0?'vence hoje':d===1?'vence amanhã':'vence em '+d+' dias')+'</div>'}).join('')+'</div>';
}w
