'use strict';

const defs = [
 {id:'aluminum',group:'商品价格 / 成本',icon:'Al',name:'铝价',desc:'成品铝价格变化',min:-20,max:20,step:1,unit:'%',default:0},
 {id:'alumina',group:'商品价格 / 成本',icon:'Ox',name:'氧化铝价格',desc:'核心原料成本变化',min:-30,max:30,step:1,unit:'%',default:0},
 {id:'energy',group:'商品价格 / 成本',icon:'⚡',name:'电价 / 煤价',desc:'能源成本变化',min:-30,max:30,step:1,unit:'%',default:0},
 {id:'bauxite',group:'商品价格 / 成本',icon:'⛏',name:'铝土矿供应稳定度',desc:'+ 表示更充足、更稳定',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'guinea',group:'商品价格 / 成本',icon:'GN',name:'几内亚矿运稳定度',desc:'+ 表示政策、运输更稳定',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'demand',group:'需求 / 供给 / 项目',icon:'建',name:'地产 / 基建需求',desc:'传统铝需求变化',min:-20,max:20,step:1,unit:'%',default:0},
 {id:'newenergy',group:'需求 / 供给 / 项目',icon:'EV',name:'汽车 / 光伏 / 电网需求',desc:'新能源相关铝需求变化',min:-30,max:30,step:1,unit:'%',default:0},
 {id:'policy',group:'需求 / 供给 / 项目',icon:'碳',name:'产能 / 双碳政策约束',desc:'+ 表示供给约束更强',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'overseas',group:'需求 / 供给 / 项目',icon:'海',name:'海外项目进展',desc:'+ 表示投产、资源兑现更顺利',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'fx',group:'资本 / 市场',icon:'¥',name:'人民币兑美元升值',desc:'+ 表示人民币更强，美元负债压力下降',min:-10,max:10,step:1,unit:'%',default:0},
 {id:'rates',group:'资本 / 市场',icon:'%',name:'美元利率变化',desc:'+ 表示利率上升；− 表示降息',min:-200,max:200,step:25,unit:'bp',default:0},
 {id:'debt',group:'资本 / 市场',icon:'债',name:'降杠杆 / 债务优化',desc:'+ 表示高息债减少、信用改善',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'capitalreturn',group:'资本 / 市场',icon:'股',name:'分红 / 回购强度',desc:'+ 表示股东回报更积极',min:-100,max:100,step:10,unit:'分',default:0},
 {id:'risk',group:'资本 / 市场',icon:'市',name:'港股风险偏好',desc:'+ 表示周期股估值环境改善',min:-100,max:100,step:10,unit:'分',default:0}
];

const paths = {
 aluminum:{mid:['margin'],direct:['profit'],label:['铝价','吨铝利润','归母净利润 / EPS','股价']},
 alumina:{mid:['margin'],direct:['profit'],label:['氧化铝成本','吨铝利润','归母净利润 / EPS','股价']},
 energy:{mid:['margin'],direct:['profit'],label:['能源成本','吨铝利润','归母净利润 / EPS','股价']},
 bauxite:{mid:['margin','balance'],direct:['profit','valuation'],label:['铝土矿供应','吨铝利润 / 行业供需','EPS / 估值','股价']},
 guinea:{mid:['margin','balance'],direct:['profit','valuation'],label:['几内亚稳定度','矿端成本 / 行业供需','EPS / 估值','股价']},
 demand:{mid:['volume','balance'],direct:['profit','valuation'],label:['地产 / 基建需求','销量 / 行业供需','EPS / 估值','股价']},
 newenergy:{mid:['volume','balance'],direct:['profit','valuation'],label:['新能源需求','销量 / 行业供需','EPS / 估值','股价']},
 policy:{mid:['balance'],direct:['valuation','profit'],label:['产能 / 双碳政策','行业供需格局','估值 / 盈利预期','股价']},
 overseas:{mid:['volume','fcf'],direct:['profit','valuation','shareholder'],label:['海外项目进展','销量 / 自由现金流','EPS / 估值 / 股东回报','股价']},
 fx:{mid:['finance'],direct:['profit'],label:['人民币汇率','财务费用','归母净利润 / EPS','股价']},
 rates:{mid:['finance','risk'],direct:['profit','valuation'],label:['美元利率','财务费用 / 资本成本','EPS / 估值','股价']},
 debt:{mid:['finance','fcf','risk'],direct:['profit','valuation','shareholder'],label:['债务优化','财务费用 / FCF / 信用','EPS / 估值 / 股东回报','股价']},
 capitalreturn:{mid:['fcf','risk'],direct:['valuation','shareholder'],label:['分红 / 回购','现金流 / 风险溢价','估值 / 股东回报','股价']},
 risk:{mid:['risk'],direct:['valuation'],label:['港股风险偏好','风险溢价 / 资本成本','估值倍数','股价']}
};

