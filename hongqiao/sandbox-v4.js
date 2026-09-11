(() => {
  const LEVELS = [
    {v:-2,name:'超悲观',cls:'red'},
    {v:-1,name:'悲观',cls:'red'},
    {v:0,name:'中性',cls:'blue'},
    {v:1,name:'乐观',cls:'green'},
    {v:2,name:'超乐观',cls:'green'}
  ];
  const MODEL = {
    basePrice:22.50,
    baseProfitBn:33.0,
    sharesBn:9.52,
    rmbToHkd:1.09,
    basePE:0,
    baseRevenueH1Bn:87.51,
    baseCostH1Bn:59.98
  };
  MODEL.basePE = MODEL.basePrice / ((MODEL.baseProfitBn/MODEL.sharesBn)*MODEL.rmbToHkd);

  const F = {
    aluminumPrice:{name:'铝价',weight:24,branch:'revenue',summary:m=>`¥${Math.round(m.alRealized).toLocaleString()}/吨`,dims:[
      d('沪铝均价','元/吨',[18000,19500,21192,23000,25000],['价格明显跌破盈利中枢','价格偏弱，收入端承压','按2026H1实现价附近','价格温和上行，吨铝利润扩大','强周期上行，利润弹性显著']),
      d('LME 铝价','美元/吨',[2200,2400,2600,2850,3150],['海外需求疲弱/供应宽松','偏弱外盘压制全球定价','全球铝价中枢','海外紧平衡强化定价','海外供应冲击/需求强劲']),
      d('华东现货升贴水','元/吨',[-200,-50,100,250,450],['明显贴水，现货需求差','小幅贴水','中性升水','升水扩大，现货偏紧','高升水，现货供给明显偏紧']),
      d('国内铝锭库存','万吨',[120,100,81.5,65,50],['明显累库，对价格最不利','库存偏高','9月初基准附近','持续去库，价格获支撑','低库存，现货紧张']),
    ]},
    aluminumVolume:{name:'铝合金销量',weight:3,branch:'revenue',summary:m=>`${m.alVolumeMt.toFixed(2)}Mt/年`,dims:[
      d('行业/公司开工率','%',[94,96,98,99,100],['检修/限产较多','开工略弱','接近行业高位','高负荷运行','满负荷运行']),
      d('云南枯水期限电影响','天',[60,30,15,5,0],['限电时间长，产量受压','存在明显限电','基准扰动','轻微影响','基本无限电']),
      d('云南产能搬迁完成度','%',[70,82,90,96,100],['搬迁滞后','进度偏慢','按计划推进','进度较快','全面完成']),
    ]},
    aluminaExternal:{name:'氧化铝外销',weight:14,branch:'revenue',summary:m=>`¥${Math.round(m.aluminaEffective)}/吨`,dims:[
      d('外销实现价','元/吨',[1800,2100,2327,2700,3200],['严重供过于求，价格大跌','价格偏弱','2026H1均价','价格回升至管理层指引附近','供应收紧，价格大幅走高']),
      d('H1外销量','万吨',[560,630,691.7,740,800],['销量显著下滑','销量略弱','2026H1基准','销量改善','销量显著增长']),
      d('行业开工率','%',[90,85,80,75,70],['高开工，供给压力大','供给偏宽松','基准约80%','供给趋紧','明显减产，价格受支撑']),
      d('中东进口需求指数','指数',[80,90,100,110,120],['中东需求明显走弱','需求偏弱','需求基准','进口需求改善','中东补库强劲']),
    ]},
    deepProcessing:{name:'深加工',weight:3,branch:'revenue',summary:m=>`${m.deepVolKt.toFixed(0)}万吨/H1`,dims:[
      d('H1销量','万吨',[35,40,44.4,49,55],['订单下滑','增速放缓','2026H1基准','客户放量','产能快速爬坡']),
      d('加工费','元/吨',[1400,1800,2244,2700,3200],['竞争激烈，加工费下滑','加工费偏弱','按铝价+加工费倒推基准','高端产品占比上升','高附加值产品明显提升']),
      d('贸易摩擦成本','元/吨',[800,500,300,150,0],['关税/CBAM/反倾销压力高','出口成本偏高','中性','压力减轻','几乎无额外贸易成本']),
    ]},
    energy:{name:'电力 / 煤价',weight:13,branch:'cost',summary:m=>`¥${m.powerCost.toFixed(3)}/度`,dims:[
      d('动力煤价格','元/吨',[1000,900,800,700,600],['煤价大涨，自备电成本明显上升','煤价偏高','基准煤价','煤价回落','煤价显著回落']),
      d('云南综合电价','元/度',[0.49,0.465,0.44,0.415,0.39],['水电偏贵/来水偏差','电价偏高','基准约0.44','水电价格改善','低成本水电优势充分释放']),
      d('云南产能占比','%',[20,28,35,42,50],['低成本云南产能占比较低','迁产偏慢','基准结构','云南占比提升','低成本产能占比显著提高']),
      d('绿电自给比例','%',[10,20,30,40,55],['绿电建设滞后','绿电贡献偏低','基准水平','风光项目推进顺利','绿电自给大幅提升']),
    ]},
    bauxite:{name:'铝土矿成本',weight:5,branch:'cost',summary:m=>`$${m.bauxiteLanded.toFixed(0)}/干吨`,dims:[
      d('进口矿价','美元/干吨',[90,80,70,60,50],['矿价大涨','矿价偏高','约70美元基准','矿价回落','矿价显著回落']),
      d('海运费','美元/吨',[35,30,25,20,15],['航道/油价冲击，运费高','运费偏高','基准海运','运费改善','航运宽松']),
      d('自有矿权益覆盖','%',[35,45,55,65,75],['外采依赖高','自有矿覆盖偏低','基准估算','资源保障增强','自有矿优势明显']),
      d('矿石品位','%',[42,44,46,48,50],['低品位提高单耗','品位偏低','基准品位','品位改善','高品位降低单耗']),
    ]},
    aluminaCost:{name:'氧化铝制造',weight:2,branch:'cost',summary:m=>`¥${Math.round(m.aluminaUnitCost)}/吨`,dims:[
      d('烧碱价格','元/吨',[3500,3200,2900,2600,2300],['烧碱价格高企','成本偏高','基准','价格回落','价格显著回落']),
      d('煤/蒸汽成本指数','指数',[120,110,100,90,80],['能源成本大涨','成本偏高','基准','成本改善','成本显著改善']),
      d('工艺效率指数','指数',[90,95,100,105,110],['单耗恶化','效率偏低','基准','效率提升','工艺效率显著提升']),
    ]},
    anode:{name:'阳极炭块',weight:2,branch:'cost',summary:m=>`石油焦¥${Math.round(m.petCoke)}/吨`,dims:[
      d('石油焦价格','元/吨',[2400,2100,1800,1550,1350],['原油/焦价大涨','成本偏高','基准','成本回落','原料价格大幅改善']),
      d('阳极单耗','吨/吨铝',[0.54,0.52,0.50,0.48,0.46],['单耗偏高','效率偏低','行业典型值','单耗改善','工艺效率领先']),
      d('阳极自产比例','%',[50,60,70,80,90],['外采依赖高','自产偏低','基准','自产提升','一体化优势明显']),
    ]},
    logistics:{name:'折旧 / 物流',weight:2,branch:'cost',summary:m=>`物流¥${Math.round(m.logisticsCost)}/吨`,dims:[
      d('矿石综合物流','元/吨',[600,520,450,390,340],['运距/运费高','物流偏高','基准','效率改善','物流网络高效']),
      d('新产能折旧负担','指数',[120,110,100,95,90],['新资产折旧压力大','折旧偏高','基准','产能利用摊薄折旧','折旧效率显著改善']),
    ]},
    carbon:{name:'碳 / 能效成本',weight:1,branch:'cost',summary:m=>`碳价¥${Math.round(m.carbonPrice)}/吨`,dims:[
      d('碳配额价格','元/吨',[140,110,80,55,35],['碳成本显著抬升','碳成本偏高','基准','碳成本较低','低碳优势明显']),
      d('单位排放强度','指数',[120,110,100,90,80],['排放强度高','能效偏弱','基准','能效改善','低碳产能占比显著提升']),
    ]},
    marketRisk:{name:'利率 / 资金偏好',weight:18,branch:'special',summary:m=>`要求股息率${m.reqYield.toFixed(1)}%`,dims:[
      d('市场要求股息率','%',[12,11,10,9,8],['风险溢价高，估值显著压缩','估值要求偏高','基准约10%','资金愿意接受更低股息率','资源股重估明显']),
      d('中国/港股风险溢价','bp',[180,140,100,60,20],['风险偏好很差','风险偏好偏弱','基准','风险溢价收窄','风险偏好强']),
      d('美债实际利率','%',[2.5,2.0,1.5,1.0,0.5],['全球贴现率很高','贴现率偏高','基准','流动性改善','全球估值环境非常友好']),
      d('资源股资金流指数','指数',[70,85,100,115,130],['资金持续流出资源股','资金偏弱','基准','资金回流','资源股明显重估']),
    ]},
    guinea:{name:'几内亚政策 / 供应',weight:10,branch:'special',summary:m=>`出口税${m.guineaTax.toFixed(0)}%`,dims:[
      d('铝土矿出口税','%',[20,15,10,5,0],['税负大幅提高，矿端成本受压','税负偏高','10%基准假设','税负下降','出口税取消']),
      d('年度出口上限','百万吨',[120,135,150,165,180],['出口明显收紧','供给偏紧','1.5亿吨基准','供应改善','出口约束明显放松']),
      d('政策稳定度','分',[50,70,85,95,100],['矿权/政策不确定性高','存在政策扰动','基准稳定度','政策环境改善','高度稳定']),
      d('矿山/铁路/港口可用率','%',[80,90,95,98,100],['运输中断风险高','有明显扰动','基准','运营顺畅','满负荷稳定运行']),
    ]},
    shareholder:{name:'分红 / 回购',weight:1,branch:'special',summary:m=>`派息率${m.payout.toFixed(0)}%`,dims:[
      d('派息率','%',[45,55,63,70,80],['资本回报明显下降','派息偏低','约62-65%基准','派息提升','高分红政策进一步强化']),
      d('年度回购','亿港元',[0,20,52,80,120],['停止回购','回购偏少','约52亿基准','回购加码','大额持续回购']),
    ]},
    debt:{name:'债务 / 财务费用',weight:0.8,branch:'special',summary:m=>`高息债$${m.highYieldDebt.toFixed(2)}bn`,dims:[
      d('高息美元债余额','十亿美元',[0.80,0.50,0.27,0.10,0.00],['重新依赖高息融资','高息债余额偏高','赎回后剩余约2.7亿美元假设','继续提前偿债','高息美元债基本清零']),
      d('平均有息负债成本','%',[6.5,5.5,4.5,3.8,3.0],['融资成本显著上升','融资成本偏高','基准估算','融资成本下降','低成本融资环境']),
      d('净负债','亿元人民币',[600,400,200,0,-200],['净负债明显上升','杠杆偏高','基准估算','接近净现金','净现金明显增加']),
    ]},
    taxMinority:{name:'税率 / 少数股东',weight:0.7,branch:'special',summary:m=>`税率${m.taxRate.toFixed(0)}%`,dims:[
      d('有效所得税率','%',[25,23,21,19,17],['税率回到标准高位','税率偏高','基准估算','云南/优惠税率贡献提升','有效税率显著下降']),
      d('归母权益比例','%',[82,86,89,91,93],['A股定增等导致少数股东漏损增加','归母比例偏低','约89%基准','归母比例改善','少数股东漏损显著减少']),
    ]},
    oneOff:{name:'减值 / 一次性',weight:0.5,branch:'special',summary:m=>`减值${m.impairment.toFixed(1)}bn`,dims:[
      d('年度减值损失','十亿元',[3.0,2.0,1.1,0.5,0.0],['存货/机组减值继续扩大','减值偏高','按H1约11亿元量级参考','减值明显减少','基本无新增减值']),
      d('其他一次性净收益','十亿元',[-1.0,-0.5,0.0,0.5,1.0],['出现一次性损失','小额损失','剔除一次性','小额净收益','较大一次性收益']),
    ]}
  };
  function d(name,unit,values,desc){return {name,unit,values,desc,level:0};}

  const GROUPS = {
    revenue:{name:'营收',weight:44,branch:'revenue',children:['aluminumPrice','aluminumVolume','aluminaExternal','deepProcessing']},
    aluminumAlloy:{name:'铝合金收入',weight:27,branch:'revenue',children:['aluminumPrice','aluminumVolume']},
    cost:{name:'营业成本',weight:25,branch:'cost',children:['energy','bauxite','aluminaCost','anode','logistics','carbon']},
    special:{name:'行业 / 特殊',weight:31,branch:'special',children:['marketRisk','guinea','shareholder','debt','taxMinority','oneOff']}
  };

  const branchLayout = [
    {id:'revenue',label:'左 · 营收',main:'revenue',nodes:[
      {id:'aluminumAlloy',group:true,side:'center',children:['aluminumPrice','aluminumVolume']},
      {id:'aluminaExternal',side:'left'},
      {id:'deepProcessing',side:'right'}
    ]},
    {id:'cost',label:'中 · 成本',main:'cost',nodes:[
      {id:'energy',side:'left'},{id:'bauxite',side:'right'},{id:'aluminaCost',side:'left'},{id:'anode',side:'right'},{id:'logistics',side:'left'},{id:'carbon',side:'right'}
    ]},
    {id:'special',label:'右 · 行业/特殊',main:'special',nodes:[
      {id:'marketRisk',side:'left'},{id:'guinea',side:'right'},{id:'shareholder',side:'left'},{id:'debt',side:'right'},{id:'taxMinority',side:'left'},{id:'oneOff',side:'right'}
    ]}
  ];

  const $ = s=>document.querySelector(s);
  const scenarioButtons = $('#scenarioButtons');
  const sheet = $('#sheet'), scrim = $('#sheetScrim'), dimList = $('#dimensionList'), groupControl = $('#groupControl');
  let selectedId = null;

  function levelMeta(level){return LEVELS[level+2];}
  function factorAvgLevel(id){
    const f=F[id]; return f.dims.reduce((s,x)=>s+x.level,0)/f.dims.length;
  }
  function groupAvgLevel(id){
    const g=GROUPS[id]; let num=0,den=0;
    g.children.forEach(cid=>{const w=(F[cid]||GROUPS[cid]).weight;num+=(F[cid]?factorAvgLevel(cid):groupAvgLevel(cid))*w;den+=w;});
    return den?num/den:0;
  }
  function clsForLevel(v){if(v<=-0.35)return 'red';if(v>=0.35)return 'green';return 'blue';}
  function stateName(v){if(v<=-1.5)return '超悲观';if(v<-.35)return '悲观';if(v>=1.5)return '超乐观';if(v>.35)return '乐观';return '中性';}
  function sizeForWeight(w){return Math.round(40 + Math.sqrt(Math.max(w,.5)/44)*54);}
  function val(dim){return dim.values[dim.level+2];}
  function fmt(v,unit){
    if(unit==='元/度') return `${Number(v).toFixed(3)}${unit}`;
    if(unit==='十亿美元') return `$${Number(v).toFixed(2)}bn`;
    if(unit==='十亿元') return `${Number(v).toFixed(1)}bn`;
    if(unit==='元/吨'||unit==='美元/吨'||unit==='美元/干吨'||unit==='亿港元'||unit==='亿元人民币'||unit==='万吨'||unit==='百万吨'||unit==='%'||unit==='bp'||unit==='指数'||unit==='分') return `${Number(v).toLocaleString()}${unit}`;
    return `${v}${unit}`;
  }

  function snapshot(){
    const al=F.aluminumPrice.dims.map(val);
    const vol=F.aluminumVolume.dims.map(val);
    const ao=F.aluminaExternal.dims.map(val);
    const deep=F.deepProcessing.dims.map(val);
    const en=F.energy.dims.map(val);
    const bx=F.bauxite.dims.map(val);
    const ac=F.aluminaCost.dims.map(val);
    const an=F.anode.dims.map(val);
    const lg=F.logistics.dims.map(val);
    const cb=F.carbon.dims.map(val);
    const mr=F.marketRisk.dims.map(val);
    const gn=F.guinea.dims.map(val);
    const sh=F.shareholder.dims.map(val);
    const db=F.debt.dims.map(val);
    const tx=F.taxMinority.dims.map(val);
    const oo=F.oneOff.dims.map(val);

    const alRealized = 21192 + .70*(al[0]-21192) + .12*(al[1]-2600)*7.1 + (al[2]-100) + 10*(81.5-al[3]);
    const alPriceProfit = ((alRealized-21192)/500)*1.90;

    const volumeIndex = .45*(vol[0]/98)+.25*((75-vol[1])/60)+.30*(vol[2]/90);
    const baseVolumeIndex = .45*1+.25*1+.30*1;
    const alVolumeMt = 5.622*(volumeIndex/baseVolumeIndex);
    const alVolumeProfit = ((alVolumeMt-5.622)/5.622)*31.2;

    const aluminaEffective = ao[0] + (80-ao[2])*15 + (ao[3]-100)*3;
    const aluminaPriceProfit = ((aluminaEffective-2327)/100)*0.95;
    const aluminaVolMtH1 = ao[1]/100;
    const aluminaVolumeProfit = ((aluminaVolMtH1-6.917)*2)*147/1000*0.68;

    const deepVolKt = deep[0];
    const deepProfit = ((deep[0]-44.4)*2*10000*(deep[1]-deep[2]-1944))/1e9*0.68 + ((deep[1]-2244)-(deep[2]-300))*0.888e6/1e9*0.68;

    const coal=en[0], yunnanP=en[1], yShare=en[2]/100, greenShare=en[3]/100;
    const shandongP=0.34+coal*0.00018, greenP=0.40;
    const powerCost=yShare*yunnanP+(1-yShare)*(greenShare*greenP+(1-greenShare)*shandongP);
    const basePower=0.35*.44+0.65*(0.30*.40+0.70*(0.34+800*.00018));
    const energyPretax = -(powerCost-basePower)/0.01*0.85;
    const energyProfit = energyPretax*0.675;

    const landed=(bx[0]+bx[1]);
    const bauxiteLanded=landed;
    const baseLanded=95;
    const exposure=.45*(1-(bx[2]-55)/100*.35);
    const gradeAdj=46/bx[3];
    const bauxitePretax=-(landed*gradeAdj-baseLanded)*33.6e6*7.1*exposure/1e9;
    const bauxiteProfit=bauxitePretax*.675;

    const aluminaUnitCost=2180 + (ac[0]-2900)*.11 + (ac[1]-100)*3.5 - (ac[2]-100)*8;
    const aluminaCostPretax=-(aluminaUnitCost-2180)*14e6/1e9;
    const aluminaCostProfit=aluminaCostPretax*.675;

    const petCoke=an[0];
    const anodeCostPerAl=(an[0]-1800)*an[1]*(1-(an[2]-70)/100*.25)+(an[1]-.50)*1800;
    const anodeProfit=-(anodeCostPerAl)*5.622e6/1e9*.675;

    const logisticsCost=lg[0];
    const logisticsPretax=-(lg[0]-450)*12e6/1e9 -(lg[1]-100)*.05;
    const logisticsProfit=logisticsPretax*.675;

    const carbonPrice=cb[0];
    const carbonPretax= -((cb[0]-80)/80 + (cb[1]-100)/100)*0.55;
    const carbonProfit=carbonPretax*.675;

    const reqYield=mr[0];
    const yieldMult=1+(10-reqYield)*.10;
    const riskMult=1+(100-mr[1])/40*.03;
    const realYieldMult=1+(1.5-mr[2])/.5*.02;
    const flowMult=1+(mr[3]-100)/15*.03;
    let marketMult=yieldMult*riskMult*realYieldMult*flowMult;
    marketMult=Math.max(.60,Math.min(1.55,marketMult));

    const guineaTax=gn[0];
    const guineaScore=.30*((10-gn[0])/5)+.20*((gn[1]-150)/15)+.25*((gn[2]-85)/10)+.25*((gn[3]-95)/5);
    const guineaProfit = guineaScore>=0 ? Math.min(1.1,guineaScore*.55) : Math.max(-1.8,guineaScore*.75);
    const guineaValMult=1+Math.max(-.04,Math.min(.03,guineaScore*.012));

    const payout=sh[0];
    const shareholderMult=1+(sh[0]-63)*.0012+(sh[1]-52)/52*.006;

    const highYieldDebt=db[0];
    const baseInterest=0.27*.045*7.1;
    const nowInterest=db[0]*db[1]/100*7.1;
    const debtProfit=(baseInterest-nowInterest)*.675;
    const creditMult=1+Math.max(-.025,Math.min(.025,((200-db[2])/200)*.012));

    const taxRate=tx[0];
    const parentShare=tx[1];
    const taxMinorRaw=((1-taxRate/100)/(1-.21))*(parentShare/.89);
    const taxMinorMult=1+(taxMinorRaw-1)*.35;

    const impairment=oo[0];
    const oneOffProfit = ((1.1-impairment)+(oo[1]-0))*0.20;

    let operatingDelta = alPriceProfit+alVolumeProfit+aluminaPriceProfit+aluminaVolumeProfit+deepProfit+energyProfit+bauxiteProfit+aluminaCostProfit+anodeProfit+logisticsProfit+carbonProfit+guineaProfit+debtProfit+oneOffProfit;
    let profit = Math.max(10, (MODEL.baseProfitBn+operatingDelta)*taxMinorMult);
    const valuationMult = marketMult*shareholderMult*guineaValMult*creditMult;
    const epsRmb=profit/MODEL.sharesBn;
    const pe=MODEL.basePE*valuationMult;
    const price=epsRmb*MODEL.rmbToHkd*pe;

    const alloyRevenue=59.57*(alRealized/21192)*(alVolumeMt/5.622);
    const aluminaRevenue=16.10*(aluminaEffective/2327)*(aluminaVolMtH1/6.917);
    const deepRevenue=10.41*(deep[0]/44.4)*((alRealized+deep[1])/(21192+2244));
    const revenueH1=alloyRevenue+aluminaRevenue+deepRevenue+1.43;
    const costH1=59.98 + (-energyPretax-bauxitePretax-aluminaCostPretax-logisticsPretax)*.5;

    return {price,profit,epsRmb,pe,valuationMult,operatingDelta,alRealized,alVolumeMt,aluminaEffective,aluminaVolMtH1,deepVolKt,powerCost,bauxiteLanded,aluminaUnitCost,petCoke,logisticsCost,carbonPrice,reqYield,guineaTax,payout,highYieldDebt,taxRate,parentShare,impairment,revenueH1,costH1,
      factors:{aluminumPrice:alPriceProfit,aluminumVolume:alVolumeProfit,aluminaExternal:aluminaPriceProfit+aluminaVolumeProfit,deepProcessing:deepProfit,energy:energyProfit,bauxite:bauxiteProfit,aluminaCost:aluminaCostProfit,anode:anodeProfit,logistics:logisticsProfit,carbon:carbonProfit,marketRisk:marketMult-1,guinea:guineaProfit,debt:debtProfit,oneOff:oneOffProfit,shareholder:shareholderMult-1,taxMinority:taxMinorMult-1}
    };
  }

  function nodeSummary(id,m){
    if(F[id]) return F[id].summary(m);
    if(id==='revenue') return `${m.revenueH1.toFixed(1)}亿/H1`;
    if(id==='cost') return `${m.costH1.toFixed(1)}亿/H1`;
    if(id==='special') return `PE ${m.pe.toFixed(2)}×`;
    if(id==='aluminumAlloy') return `${(m.revenueH1*0.68).toFixed(1)}亿/H1`;
    return '';
  }
  function nodeWeight(id){return (F[id]||GROUPS[id]).weight;}
  function nodeName(id){return (F[id]||GROUPS[id]).name;}
  function nodeLevel(id){return F[id]?factorAvgLevel(id):groupAvgLevel(id);}

  function renderTree(){
    const m=snapshot();
    const wrap=$('#treeColumns'); wrap.innerHTML='';
    branchLayout.forEach(branch=>{
      const col=document.createElement('div'); col.className='branch-col';
      const lab=document.createElement('div');lab.className='branch-label';lab.textContent=branch.label;col.appendChild(lab);
      const main=document.createElement('div');main.className='branch-main';main.appendChild(makeNode(branch.main,m));col.appendChild(main);
      const spine=document.createElement('div');spine.className='branch-spine';
      branch.nodes.forEach((n,i)=>{
        const line=document.createElement('div');line.className=`factor-line ${n.side||'center'}`;
        line.appendChild(makeNode(n.id,m));spine.appendChild(line);
        if(n.children){const pair=document.createElement('div');pair.className='child-pair';n.children.forEach(cid=>pair.appendChild(makeNode(cid,m)));spine.appendChild(pair);}
      });
      col.appendChild(spine);wrap.appendChild(col);
    });
  }

  function makeNode(id,m){
    const b=document.createElement('button');b.type='button';b.className=`circle-node ${clsForLevel(nodeLevel(id))}`;b.style.setProperty('--size',`${sizeForWeight(nodeWeight(id))}px`);b.dataset.id=id;
    if(selectedId===id)b.classList.add('selected');
    b.innerHTML=`<span class="w">${nodeWeight(id)}%</span><span class="name">${nodeName(id)}</span><span class="val">${nodeSummary(id,m)}</span>`;
    b.addEventListener('click',()=>openFactor(id));return b;
  }

  function openFactor(id){
    selectedId=id; renderTree();
    const isGroup=!!GROUPS[id]; const obj=F[id]||GROUPS[id]; const m=snapshot();
    $('#sheetKicker').textContent=isGroup?'聚合节点 · 一键同步子因子':`敏感度权重 ${obj.weight}%`;
    $('#sheetTitle').textContent=obj.name;
    $('#sheetSubtitle').textContent=isGroup?'选择档位后，会将该节点所有子因子同步设为相同情景档位。':'每个维度都可在五档之间拖动；每档都有明确数值和经济解释。';
    const avg=nodeLevel(id), cls=clsForLevel(avg);const pill=$('#factorState');pill.className=`state-pill ${cls}`;pill.textContent=stateName(avg);
    $('#factorCurrent').textContent=nodeSummary(id,m);
    $('#factorImpact').textContent=`对模型价 ${factorPriceImpact(id)>=0?'+':''}HK$${factorPriceImpact(id).toFixed(2)}`;
    if(isGroup){renderGroupPanel(id);dimList.innerHTML='';groupControl.classList.remove('hidden');}
    else{groupControl.classList.add('hidden');renderDimensions(id);}
    sheet.classList.add('open');scrim.classList.add('show');sheet.setAttribute('aria-hidden','false');
  }

  function renderGroupPanel(id){
    const g=GROUPS[id];groupControl.innerHTML=`<h3>整体情景档位</h3><p>当前聚合值：${nodeSummary(id,snapshot())}。点击任一档位，将同步调整 ${g.children.length} 个子因子。</p><div class="group-levels">${LEVELS.map(l=>`<button class="${l.cls}" data-v="${l.v}">${l.name}</button>`).join('')}</div>`;
    groupControl.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{setGroupLevel(id,+btn.dataset.v);updateAll();openFactor(id);}));
  }

  function renderDimensions(id){
    const f=F[id];dimList.innerHTML='';f.dims.forEach((dim,idx)=>{
      const meta=levelMeta(dim.level);const box=document.createElement('div');box.className=`dimension ${meta.cls}`;
      const values=dim.values.map((v,j)=>`<div class="level-chip ${j===dim.level+2?'on':''}"><b>${LEVELS[j].name}</b><span>${fmt(v,dim.unit)}</span></div>`).join('');
      box.innerHTML=`<div class="dim-top"><div><div class="dim-name">${dim.name}</div><div class="dim-meta">${f.name} · ${f.weight}%敏感度节点</div></div><div class="dim-current">${fmt(val(dim),dim.unit)}</div></div><input class="range" type="range" min="-2" max="2" step="1" value="${dim.level}" data-idx="${idx}"/><div class="levels">${values}</div><div class="dim-desc"><b>${meta.name}：</b>${dim.desc[dim.level+2]}</div><div class="dim-impact">该维度改变后，系统实时重算利润、EPS、估值乘数与最终股价。</div>`;
      box.querySelector('.range').addEventListener('input',e=>{dim.level=+e.target.value;clearScenarioActive();updateAll();openFactor(id);});
      dimList.appendChild(box);
    });
  }

  function factorPriceImpact(id){
    const f=F[id];if(!f){return groupPriceImpact(id);}const saved=f.dims.map(x=>x.level);const now=snapshot().price;f.dims.forEach(x=>x.level=0);const neutral=snapshot().price;f.dims.forEach((x,i)=>x.level=saved[i]);return now-neutral;
  }
  function groupPriceImpact(id){
    const ids=collectLeaves(id);const saved={};ids.forEach(fid=>saved[fid]=F[fid].dims.map(x=>x.level));const now=snapshot().price;ids.forEach(fid=>F[fid].dims.forEach(x=>x.level=0));const neutral=snapshot().price;ids.forEach(fid=>F[fid].dims.forEach((x,i)=>x.level=saved[fid][i]));return now-neutral;
  }
  function collectLeaves(id){const g=GROUPS[id];if(!g)return [id];let out=[];g.children.forEach(c=>out.push(...(GROUPS[c]?collectLeaves(c):[c])));return [...new Set(out)];}
  function setGroupLevel(id,lv){collectLeaves(id).forEach(fid=>F[fid].dims.forEach(x=>x.level=lv));clearScenarioActive();}

  function updateAll(){
    const p=+($('#currentPrice').value||MODEL.basePrice);MODEL.basePrice=p;MODEL.basePE = MODEL.basePrice / ((MODEL.baseProfitBn/MODEL.sharesBn)*MODEL.rmbToHkd);
    const m=snapshot();const ret=(m.price/p-1)*100;
    $('#scenarioPrice').textContent=`HK$${m.price.toFixed(2)}`;$('#scenarioReturn').textContent=`${ret>=0?'+':''}${ret.toFixed(2)}%`;
    $('#rootPrice').textContent=`HK$${m.price.toFixed(2)}`;$('#rootDelta').textContent=`${ret>=0?'+':''}${ret.toFixed(2)}%`;
    const rb=$('#resultBox');rb.classList.remove('pos','neg');rb.classList.add(ret>=0?'pos':'neg');
    $('#profitValue').textContent=`${(m.profit*10).toFixed(1)}亿`;
    $('#epsValue').textContent=`¥${m.epsRmb.toFixed(2)}`;
    $('#peValue').textContent=`${m.pe.toFixed(2)}×`;
    $('#valuationValue').textContent=`${m.valuationMult.toFixed(3)}×`;
    renderTree();renderPresetPrices();
  }

  function setAll(level){Object.values(F).forEach(f=>f.dims.forEach(x=>x.level=level));}
  function applyScenario(mode){
    if(mode==='base') setAll(0);
    if(mode==='bear'){
      setAll(-1);
      F.shareholder.dims.forEach(x=>x.level=0);F.oneOff.dims.forEach(x=>x.level=-1);
    }
    if(mode==='bull'){
      setAll(1);
      F.oneOff.dims.forEach(x=>x.level=0);
    }
    scenarioButtons.querySelectorAll('.scenario').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    selectedId=null;closeSheet();updateAll();
  }
  function clearScenarioActive(){scenarioButtons.querySelectorAll('.scenario').forEach(b=>b.classList.remove('active'));}

  function presetPrice(mode){
    const saved={};Object.entries(F).forEach(([id,f])=>saved[id]=f.dims.map(x=>x.level));
    if(mode==='base')setAll(0);else if(mode==='bear'){setAll(-1);F.shareholder.dims.forEach(x=>x.level=0);F.oneOff.dims.forEach(x=>x.level=-1);}else{setAll(1);F.oneOff.dims.forEach(x=>x.level=0);}
    const out=snapshot().price;
    Object.entries(F).forEach(([id,f])=>f.dims.forEach((x,i)=>x.level=saved[id][i]));
    return out;
  }
  function renderPresetPrices(){
    $('#bearPrice').textContent=`HK$${presetPrice('bear').toFixed(2)}`;$('#basePrice').textContent=`HK$${presetPrice('base').toFixed(2)}`;$('#bullPrice').textContent=`HK$${presetPrice('bull').toFixed(2)}`;
  }

  function closeSheet(){sheet.classList.remove('open');scrim.classList.remove('show');sheet.setAttribute('aria-hidden','true');selectedId=null;renderTree();}
  scenarioButtons.addEventListener('click',e=>{const b=e.target.closest('.scenario');if(b)applyScenario(b.dataset.mode);});
  $('#currentPrice').addEventListener('input',()=>{clearScenarioActive();updateAll();});
  $('#resetBtn').addEventListener('click',()=>applyScenario('base'));
  $('#sheetClose').addEventListener('click',closeSheet);scrim.addEventListener('click',closeSheet);

  updateAll();
})();
