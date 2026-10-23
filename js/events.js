(function () {
  const grid = document.getElementById('dynamic-events');
  const empty = document.getElementById('events-empty');
  if (!grid) return;

  const cfg = window.AAVAN_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('PASTE_') && !cfg.anonKey.includes('PASTE_');
  if (!configured || !window.supabase) return;

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value + 'T12:00:00');
    return new Intl.DateTimeFormat('en-CA', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  };

  async function loadEvents() {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from('events')
      .select('id,title,event_date,start_time,venue,description,image_url,registration_url,featured')
      .eq('published', true)
      .gte('event_date', today)
      .order('featured', { ascending: false })
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Could not load events:', error.message);
      return;
    }
    if (!data || data.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }

    grid.innerHTML = data.map(event => {
      const title = escapeHtml(event.title);
      const venue = escapeHtml(event.venue || 'Greater Vancouver, BC');
      const summary = escapeHtml(event.description || 'Join the Assam Association Vancouver community.');
      const date = formatDate(event.event_date);
      const time = escapeHtml(event.start_time || '');
      const image = event.image_url ? escapeHtml(event.image_url) : 'assets/images/bihu-community.jpg';
      const reg = event.registration_url ? `<a class="btn btn-dark" href="${escapeHtml(event.registration_url)}" target="_blank" rel="noopener">Register / Details</a>` : '';
      return `<article class="event-card dynamic-event-card reveal visible">
        <img src="${image}" alt="${title}" loading="lazy">
        <div>
          <span class="tag">${event.featured ? 'Featured event' : 'Upcoming event'}</span>
          <h3>${title}</h3>
          <p>${summary}</p>
          <div class="event-meta"><span>📅 ${date}${time ? ` • ${time}` : ''}</span><span>📍 ${venue}</span></div>
          ${reg}
        </div>
      </article>`;
    }).join('');
    if (empty) empty.hidden = true;
  }

  loadEvents();
})();
