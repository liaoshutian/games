(()=>{
  const mq=window.matchMedia('(min-width:700px) and (max-width:1180px) and (min-height:600px) and (orientation:landscape)');
  let lastFactor='铝价';

  function factorButtonByName(name){
    return [...document.querySelectorAll('.circle-node')].find(btn=>{
      const el=btn.querySelector('.name');
      return el && el.textContent.trim()===name;
    });
  }

  function openLast(){
    if(!mq.matches) return;
    requestAnimationFrame(()=>{
      const btn=factorButtonByName(lastFactor)||factorButtonByName('铝价');
      if(btn) btn.click();
    });
  }

  document.addEventListener('click',e=>{
    const node=e.target.closest('.circle-node');
    if(node){
      const name=node.querySelector('.name');
      if(name) lastFactor=name.textContent.trim();
    }

    if(e.target.closest('.scenario') || e.target.closest('#resetBtn')){
      setTimeout(openLast,0);
    }
  });

  const price=document.querySelector('#currentPrice');
  if(price) price.addEventListener('input',()=>setTimeout(openLast,0));

  function onModeChange(){
    if(mq.matches) openLast();
  }
  if(mq.addEventListener) mq.addEventListener('change',onModeChange);
  else if(mq.addListener) mq.addListener(onModeChange);

  openLast();
})();
