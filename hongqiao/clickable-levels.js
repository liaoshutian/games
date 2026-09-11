(()=>{
  function enhance(root=document){
    root.querySelectorAll('.level-chip').forEach((chip,i)=>{
      chip.setAttribute('role','button');
      chip.setAttribute('tabindex','0');
      chip.setAttribute('aria-label',`切换到${chip.querySelector('b')?.textContent||'该'}档位`);
    });
  }

  function activate(chip){
    const levels=chip.closest('.levels');
    const dimension=chip.closest('.dimension');
    if(!levels||!dimension) return;
    const chips=[...levels.querySelectorAll('.level-chip')];
    const index=chips.indexOf(chip);
    const range=dimension.querySelector('input.range');
    if(index<0||!range) return;
    range.value=String(index-2);
    range.dispatchEvent(new Event('input',{bubbles:true}));
    if(window.navigator?.vibrate) navigator.vibrate(8);
  }

  document.addEventListener('click',e=>{
    const chip=e.target.closest('.level-chip');
    if(!chip) return;
    e.preventDefault();
    activate(chip);
  });

  document.addEventListener('keydown',e=>{
    const chip=e.target.closest?.('.level-chip');
    if(!chip || (e.key!=='Enter'&&e.key!==' ')) return;
    e.preventDefault();
    activate(chip);
  });

  const observer=new MutationObserver(muts=>{
    muts.forEach(m=>m.addedNodes.forEach(n=>{
      if(n.nodeType===1){
        if(n.matches?.('.level-chip')) enhance(n.parentElement||document);
        else enhance(n);
      }
    }));
  });
  observer.observe(document.body,{childList:true,subtree:true});
  enhance();
})();
