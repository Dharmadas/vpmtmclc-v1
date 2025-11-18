// Main JS for interactivity and accessibility
(function(){
  'use strict';

  const root = document.documentElement;
  const body = document.body;

  // Accessibility toolbar elements
  const btnContrast = document.getElementById('toggle-contrast');
  const btnTextInc = document.getElementById('text-increase');
  const btnTextDec = document.getElementById('text-decrease');
  const btnTextReset = document.getElementById('text-reset');
  const btnLine = document.getElementById('line-height');
  const btnToggleImages = document.getElementById('toggle-images');
  const btnBigCursor = document.getElementById('big-cursor');

  // Read/Write preferences
  function setPref(key,val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function getPref(key, fallback){ try{ const v = localStorage.getItem(key); return v?JSON.parse(v):fallback }catch(e){ return fallback } }

  // Font size scaling
  function setFontScale(scale){ root.style.setProperty('--font-scale', scale+'rem'); setPref('fontScale', scale); }
  (function(){ const s = getPref('fontScale',1); setFontScale(s); })();

  btnTextInc.addEventListener('click', ()=>{ const v = parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) || 1; setFontScale((v+0.1).toFixed(2)); });
  btnTextDec.addEventListener('click', ()=>{ const v = parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) || 1; setFontScale(Math.max(0.8,(v-0.1)).toFixed(2)); });
  btnTextReset.addEventListener('click', ()=>{ setFontScale(1); });

  // Contrast
  function toggleContrast(){ const on = body.classList.toggle('high-contrast'); setPref('highContrast', on); btnContrast.setAttribute('aria-pressed', on); }
  btnContrast.addEventListener('click', toggleContrast);
  if(getPref('highContrast',false)) body.classList.add('high-contrast');

  // Line height
  btnLine.addEventListener('click', ()=>{ const on = body.classList.toggle('increased-line-height'); setPref('lineHeight', on); });
  if(getPref('lineHeight',false)) body.classList.add('increased-line-height');

  // Hide images
  btnToggleImages.addEventListener('click', ()=>{ const on = body.classList.toggle('hide-images'); setPref('hideImages', on); btnToggleImages.textContent = on? 'Show Images' : 'Hide Images'; });
  if(getPref('hideImages',false)){ body.classList.add('hide-images'); btnToggleImages.textContent = 'Show Images'; }

  // Big cursor
  btnBigCursor.addEventListener('click', ()=>{ const on = body.classList.toggle('big-cursor'); setPref('bigCursor', on); });
  if(getPref('bigCursor',false)) body.classList.add('big-cursor');

  // Mobile nav toggle using Bootstrap collapse with backdrop handling
  (function(){
    const toggle = document.getElementById('mobile-nav-toggle');
    const panel = document.getElementById('mobile-panel');
    if(!toggle || !panel || typeof bootstrap === 'undefined') return;

    const bs = bootstrap.Collapse.getOrCreateInstance(panel, {toggle:false});
    let backdrop = null;

    function createBackdrop(){
      backdrop = document.createElement('div');
      backdrop.id = 'mobile-backdrop';
      backdrop.className = 'mobile-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', onBackdropClick);
    }

    function removeBackdrop(){
      if(!backdrop) return;
      backdrop.removeEventListener('click', onBackdropClick);
      if(backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      backdrop = null;
    }

    function onBackdropClick(){
      bs.hide();
      toggle.setAttribute('aria-expanded','false');
    }

    // Toggle handler
    toggle.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      if(panel.classList.contains('show')){
        bs.hide();
      } else {
        bs.show();
      }
    });

    // Prevent clicks inside the mobile panel from bubbling up
    panel.addEventListener('click', function(e){ e.stopPropagation(); });

    // Close panel when any in-panel link is clicked (short delay for feedback)
    panel.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click', function(){
        setTimeout(()=>{ bs.hide(); }, 120);
      });
    });

    // Hook bootstrap show/hide events to manage aria and backdrop
    panel.addEventListener('show.bs.collapse', function(){
      toggle.setAttribute('aria-expanded','true');
      // createBackdrop();
    });

    panel.addEventListener('shown.bs.collapse', function(){
      // nothing extra yet
    });

    panel.addEventListener('hide.bs.collapse', function(e){
      // allow hide, but ensure aria updated in hidden event
    });

    panel.addEventListener('hidden.bs.collapse', function(){
      toggle.setAttribute('aria-expanded','false');
      removeBackdrop();
    });
  })();

  // IntersectionObserver for reveal-on-scroll animations
  const revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){ entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, {threshold:0.12});
    revealEls.forEach(el=>obs.observe(el));
  } else {
    // fallback
    revealEls.forEach(el=>el.classList.add('visible'));
  }

  // Simple form validation (client-side)
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      let valid = true;
      ['name','email','message'].forEach(id=>{
        const el = document.getElementById(id);
        if(!el.checkValidity()){ el.classList.add('is-invalid'); valid = false; } else { el.classList.remove('is-invalid'); }
      });
      if(valid){
        // simulate send
        this.reset();
        alert('Message sent (simulated). Thank you.');
      }
    });
  }

  // Auto-update 'Latest Information' (demo dynamic feed)
  (function seedLatest(){
    const feed = document.getElementById('latest-list');
    if(!feed) return;
    const items = getPref('latestItems',[ ]);
    if(items.length===0){
      const sample = [
        {text: 'New circular: Library hours updated', date:'2025-11-16'},
        {text: 'Judgment summary uploaded', date:'2025-11-12'}
      ];
      setPref('latestItems', sample);
    } else {
      // add to DOM
      items.slice(0,3).forEach(it=>{
        const a = document.createElement('a');
        a.className = 'list-group-item list-group-item-action';
        a.href = '#';
        a.innerHTML = `${it.text} <span class="badge bg-secondary float-end">${it.date}</span>`;
        feed.prepend(a);
      });
    }
  })();

  // Keyboard accessibility: allow Enter to toggle toolbar items
  document.getElementById('access-toolbar').addEventListener('keydown', (e)=>{
    if(e.key === 'Enter' && e.target.tagName === 'BUTTON'){ e.target.click(); }
  });

  // Theme toggle by double-clicking logo (simple dynamic component)
  (function themeToggle(){
    const logo = document.getElementById('logo');
    if(!logo) return;
    logo.addEventListener('dblclick', ()=>{
      const current = body.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      body.setAttribute('data-theme', next);
      setPref('theme', next);
      if(next === 'dark') document.documentElement.style.setProperty('--bg-blue','#06263a');
      else document.documentElement.style.setProperty('--bg-blue','#d9eefc');
    });
    // apply saved
    const saved = getPref('theme','light'); if(saved === 'dark'){ body.setAttribute('data-theme','dark'); document.documentElement.style.setProperty('--bg-blue','#06263a'); }
  })();

})();
