(async () => {
  const s = window.AAVAN?.supabase;

  if (!s) {
    location.href = 'committee-login.html';
    return;
  }

  const {
    data: { session }
  } = await s.auth.getSession();

  if (!session?.user) {
    location.href = 'committee-login.html';
    return;
  }

  const byId = (id) => document.getElementById(id);

  const esc = (v = '') =>
    String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const money = (v) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(v || 0));

  const decoratePlanRows = () => {
    const list = byId('planSettingsList');
    if (!list) return;

    list.querySelectorAll('.setting-row').forEach((row) => {
      if (row.dataset.enhanced === 'true') return;

      row.dataset.enhanced = 'true';

      const nameInput = row.querySelector('[data-plan-name]');
      const priceInput = row.querySelector('[data-plan-price]');
      const activeSelect = row.querySelector('[data-plan-active]');
      const saveBtn = row.querySelector('[data-plan-save]');

      if (!nameInput || !priceInput || !activeSelect || !saveBtn) {
        return;
      }

      const summary = document.createElement('div');
      summary.className = 'plan-summary';

      summary.innerHTML = `
        <div class="plan-summary-main">
          <strong class="plan-summary-name">
            ${esc(nameInput.value || 'Membership plan')}
          </strong>

          <span class="plan-summary-price">
            ${money(priceInput.value)} / year
          </span>
        </div>

        <span class="plan-summary-status ${
          activeSelect.value === 'true'
            ? 'is-active'
            : 'is-inactive'
        }">
          ${
            activeSelect.value === 'true'
              ? 'Active'
              : 'Inactive'
          }
        </span>

        <button
          type="button"
          class="plan-edit-btn"
        >
          Edit
        </button>
      `;

      const editor = document.createElement('div');
      editor.className = 'plan-editor';
      editor.hidden = true;

      nameInput.parentNode?.insertBefore(summary, nameInput);

      editor.append(
        nameInput,
        priceInput,
        activeSelect,
        saveBtn
      );

      row.appendChild(editor);

      saveBtn.textContent = 'Save changes';
      saveBtn.classList.add('plan-save-btn');

      summary
        .querySelector('.plan-edit-btn')
        ?.addEventListener('click', () => {
          editor.hidden = !editor.hidden;

          row.classList.toggle(
            'is-editing',
            !editor.hidden
          );

          summary.querySelector(
            '.plan-edit-btn'
          ).textContent = editor.hidden
            ? 'Edit'
            : 'Close';
        });

      [nameInput, priceInput, activeSelect].forEach(
        (field) => {
          field.addEventListener('input', () => {
            summary.querySelector(
              '.plan-summary-name'
            ).textContent =
              nameInput.value || 'Membership plan';

            summary.querySelector(
              '.plan-summary-price'
            ).textContent =
              `${money(priceInput.value)} / year`;

            const status = summary.querySelector(
              '.plan-summary-status'
            );

            status.textContent =
              activeSelect.value === 'true'
                ? 'Active'
                : 'Inactive';

            status.classList.toggle(
              'is-active',
              activeSelect.value === 'true'
            );

            status.classList.toggle(
              'is-inactive',
              activeSelect.value !== 'true'
            );
          });
        }
      );
    });
  };

  const installPlanObserver = () => {
    const list = byId('planSettingsList');
    if (!list) return;

    decoratePlanRows();

    const observer = new MutationObserver(() => {
      decoratePlanRows();
    });

    observer.observe(list, {
      childList: true,
      subtree: true
    });
  };

  const installAddPlanPanel = () => {
    const addBtn = byId('addPlanBtn');
    const list = byId('planSettingsList');

    if (!addBtn || !list) return;

    let panel = byId('newPlanInlinePanel');

    if (!panel) {
      panel = document.createElement('div');

      panel.id = 'newPlanInlinePanel';
      panel.className = 'new-plan-panel';
      panel.hidden = true;

      panel.innerHTML = `
        <div class="new-plan-head">
          <div>
            <span class="new-plan-kicker">
              NEW MEMBERSHIP PLAN
            </span>

            <h4>Add a plan</h4>
          </div>

          <button
            type="button"
            class="plan-cancel-btn"
            id="cancelNewPlanBtn"
          >
            Cancel
          </button>
        </div>

        <div class="new-plan-grid">
          <label>
            Plan name
            <input
              id="newPlanName"
              type="text"
              placeholder="e.g. Senior Membership"
            >
          </label>

          <label>
            Annual price (CAD)
            <input
              id="newPlanPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
            >
          </label>

          <label>
            Status
            <select id="newPlanStatus">
              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>
          </label>
        </div>

        <div class="new-plan-actions">
          <button
            type="button"
            class="btn btn-primary"
            id="saveNewPlanBtn"
          >
            Create Plan
          </button>

          <span
            id="newPlanMessage"
            class="form-message"
          ></span>
        </div>
      `;

      list.parentNode.insertBefore(
        panel,
        list
      );
    }

    addBtn.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();

        panel.hidden = false;

        byId('newPlanName')?.focus();

        panel.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      },
      true
    );

    byId('cancelNewPlanBtn')
      ?.addEventListener('click', () => {
        panel.hidden = true;

        byId('newPlanName').value = '';
        byId('newPlanPrice').value = '';
        byId('newPlanStatus').value = 'true';
        byId('newPlanMessage').textContent = '';
      });

    byId('saveNewPlanBtn')
      ?.addEventListener('click', async () => {
        const name =
          byId('newPlanName')?.value.trim();

        const price =
          Number(byId('newPlanPrice')?.value);

        const active =
          byId('newPlanStatus')?.value === 'true';

        const msg =
          byId('newPlanMessage');

        if (!name) {
          msg.textContent =
            'Enter a plan name.';

          msg.classList.add('error');
          return;
        }

        if (
          Number.isNaN(price) ||
          price < 0
        ) {
          msg.textContent =
            'Enter a valid price.';

          msg.classList.add('error');
          return;
        }

        msg.classList.remove('error');
        msg.textContent =
          'Creating plan…';

        const {
          data: existingPlans,
          error: readError
        } = await s
          .from('membership_plans')
          .select('display_order');

        if (readError) {
          msg.textContent =
            readError.message;

          msg.classList.add('error');
          return;
        }

        const maxOrder =
          Math.max(
            0,
            ...(existingPlans || []).map(
              (p) =>
                Number(
                  p.display_order || 0
                )
            )
          );

        const { error } = await s
          .from('membership_plans')
          .insert({
            name,
            price,
            billing_type: 'annual',
            audience_type: 'individual',
            active,
            visible: true,
            display_order: maxOrder + 1,
            description:
              'Annual AAVAN membership'
          });

        if (error) {
          msg.textContent =
            error.message;

          msg.classList.add('error');
          return;
        }

        panel.hidden = true;

        byId('newPlanName').value = '';
        byId('newPlanPrice').value = '';
        byId('newPlanStatus').value = 'true';

        msg.textContent = '';

        await window.AAVAN?.admin
          ?.loadMembershipPlans?.();

        window.AAVAN?.membership
          ?.reloadPlans?.();
      });
  };

  try {
    const {
      data: p,
      error
    } = await s
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (
      error ||
      p?.status !== 'active'
    ) {
      await s.auth.signOut();

      location.href =
        'committee-login.html';

      return;
    }

    await window.AAVAN?.admin
      ?.configureDashboard?.(
        session.user,
        p
      );

    window.AAVAN?.gallery
      ?.setAdminContext?.({
        user: session.user,
        profile: p
      });

    const rawName =
      (p.full_name || '').trim();

    const genericName =
      /^aavan\s+(committee\s+)?admin$/i
        .test(rawName) ||
      /^committee\s+admin$/i
        .test(rawName);

    const displayName =
      !genericName && rawName
        ? rawName
        : (
            session.user.email ||
            'Signed in account'
          );

    if (byId('dashboardUserName')) {
      byId(
        'dashboardUserName'
      ).textContent = displayName;
    }

    if (byId('dashboardAvatar')) {
      byId(
        'dashboardAvatar'
      ).textContent =
        displayName
          .split(/\s+|@/)
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x[0])
          .join('')
          .toUpperCase();
    }

    if (byId('roleSummary')) {
      byId(
        'roleSummary'
      ).textContent =
        `${
          String(
            p.role || 'member'
          ).replace(
            /^./,
            (c) => c.toUpperCase()
          )
        } • ${
          String(
            p.status || ''
          ).replace(
            /^./,
            (c) => c.toUpperCase()
          )
        }`;
    }

    installPlanObserver();
    installAddPlanPanel();

    if (byId('logoutBtn')) {
      byId('logoutBtn').onclick =
        async () => {
          await s.auth.signOut();

          location.href =
            'committee-login.html';
        };
    }

  } catch (e) {
    console.error(e);

    location.href =
      'committee-login.html';
  }
})();