const presets = {
 base:{},
 bull:{aluminum:10,alumina:-15,energy:-8,bauxite:30,guinea:20,demand:6,newenergy:12,policy:25,overseas:30,fx:2,rates:-50,debt:40,capitalreturn:35,risk:20},
 bear:{aluminum:-10,alumina:15,energy:12,bauxite:-30,guinea:-40,demand:-8,newenergy:-5,policy:-10,overseas:-20,fx:-3,rates:75,debt:-10,capitalreturn:-15,risk:-45},
 rerate:{aluminum:2,alumina:-3,energy:0,bauxite:10,guinea:10,demand:0,newenergy:5,policy:15,overseas:15,fx:1,rates:-50,debt:55,capitalreturn:70,risk:25},
 riskoff:{aluminum:-3,alumina:0,energy:0,bauxite:0,guinea:0,demand:-2,newenergy:0,policy:0,overseas:0,fx:-2,rates:50,debt:0,capitalreturn:0,risk:-65}
};

const events = {
 redeem:{debt:30,risk:3},
 alup:{aluminum:10},
 aluminadown:{alumina:-15},
 guinea:{guinea:-75,bauxite:-45,alumina:12,aluminum:6},
 stimulus:{demand:10,aluminum:4,risk:18},
 ratecut:{rates:-100,risk:15,fx:1}
};

let state = Object.fromEntries(defs.map(d=>[d.id,d.default]));
let strength = 1;
let selected = 'aluminum';

function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function signed(x,d=1){return `${x>0?'+':''}${x.toFixed(d)}%`;}
function driverText(d,v){
  if(d.unit==='%') return `${v>0?'+':''}${Number(v).toFixed(0)}%`;
  if(d.unit==='bp') return `${v>0?'+':''}${Number(v).toFixed(0)}bp`;
  return `${v>0?'+':''}${Number(v).toFixed(0)}`;
}

function model(s=state){
  const margin = 0.78*s.aluminum - 0.30*s.alumina - 0.13*s.energy + 0.035*s.bauxite + 0.025*s.guinea;
  const volume = 0.34*s.demand + 0.24*s.newenergy + 0.055*s.overseas;
  const finance = 0.34*s.fx - 0.0075*s.rates + 0.020*s.debt;
  const balance = 0.060*s.policy + 0.030*s.bauxite + 0.022*s.guinea + 0.15*s.demand + 0.09*s.newenergy;
  const risk = 0.075*s.risk + 0.030*s.capitalreturn + 0.017*s.debt - 0.0045*s.rates + 0.015*s.policy;
  const fcf = 0.30*margin + 0.20*volume + 0.024*s.debt + 0.018*s.capitalreturn - 0.010*Math.max(0,s.overseas) + 0.012*Math.min(0,s.overseas);

  let profit = (0.72*margin + 0.38*volume + finance + 0.16*balance) / 100;
  let valuation = (risk + 0.28*balance + 0.028*s.overseas + 0.022*s.newenergy) / 100;
  let shareholder = (0.10*fcf + 0.045*s.capitalreturn + 0.015*s.debt) / 100;
  profit = clamp(profit*strength,-0.42,0.55);
  valuation = clamp(valuation*strength,-0.30,0.38);
  shareholder = clamp(shareholder*strength,-0.10,0.16);
  const multiplier=(1+profit)*(1+valuation)*(1+shareholder);
  return {margin,volume,finance,fcf,balance,risk,profit,valuation,shareholder,multiplier};
}

function buildDrivers(){
  const box=document.getElementById('driverContainer'); box.innerHTML=''; let g='';
  defs.forEach(d=>{
    if(d.group!==g){g=d.group; const gt=document.createElement('div');gt.className='group-title';gt.textContent=g;box.appendChild(gt);}
    const wrap=document.createElement('div'); wrap.className='driver'; wrap.id=`driver-${d.id}`;
    wrap.innerHTML=`
      <div class="driver-top" onclick="selectDriver('${d.id}')">
        <div class="ico">${d.icon}</div>
        <div><div class="dname">${d.name}</div><div class="ddesc">${d.desc}</div></div>
        <div class="dval" id="dval-${d.id}">0</div>
      </div>
      <div class="ctrl">
        <button class="tiny" onclick="stepDriver('${d.id}',-1,event)">−</button>
        <input id="rng-${d.id}" type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.default}" oninput="rangeDriver('${d.id}',this.value)" onclick="event.stopPropagation()">
        <button class="tiny" onclick="stepDriver('${d.id}',1,event)">+</button>
      </div>
      <div class="impact-line"><span>${d.min}${d.unit==='分'?'':d.unit} ← 中性 → ${d.max>0?'+':''}${d.max}${d.unit==='分'?'':d.unit}</span><b id="impact-${d.id}">股价 0.0%</b></div>`;
    box.appendChild(wrap);
  });
}

