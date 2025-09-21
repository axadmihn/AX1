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
  const root = document.documentElement;
  const setHeight = ()=>{
    const rect = header.getBoundingClientRect();
    root.style.setProperty('--header-height', Math.round(rect.height) + 'px');
  };
  setHeight();
  if('ResizeObserver' in window){
    const observer = new ResizeObserver(setHeight);
    observer.observe(header);
  } else {
    window.addEventListener('resize', setHeight, {passive:true});
  }
  let last = window.scrollY || 0;
  let condensed = header.classList.contains('is-condensed');
  const onScroll = ()=>{
    const current = window.scrollY || 0;
    const shouldCondense = current > 40;
    header.classList.toggle('is-condensed', shouldCondense);
    if(shouldCondense !== condensed){
      condensed = shouldCondense;
      setHeight();
    }
    const hidden = current > last && current > 120;
    header.classList.toggle('is-hidden', hidden);
    last = current;
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

// Navigation toggle (mobile)
(function(){
  const nav = document.getElementById('site-nav');
  const toggle = document.querySelector('[data-nav-toggle]');
  if(!nav || !toggle) return;
  const root = document.documentElement;
  const applyScrollLock = ()=>{
    const scrollBarWidth = Math.max(0, window.innerWidth - root.clientWidth);
    document.body.style.setProperty('--scrollbar-compensation', scrollBarWidth ? scrollBarWidth + 'px' : '0px');
  };
  const releaseScrollLock = ()=>{
    document.body.style.removeProperty('--scrollbar-compensation');
  };
  const close = ()=>{
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    releaseScrollLock();
  };
  const open = ()=>{
    applyScrollLock();
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
    } else if(nav.classList.contains('is-open')){
      applyScrollLock();
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

// Contact form handler for API-backed submissions with graceful fallback
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  const endpoint = form.getAttribute('data-endpoint') || form.getAttribute('action') || '/api/contact';
  const statusEl = document.getElementById('contactStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const directLink = form.querySelector('[data-direct-email]');
  const defaultLabel = submitButton ? submitButton.textContent : '';
  const setStatus = (message, state)=>{
    if(!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.remove('form-status--pending', 'form-status--success', 'form-status--error', 'is-visible');
    if(message){
      statusEl.classList.add('is-visible');
      if(state) statusEl.classList.add('form-status--' + state);
    }
  };
  const setLoading = (isLoading)=>{
    if(submitButton){
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? 'Sending…' : defaultLabel;
    }
    if(isLoading){
      form.setAttribute('aria-busy', 'true');
    } else {
      form.removeAttribute('aria-busy');
    }
  };
  const buildMailto = (name, email, message)=>{
    const subject = encodeURIComponent('Hello from ' + (name || email || 'website visitor'));
    const bodyParts = [];
    if(message) bodyParts.push(message);
    const reply = email ? 'reply-to: ' + email : '';
    const signature = name ? 'sender: ' + name : '';
    if(reply || signature) bodyParts.push('', [signature, reply].filter(Boolean).join('\n'));
    return 'mailto:axadmihn@axnmihn.com?subject=' + subject + '&body=' + encodeURIComponent(bodyParts.join('\n'));
  };
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  form.addEventListener('submit', async (event)=>{
    event.preventDefault();
    const name = ((document.getElementById('yourName') || {}).value || '').trim();
    const email = ((document.getElementById('yourEmail') || {}).value || '').trim();
    const message = ((document.getElementById('yourMessage') || {}).value || '').trim();
    if(!name || !email || !message){
      setStatus('Please complete every field before sending your message.', 'error');
      return;
    }
    if(!emailPattern.test(email)){
      setStatus('Enter a valid email so we can respond.', 'error');
      return;
    }
    if(message.length < 10){
      setStatus('Your message is a bit short—share at least 10 characters of context.', 'error');
      return;
    }
    if(typeof window.fetch !== 'function'){
      window.location.href = buildMailto(name, email, message);
      return;
    }
    setLoading(true);
    setStatus('Sending your message…', 'pending');
    try {
      const response = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name, email, message})
      });
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : {};
      if(!response.ok){
        const errorMessage = (payload && payload.error) || 'We could not deliver your message automatically.';
        throw new Error(errorMessage);
      }
      setStatus("Thanks—your message is on its way. We'll respond within one business day.", 'success');
      form.reset();
      if(submitButton) submitButton.blur();
    } catch (error){
      console.error(error);
      setStatus("We couldn't send your message automatically. Email us directly at axadmihn@axnmihn.com.", 'error');
      if(directLink) directLink.focus();
    } finally {
      setLoading(false);
    }
  });
})();
