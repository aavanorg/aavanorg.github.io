(() => {
  const supabase = window.AAVAN?.supabase;

  if (!supabase) {
    console.warn('AAVAN admin: Supabase is not available.');
    return;
  }

  let currentUser = null;
  let currentProfile = null;

  /* =========================================================
     DOM REFERENCES
     ========================================================= */

  const dashboard = document.getElementById('dashboard');
  const dashboardUserName = document.getElementById('dashboardUserName');
  const dashboardAvatar = document.getElementById('dashboardAvatar');
  const roleSummary = document.getElementById('roleSummary');

  const metricEvents = document.getElementById('metricEvents');
  const metricAccess = document.getElementById('metricAccess');
  const metricMemberships = document.getElementById('metricMemberships');
  const metricRole = document.getElementById('metricRole');
  const permissionSummary = document.getElementById('permissionSummary');

  const membershipsTab = document.getElementById('membershipsTab');
  const accessTab = document.getElementById('accessTab');
  const settingsTab = document.getElementById('settingsTab');

  /* Events */
  const eventsList = document.getElementById('eventsList');
  const eventFormPanel = document.getElementById('eventFormPanel');
  const newEventBtn = document.getElementById('newEventBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const eventForm = document.getElementById('eventForm');
  const eventId = document.getElementById('eventId');
  const eventTitle = document.getElementById('eventTitle');
  const eventDate = document.getElementById('eventDate');
  const eventEndDate = document.getElementById('eventEndDate');
  const eventTime = document.getElementById('eventTime');
  const eventVenue = document.getElementById('eventVenue');
  const eventSummary = document.getElementById('eventSummary');
  const eventRegistration = document.getElementById('eventRegistration');
  const eventImage = document.getElementById('eventImage');
  const eventFeatured = document.getElementById('eventFeatured');
  const eventPublished = document.getElementById('eventPublished');
  const eventMessage = document.getElementById('eventMessage');
  const formTitle = document.getElementById('formTitle');

  /* Access */
  const membersList = document.getElementById('membersList');
  const pendingMembersList = document.getElementById('pendingMembersList');
  const pendingRequestCount = document.getElementById('pendingRequestCount');
  const membersMessage = document.getElementById('membersMessage');

  const addCommitteeUserBtn = document.getElementById('addCommitteeUserBtn');
  const addCommitteeUserPanel = document.getElementById('addCommitteeUserPanel');
  const cancelAddCommitteeUserBtn = document.getElementById('cancelAddCommitteeUserBtn');
  const committeeInviteForm = document.getElementById('committeeInviteForm');
  const inviteFullName = document.getElementById('inviteFullName');
  const inviteEmail = document.getElementById('inviteEmail');
  const inviteRole = document.getElementById('inviteRole');
  const inviteMessage = document.getElementById('inviteMessage');

  /* Memberships */
  const membershipApplicationsList =
    document.getElementById('membershipApplicationsList');
  const membershipStatusFilter =
    document.getElementById('membershipStatusFilter');
  const membershipSearch =
    document.getElementById('membershipSearch');

  /* Settings */
  const planSettingsList = document.getElementById('planSettingsList');
  const addPlanBtn = document.getElementById('addPlanBtn');
  const paymentSettingsForm = document.getElementById('paymentSettingsForm');
  const settingInteracEmail = document.getElementById('settingInteracEmail');
  const settingPaymentInstructions =
    document.getElementById('settingPaymentInstructions');
  const settingsMessage = document.getElementById('settingsMessage');

  /* =========================================================
     HELPERS
     ========================================================= */

  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const money = (value) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(Number(value || 0));

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (value) => {
    if (!value) return '—';

    const [year, month, day] = String(value).split('-').map(Number);

    if (!year || !month || !day) return value;

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatEventDateRange = (event) => {
    const start = event.event_date;
    const end = event.end_date;

    if (!start && !end) return 'No date';
    if (!start && end) return `Through ${formatDate(end)}`;
    if (!end || end === start) return formatDate(start);

    return `${formatDate(start)} – ${formatDate(end)}`;
  };

  const setMessage = (
    element,
    text = '',
    isError = false
  ) => {
    if (!element) return;

    element.textContent = text;
    element.classList.toggle('error', Boolean(isError));
  };

  const getInitials = (name = '') => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);

    return parts
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A';
  };

  const isAdmin = () =>
    currentProfile?.role === 'admin' &&
    currentProfile?.status === 'active';

  const canEdit = () =>
    ['admin', 'editor'].includes(currentProfile?.role) &&
    currentProfile?.status === 'active';

  const refreshPublicData = () => {
    window.AAVAN?.events?.reload?.();
    window.AAVAN?.membership?.reloadPlans?.();
    window.AAVAN?.gallery?.reload?.();
  };

  /* =========================================================
     DASHBOARD NAVIGATION
     ========================================================= */

  document
    .querySelectorAll('.dashboard-nav')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const panelId = button.dataset.panel;
        if (!panelId) return;

        document
          .querySelectorAll('.dashboard-nav')
          .forEach((navButton) => {
            navButton.classList.remove('active');
          });

        button.classList.add('active');

        document
          .querySelectorAll('.dashboard-panel')
          .forEach((panel) => {
            panel.hidden = true;
            panel.classList.remove('active');
          });

        const panel = document.getElementById(panelId);

        if (panel) {
          panel.hidden = false;
          panel.classList.add('active');
        }

        if (panelId === 'eventsPanel') {
          resetEventForm();
          if (eventFormPanel) eventFormPanel.hidden = true;
          loadEvents();
        }

        if (panelId === 'galleryPanel') {
          window.AAVAN?.gallery?.loadAdmin?.({
            user: currentUser,
            profile: currentProfile
          });
        }

        if (
          panelId === 'membershipsPanel' &&
          isAdmin()
        ) {
          loadMembershipApplications();
        }

        if (
          panelId === 'accessPanel' &&
          isAdmin()
        ) {
          loadCommitteeUsers();
        }

        if (
          panelId === 'settingsPanel' &&
          isAdmin()
        ) {
          loadMembershipPlans();
          loadPaymentSettings();
        }
      });
    });

  /* =========================================================
     PROFILE / DASHBOARD SETUP
     ========================================================= */

  const configureDashboard = async (
    user,
    profile
  ) => {
    currentUser = user;
    currentProfile = profile;

    if (dashboardUserName) {
      dashboardUserName.textContent =
        profile.full_name ||
        user.email ||
        'Committee Member';
    }

    if (dashboardAvatar) {
      dashboardAvatar.textContent =
        getInitials(
          profile.full_name ||
          user.email ||
          'A'
        );
    }

    if (roleSummary) {
      roleSummary.textContent =
        `${profile.role} • ${profile.status}`;
    }

    if (metricRole) {
      metricRole.textContent =
        profile.role || '—';
    }

    if (isAdmin()) {
      if (membershipsTab) membershipsTab.hidden = false;
      if (accessTab) accessTab.hidden = false;
      if (settingsTab) settingsTab.hidden = false;

      if (permissionSummary) {
        permissionSummary.textContent =
          'You have full Admin access: events, gallery, memberships, committee access, membership plans and payment settings.';
      }
    } else if (profile.role === 'editor') {
      if (membershipsTab) membershipsTab.hidden = true;
      if (accessTab) accessTab.hidden = true;
      if (settingsTab) settingsTab.hidden = true;

      if (permissionSummary) {
        permissionSummary.textContent =
          'You can create, edit, publish and manage events and gallery content. Membership records and user access remain Admin-only.';
      }
    } else {
      if (membershipsTab) membershipsTab.hidden = true;
      if (accessTab) accessTab.hidden = true;
      if (settingsTab) settingsTab.hidden = true;

      if (permissionSummary) {
        permissionSummary.textContent =
          'Your Viewer role is read-only. Contact an Admin if you need editing access.';
      }
    }

    if (newEventBtn) {
      newEventBtn.hidden = !canEdit();
    }

    resetEventForm();
    if (eventFormPanel) eventFormPanel.hidden = true;

    await Promise.all([
      loadDashboardMetrics(),
      loadEvents()
    ]);

    window.AAVAN?.gallery?.setAdminContext?.({
      user: currentUser,
      profile: currentProfile
    });
  };

  /* =========================================================
     DASHBOARD METRICS
     ========================================================= */

  const loadDashboardMetrics = async () => {
    try {
      const today = getLocalDateString();

      const { data: eventRows, error: eventError } =
        await supabase
          .from('events')
          .select('id,event_date,end_date,published');

      if (eventError) throw eventError;

      const upcomingEventCount = (eventRows || [])
        .filter((event) => {
          if (!event.published) {
            return false;
          }

          const finalDate =
            event.end_date || event.event_date;

          // Published event with no date still counts as active/current.
          if (!finalDate) {
            return true;
          }

          return finalDate >= today;
        })
        .length;

      if (metricEvents) {
        metricEvents.textContent =
          upcomingEventCount;
      }

      if (isAdmin()) {
        const [
          accessResult,
          membershipsResult
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select('id', {
              count: 'exact',
              head: true
            })
            .eq('status', 'pending'),

          supabase
            .from('membership_applications')
            .select('id', {
              count: 'exact',
              head: true
            })
            .eq(
              'payment_status',
              'pending_payment'
            )
        ]);

        if (metricAccess) {
          metricAccess.textContent =
            accessResult.count ?? 0;
        }

        if (metricMemberships) {
          metricMemberships.textContent =
            membershipsResult.count ?? 0;
        }
      } else {
        document
          .querySelectorAll('.admin-only-metric')
          .forEach((item) => {
            item.hidden = true;
          });
      }
    } catch (error) {
      console.error(
        'Dashboard metric error:',
        error
      );
    }
  };