function renderAll(){
  const m=model(); const p=Math.max(.01,Number(document.getElementById('currentPrice').value)||22.5); const fair=p*m.multiplier; const ret=m.multiplier-1;
  document.getElementById('fairPrice').textContent=`HK$${fair.toFixed(2)}`;
  const rt=document.getElementById('returnText'); rt.textContent=signed(ret*100,1); rt.style.color=ret>=0?'#fff':'#ffe3e1';
  document.getElementById('profitIndex').textContent=Math.round((1+m.profit)*100);
  document.getElementById('valuationIndex').textContent=Math.round((1+m.valuation)*100);
  document.getElementById('returnIndex').textContent=Math.round((1+m.shareholder)*100);
  document.getElementById('chainPrice').textContent=`HK$${fair.toFixed(2)}`;
  document.getElementById('chainPriceSub').textContent=`相对当前价 ${signed(ret*100,1)}`;

  setNode('profit',m.profit*100); setNode('valuation',m.valuation*100); setNode('shareholder',m.shareholder*100);
  setMid('margin',m.margin); setMid('volume',m.volume); setMid('finance',m.finance); setMid('fcf',m.fcf); setMid('balance',m.balance); setMid('risk',m.risk);

  defs.forEach(d=>{
    const v=state[d.id]; const el=document.getElementById(`dval-${d.id}`); if(el){el.textContent=driverText(d,v);el.className='dval '+(v>0?'pos':v<0?'neg':'');}
    const r=document.getElementById(`rng-${d.id}`); if(r && Number(r.value)!==v) r.value=v;
    const impact=singleImpact(d.id); const ie=document.getElementById(`impact-${d.id}`); if(ie){ie.textContent=`股价 ${signed(impact*100,1)}`;ie.style.color=impact>=0?'var(--green2)':'var(--red)';}
  });
  renderContrib(); renderTrace(); renderSummary(m,ret,fair,p); safeSave();
}

function setNode(id,x){
  const el=document.getElementById(`direct-${id}`), node=document.getElementById(`node-${id}`); if(!el||!node)return;
  el.textContent=signed(x,1); node.classList.remove('positive','negative'); if(x>.05)node.classList.add('positive');if(x<-.05)node.classList.add('negative');
}
function setMid(id,x){
  const el=document.getElementById(`mid-${id}`), node=document.getElementById(`node-${id}`); if(!el||!node)return;
  el.textContent=signed(x,1); node.classList.remove('positive','negative'); if(x>.05)node.classList.add('positive');if(x<-.05)node.classList.add('negative');
}

function singleImpact(id){
  const s=Object.fromEntries(defs.map(d=>[d.id,0])); s[id]=state[id]; return model(s).multiplier-1;
}

function renderContrib(){
  const list=document.getElementById('contribList');list.innerHTML='';
  const arr=defs.map(d=>({name:d.name,id:d.id,val:singleImpact(d.id)})).sort((a,b)=>Math.abs(b.val)-Math.abs(a.val));
  const max=Math.max(.001,...arr.map(x=>Math.abs(x.val)));
  arr.slice(0,10).forEach(x=>{
    const w=Math.min(50,Math.abs(x.val)/max*50); const row=document.createElement('div');row.className='crow';
    row.innerHTML=`<div class="cname">${x.name}</div><div class="track"><div class="${x.val>=0?'barp':'barn'}" style="width:${w}%"></div></div><div class="cval" style="color:${x.val>=0?'var(--green2)':'var(--red)'}">${signed(x.val*100,1)}</div>`; list.appendChild(row);
  });
}

function renderTrace(){
  const path=paths[selected]||paths.aluminum; const trace=document.getElementById('tracePath');
  trace.innerHTML=path.label.map((x,i)=>`${i?'<span class="trace-arrow">→</span>':''}<span class="trace-pill">${x}</span>`).join('');
  document.querySelectorAll('.node').forEach(n=>n.classList.remove('highlight','dim'));
  document.querySelectorAll('.driver').forEach(n=>n.classList.remove('selected'));
  const d=document.getElementById(`driver-${selected}`);if(d)d.classList.add('selected');
  const activeIds=['node-price',...path.mid.map(x=>`node-${x}`),...path.direct.map(x=>`node-${x}`)];
  document.querySelectorAll('#chainCard .node, #chainCard .chain-top').forEach(n=>{if(activeIds.includes(n.id))n.classList.add('highlight');else n.classList.add('dim');});
}

