
// Spotlight effect
(function(){
  const spots = document.querySelectorAll('.spotlight');
  window.addEventListener('mousemove', (e)=>{
    for(const el of spots){
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / Math.max(r.width,1))*100;
      const y = ((e.clientY - r.top) / Math.max(r.height,1))*100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
    }
  }, {passive:true});
})();

// BUILD_ID (personalized)
(function(){
  const p = new URLSearchParams(location.search);
  const id = p.get('build') || 'Jongmin-AXN-Final';
  const el = document.getElementById('buildId');
  if(el) el.textContent = 'BUILD_ID: ' + id;
})();

// Simple mailto form handler for static hosting
(function(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = (document.getElementById('yourEmail')||{}).value || '';
    const msg = (document.getElementById('yourMessage')||{}).value || '';
    const subject = encodeURIComponent('Hello from ' + (email || 'website visitor'));
    const body = encodeURIComponent(msg + (email ? '\n\nreply-to: ' + email : ''));
    window.location.href = 'mailto:axadmihn@axnmihn.com?subject=' + subject + '&body=' + body;
  });
})();
