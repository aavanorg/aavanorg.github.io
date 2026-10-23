(function(){
  const portal=document.getElementById('committeePortal');
  const openBtn=document.getElementById('committeeLoginBtn');
  const closeBtn=document.getElementById('committeePortalClose');
  if(!portal||!openBtn||!closeBtn)return;
  function openPortal(){portal.hidden=false;portal.setAttribute('aria-hidden','false');document.body.classList.add('committee-portal-open');setTimeout(()=>{const el=document.getElementById('loginEmail');if(el&&!el.offsetParent===false) el.focus();},0);}
  function closePortal(){portal.hidden=true;portal.setAttribute('aria-hidden','true');document.body.classList.remove('committee-portal-open');openBtn.focus();}
  openBtn.addEventListener('click',openPortal);
  closeBtn.addEventListener('click',closePortal);
  portal.querySelectorAll('[data-portal-close]').forEach(el=>el.addEventListener('click',closePortal));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!portal.hidden)closePortal();});
  // If Supabase returns to the homepage with auth data in the URL, open the portal automatically.
  if(location.hash.includes('access_token=')||location.search.includes('code=')){openPortal();}
})();