function selectDriver(id){selected=id;renderTrace();const t=document.getElementById('traceBox');if(t)t.scrollIntoView({behavior:'smooth',block:'center'});}
function rangeDriver(id,value){state[id]=Number(value);clearPreset();selected=id;renderAll();}
function stepDriver(id,dir,ev){if(ev)ev.stopPropagation();const d=defs.find(x=>x.id===id);state[id]=clamp(state[id]+dir*d.step,d.min,d.max);clearPreset();selected=id;renderAll();}

function clearPreset(){document.querySelectorAll('#presetTabs .chip').forEach(x=>x.classList.remove('active'));}
function applyPreset(name,btn){
  state=Object.fromEntries(defs.map(d=>[d.id,d.default])); Object.assign(state,presets[name]||{});
  document.querySelectorAll('#presetTabs .chip').forEach(x=>x.classList.remove('active')); if(btn)btn.classList.add('active');
  selected=name==='riskoff'?'risk':name==='rerate'?'capitalreturn':name==='bull'?'aluminum':name==='bear'?'alumina':'aluminum'; renderAll(); toast('已应用情景');
}
function applyEvent(name){
  const e=events[name]||{};Object.entries(e).forEach(([k,v])=>{state[k]=v});clearPreset();
  selected=name==='redeem'?'debt':name==='alup'?'aluminum':name==='aluminadown'?'alumina':name==='guinea'?'guinea':name==='stimulus'?'demand':'rates';
  renderAll(); document.getElementById('chainCard').scrollIntoView({behavior:'smooth',block:'start'}); toast('事件已写入传导链');
}
function setStrength(x,btn){strength=Number(x);document.querySelectorAll('#strengthSeg button').forEach(b=>b.classList.toggle('active',b===btn));renderAll();toast('敏感度已切换');}
function resetAll(){state=Object.fromEntries(defs.map(d=>[d.id,d.default]));strength=1;selected='aluminum';document.getElementById('currentPrice').value='22.50';document.querySelectorAll('#strengthSeg button').forEach((b,i)=>b.classList.toggle('active',i===1));document.querySelectorAll('#presetTabs .chip').forEach((b,i)=>b.classList.toggle('active',i===0));renderAll();toast('已恢复基准');}

function renderSummary(m,ret,fair,p){
  const drivers=defs.map(d=>({name:d.name,val:singleImpact(d.id)})).sort((a,b)=>Math.abs(b.val)-Math.abs(a.val)).filter(x=>Math.abs(x.val)>.001);
  const top=drivers.slice(0,3).map(x=>`${x.name} ${signed(x.val*100,1)}`).join('、')||'暂无明显冲击';
  const direct=[{n:'盈利/EPS',v:m.profit},{n:'估值',v:m.valuation},{n:'股东回报',v:m.shareholder}].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))[0];
  const tone=ret>0.12?'偏乐观':ret<-0.12?'偏悲观':'中性';
  document.getElementById('summaryText').innerHTML=`当前情景为 <b>${tone}</b>。以 HK$${p.toFixed(2)} 为起点，传导链得到情景价格 <b>HK$${fair.toFixed(2)}</b>，对应 <b>${signed(ret*100,1)}</b>。目前对股价作用最大的直接通道是 <b>${direct.n}</b>（${signed(direct.v*100,1)}）；底层主要驱动为：<b>${top}</b>。`;
}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.classList.remove('show'),1300);}
function safeSave(){try{localStorage.setItem('hq-chain-v2',JSON.stringify({state,strength,selected,price:document.getElementById('currentPrice').value}));}catch(e){}}
function safeLoad(){try{const x=JSON.parse(localStorage.getItem('hq-chain-v2')||'null');if(x&&x.state)state={...state,...x.state};if(x&&x.strength)strength=x.strength;if(x&&x.selected)selected=x.selected;if(x&&x.price)document.getElementById('currentPrice').value=x.price;}catch(e){}}
function copySummary(){
  const m=model(),p=Math.max(.01,Number(document.getElementById('currentPrice').value)||22.5),fair=p*m.multiplier,ret=m.multiplier-1;
  const active=defs.filter(d=>state[d.id]!==0).map(d=>`${d.name} ${driverText(d,state[d.id])}`).join('；')||'全部中性';
  const text=`中国宏桥金融沙盒推演\n当前价：HK$${p.toFixed(2)}\n情景价：HK$${fair.toFixed(2)}（${signed(ret*100,1)}）\n直接通道：盈利/EPS ${signed(m.profit*100,1)}；估值 ${signed(m.valuation*100,1)}；股东回报 ${signed(m.shareholder*100,1)}\n当前变量：${active}\n\n注：情景敏感度模型，仅用于研究传导关系。`;
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('已复制')).catch(()=>fallbackCopy(text));}else fallbackCopy(text);
}
function fallbackCopy(text){const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('已复制');}catch(e){window.prompt('请手动复制：',text);}document.body.removeChild(ta);}

function init(){buildDrivers();safeLoad();renderAll();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();