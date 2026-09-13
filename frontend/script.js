/* =========================================================
   ASHWORTH & VALE — shared interactivity
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Theme (dark / light) ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem('eh-theme');
  if(saved === 'dark') root.classList.add('dark');
  document.querySelectorAll('.theme-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      root.classList.toggle('dark');
      localStorage.setItem('eh-theme', root.classList.contains('dark') ? 'dark' : 'light');
    });
  });

  /* ---------- Animated navbar on scroll ---------- */
  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.scroll-progress');
  const backTop = document.querySelector('.back-top');

  const onScroll = () => {
    const y = window.scrollY;
    if(nav) nav.classList.toggle('is-scrolled', y > 30);
    if(backTop) backTop.classList.toggle('show', y > 500);
    if(progress){
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = h > 0 ? (y / h * 100) + '%' : '0%';
    }
  };
  document.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  if(backTop){
    backTop.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('.burger');
  const panel = document.querySelector('.mobile-panel');
  if(burger && panel){
    burger.addEventListener('click', ()=>{
      burger.classList.toggle('open');
      panel.classList.toggle('open');
      document.body.style.overflow = panel.classList.contains('open') ? 'hidden' : '';
    });
    panel.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=>{
      burger.classList.remove('open');
      panel.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if(revealEls.length){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:0.15});
    revealEls.forEach(el=> io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if(counters.length){
    const countIO = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const decimals = el.dataset.count.includes('.') ? 1 : 0;
        const duration = 1400;
        const start = performance.now();
        const step = (now)=>{
          const p = Math.min((now-start)/duration, 1);
          const eased = 1 - Math.pow(1-p, 3);
          el.textContent = (target*eased).toFixed(decimals) + suffix;
          if(p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, {threshold:0.5});
    counters.forEach(c=> countIO.observe(c));
  }

  /* ---------- Testimonial slider ---------- */
  const testiWrap = document.querySelector('.testi-wrap');
  if(testiWrap){
    const slides = testiWrap.querySelectorAll('.testi-slide');
    const dots = testiWrap.querySelectorAll('.testi-dots button');
    let idx = 0;
    const show = (i)=>{
      slides.forEach(s=>s.classList.remove('active'));
      dots.forEach(d=>d.classList.remove('active'));
      idx = (i+slides.length)%slides.length;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
    };
    dots.forEach((d,i)=> d.addEventListener('click', ()=> show(i)));
    const prev = testiWrap.querySelector('.testi-nav.prev');
    const next = testiWrap.querySelector('.testi-nav.next');
    if(prev) prev.addEventListener('click', ()=> show(idx-1));
    if(next) next.addEventListener('click', ()=> show(idx+1));
    let auto = setInterval(()=> show(idx+1), 6000);
    testiWrap.addEventListener('mouseenter', ()=> clearInterval(auto));
    testiWrap.addEventListener('mouseleave', ()=> auto = setInterval(()=> show(idx+1), 6000));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(item=>{
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(other=>{
        other.classList.remove('open');
        other.querySelector('.faq-a').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Property / category filters ---------- */
  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('[data-category]');
  if(chips.length && cards.length){
    chips.forEach(chip=>{
      chip.addEventListener('click', ()=>{
        chips.forEach(c=> c.classList.remove('active'));
        chip.classList.add('active');
        const val = chip.dataset.filter;
        cards.forEach(card=>{
          const match = val === 'all' || card.dataset.category === val;
          card.style.display = match ? '' : 'none';
        });
      });
    });
  }

  /* ---------- Lightbox gallery ---------- */
  const lightbox = document.querySelector('.lightbox');
  if(lightbox){
    const lbImg = lightbox.querySelector('img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-nav.prev');
    const nextBtn = lightbox.querySelector('.lightbox-nav.next');
    let gallery = [];
    let gi = 0;
    const open = (src, list, i)=>{
      gallery = list; gi = i;
      lbImg.src = src;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    const close = ()=>{
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    };
    const go = (dir)=>{
      if(!gallery.length) return;
      gi = (gi + dir + gallery.length) % gallery.length;
      lbImg.src = gallery[gi];
    };
    document.querySelectorAll('.gallery-strip img, [data-lightbox]').forEach(img=>{
      const groupEl = img.closest('.gallery-strip') || document;
      const list = Array.from(groupEl.querySelectorAll('img')).map(i=> i.dataset.full || i.src);
      img.addEventListener('click', ()=>{
        const i = list.indexOf(img.dataset.full || img.src);
        open(img.dataset.full || img.src, list, i < 0 ? 0 : i);
      });
    });
    if(closeBtn) closeBtn.addEventListener('click', close);
    if(prevBtn) prevBtn.addEventListener('click', ()=> go(-1));
    if(nextBtn) nextBtn.addEventListener('click', ()=> go(1));
    lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) close(); });
    document.addEventListener('keydown', (e)=>{
      if(!lightbox.classList.contains('open')) return;
      if(e.key === 'Escape') close();
      if(e.key === 'ArrowRight') go(1);
      if(e.key === 'ArrowLeft') go(-1);
    });
  }

  /* ---------- ENQUIRY FORM (SMTP + MongoDB) ---------- */
  const enquiryForm = document.getElementById('enquiryForm');
  const enquirySuccess = document.getElementById('enquirySuccess');

  // LOCAL TEST: 'http://localhost:5000'
  // PRODUCTION: 'https://ashworth-vale-backend.onrender.com'
  const BACKEND_URL = 'http://localhost:5000';

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!enquiryForm.checkValidity()) return;

      const submitBtn = enquiryForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const formData = new FormData(enquiryForm);
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        interest: formData.get('interest'),
        message: formData.get('message')
      };

      try {
        const res = await fetch(`${BACKEND_URL}/api/enquiry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
          enquirySuccess.textContent = '✅ Thank you — your enquiry has been received. An agent will reach out shortly.';
          enquirySuccess.classList.add('show');
          enquiryForm.reset();
        } else {
          enquirySuccess.textContent = data.message || 'Something went wrong. Please try again.';
          enquirySuccess.classList.add('show');
        }
      } catch (err) {
        enquirySuccess.textContent = "Couldn't reach the server. Please try again.";
        enquirySuccess.classList.add('show');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        setTimeout(() => enquirySuccess.classList.remove('show'), 6000);
      }
    });
  }

});