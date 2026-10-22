/* Show actionable startup failures instead of leaving an inert Start button. */
(() => {
 'use strict';
 const el=id=>document.getElementById(id);
 const show=message=>{window.IslandOnFatal?.();el('menu').hidden=false;el('fatal').textContent=message;el('reload').hidden=false;el('start').disabled=true;el('start-free').disabled=true;el('fatal').scrollIntoView?.({block:'nearest'});};
 el('reload').onclick=()=>window.location.reload();
 window.addEventListener('error',e=>{
  if(e.target?.tagName==='SCRIPT'){const name=(e.target.src||'').split('/').pop().split('?')[0];show(`缺少遊戲檔案：${name}。請完整解壓 ZIP，再按重新載入；不要只打開單獨一份 HTML。`);}
  else if(e.message)show(`遊戲發生錯誤：${e.message}。請按重新載入；若仍失敗，可把這段錯誤文字貼回對話。存檔未清除。`);
 },true);
 window.addEventListener('unhandledrejection',e=>show(`遊戲無法繼續：${e.reason?.message||String(e.reason)}。請重新載入，存檔未清除。`));
})();
