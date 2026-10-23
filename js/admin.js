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

  const dashboardUserName =
    document.getElementById('dashboardUserName');

  const dashboardAvatar =
    document.getElementById('dashboardAvatar');

  const roleSummary =
    document.getElementById('roleSummary');

  const metricEvents =
    document.getElementById('metricEvents');

  const metricAccess =
    document.getElementById('metricAccess');

  const metricMemberships =
    document.getElementById('metricMemberships');

  const metricRole =
    document.getElementById('metricRole');

  const permissionSummary =
    document.getElementById('permissionSummary');

  const membershipsTab =
    document.getElementById('membershipsTab');

  const accessTab =
    document.getElementById('accessTab');

  const settingsTab =
    document.getElementById('settingsTab');

  const eventsList =
    document.getElementById('eventsList');

  const eventFormPanel =
    document.getElementById('eventFormPanel');

  const newEventBtn =
    document.getElementById('newEventBtn');

  const cancelEditBtn =
    document.getElementById('cancelEditBtn');

  const eventForm =
    document.getElementById('eventForm');

  const eventId =
    document.getElementById('eventId');

  const eventTitle =
    document.getElementById('eventTitle');

  const eventDate =
    document.getElementById('eventDate');

  const eventTime =
    document.getElementById('eventTime');

  const eventVenue =
    document.getElementById('eventVenue');

  const eventSummary =
    document.getElementById('eventSummary');

  const eventRegistration =
    document.getElementById('eventRegistration');

  const eventImage =
    document.getElementById('eventImage');

  const eventFeatured =
    document.getElementById('eventFeatured');

  const eventPublished =
    document.getElementById('eventPublished');

  const eventMessage =
    document.getElementById('eventMessage');

  const formTitle =
    document.getElementById('formTitle');

  const membersList =
    document.getElementById('membersList');

  const membersMessage =
    document.getElementById('membersMessage');

  const membershipApplicationsList =
    document.getElementById('membershipApplicationsList');

  const membershipStatusFilter =
    document.getElementById('membershipStatusFilter');

  const membershipSearch =
    document.getElementById('membershipSearch');

  const planSettingsList =
    document.getElementById('planSettingsList');

  const addPlanBtn =
    document.getElementById('addPlanBtn');

  const paymentSettingsForm =
    document.getElementById('paymentSettingsForm');

  const settingInteracEmail =
    document.getElementById('settingInteracEmail');

  const settingPaymentInstructions =
    document.getElementById('settingPaymentInstructions');

  const settingsMessage =
    document.getElementById('settingsMessage');

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

  const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(`${value}T00:00:00`);

    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const setMessage = (
    element,
    text = '',
    isError = false
  ) => {
    if (!element) return;

    element.textContent = text;
    element.classList.toggle(
      'error',
      Boolean(isError)
    );
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
    ['admin', 'editor'].includes(
      currentProfile?.role
    ) &&
    currentProfile?.status === 'active';

  const refreshPublicData = () => {
    window.AAVAN?.events?.reload?.();
    window.AAVAN?.membership?.reloadPlans?.();
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

        const panel =
          document.getElementById(panelId);

        if (panel) {
          panel.hidden = false;
          panel.classList.add('active');
        }

        if (panelId === 'eventsPanel') {
          loadEvents();
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
      membershipsTab.hidden = false;
      accessTab.hidden = false;
      settingsTab.hidden = false;

      permissionSummary.textContent =
        'You have full Admin access: events, memberships, committee access, membership plans and payment settings.';
    } else if (
      profile.role === 'editor'
    ) {
      membershipsTab.hidden = true;
      accessTab.hidden = true;
      settingsTab.hidden = true;

      permissionSummary.textContent =
        'You can create, edit, publish and manage events. Membership records and user access remain Admin-only.';
    } else {
      membershipsTab.hidden = true;
      accessTab.hidden = true;
      settingsTab.hidden = true;

      permissionSummary.textContent =
        'Your Viewer role is read-only. Contact an Admin if you need editing access.';
    }

    if (newEventBtn) {
      newEventBtn.hidden = !canEdit();
    }

    await Promise.all([
      loadDashboardMetrics(),
      loadEvents()
    ]);
  };

  /* =========================================================
     DASHBOARD METRICS
     ========================================================= */

  const loadDashboardMetrics = async () => {
    try {
      const today =
        new Date().toISOString().slice(0, 10);

      const eventQuery = supabase
        .from('events')
        .select('id', {
          count: 'exact',
          head: true
        })
        .gte('event_date', today);

      const requests = [eventQuery];

      if (isAdmin()) {
        requests.push(
          supabase
            .from('profiles')
            .select('id', {
              count: 'exact',
              head: true
            })
            .eq('status', 'pending')
        );

        requests.push(
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
        );
      }

      const results =
        await Promise.all(requests);

      if (metricEvents) {
        metricEvents.textContent =
          results[0]?.count ?? 0;
      }

      if (isAdmin()) {
        if (metricAccess) {
          metricAccess.textContent =
            results[1]?.count ?? 0;
        }

        if (metricMemberships) {
          metricMemberships.textContent =
            results[2]?.count ?? 0;
        }
      } else {
        document
          .querySelectorAll(
            '.admin-only-metric'
          )
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

    if (eventPublished) {
      eventPublished.checked = true;
    }

    if (formTitle) {
      formTitle.textContent = 'Add event';
    }

    setMessage(eventMessage);
  };

  newEventBtn?.addEventListener(
    'click',
    () => {
      resetEventForm();
      eventFormPanel.hidden = false;

      eventFormPanel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  );

  cancelEditBtn?.addEventListener(
    'click',
    () => {
      resetEventForm();
      eventFormPanel.hidden = true;
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

    const {
      data
    } = supabase.storage
      .from('event-images')
      .getPublicUrl(path);

    return data?.publicUrl || null;
  };

  const loadEvents = async () => {
    if (!eventsList) return;

    eventsList.innerHTML =
      '<div class="admin-loading">Loading events…</div>';

    try {
      const {
        data,
        error
      } = await supabase
        .from('events')
        .select('*')
        .order('event_date', {
          ascending: true
        });

      if (error) throw error;

      const events =
        Array.isArray(data)
          ? data
          : [];

      if (!events.length) {
        eventsList.innerHTML = `
          <div class="admin-empty">
            No events have been created yet.
          </div>
        `;

        return;
      }

      eventsList.innerHTML =
        events.map((event) => `
          <article class="admin-row">

            <div class="admin-row-main">
              <strong>
                ${escapeHtml(event.title)}
              </strong>

              <span>
                ${escapeHtml(
                  event.venue || 'Venue not set'
                )}
              </span>
            </div>

            <div class="admin-row-meta">
              <span>Date</span>
              <strong>
                ${formatDate(event.event_date)}
              </strong>
            </div>

            <div class="admin-row-meta">
              <span>Status</span>

              <span class="status-pill ${
                event.published
                  ? 'published'
                  : ''
              }">
                ${
                  event.published
                    ? 'Published'
                    : 'Draft'
                }
              </span>
            </div>

            <div class="admin-row-actions">

              ${
                canEdit()
                  ? `
                    <button
                      type="button"
                      data-event-edit="${event.id}"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      class="danger"
                      data-event-delete="${event.id}"
                    >
                      Delete
                    </button>
                  `
                  : ''
              }

            </div>

          </article>
        `).join('');

      attachEventActions(events);

    } catch (error) {
      console.error(
        'Load events error:',
        error
      );

      eventsList.innerHTML = `
        <div class="admin-empty">
          Unable to load events.
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

            eventId.value =
              event.id || '';

            eventTitle.value =
              event.title || '';

            eventDate.value =
              event.event_date || '';

            eventTime.value =
              event.start_time || '';

            eventVenue.value =
              event.venue || '';

            eventSummary.value =
              event.description || '';

            eventRegistration.value =
              event.registration_url || '';

            eventFeatured.checked =
              Boolean(event.featured);

            eventPublished.checked =
              Boolean(event.published);

            formTitle.textContent =
              'Edit event';

            eventFormPanel.hidden = false;

            eventFormPanel.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
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

            const {
              error
            } = await supabase
              .from('events')
              .delete()
              .eq(
                'id',
                button.dataset.eventDelete
              );

            if (error) {
              window.alert(
                error.message
              );

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

      try {
        setMessage(
          eventMessage,
          'Saving event…'
        );

        let imageUrl = null;

        if (
          eventImage?.files?.[0]
        ) {
          imageUrl =
            await uploadEventImage(
              eventImage.files[0]
            );
        }

        const payload = {
          title:
            eventTitle.value.trim(),

          event_date:
            eventDate.value,

          start_time:
            eventTime.value || null,

          venue:
            eventVenue.value.trim(),

          description:
            eventSummary.value.trim(),

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

        setMessage(
          eventMessage,
          'Event saved successfully.'
        );

        resetEventForm();
        eventFormPanel.hidden = true;

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

              const {
                error
              } = await supabase
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
                window.alert(
                  error.message
                );

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

              const {
                error
              } = await supabase
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
                window.alert(
                  error.message
                );

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

  const loadCommitteeUsers =
    async () => {
      if (
        !membersList ||
        !isAdmin()
      ) {
        return;
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

        membersList.innerHTML =
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
                  ${escapeHtml(
                    profile.email
                  )}
                </span>
              </div>

              <select
                data-user-role="${profile.id}"
                ${
                  profile.id ===
                  currentUser.id
                    ? 'disabled'
                    : ''
                }
              >
                <option
                  value="viewer"
                  ${
                    profile.role ===
                    'viewer'
                      ? 'selected'
                      : ''
                  }
                >
                  Viewer
                </option>

                <option
                  value="editor"
                  ${
                    profile.role ===
                    'editor'
                      ? 'selected'
                      : ''
                  }
                >
                  Editor
                </option>

                <option
                  value="admin"
                  ${
                    profile.role ===
                    'admin'
                      ? 'selected'
                      : ''
                  }
                >
                  Admin
                </option>
              </select>

              <select
                data-user-status="${profile.id}"
                ${
                  profile.id ===
                  currentUser.id
                    ? 'disabled'
                    : ''
                }
              >
                <option
                  value="pending"
                  ${
                    profile.status ===
                    'pending'
                      ? 'selected'
                      : ''
                  }
                >
                  Pending
                </option>

                <option
                  value="active"
                  ${
                    profile.status ===
                    'active'
                      ? 'selected'
                      : ''
                  }
                >
                  Active
                </option>

                <option
                  value="disabled"
                  ${
                    profile.status ===
                    'disabled'
                      ? 'selected'
                      : ''
                  }
                >
                  Disabled
                </option>
              </select>

              <div class="member-actions">

                ${
                  profile.id !==
                  currentUser.id
                    ? `
                      <button
                        type="button"
                        data-user-save="${profile.id}"
                      >
                        Save
                      </button>
                    `
                    : `
                      <span class="status-pill active">
                        Current Admin
                      </span>
                    `
                }

              </div>

            </article>
          `).join('');

        attachCommitteeUserActions();

      } catch (error) {
        console.error(
          'Committee users error:',
          error
        );

        membersList.innerHTML = `
          <div class="admin-empty">
            Unable to load committee users.
          </div>
        `;
      }
    };

  const attachCommitteeUserActions =
    () => {
      document
        .querySelectorAll(
          '[data-user-save]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            async () => {
              if (!isAdmin()) return;

              const userId =
                button.dataset.userSave;

              const role =
                document.querySelector(
                  `[data-user-role="${userId}"]`
                )?.value;

              const status =
                document.querySelector(
                  `[data-user-status="${userId}"]`
                )?.value;

              if (!role || !status) return;

              try {
                setMessage(
                  membersMessage,
                  'Saving access…'
                );

                const {
                  error
                } = await supabase
                  .from('profiles')
                  .update({
                    role,
                    status
                  })
                  .eq(
                    'id',
                    userId
                  );

                if (error) {
                  throw error;
                }

                setMessage(
                  membersMessage,
                  'Committee access updated.'
                );

                await loadCommitteeUsers();
                await loadDashboardMetrics();

              } catch (error) {
                setMessage(
                  membersMessage,
                  error.message ||
                  'Unable to update access.',
                  true
                );
              }
            }
          );
        });
    };

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
                window.alert(
                  error.message
                );

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
        window.alert(
          error.message
        );

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
          const {
            error
          } = await supabase
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
