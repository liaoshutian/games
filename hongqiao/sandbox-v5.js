(()=>{
const LEVELS=[['超悲观','red'],['悲观','red'],['中性','blue'],['乐观','green'],['超乐观','green']];
const MODEL={basePrice:22.5,baseProfit:33,shares:9.52,rmbHkd:1.09,basePE:0};
MODEL.basePE=MODEL.basePrice/((MODEL.baseProfit/MODEL.shares)*MODEL.rmbHkd);
const d=(name,unit,values,desc)=>({name,unit,values,desc,level:0});
const F={
 aluminumPrice:{name:'铝价',weight:24,summary:m=>`¥${Math.round(m.alPrice).toLocaleString()}/吨`,dims:[
  d('沪铝均价','元/吨',[18000,19500,21192,23000,25000],['价格显著下探','价格偏弱','H1实现价附近','价格温和上行','强周期上行']),
  d('LME铝价','美元/吨',[2200,2400,2600,2850,3150],['海外宽松','外盘偏弱','全球中枢','海外紧平衡','海外供应冲击']),
  d('华东现货升贴水','元/吨',[-200,-50,100,250,450],['明显贴水','小幅贴水','中性','升水扩大','高升水紧缺']),
  d('国内铝锭库存','万吨',[120,100,81.5,65,50],['明显累库','库存偏高','基准库存','持续去库','低库存紧张'])]},
 aluminumVolume:{name:'铝合金销量',weight:3,summary:m=>`${m.alVolume.toFixed(2)}Mt/年`,dims:[
  d('开工率','%',[94,96,98,99,100],['检修较多','略弱','高位基准','高负荷','满负荷']),
  d('云南限电影响','天',[60,30,15,5,0],['限电严重','明显限电','基准扰动','轻微影响','基本无限电']),
  d('云南搬迁完成度','%',[70,82,90,96,100],['进度滞后','偏慢','按计划','较快','全面完成'])]},
 aluminaExternal:{name:'氧化铝外销',weight:14,summary:m=>`¥${Math.round(m.aluminaPrice)}/吨`,dims:[
  d('外销实现价','元/吨',[1800,2100,2327,2700,3200],['价格大跌','价格偏弱','H1基准','回升至指引附近','供应收紧大涨']),
  d('H1外销量','万吨',[560,630,691.7,740,800],['销量显著下滑','销量偏弱','H1基准','销量改善','明显增长']),
  d('行业开工率','%',[90,85,80,75,70],['供给压力大','供给偏宽','基准80%','供给趋紧','明显减产']),
  d('中东进口需求','指数',[80,90,100,110,120],['需求弱','偏弱','基准','改善','补库强劲'])]},
 deepProcessing:{name:'深加工',weight:3,summary:m=>`${m.deepVolume.toFixed(1)}万吨/H1`,dims:[
  d('H1销量','万吨',[35,40,44.4,49,55],['订单下滑','增速放缓','H1基准','客户放量','快速爬坡']),
  d('加工费','元/吨',[1400,1800,2244,2700,3200],['竞争激烈','偏弱','基准','高端占比升','高附加值']),
  d('贸易摩擦成本','元/吨',[800,500,300,150,0],['压力很高','偏高','基准','压力减轻','基本消除'])]},
 energy:{name:'电力 / 煤价',weight:13,summary:m=>`¥${m.powerCost.toFixed(3)}/度`,dims:[
  d('动力煤价格','元/吨',[1000,900,800,700,600],['煤价大涨','偏高','基准','回落','显著回落']),
  d('云南综合电价','元/度',[.49,.465,.44,.415,.39],['来水差/电价高','偏高','基准0.44','改善','低成本水电']),
  d('云南产能占比','%',[20,28,35,42,50],['占比低','迁产偏慢','基准结构','占比提升','显著提升']),
  d('绿电自给比例','%',[10,20,30,40,55],['建设滞后','贡献低','基准','推进顺利','绿电优势明显'])]},
 bauxite:{name:'铝土矿成本',weight:5,summary:m=>`$${m.bauxite.toFixed(0)}/干吨`,dims:[
  d('进口矿价','美元/干吨',[90,80,70,60,50],['矿价大涨','偏高','基准70','回落','显著回落']),
  d('海运费','美元/吨',[35,30,25,20,15],['航运冲击','偏高','基准','改善','宽松']),
  d('自有矿权益覆盖','%',[35,45,55,65,75],['外采依赖高','偏低','基准估算','资源保障强','优势明显']),
  d('矿石品位','%',[42,44,46,48,50],['低品位','偏低','基准','改善','高品位'])]},
 aluminaCost:{name:'氧化铝制造',weight:2,summary:m=>`¥${Math.round(m.aluminaCost)}/吨`,dims:[
  d('烧碱价格','元/吨',[3500,3200,2900,2600,2300],['高企','偏高','基准','回落','显著回落']),
  d('煤/蒸汽成本','指数',[120,110,100,90,80],['大涨','偏高','基准','改善','明显改善']),
  d('工艺效率','指数',[90,95,100,105,110],['恶化','偏低','基准','提升','明显提升'])]},
 anode:{name:'阳极炭块',weight:2,summary:m=>`石油焦¥${Math.round(m.petCoke)}/吨`,dims:[
  d('石油焦价格','元/吨',[2400,2100,1800,1550,1350],['大涨','偏高','基准','回落','大幅改善']),
  d('阳极单耗','吨/吨铝',[.54,.52,.50,.48,.46],['单耗高','偏高','基准','改善','领先']),
  d('阳极自产比例','%',[50,60,70,80,90],['外采高','偏低','基准','提升','一体化强'])]},
 logistics:{name:'折旧 / 物流',weight:2,summary:m=>`物流¥${Math.round(m.logistics)}/吨`,dims:[
  d('矿石综合物流','元/吨',[600,520,450,390,340],['成本高','偏高','基准','改善','高效']),
  d('新产能折旧负担','指数',[120,110,100,95,90],['压力大','偏高','基准','摊薄','效率好'])]},
 carbon:{name:'碳 / 能效成本',weight:1,summary:m=>`碳价¥${Math.round(m.carbon)}/吨`,dims:[
  d('碳配额价格','元/吨',[140,110,80,55,35],['成本大增','偏高','基准','较低','低碳优势']),
  d('单位排放强度','指数',[120,110,100,90,80],['高排放','偏高','基准','改善','显著改善'])]},
 marketRisk:{name:'利率 / 资金偏好',weight:18,summary:m=>`要求股息率${m.reqYield.toFixed(1)}%`,dims:[
  d('市场要求股息率','%',[12,11,10,9,8],['估值显著压缩','估值要求高','基准10%','接受更低股息率','资源股重估']),
  d('港股风险溢价','bp',[180,140,100,60,20],['风险偏好很差','偏弱','基准','收窄','风险偏好强']),
  d('美债实际利率','%',[2.5,2,1.5,1,.5],['贴现率很高','偏高','基准','改善','非常友好']),
  d('资源股资金流','指数',[70,85,100,115,130],['持续流出','偏弱','基准','回流','明显重估'])]},
 guinea:{name:'几内亚政策 / 供应',weight:10,summary:m=>`出口税${m.guineaTax.toFixed(0)}%`,dims:[
  d('铝土矿出口税','%',[20,15,10,5,0],['税负大增','偏高','基准10%','下降','取消']),
  d('年度出口上限','百万吨',[120,135,150,165,180],['明显收紧','偏紧','1.5亿吨基准','改善','约束放松']),
  d('政策稳定度','分',[50,70,85,95,100],['不确定性高','有扰动','基准','改善','高度稳定']),
  d('矿山/铁路/港口可用率','%',[80,90,95,98,100],['中断风险高','有扰动','基准','顺畅','满负荷'])]},
 shareholder:{name:'分红 / 回购',weight:1,summary:m=>`派息率${m.payout.toFixed(0)}%`,dims:[
  d('派息率','%',[45,55,63,70,80],['明显下降','偏低','62-65%基准','提升','高分红强化']),
  d('年度回购','亿港元',[0,20,52,80,120],['停止','偏少','52亿基准','加码','大额持续'])]},
 debt:{name:'债务 / 财务费用',weight:.8,summary:m=>`高息债$${m.debt.toFixed(2)}bn`,dims:[
  d('高息美元债余额','十亿美元',[.8,.5,.27,.1,0],['重新依赖高息债','余额偏高','赎回后基准','继续偿债','基本清零']),
  d('平均融资成本','%',[6.5,5.5,4.5,3.8,3],['显著上升','偏高','基准','下降','低成本']),
  d('净负债','亿元人民币',[600,400,200,0,-200],['杠杆高','偏高','基准估算','净负债清零','明显净现金'])]},
 taxMinority:{name:'税率 / 少数股东',weight:.7,summary:m=>`税率${m.taxRate.toFixed(0)}%`,dims:[
  d('有效所得税率','%',[25,23,21,19,17],['回到高位','偏高','基准','优惠贡献升','显著下降']),
  d('归母权益比例','%',[82,86,89,91,93],['漏损增加','偏低','约89%基准','改善','明显改善'])]},
 oneOff:{name:'减值 / 一次性',weight:.5,summary:m=>`减值${m.impairment.toFixed(1)}bn`,dims:[
  d('年度减值损失','十亿元',[3,2,1.1,.5,0],['减值扩大','偏高','基准','明显减少','无新增']),
  d('其他一次性净收益','十亿元',[-1,-.5,0,.5,1],['净损失','小额损失','剔除一次性','小额收益','较大收益'])]}
};
const GROUPS={
 revenue:{name:'营收',weight:44,children:['aluminumPrice','aluminumVolume','aluminaExternal','deepProcessing']},
 aluminumAlloy:{name:'铝合金收入',weight:27,children:['aluminumPrice','aluminumVolume']},
 cost:{name:'营业成本',weight:25,children:['energy','bauxite','aluminaCost','anode','logistics','carbon']},
 special:{name:'行业 / 特殊',weight:31,children:['marketRisk','guinea','shareholder','debt','taxMinority','oneOff']}
};
const layout=[
 {label:'左 · 营收',main:'revenue',nodes:[['aluminumAlloy','center',['aluminumPrice','aluminumVolume']],['aluminaExternal','left'],['deepProcessing','right']]},
 {label:'中 · 成本',main:'cost',nodes:[['energy','left'],['bauxite','right'],['aluminaCost','left'],['anode','right'],['logistics','left'],['carbon','right']]},
 {label:'右 · 行业/特殊',main:'special',nodes:[['marketRisk','left'],['guinea','right'],['shareholder','left'],['debt','right'],['taxMinority','left'],['oneOff','right']]}
];
const $=s=>document.querySelector(s),buttons=$('#scenarioButtons'),sheet=$('#sheet'),scrim=$('#sheetScrim'),dimList=$('#dimensionList'),groupControl=$('#groupControl');let selected=null;
const levelMeta=l=>({name:LEVELS[l+2][0],cls:LEVELS[l+2][1]});
const avg=id=>F[id].dims.reduce((s,x)=>s+x.level,0)/F[id].dims.length;
const leaves=id=>F[id]?[id]:[...new Set(GROUPS[id].children.flatMap(x=>F[x]?[x]:leaves(x)))];
const groupAvg=id=>{let n=0,w=0;leaves(id).forEach(x=>{n+=avg(x)*F[x].weight;w+=F[x].weight});return n/w};
const nlevel=id=>F[id]?avg(id):groupAvg(id),ncls=v=>v<-.35?'red':v>.35?'green':'blue',state=v=>v<=-1.5?'超悲观':v<-.35?'悲观':v>=1.5?'超乐观':v>.35?'乐观':'中性';
const size=w=>Math.round(40+Math.sqrt(Math.max(w,.5)/44)*54),val=x=>x.values[x.level+2];
const interp=(s,a)=>{s=Math.max(-2,Math.min(2,s));const p=s+2,l=Math.floor(p),h=Math.ceil(p);return l===h?a[l]:a[l]*(h-p)+a[h]*(p-l)};
const fs=id=>avg(id),dl=(id,i)=>F[id].dims[i].level;
function fmt(v,u){if(u==='元/度')return `${(+v).toFixed(3)}${u}`;if(u==='十亿美元')return `$${(+v).toFixed(2)}bn`;if(u==='十亿元')return `${(+v).toFixed(1)}bn`;return `${Number(v).toLocaleString()}${u}`}
function snapshot(){
 const alS=.45*dl('aluminumPrice',0)+.2*dl('aluminumPrice',1)+.15*dl('aluminumPrice',2)+.2*dl('aluminumPrice',3),alPrice=interp(alS,[18000,19500,21192,23000,25000]),alPD=(alPrice-21192)/500*1.9;
 const vS=.45*dl('aluminumVolume',0)+.3*dl('aluminumVolume',1)+.25*dl('aluminumVolume',2),alVolume=interp(vS,[5.2,5.45,5.622,5.75,5.9]),volD=(alVolume-5.622)/5.622*31.2;
 const aoS=.6*dl('aluminaExternal',0)+.2*dl('aluminaExternal',2)+.2*dl('aluminaExternal',3),aluminaPrice=interp(aoS,[1800,2100,2327,2700,3200]),aoPD=(aluminaPrice-2327)/100*.95,aoVol=interp(dl('aluminaExternal',1),[5.6,6.3,6.917,7.4,8]),aoVD=(aoVol-6.917)*2*147/1000*.68;
 const dpS=.45*dl('deepProcessing',0)+.35*dl('deepProcessing',1)+.2*dl('deepProcessing',2),deepVolume=interp(dl('deepProcessing',0),[35,40,44.4,49,55]),dpD=interp(dpS,[-.65,-.3,0,.32,.65]);
 const enS=.35*dl('energy',0)+.3*dl('energy',1)+.2*dl('energy',2)+.15*dl('energy',3),powerCost=interp(enS,[.49,.47,.452,.435,.415]),enPretax=(.452-powerCost)/.01*.85,enD=enPretax*.675;
 const bxS=.35*dl('bauxite',0)+.2*dl('bauxite',1)+.3*dl('bauxite',2)+.15*dl('bauxite',3),bauxite=interp(bxS,[120,107,95,83,72]),bxD=(95-bauxite)/10*.73,bxPretax=bxD/.675;
 const acS=fs('aluminaCost'),aluminaCost=interp(acS,[2400,2290,2180,2070,1960]),acPretax=(2180-aluminaCost)*14e6/1e9,acD=acPretax*.675;
 const anS=fs('anode'),petCoke=interp(dl('anode',0),[2400,2100,1800,1550,1350]),anD=interp(anS,[-1.2,-.55,0,.48,.9]);
 const lgS=fs('logistics'),logistics=interp(dl('logistics',0),[600,520,450,390,340]),lgD=interp(lgS,[-.8,-.38,0,.32,.62]),lgPretax=lgD/.675;
 const cbS=fs('carbon'),carbon=interp(dl('carbon',0),[140,110,80,55,35]),cbD=interp(cbS,[-.5,-.23,0,.19,.38]);
 const mrS=.45*dl('marketRisk',0)+.2*dl('marketRisk',1)+.2*dl('marketRisk',2)+.15*dl('marketRisk',3),reqYield=interp(mrS,[12,11,10,9,8]),marketMult=interp(mrS,[.7,.85,1,1.15,1.32]);
 const gnS=.3*dl('guinea',0)+.2*dl('guinea',1)+.25*dl('guinea',2)+.25*dl('guinea',3),guineaTax=interp(dl('guinea',0),[20,15,10,5,0]),gnD=interp(gnS,[-1.8,-.9,0,.5,.9]),gnV=interp(gnS,[.96,.98,1,1.015,1.03]);
 const shS=fs('shareholder'),payout=interp(dl('shareholder',0),[45,55,63,70,80]),shV=interp(shS,[.97,.99,1,1.02,1.04]);
 const dbS=.4*dl('debt',0)+.3*dl('debt',1)+.3*dl('debt',2),debt=interp(dl('debt',0),[.8,.5,.27,.1,0]),dbD=interp(dbS,[-.35,-.15,0,.1,.18]),dbV=interp(dbS,[.98,.99,1,1.01,1.02]);
 const txS=.55*dl('taxMinority',0)+.45*dl('taxMinority',1),taxRate=interp(dl('taxMinority',0),[25,23,21,19,17]),parentShare=interp(dl('taxMinority',1),[82,86,89,91,93]),txV=interp(txS,[.96,.98,1,1.015,1.03]);
 const ooS=fs('oneOff'),impairment=interp(dl('oneOff',0),[3,2,1.1,.5,0]),ooD=interp(ooS,[-.6,-.3,0,.15,.25]);
 const op=alPD+volD+aoPD+aoVD+dpD+enD+bxD+acD+anD+lgD+cbD+gnD+dbD+ooD,profit=Math.max(10,(MODEL.baseProfit+op)*txV),valuation=marketMult*shV*gnV*dbV,eps=profit/MODEL.shares,pe=MODEL.basePE*valuation,price=eps*MODEL.rmbHkd*pe;
 const rev=59.57*(alPrice/21192)*(alVolume/5.622)+16.1*(aluminaPrice/2327)*(aoVol/6.917)+10.41*(1+dpS*.035)+1.43,cost=59.98-(enPretax+bxPretax+acPretax+lgPretax)*.5;
 return {price,profit,valuation,eps,pe,rev,cost,alPrice,alVolume,aluminaPrice,deepVolume,powerCost,bauxite,aluminaCost,petCoke,logistics,carbon,reqYield,guineaTax,payout,debt,taxRate,parentShare,impairment};
}
function summary(id,m){if(F[id])return F[id].summary(m);if(id==='revenue')return `${m.rev.toFixed(1)}亿/H1`;if(id==='cost')return `${m.cost.toFixed(1)}亿/H1`;if(id==='special')return `PE ${m.pe.toFixed(2)}×`;if(id==='aluminumAlloy')return `${(59.57*(m.alPrice/21192)*(m.alVolume/5.622)).toFixed(1)}亿/H1`;return ''}
function node(id,m){const o=F[id]||GROUPS[id],b=document.createElement('button');b.type='button';b.className=`circle-node ${ncls(nlevel(id))}${selected===id?' selected':''}`;b.style.setProperty('--size',`${size(o.weight)}px`);b.innerHTML=`<span class="w">${o.weight}%</span><span class="name">${o.name}</span><span class="val">${summary(id,m)}</span>`;b.onclick=()=>open(id);return b}
function renderTree(){const m=snapshot(),wrap=$('#treeColumns');wrap.innerHTML='';layout.forEach(br=>{const c=document.createElement('div');c.className='branch-col';c.innerHTML=`<div class="branch-label">${br.label}</div>`;const main=document.createElement('div');main.className='branch-main';main.appendChild(node(br.main,m));c.appendChild(main);const sp=document.createElement('div');sp.className='branch-spine';br.nodes.forEach(n=>{const line=document.createElement('div');line.className=`factor-line ${n[1]}`;line.appendChild(node(n[0],m));sp.appendChild(line);if(n[2]){const pair=document.createElement('div');pair.className='child-pair';n[2].forEach(x=>pair.appendChild(node(x,m)));sp.appendChild(pair)}});c.appendChild(sp);wrap.appendChild(c)})}
function factorImpact(id){const ids=leaves(id),saved={};ids.forEach(x=>saved[x]=F[x].dims.map(y=>y.level));const now=snapshot().price;ids.forEach(x=>F[x].dims.forEach(y=>y.level=0));const base=snapshot().price;ids.forEach(x=>F[x].dims.forEach((y,i)=>y.level=saved[x][i]));return now-base}
function open(id){selected=id;renderTree();const o=F[id]||GROUPS[id],isG=!!GROUPS[id],m=snapshot(),lv=nlevel(id),meta={name:state(lv),cls:ncls(lv)};$('#sheetKicker').textContent=isG?'聚合节点 · 同步子因子':`敏感度权重 ${o.weight}%`;$('#sheetTitle').textContent=o.name;$('#sheetSubtitle').textContent=isG?'选择档位会同步设置该分支的全部子因子。':'每个维度都有五个明确数值，并实时进入股价公式。';const pill=$('#factorState');pill.className=`state-pill ${meta.cls}`;pill.textContent=meta.name;$('#factorCurrent').textContent=summary(id,m);const imp=factorImpact(id);$('#factorImpact').textContent=`对模型价 ${imp>=0?'+':''}HK$${imp.toFixed(2)}`;if(isG){dimList.innerHTML='';groupControl.classList.remove('hidden');groupControl.innerHTML=`<h3>整体情景档位</h3><p>将 ${leaves(id).length} 个底层因子同步切换到同一档位。</p><div class="group-levels">${LEVELS.map((x,i)=>`<button class="${x[1]}" data-l="${i-2}">${x[0]}</button>`).join('')}</div>`;groupControl.querySelectorAll('button').forEach(b=>b.onclick=()=>{leaves(id).forEach(x=>F[x].dims.forEach(y=>y.level=+b.dataset.l));clearScenario();update();open(id)})}else{groupControl.classList.add('hidden');renderDims(id)}sheet.classList.add('open');scrim.classList.add('show');sheet.setAttribute('aria-hidden','false')}
function renderDims(id){const f=F[id];dimList.innerHTML='';f.dims.forEach((x,i)=>{const meta=levelMeta(x.level),box=document.createElement('div');box.className=`dimension ${meta.cls}`;box.innerHTML=`<div class="dim-top"><div><div class="dim-name">${x.name}</div><div class="dim-meta">${f.name} · 权重${f.weight}%</div></div><div class="dim-current">${fmt(val(x),x.unit)}</div></div><input class="range" type="range" min="-2" max="2" step="1" value="${x.level}"><div class="levels">${x.values.map((v,j)=>`<div class="level-chip ${j===x.level+2?'on':''}"><b>${LEVELS[j][0]}</b><span>${fmt(v,x.unit)}</span></div>`).join('')}</div><div class="dim-desc"><b>${meta.name}：</b>${x.desc[x.level+2]}</div><div class="dim-impact">当前值已纳入利润 / EPS / PE / 股价联动计算。</div>`;box.querySelector('input').oninput=e=>{x.level=+e.target.value;clearScenario();update();open(id)};dimList.appendChild(box)})}
function setAll(l){Object.values(F).forEach(f=>f.dims.forEach(x=>x.level=l))}
const QUICK=['aluminumPrice','aluminaExternal','energy','bauxite','marketRisk','guinea','aluminumVolume'];
function apply(mode){setAll(0);if(mode==='bear')QUICK.forEach(id=>F[id].dims.forEach(x=>x.level=-1));if(mode==='bull')QUICK.forEach(id=>F[id].dims.forEach(x=>x.level=1));buttons.querySelectorAll('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));close();update()}
function clearScenario(){buttons.querySelectorAll('.scenario').forEach(b=>b.classList.remove('active'))}
function preset(mode){const saved={};Object.entries(F).forEach(([id,f])=>saved[id]=f.dims.map(x=>x.level));setAll(0);if(mode==='bear')QUICK.forEach(id=>F[id].dims.forEach(x=>x.level=-1));if(mode==='bull')QUICK.forEach(id=>F[id].dims.forEach(x=>x.level=1));const p=snapshot().price;Object.entries(F).forEach(([id,f])=>f.dims.forEach((x,i)=>x.level=saved[id][i]));return p}
function update(){const p=+($('#currentPrice').value||22.5);MODEL.basePrice=p;MODEL.basePE=p/((MODEL.baseProfit/MODEL.shares)*MODEL.rmbHkd);const m=snapshot(),r=(m.price/p-1)*100;$('#scenarioPrice').textContent=`HK$${m.price.toFixed(2)}`;$('#scenarioReturn').textContent=`${r>=0?'+':''}${r.toFixed(2)}%`;$('#rootPrice').textContent=`HK$${m.price.toFixed(2)}`;$('#rootDelta').textContent=`${r>=0?'+':''}${r.toFixed(2)}%`;const rb=$('#resultBox');rb.classList.remove('pos','neg');rb.classList.add(r>=0?'pos':'neg');$('#profitValue').textContent=`${(m.profit*10).toFixed(1)}亿`;$('#epsValue').textContent=`¥${m.eps.toFixed(2)}`;$('#peValue').textContent=`${m.pe.toFixed(2)}×`;$('#valuationValue').textContent=`${m.valuation.toFixed(3)}×`;renderTree();$('#bearPrice').textContent=`HK$${preset('bear').toFixed(2)}`;$('#basePrice').textContent=`HK$${preset('base').toFixed(2)}`;$('#bullPrice').textContent=`HK$${preset('bull').toFixed(2)}`}
function close(){sheet.classList.remove('open');scrim.classList.remove('show');sheet.setAttribute('aria-hidden','true');selected=null;renderTree()}
buttons.onclick=e=>{const b=e.target.closest('.scenario');if(b)apply(b.dataset.mode)};$('#currentPrice').oninput=()=>{clearScenario();update()};$('#resetBtn').onclick=()=>apply('base');$('#sheetClose').onclick=close;scrim.onclick=close;update();
})();
