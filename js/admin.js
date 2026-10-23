(function () {
  const cfg = window.AAVAN_SUPABASE || {};
  const configured = cfg.url && cfg.anonKey && !cfg.url.includes('PASTE_') && !cfg.anonKey.includes('PASTE_');
  const $ = (id) => document.getElementById(id);
  const setupNotice = $('setupNotice');
  const authPanel = $('authPanel');
  const pendingPanel = $('pendingPanel');
  const dashboard = $('dashboard');
  const logoutBtn = $('logoutBtn');

  if (!configured || !window.supabase) {
    setupNotice.hidden = false;
    authPanel.hidden = true;
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey);
  let currentUser = null;
  let currentProfile = null;
  let editingImageUrl = '';

  const message = (id, text, error = false) => {
    const el = $(id); if (!el) return;
    el.textContent = text; el.classList.toggle('error', error);
  };

  function setAuthMode(mode) {
    const login = mode === 'login';
    $('loginForm').hidden = !login;
    $('signupForm').hidden = login;
    $('loginTab').classList.toggle('active', login);
    $('signupTab').classList.toggle('active', !login);
    message('loginMessage', ''); message('signupMessage', '');
  }
  $('loginTab').addEventListener('click', () => setAuthMode('login'));
  $('signupTab').addEventListener('click', () => setAuthMode('signup'));

  async function getMyProfile(user) {
    if (!user) return null;
    const { data, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function renderSession(session) {
    const user = session?.user || null;
    currentUser = user;
    currentProfile = null;
    $('headerIdentity').textContent = '';

    if (!user) {
      authPanel.hidden = false; pendingPanel.hidden = true; dashboard.hidden = true; logoutBtn.hidden = true;
      return;
    }

    try { currentProfile = await getMyProfile(user); }
    catch (err) {
      authPanel.hidden = false; pendingPanel.hidden = true; dashboard.hidden = true; logoutBtn.hidden = false;
      message('loginMessage', err.message, true); return;
    }

    logoutBtn.hidden = false;
    $('headerIdentity').textContent = currentProfile?.full_name || user.email;

    if (!currentProfile || currentProfile.status !== 'active') {
      authPanel.hidden = true; dashboard.hidden = true; pendingPanel.hidden = false;
      const disabled = currentProfile?.status === 'disabled';
      $('pendingTitle').textContent = disabled ? 'Access disabled' : 'Approval required';
      $('pendingCopy').textContent = disabled
        ? 'Your committee website access has been disabled. Contact an AAVAN Admin if you believe this is an error.'
        : 'Your account is registered. An AAVAN Admin must approve it before you can access committee tools.';
      return;
    }

    authPanel.hidden = true; pendingPanel.hidden = true; dashboard.hidden = false;
    const role = currentProfile.role;
    $('roleSummary').textContent = `${currentProfile.full_name || user.email} • ${role.charAt(0).toUpperCase()+role.slice(1)}`;
    const canEdit = role === 'admin' || role === 'editor';
    $('newEventBtn').hidden = !canEdit;
    $('accessTab').hidden = role !== 'admin';
    activateDashboardPanel('eventsPanel');
    await loadEvents();
    if (role === 'admin') await loadMembers();
  }

  client.auth.getSession().then(({ data }) => renderSession(data.session));
  client.auth.onAuthStateChange((_event, session) => setTimeout(() => renderSession(session), 0));

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); message('loginMessage', 'Signing in…');
    const { error } = await client.auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPassword').value });
    if (error) message('loginMessage', error.message, true);
  });

  $('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault(); message('signupMessage', 'Creating account…');
    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;
    const fullName = $('signupName').value.trim();
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    if (error) { message('signupMessage', error.message, true); return; }
    $('signupForm').reset();
    message('signupMessage', data.session
      ? 'Account created. Your access is pending Admin approval.'
      : 'Account created. Check your email to confirm it, then an Admin can approve your access.');
  });

  $('forgotPasswordBtn').addEventListener('click', async () => {
    const email = $('loginEmail').value.trim();
    if (!email) { message('loginMessage', 'Enter your email first, then click Forgot password.', true); return; }
    const { error } = await client.auth.resetPasswordForEmail(email);
    message('loginMessage', error ? error.message : 'Password reset email sent.', !!error);
  });

  logoutBtn.addEventListener('click', () => client.auth.signOut());
  $('pendingLogoutBtn').addEventListener('click', () => client.auth.signOut());

  document.querySelectorAll('.dashboard-tab').forEach(btn => btn.addEventListener('click', () => activateDashboardPanel(btn.dataset.panel)));
  function activateDashboardPanel(id) {
    document.querySelectorAll('.dashboard-panel').forEach(p => p.hidden = p.id !== id);
    document.querySelectorAll('.dashboard-tab').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
    if (id === 'accessPanel' && currentProfile?.role === 'admin') loadMembers();
  }

  $('newEventBtn').addEventListener('click', () => openForm());
  $('cancelEditBtn').addEventListener('click', () => closeForm());

  function canEditEvents() { return currentProfile && ['admin','editor'].includes(currentProfile.role) && currentProfile.status === 'active'; }

  function openForm(event = null) {
    if (!canEditEvents()) return;
    $('eventFormPanel').hidden = false;
    $('formTitle').textContent = event ? 'Edit event' : 'Add event';
    $('eventId').value = event?.id || '';
    $('eventTitle').value = event?.title || '';
    $('eventDate').value = event?.event_date || '';
    $('eventTime').value = event?.start_time || '';
    $('eventVenue').value = event?.venue || '';
    $('eventSummary').value = event?.description || '';
    $('eventRegistration').value = event?.registration_url || '';
    $('eventFeatured').checked = !!event?.featured;
    $('eventPublished').checked = event ? !!event.published : true;
    editingImageUrl = event?.image_url || '';
    $('eventImage').value = '';
    message('eventMessage', '');
    $('eventFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function closeForm() { $('eventFormPanel').hidden = true; $('eventForm').reset(); $('eventId').value = ''; editingImageUrl = ''; }

  async function uploadImage(file) {
    if (!file) return editingImageUrl || null;
    const ext = file.name.split('.').pop().toLowerCase();
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const path = `${currentUser.id}/${safeName}`;
    const { error } = await client.storage.from('event-images').upload(path, file, { upsert: false, cacheControl: '3600' });
    if (error) throw error;
    const { data } = client.storage.from('event-images').getPublicUrl(path);
    return data.publicUrl;
  }

  $('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault(); if (!canEditEvents()) return;
    message('eventMessage', 'Saving…');
    try {
      const imageUrl = await uploadImage($('eventImage').files[0]);
      const payload = {
        title: $('eventTitle').value.trim(), event_date: $('eventDate').value,
        start_time: $('eventTime').value.trim() || null, venue: $('eventVenue').value.trim() || null,
        description: $('eventSummary').value.trim(), registration_url: $('eventRegistration').value.trim() || null,
        image_url: imageUrl, featured: $('eventFeatured').checked, published: $('eventPublished').checked,
        updated_by: currentUser.id, updated_at: new Date().toISOString()
      };
      const id = $('eventId').value;
      const query = id ? client.from('events').update(payload).eq('id', id) : client.from('events').insert({ ...payload, created_by: currentUser.id });
      const { error } = await query; if (error) throw error;
      message('eventMessage', 'Saved successfully.'); await loadEvents(); setTimeout(closeForm, 450);
    } catch (err) { message('eventMessage', err.message || 'Could not save event.', true); }
  });

  async function loadEvents() {
    const list = $('eventsList'); list.innerHTML = '<div class="admin-panel">Loading events…</div>';
    const { data, error } = await client.from('events').select('*').order('event_date', { ascending: true });
    if (error) { list.innerHTML = `<div class="admin-panel error">${escapeHtml(error.message)}</div>`; return; }
    if (!data.length) { list.innerHTML = '<div class="admin-panel">No events yet.</div>'; return; }
    const editable = canEditEvents();
    list.innerHTML = data.map(ev => `<article class="admin-event" data-id="${ev.id}">
      <img src="${escapeAttr(ev.image_url || 'assets/images/bihu-community.jpg')}" alt="">
      <div class="admin-event-copy"><div class="admin-event-top"><div><span class="status ${ev.published ? 'live' : 'draft'}">${ev.published ? 'Published' : 'Draft'}</span>${ev.featured ? '<span class="status featured">Featured</span>' : ''}</div><span>${escapeHtml(ev.event_date)}</span></div>
      <h3>${escapeHtml(ev.title)}</h3><p>${escapeHtml(ev.venue || '')}</p></div>
      ${editable ? '<div class="admin-actions"><button class="edit-btn">Edit</button><button class="delete-btn">Delete</button></div>' : ''}
    </article>`).join('');
    if (editable) list.querySelectorAll('.admin-event').forEach((card, i) => {
      card.querySelector('.edit-btn').addEventListener('click', () => openForm(data[i]));
      card.querySelector('.delete-btn').addEventListener('click', async () => {
        if (!confirm(`Delete “${data[i].title}”? This cannot be undone.`)) return;
        const { error } = await client.from('events').delete().eq('id', data[i].id);
        if (error) alert(error.message); else loadEvents();
      });
    });
  }

  async function loadMembers() {
    if (currentProfile?.role !== 'admin') return;
    const list = $('membersList'); list.innerHTML = '<div class="admin-panel">Loading accounts…</div>';
    const { data, error } = await client.from('profiles').select('*').order('created_at', { ascending: true });
    if (error) { list.innerHTML = ''; message('membersMessage', error.message, true); return; }
    message('membersMessage', '');
    list.innerHTML = data.map(member => {
      const self = member.id === currentUser.id;
      return `<article class="member-card" data-id="${member.id}">
        <div class="member-main"><div class="avatar">${escapeHtml(initials(member.full_name || member.email))}</div><div><h3>${escapeHtml(member.full_name || 'Name not provided')}</h3><p>${escapeHtml(member.email)}</p><span class="status ${member.status === 'active' ? 'live' : member.status === 'disabled' ? 'disabled' : 'pending'}">${escapeHtml(member.status)}</span>${self ? '<span class="self-badge">You</span>' : ''}</div></div>
        <div class="member-controls">
          <label>Role<select class="role-select" ${self ? 'disabled' : ''}><option value="viewer" ${member.role==='viewer'?'selected':''}>Viewer</option><option value="editor" ${member.role==='editor'?'selected':''}>Editor</option><option value="admin" ${member.role==='admin'?'selected':''}>Admin</option></select></label>
          <label>Status<select class="status-select" ${self ? 'disabled' : ''}><option value="pending" ${member.status==='pending'?'selected':''}>Pending</option><option value="active" ${member.status==='active'?'selected':''}>Active</option><option value="disabled" ${member.status==='disabled'?'selected':''}>Disabled</option></select></label>
          <button class="save-member btn btn-dark" ${self ? 'disabled' : ''}>Save</button>
        </div>
      </article>`;
    }).join('');

    list.querySelectorAll('.member-card').forEach(card => {
      const btn = card.querySelector('.save-member'); if (!btn || btn.disabled) return;
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = 'Saving…';
        const role = card.querySelector('.role-select').value;
        const status = card.querySelector('.status-select').value;
        const { error } = await client.from('profiles').update({ role, status }).eq('id', card.dataset.id);
        if (error) { alert(error.message); btn.disabled = false; btn.textContent = 'Save'; return; }
        btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Save'; }, 900);
      });
    });
  }

  function initials(s='') { return s.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || '?'; }
  function escapeHtml(value='') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function escapeAttr(value='') { return escapeHtml(value); }
})();
