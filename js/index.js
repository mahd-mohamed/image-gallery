// Simple gallery JS — supports categories, lightbox, next/prev, keyboard, filters
(function(){
  const gallery = document.getElementById('gallery');
  const cards = Array.from(gallery.querySelectorAll('.card'));
  const lightbox = document.getElementById('lightbox');
  const lbImage = document.getElementById('lbImage');
  const lbCaption = document.getElementById('lbCaption');
  const lbDetails = document.getElementById('lbDetails');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const closeBtn = document.getElementById('closeBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const lbCounter = document.getElementById('lbCounter');
  const presetFilter = document.getElementById('presetFilter');

  let currentIndex = -1;
  let activeFilter = 'all';

  // Open lightbox with a given card index
  function openLightbox(index){
    const card = cards[index];
    if(!card) return;
    const src = card.dataset.src || card.querySelector('img').src;
    const caption = card.dataset.caption || card.querySelector('img').alt || '';
    lbImage.src = src;
    lbImage.alt = caption;
    lbCaption.textContent = caption;
    lbDetails.textContent = `Category: ${card.dataset.category || '—'}`;
    updateCounter(index);
    currentIndex = index;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // clear image to release memory
    lbImage.src = '';
    currentIndex = -1;
    if(lbCounter) lbCounter.textContent = '';
  }

  function showNext(){
    if(currentIndex < 0) return;
    let next = currentIndex + 1;
    // find next visible card (respecting filters)
    for(let i=0;i<cards.length;i++){
      const idx = (next + i) % cards.length;
      if(isCardVisible(cards[idx])){openLightbox(idx);return}
    }
  }

  function showPrev(){
    if(currentIndex < 0) return;
    let prev = currentIndex - 1;
    for(let i=0;i<cards.length;i++){
      const idx = (prev - i + cards.length) % cards.length;
      if(isCardVisible(cards[idx])){openLightbox(idx);return}
    }
  }

  function isCardVisible(card){
    if(!card) return false;
    if(activeFilter === 'all') return true;
    return card.dataset.category === activeFilter;
  }

  // attach click handlers to cards
  cards.forEach((card, idx)=>{
    card.addEventListener('click', ()=> openLightbox(idx));
    card.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(idx) } });
  });

  // nav
  nextBtn.addEventListener('click', showNext);
  prevBtn.addEventListener('click', showPrev);
  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });

  // keyboard navigation
  document.addEventListener('keydown', (e)=>{
    if(lightbox.classList.contains('open')){
      if(e.key === 'ArrowRight') showNext();
      if(e.key === 'ArrowLeft') showPrev();
      if(e.key === 'Escape') closeLightbox();
    }
  });

  // ✅ Download current image (تم التعديل هنا)
  downloadBtn.addEventListener('click', async ()=>{
    if(!lbImage.src) return;
    try {
      // Fetch the image as a blob
      const response = await fetch(lbImage.src, {mode: 'cors'});
      const blob = await response.blob();
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Build the filename
      const ext = blob.type.split('/')[1] || 'jpg';
      const filename = (lbImage.alt || 'image')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g,'-')
        .replace(/(^-|-$)/g,'') + '.' + ext;

      // Create anchor and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Revoke URL after download
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
    }
  });

  // category filter buttons
  const pills = Array.from(document.querySelectorAll('.pill'));
  pills.forEach(p=> p.addEventListener('click', ()=>{
    pills.forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    const f = p.dataset.filter;
    activeFilter = f;
    // hide/show cards
    cards.forEach(card=>{
      const match = (f === 'all') || (card.dataset.category === f);
      card.style.display = match ? '' : 'none';
    });
  }));

  // progressive enhancement: click on next/prev with touch gestures (swipe)
  let startX = 0;
  let endX = 0;
  const media = lightbox.querySelector('.lb-media');
  media.addEventListener('touchstart', (e)=>{ startX = e.changedTouches[0].clientX })
  media.addEventListener('touchend', (e)=>{ endX = e.changedTouches[0].clientX; handleSwipe(); })
  function handleSwipe(){ if(!startX) return; const dx = endX - startX; if(Math.abs(dx) < 40) return; if(dx < 0) showNext(); else showPrev(); startX=0; endX=0 }

  // counter helper
  function updateCounter(index){
    if(!lbCounter) return;
    // count visible cards
    const total = cards.filter(c => isCardVisible(c)).length || cards.length;
    // find the position among visible ones
    const visibleIndices = cards.map((c,i)=>({c,i})).filter(({c})=>isCardVisible(c)).map(({i})=>i);
    const position = visibleIndices.indexOf(index) + 1;
    lbCounter.textContent = `${position} / ${total}`;
  }

  // Accessibility: trap focus inside lightbox when open
  document.addEventListener('focusin', (e)=>{
    if(lightbox.classList.contains('open')){
      if(!lightbox.contains(e.target)){
        e.stopPropagation();
        closeBtn.focus();
      }
    }
  });

  // Preload full images when opening for smoother experience
  function preload(src){ const i = new Image(); i.src = src }
  cards.forEach(c=> c.addEventListener('mouseenter', ()=>{ const s=c.dataset.src; if(s) preload(s) }));

})();
