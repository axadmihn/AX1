// Spotlight effect
(function(){
  const spots = Array.from(document.querySelectorAll('.spotlight'));
  if(!spots.length) return;
  const update = (clientX, clientY)=>{
    for(const el of spots){
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 100;
      const y = ((clientY - rect.top) / Math.max(rect.height, 1)) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    }
  };
  window.addEventListener('mousemove', (event)=>{
    update(event.clientX, event.clientY);
  }, {passive:true});
  window.addEventListener('touchmove', (event)=>{
    if(event.touches && event.touches[0]){
      const t = event.touches[0];
      update(t.clientX, t.clientY);
    }
  }, {passive:true});
})();

// Header condense + hide on scroll
(function(){
  const header = document.querySelector('.header');
  if(!header) return;
  let last = window.scrollY || 0;
  window.addEventListener('scroll', ()=>{
    const current = window.scrollY || 0;
    if(current > 40) header.classList.add('is-condensed');
    else header.classList.remove('is-condensed');
    const hidden = current > last && current > 120;
    header.classList.toggle('is-hidden', hidden);
    last = current;
  }, {passive:true});
})();

// Navigation toggle (mobile)
(function(){
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('[data-nav-toggle]');
  if(!nav || !toggle) return;
  const close = ()=>{
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  const open = ()=>{
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  };
  toggle.addEventListener('click', ()=>{
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if(expanded) close(); else open();
  });
  nav.querySelectorAll('a').forEach((link)=>{
    link.addEventListener('click', close);
  });
  window.addEventListener('resize', ()=>{
    if(window.innerWidth > 900){
      close();
    }
  }, {passive:true});
  document.addEventListener('keydown', (event)=>{
    if(event.key === 'Escape') close();
  });
})();

// BUILD_ID (personalized)
(function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('build') || 'Jongmin-AXN-Final';
  const el = document.getElementById('buildId');
  if(el) el.textContent = 'BUILD_ID: ' + id;
})();

// Simple mailto form handler for static hosting
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', (event)=>{
    event.preventDefault();
    const email = (document.getElementById('yourEmail') || {}).value || '';
    const msg = (document.getElementById('yourMessage') || {}).value || '';
    const subject = encodeURIComponent('Hello from ' + (email || 'website visitor'));
    const body = encodeURIComponent(msg + (email ? '\n\nreply-to: ' + email : ''));
    window.location.href = 'mailto:axadmihn@axnmihn.com?subject=' + subject + '&body=' + body;
  });
})();
