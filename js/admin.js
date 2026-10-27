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
          // Always enter Events in list mode. The form opens only when
          // Add Event or Edit is explicitly selected.
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

    // Dashboard must start in list mode, never with an event form left open.
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
          .select('id,event_date,end_date');

      if (eventError) throw eventError;

      const upcomingEventCount = (eventRows || [])
        .filter((event) => {
          const finalDate =
            event.end_date || event.event_date;

          return finalDate && finalDate >= today;
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

  /* =========================================================
     EVENT MANAGEMENT
     ========================================================= */

  const resetEventForm = () => {
    eventForm?.reset();

    if (eventId) eventId.value = '';

    if (eventEndDate) {
      eventEndDate.value = '';
      eventEndDate.min = '';
    }

    if (eventPublished) {
      eventPublished.checked = true;
    }

    if (formTitle) {
      formTitle.textContent = 'Add event';
    }

    setMessage(eventMessage);
  };

  eventDate?.addEventListener('change', () => {
    if (!eventEndDate) return;

    eventEndDate.min =
      eventDate.value || '';

    if (
      eventEndDate.value &&
      eventDate.value &&
      eventEndDate.value < eventDate.value
    ) {
      eventEndDate.value = eventDate.value;
    }
  });

  newEventBtn?.addEventListener(
    'click',
    () => {
      resetEventForm();
      if (eventFormPanel) {
        eventFormPanel.hidden = false;
        eventFormPanel.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  );

  cancelEditBtn?.addEventListener(
    'click',
    () => {
      resetEventForm();
      if (eventFormPanel) {
        eventFormPanel.hidden = true;
      }
    }
  );

  const uploadEventImage = async (
    file
  ) => {
    if (!file) return null;

    const extension =
      file.name.split('.').pop()?.toLowerCase() ||
      'jpg';

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `events/${filename}`;

    const {
      error: uploadError
    } = await supabase.storage
      .from('event-images')
      .upload(
        path,
        file,
        {
          cacheControl: '3600',
          upsert: false
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('event-images')
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  const loadEvents = async () => {
    if (!eventsList) return;

    eventsList.innerHTML =
      '<div class="admin-loading">Loading events…</div>';

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      const events = Array.isArray(data) ? data : [];

      if (!events.length) {
        eventsList.innerHTML = `
          <div class="admin-empty admin-empty--large">
            <strong>No events yet</strong>
            <span>Create your first event and it will appear here.</span>
          </div>
        `;
        return;
      }

      const today = getLocalDateString();

      const rows = events.map((event) => {
        const finalDate = event.end_date || event.event_date;
        const past = Boolean(finalDate && finalDate < today);

        const title =
          event.title ||
          (event.image_url ? 'Image-only event' : 'Untitled event');

        const venue = event.venue || 'Venue not set';

        const statusText =
          past
            ? 'Past'
            : event.published
              ? 'Published'
              : 'Draft';

        const statusClass =
          past
            ? 'disabled'
            : event.published
              ? 'published'
              : 'pending';

        const actions = canEdit()
          ? `
              <div class="table-action-group">
                <button
                  class="table-action"
                  type="button"
                  data-event-edit="${event.id}"
                >
                  Edit
                </button>
                <button
                  class="table-action table-action--danger"
                  type="button"
                  data-event-delete="${event.id}"
                >
                  Delete
                </button>
              </div>
            `
          : '<span class="table-readonly">View only</span>';

        return `
          <tr>
            <td data-label="Event">
              <div class="event-table-title">
                <strong>${escapeHtml(title)}</strong>
                ${
                  event.featured
                    ? '<span class="mini-badge">Featured</span>'
                    : ''
                }
              </div>
            </td>
            <td data-label="Date">
              ${escapeHtml(formatEventDateRange(event))}
            </td>
            <td data-label="Venue">
              ${escapeHtml(venue)}
            </td>
            <td data-label="Status">
              <span class="status-pill ${statusClass}">
                ${statusText}
              </span>
            </td>
            <td data-label="Actions">
              ${actions}
            </td>
          </tr>
        `;
      }).join('');

      eventsList.innerHTML = `
        <div class="admin-table-card">
          <div class="admin-table-scroll">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Status</th>
                  <th class="admin-table-actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        </div>
      `;

      attachEventActions(events);

    } catch (error) {
      console.error('Load events error:', error);

      eventsList.innerHTML = `
        <div class="admin-empty admin-empty--large">
          <strong>Unable to load events</strong>
          <span>Please refresh the page or try again.</span>
        </div>
      `;
    }
  };

  const attachEventActions = (
    events
  ) => {
    document
      .querySelectorAll('[data-event-edit]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            const event =
              events.find(
                (item) =>
                  String(item.id) ===
                  String(
                    button.dataset.eventEdit
                  )
              );

            if (!event) return;

            if (eventId) {
              eventId.value =
                event.id || '';
            }

            if (eventTitle) {
              eventTitle.value =
                event.title || '';
            }

            if (eventDate) {
              eventDate.value =
                event.event_date || '';
            }

            if (eventEndDate) {
              eventEndDate.value =
                event.end_date || '';
              eventEndDate.min =
                event.event_date || '';
            }

            if (eventTime) {
              eventTime.value =
                event.start_time || '';
            }

            if (eventVenue) {
              eventVenue.value =
                event.venue || '';
            }

            if (eventSummary) {
              eventSummary.value =
                event.description || '';
            }

            if (eventRegistration) {
              eventRegistration.value =
                event.registration_url || '';
            }

            if (eventFeatured) {
              eventFeatured.checked =
                Boolean(event.featured);
            }

            if (eventPublished) {
              eventPublished.checked =
                Boolean(event.published);
            }

            if (formTitle) {
              formTitle.textContent =
                'Edit event';
            }

            if (eventFormPanel) {
              eventFormPanel.hidden = false;

              eventFormPanel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        );
      });

    document
      .querySelectorAll(
        '[data-event-delete]'
      )
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            if (!canEdit()) return;

            const confirmed =
              window.confirm(
                'Delete this event permanently?'
              );

            if (!confirmed) return;

            const { error } =
              await supabase
                .from('events')
                .delete()
                .eq(
                  'id',
                  button.dataset.eventDelete
                );

            if (error) {
              window.alert(error.message);
              return;
            }

            await loadEvents();
            await loadDashboardMetrics();

            refreshPublicData();
          }
        );
      });
  };

  eventForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (!canEdit()) {
        setMessage(
          eventMessage,
          'Your role does not allow event editing.',
          true
        );
        return;
      }

      const startDate =
        eventDate?.value || '';

      const endDate =
        eventEndDate?.value || '';

      const hasImage =
        Boolean(eventImage?.files?.[0]);

      const hasAnyContent =
        Boolean(
          eventTitle?.value.trim() ||
          startDate ||
          endDate ||
          eventTime?.value ||
          eventVenue?.value.trim() ||
          eventSummary?.value.trim() ||
          eventRegistration?.value.trim() ||
          hasImage
        );

      if (!hasAnyContent) {
        setMessage(
          eventMessage,
          'Add at least one event detail or upload an event image.',
          true
        );
        return;
      }

      if (
        endDate &&
        startDate &&
        endDate < startDate
      ) {
        setMessage(
          eventMessage,
          'End date cannot be before the start date.',
          true
        );
        return;
      }

      try {
        setMessage(
          eventMessage,
          'Saving event…'
        );

        let imageUrl = null;

        if (eventImage?.files?.[0]) {
          imageUrl =
            await uploadEventImage(
              eventImage.files[0]
            );
        }

        const payload = {
          title:
            eventTitle.value.trim() || null,

          event_date:
            startDate || null,

          end_date:
            endDate || null,

          start_time:
            eventTime.value || null,

          venue:
            eventVenue.value.trim() || null,

          description:
            eventSummary.value.trim() || null,

          registration_url:
            eventRegistration.value.trim() ||
            null,

          featured:
            eventFeatured.checked,

          published:
            eventPublished.checked,

          updated_by:
            currentUser.id
        };

        if (imageUrl) {
          payload.image_url =
            imageUrl;
        }

        let result;

        if (eventId.value) {
          result = await supabase
            .from('events')
            .update(payload)
            .eq(
              'id',
              eventId.value
            );
        } else {
          payload.created_by =
            currentUser.id;

          result = await supabase
            .from('events')
            .insert(payload);
        }

        if (result.error) {
          throw result.error;
        }

        resetEventForm();

        if (eventFormPanel) {
          eventFormPanel.hidden = true;
        }

        await loadEvents();
        await loadDashboardMetrics();

        refreshPublicData();

      } catch (error) {
        console.error(
          'Save event error:',
          error
        );

        setMessage(
          eventMessage,
          error.message ||
          'Unable to save event.',
          true
        );
      }
    }
  );

  /* =========================================================
     MEMBERSHIP APPLICATIONS
     ========================================================= */

  const loadMembershipApplications =
    async () => {
      if (
        !membershipApplicationsList ||
        !isAdmin()
      ) {
        return;
      }

      membershipApplicationsList.innerHTML =
        '<div class="admin-loading">Loading applications…</div>';

      try {
        let query = supabase
          .from('membership_applications')
          .select('*')
          .order('created_at', {
            ascending: false
          });

        const status =
          membershipStatusFilter?.value;

        if (
          status &&
          status !== 'all'
        ) {
          query = query.eq(
            'membership_status',
            status
          );
        }

        const {
          data,
          error
        } = await query;

        if (error) throw error;

        let applications =
          Array.isArray(data)
            ? data
            : [];

        const search =
          membershipSearch?.value
            .trim()
            .toLowerCase();

        if (search) {
          applications =
            applications.filter(
              (application) =>
                String(
                  application.full_name || ''
                )
                  .toLowerCase()
                  .includes(search) ||
                String(
                  application.email || ''
                )
                  .toLowerCase()
                  .includes(search)
            );
        }

        if (!applications.length) {
          membershipApplicationsList.innerHTML = `
            <div class="admin-empty">
              No membership applications match this view.
            </div>
          `;
          return;
        }

        membershipApplicationsList.innerHTML =
          applications.map(
            (application) => `
              <article class="admin-row">

                <div class="admin-row-main">
                  <strong>
                    ${escapeHtml(
                      application.full_name
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      application.email
                    )}
                  </span>

                  <span>
                    ${escapeHtml(
                      application.application_reference ||
                      ''
                    )}
                  </span>
                </div>

                <div class="admin-row-meta">
                  <span>Plan</span>
                  <strong>
                    ${escapeHtml(
                      application.membership_plan_name ||
                      '—'
                    )}
                  </strong>
                </div>

                <div class="admin-row-meta">
                  <span>Payment</span>

                  <strong>
                    ${money(
                      application.membership_amount
                    )}
                  </strong>

                  <span class="status-pill ${
                    application.payment_status
                  }">
                    ${escapeHtml(
                      application.payment_status ||
                      'pending'
                    )}
                  </span>
                </div>

                <div class="admin-row-actions">
                  ${
                    application.payment_status !==
                    'paid'
                      ? `
                        <button
                          type="button"
                          data-payment-received="${application.id}"
                        >
                          Mark Payment Received
                        </button>
                      `
                      : ''
                  }

                  ${
                    application.membership_status !==
                    'declined'
                      ? `
                        <button
                          type="button"
                          class="danger"
                          data-membership-decline="${application.id}"
                        >
                          Decline
                        </button>
                      `
                      : ''
                  }
                </div>

              </article>
            `
          ).join('');

        attachMembershipActions();

      } catch (error) {
        console.error(
          'Membership application error:',
          error
        );

        membershipApplicationsList.innerHTML = `
          <div class="admin-empty">
            Unable to load membership applications.
          </div>
        `;
      }
    };

  const attachMembershipActions =
    () => {
      document
        .querySelectorAll(
          '[data-payment-received]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              if (!isAdmin()) return;

              const confirmed =
                window.confirm(
                  'Confirm that the Interac payment has been received?'
                );

              if (!confirmed) return;

              const { error } =
                await supabase
                  .from(
                    'membership_applications'
                  )
                  .update({
                    payment_status:
                      'paid',

                    membership_status:
                      'active',

                    payment_verified_at:
                      new Date().toISOString(),

                    payment_verified_by:
                      currentUser.id
                  })
                  .eq(
                    'id',
                    button.dataset
                      .paymentReceived
                  );

              if (error) {
                window.alert(error.message);
                return;
              }

              await loadMembershipApplications();
              await loadDashboardMetrics();
            }
          );
        });

      document
        .querySelectorAll(
          '[data-membership-decline]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              if (!isAdmin()) return;

              const confirmed =
                window.confirm(
                  'Decline this membership application?'
                );

              if (!confirmed) return;

              const { error } =
                await supabase
                  .from(
                    'membership_applications'
                  )
                  .update({
                    membership_status:
                      'declined'
                  })
                  .eq(
                    'id',
                    button.dataset
                      .membershipDecline
                  );

              if (error) {
                window.alert(error.message);
                return;
              }

              await loadMembershipApplications();
              await loadDashboardMetrics();
            }
          );
        });
    };

  membershipStatusFilter
    ?.addEventListener(
      'change',
      loadMembershipApplications
    );

  membershipSearch
    ?.addEventListener(
      'input',
      loadMembershipApplications
    );

  /* =========================================================
     COMMITTEE ACCESS MANAGEMENT
     ========================================================= */

  const renderPendingProfiles = (
    profiles
  ) => {
    if (!pendingMembersList) return;

    if (pendingRequestCount) {
      pendingRequestCount.textContent =
        profiles.length
          ? `${profiles.length} pending`
          : 'No pending requests';
    }

    if (!profiles.length) {
      pendingMembersList.innerHTML = `
        <div class="admin-empty">
          No committee access requests are waiting for approval.
        </div>
      `;
      return;
    }

    pendingMembersList.innerHTML =
      profiles.map((profile) => `
        <article class="member-row">

          <div class="member-identity">
            <strong>
              ${escapeHtml(
                profile.full_name ||
                'Unnamed user'
              )}
            </strong>

            <span>
              ${escapeHtml(profile.email)}
            </span>
          </div>

          <select
            data-pending-role="${profile.id}"
          >
            <option
              value="viewer"
              ${
                profile.role === 'viewer'
                  ? 'selected'
                  : ''
              }
            >
              Viewer
            </option>

            <option
              value="editor"
              ${
                profile.role === 'editor'
                  ? 'selected'
                  : ''
              }
            >
              Editor
            </option>

            <option
              value="admin"
              ${
                profile.role === 'admin'
                  ? 'selected'
                  : ''
              }
            >
              Admin
            </option>
          </select>

          <span class="status-pill pending">
            Pending
          </span>

          <div class="member-actions">
            <button
              type="button"
              data-user-approve="${profile.id}"
            >
              Approve
            </button>

            <button
              type="button"
              class="danger"
              data-user-decline="${profile.id}"
            >
              Decline
            </button>
          </div>

        </article>
      `).join('');
  };

  const renderActiveProfiles = (
    profiles
  ) => {
    if (!membersList) return;

    if (!profiles.length) {
      membersList.innerHTML = `
        <div class="admin-empty">
          No committee users found.
        </div>
      `;
      return;
    }

    membersList.innerHTML =
      profiles.map((profile) => {
        const isCurrentUser =
          profile.id === currentUser?.id;

        return `
          <article class="member-row">

            <div class="member-identity">
              <strong>
                ${escapeHtml(
                  profile.full_name ||
                  'Unnamed user'
                )}
              </strong>

              <span>
                ${escapeHtml(profile.email)}
              </span>
            </div>

            <select
              data-user-role="${profile.id}"
              ${isCurrentUser ? 'disabled' : ''}
            >
              <option
                value="viewer"
                ${
                  profile.role === 'viewer'
                    ? 'selected'
                    : ''
                }
              >
                Viewer
              </option>

              <option
                value="editor"
                ${
                  profile.role === 'editor'
                    ? 'selected'
                    : ''
                }
              >
                Editor
              </option>

              <option
                value="admin"
                ${
                  profile.role === 'admin'
                    ? 'selected'
                    : ''
                }
              >
                Admin
              </option>
            </select>

            <span class="status-pill ${
              profile.status === 'active'
                ? 'active'
                : 'disabled'
            }">
              ${
                profile.status === 'active'
                  ? 'Active'
                  : 'Revoked'
              }
            </span>

            <div class="member-actions">
              ${
                isCurrentUser
                  ? `
                    <span class="status-pill active">
                      Current Admin
                    </span>
                  `
                  : `
                    <button
                      type="button"
                      data-user-role-save="${profile.id}"
                    >
                      Save Role
                    </button>

                    ${
                      profile.status === 'active'
                        ? `
                          <button
                            type="button"
                            class="danger"
                            data-user-revoke="${profile.id}"
                          >
                            Revoke Access
                          </button>
                        `
                        : `
                          <button
                            type="button"
                            data-user-reactivate="${profile.id}"
                          >
                            Reactivate
                          </button>
                        `
                    }
                  `
              }
            </div>

          </article>
        `;
      }).join('');
  };

  const loadCommitteeUsers =
    async () => {
      if (
        !membersList ||
        !isAdmin()
      ) {
        return;
      }

      if (pendingMembersList) {
        pendingMembersList.innerHTML =
          '<div class="admin-loading">Loading pending requests…</div>';
      }

      membersList.innerHTML =
        '<div class="admin-loading">Loading committee users…</div>';

      try {
        const {
          data,
          error
        } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', {
            ascending: true
          });

        if (error) throw error;

        const profiles =
          Array.isArray(data)
            ? data
            : [];

        const pendingProfiles =
          profiles.filter(
            (profile) =>
              profile.status === 'pending'
          );

        const activeProfiles =
          profiles.filter(
            (profile) =>
              profile.status !== 'pending'
          );

        renderPendingProfiles(
          pendingProfiles
        );

        renderActiveProfiles(
          activeProfiles
        );

        attachCommitteeUserActions();

      } catch (error) {
        console.error(
          'Committee users error:',
          error
        );

        if (pendingMembersList) {
          pendingMembersList.innerHTML = `
            <div class="admin-empty">
              Unable to load pending requests.
            </div>
          `;
        }

        membersList.innerHTML = `
          <div class="admin-empty">
            Unable to load committee users.
          </div>
        `;
      }
    };

  const updateProfileAccess = async (
    userId,
    updates,
    successMessage
  ) => {
    if (!isAdmin()) return;

    if (
      userId === currentUser?.id &&
      updates.status &&
      updates.status !== 'active'
    ) {
      window.alert(
        'You cannot revoke your own Admin access.'
      );
      return;
    }

    setMessage(
      membersMessage,
      'Saving access…'
    );

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      setMessage(
        membersMessage,
        error.message ||
        'Unable to update access.',
        true
      );
      return;
    }

    setMessage(
      membersMessage,
      successMessage
    );

    await loadCommitteeUsers();
    await loadDashboardMetrics();
  };

  const attachCommitteeUserActions =
    () => {
      document
        .querySelectorAll(
          '[data-user-approve]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              const userId =
                button.dataset.userApprove;

              const role =
                document.querySelector(
                  `[data-pending-role="${userId}"]`
                )?.value || 'viewer';

              const confirmed =
                window.confirm(
                  `Approve this committee request as ${role}?`
                );

              if (!confirmed) return;

              await updateProfileAccess(
                userId,
                {
                  role,
                  status: 'active'
                },
                'Committee access approved.'
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-user-decline]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              const confirmed =
                window.confirm(
                  'Decline this committee access request?'
                );

              if (!confirmed) return;

              await updateProfileAccess(
                button.dataset.userDecline,
                {
                  status: 'disabled'
                },
                'Committee access request declined.'
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-user-role-save]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              const userId =
                button.dataset.userRoleSave;

              const role =
                document.querySelector(
                  `[data-user-role="${userId}"]`
                )?.value;

              if (!role) return;

              await updateProfileAccess(
                userId,
                { role },
                'Committee role updated.'
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-user-revoke]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              const confirmed =
                window.confirm(
                  'Revoke this committee member’s access? They will no longer be able to enter the dashboard.'
                );

              if (!confirmed) return;

              await updateProfileAccess(
                button.dataset.userRevoke,
                {
                  status: 'disabled'
                },
                'Committee access revoked.'
              );
            }
          );
        });

      document
        .querySelectorAll(
          '[data-user-reactivate]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              const confirmed =
                window.confirm(
                  'Reactivate this committee member’s access?'
                );

              if (!confirmed) return;

              await updateProfileAccess(
                button.dataset.userReactivate,
                {
                  status: 'active'
                },
                'Committee access reactivated.'
              );
            }
          );
        });
    };

  addCommitteeUserBtn?.addEventListener(
    'click',
    () => {
      if (!isAdmin()) return;

      if (committeeInviteForm) {
        committeeInviteForm.reset();
      }

      if (inviteRole) {
        inviteRole.value = 'editor';
      }

      setMessage(inviteMessage);

      if (addCommitteeUserPanel) {
        addCommitteeUserPanel.hidden = false;
        addCommitteeUserPanel.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  );

  cancelAddCommitteeUserBtn
    ?.addEventListener(
      'click',
      () => {
        committeeInviteForm?.reset();
        setMessage(inviteMessage);

        if (addCommitteeUserPanel) {
          addCommitteeUserPanel.hidden = true;
        }
      }
    );

  committeeInviteForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (!isAdmin()) return;

      const email =
        inviteEmail.value
          .trim()
          .toLowerCase();

      const fullName =
        inviteFullName.value.trim();

      const role =
        inviteRole.value;

      if (!email || !fullName || !role) {
        setMessage(
          inviteMessage,
          'Name, email and role are required.',
          true
        );
        return;
      }

      try {
        setMessage(
          inviteMessage,
          'Adding authorized user…'
        );

        const {
          data: existingProfile,
          error: profileLookupError
        } = await supabase
          .from('profiles')
          .select('id,email,status')
          .eq('email', email)
          .maybeSingle();

        if (profileLookupError) {
          throw profileLookupError;
        }

        if (existingProfile) {
          setMessage(
            inviteMessage,
            'This email already has a committee account. Manage it in the lists below.',
            true
          );
          return;
        }

        const {
          error
        } = await supabase
          .from('committee_invites')
          .upsert(
            {
              email,
              full_name: fullName,
              role,
              status: 'pending',
              invited_by: currentUser.id
            },
            {
              onConflict: 'email'
            }
          );

        if (error) throw error;

        committeeInviteForm.reset();

        if (inviteRole) {
          inviteRole.value = 'editor';
        }

        setMessage(
          inviteMessage,
          'User pre-authorized. Ask them to use Request Access with this same email address.'
        );

      } catch (error) {
        setMessage(
          inviteMessage,
          error.message ||
          'Unable to add authorized user.',
          true
        );
      }
    }
  );

  /* =========================================================
     MEMBERSHIP PLAN SETTINGS
     ========================================================= */

  const loadMembershipPlans =
    async () => {
      if (
        !planSettingsList ||
        !isAdmin()
      ) {
        return;
      }

      planSettingsList.innerHTML =
        '<div class="admin-loading">Loading plans…</div>';

      try {
        const {
          data,
          error
        } = await supabase
          .from('membership_plans')
          .select('*')
          .order(
            'display_order',
            {
              ascending: true
            }
          );

        if (error) throw error;

        const plans =
          Array.isArray(data)
            ? data
            : [];

        if (!plans.length) {
          planSettingsList.innerHTML = `
            <div class="admin-empty">
              No membership plans exist yet.
            </div>
          `;
          return;
        }

        planSettingsList.innerHTML =
          plans.map((plan) => `
            <div class="setting-row">

              <input
                type="text"
                data-plan-name="${plan.id}"
                value="${escapeHtml(
                  plan.name
                )}"
              >

              <input
                type="number"
                min="0"
                step="0.01"
                data-plan-price="${plan.id}"
                value="${Number(
                  plan.price || 0
                )}"
              >

              <select
                data-plan-active="${plan.id}"
              >
                <option
                  value="true"
                  ${
                    plan.active
                      ? 'selected'
                      : ''
                  }
                >
                  Active
                </option>

                <option
                  value="false"
                  ${
                    !plan.active
                      ? 'selected'
                      : ''
                  }
                >
                  Inactive
                </option>
              </select>

              <button
                type="button"
                data-plan-save="${plan.id}"
              >
                Save
              </button>

            </div>
          `).join('');

        attachPlanActions();

      } catch (error) {
        console.error(
          'Membership plan error:',
          error
        );

        planSettingsList.innerHTML = `
          <div class="admin-empty">
            Unable to load membership plans.
          </div>
        `;
      }
    };

  const attachPlanActions =
    () => {
      document
        .querySelectorAll(
          '[data-plan-save]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              if (!isAdmin()) return;

              const id =
                button.dataset.planSave;

              const name =
                document.querySelector(
                  `[data-plan-name="${id}"]`
                )?.value.trim();

              const price =
                Number(
                  document.querySelector(
                    `[data-plan-price="${id}"]`
                  )?.value || 0
                );

              const active =
                document.querySelector(
                  `[data-plan-active="${id}"]`
                )?.value === 'true';

              if (!name) {
                window.alert(
                  'Plan name cannot be empty.'
                );
                return;
              }

              const {
                error
              } = await supabase
                .from('membership_plans')
                .update({
                  name,
                  price,
                  active
                })
                .eq(
                  'id',
                  id
                );

              if (error) {
                window.alert(error.message);
                return;
              }

              refreshPublicData();
              await loadMembershipPlans();
            }
          );
        });
    };

  addPlanBtn?.addEventListener(
    'click',
    async () => {
      if (!isAdmin()) return;

      const name =
        window.prompt(
          'Membership plan name'
        );

      if (!name?.trim()) return;

      const priceText =
        window.prompt(
          'Annual price in CAD'
        );

      const price =
        Number(priceText);

      if (
        Number.isNaN(price) ||
        price < 0
      ) {
        window.alert(
          'Please enter a valid price.'
        );
        return;
      }

      const {
        data: existingPlans
      } = await supabase
        .from('membership_plans')
        .select('display_order');

      const maxOrder =
        Math.max(
          0,
          ...(existingPlans || [])
            .map(
              (plan) =>
                Number(
                  plan.display_order || 0
                )
            )
        );

      const {
        error
      } = await supabase
        .from('membership_plans')
        .insert({
          name:
            name.trim(),

          price,

          billing_type:
            'annual',

          audience_type:
            'individual',

          active:
            true,

          visible:
            true,

          display_order:
            maxOrder + 1,

          description:
            'Annual AAVAN membership'
        });

      if (error) {
        window.alert(error.message);
        return;
      }

      refreshPublicData();
      await loadMembershipPlans();
    }
  );

  /* =========================================================
     PAYMENT SETTINGS
     ========================================================= */

  const loadPaymentSettings =
    async () => {
      if (!isAdmin()) return;

      try {
        const {
          data,
          error
        } = await supabase
          .from('site_settings')
          .select(
            'setting_key, setting_value'
          )
          .in(
            'setting_key',
            [
              'interac_email',
              'payment_instructions'
            ]
          );

        if (error) throw error;

        const settings = {};

        (data || []).forEach((row) => {
          settings[row.setting_key] =
            row.setting_value;
        });

        if (settingInteracEmail) {
          settingInteracEmail.value =
            settings.interac_email ||
            'aavanmembers@gmail.com';
        }

        if (
          settingPaymentInstructions
        ) {
          settingPaymentInstructions.value =
            settings.payment_instructions ||
            'Send the exact membership amount by Interac e-Transfer.';
        }

      } catch (error) {
        console.error(
          'Payment settings error:',
          error
        );
      }
    };

  paymentSettingsForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (!isAdmin()) return;

      try {
        setMessage(
          settingsMessage,
          'Saving settings…'
        );

        const rows = [
          {
            setting_key:
              'interac_email',

            setting_value:
              settingInteracEmail
                .value
                .trim()
          },
          {
            setting_key:
              'payment_instructions',

            setting_value:
              settingPaymentInstructions
                .value
                .trim()
          }
        ];

        for (const row of rows) {
          const { error } =
            await supabase
              .from('site_settings')
              .upsert(
                row,
                {
                  onConflict:
                    'setting_key'
                }
              );

          if (error) {
            throw error;
          }
        }

        setMessage(
          settingsMessage,
          'Payment settings saved.'
        );

        refreshPublicData();

      } catch (error) {
        setMessage(
          settingsMessage,
          error.message ||
          'Unable to save settings.',
          true
        );
      }
    }
  );

  /* =========================================================
     PUBLIC API FOR COMMITTEE PORTAL
     ========================================================= */

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.admin = {
    configureDashboard,
    loadDashboardMetrics,
    loadEvents,
    loadMembershipApplications,
    loadCommitteeUsers,
    loadMembershipPlans,
    loadPaymentSettings
  };
})();
