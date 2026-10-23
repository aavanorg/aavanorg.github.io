(() => {
  const supabase = window.AAVAN?.supabase;

  const modal = document.getElementById('membershipModal');
  const form = document.getElementById('membershipForm');
  const successPanel = document.getElementById('membershipSuccess');

  const steps = [...document.querySelectorAll('[data-membership-step]')];
  const progressSteps = [...document.querySelectorAll('[data-step-jump]')];

  const backButton = document.getElementById('membershipBack');
  const nextButton = document.getElementById('membershipNext');
  const submitButton = document.getElementById('membershipSubmit');

  const planOptions = document.getElementById('membershipPlanOptions');
  const planPreview = document.getElementById('membershipPlanPreview');

  const paymentPlanName = document.getElementById('paymentPlanName');
  const paymentAmount = document.getElementById('paymentAmount');
  const paymentEmail = document.getElementById('paymentEmail');

  const addFamilyMemberButton = document.getElementById('addFamilyMemberBtn');
  const familyMembersContainer = document.getElementById('familyMembers');

  const message = document.getElementById('membershipMessage');
  const referenceOutput = document.getElementById('membershipReference');

  let currentStep = 1;
  let membershipPlans = [];
  let siteSettings = {
    interac_email: 'aavanmembers@gmail.com',
    payment_instructions:
      'Send the exact membership amount by Interac e-Transfer.'
  };

  const fallbackPlans = [
    {
      id: 'family',
      name: 'Family Membership',
      price: 40,
      billing_type: 'annual',
      audience_type: 'family',
      active: true,
      visible: true,
      display_order: 1,
      description: 'Annual family membership'
    },
    {
      id: 'working-adult',
      name: 'Working Adult Membership',
      price: 25,
      billing_type: 'annual',
      audience_type: 'individual',
      active: true,
      visible: true,
      display_order: 2,
      description: 'Annual membership for working adults'
    },
    {
      id: 'student',
      name: 'Independent Student Membership',
      price: 15,
      billing_type: 'annual',
      audience_type: 'student',
      active: true,
      visible: true,
      display_order: 3,
      description: 'Annual membership for independent students'
    }
  ];

  const money = (value) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value || 0));

  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const setMessage = (text = '', isError = false) => {
    if (!message) return;

    message.textContent = text;
    message.classList.toggle('error', Boolean(isError));
  };

  const getSelectedPlanId = () => {
    const selected = form?.querySelector(
      'input[name="membership_plan"]:checked'
    );

    return selected?.value || '';
  };

  const getSelectedPlan = () =>
    membershipPlans.find(
      (plan) => String(plan.id) === String(getSelectedPlanId())
    ) || null;

  const showStep = (stepNumber) => {
    currentStep = Math.min(
      Math.max(Number(stepNumber) || 1, 1),
      steps.length
    );

    steps.forEach((step) => {
      const isActive =
        Number(step.dataset.membershipStep) === currentStep;

      step.hidden = !isActive;
      step.classList.toggle('active', isActive);
    });

    progressSteps.forEach((button, index) => {
      const step = index + 1;
      const isActive = step === currentStep;
      const isComplete = step < currentStep;

      button.classList.toggle('active', isActive);
      button.classList.toggle('complete', isComplete);
      button.setAttribute(
        'aria-current',
        isActive ? 'step' : 'false'
      );
    });

    if (backButton) {
      backButton.hidden = currentStep === 1;
    }

    if (nextButton) {
      nextButton.hidden = currentStep === steps.length;
    }

    if (submitButton) {
      submitButton.hidden = currentStep !== steps.length;
    }

    if (currentStep === 5) {
      updatePaymentSummary();
    }

    const activeStep = steps.find(
      (step) =>
        Number(step.dataset.membershipStep) === currentStep
    );

    activeStep?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  const validateCurrentStep = () => {
    const current = steps.find(
      (step) =>
        Number(step.dataset.membershipStep) === currentStep
    );

    if (!current) return true;

    const requiredFields = [
      ...current.querySelectorAll(
        'input[required], select[required], textarea[required]'
      )
    ];

    for (const field of requiredFields) {
      if (!field.reportValidity()) {
        return false;
      }
    }

    if (currentStep === 4 && !getSelectedPlanId()) {
      setMessage('Please choose a membership plan.', true);
      return false;
    }

    setMessage('');
    return true;
  };

  const addFamilyMemberRow = (values = {}) => {
    if (!familyMembersContainer) return;

    const row = document.createElement('div');
    row.className = 'family-row';

    row.innerHTML = `
      <label>
        Name
        <input
          type="text"
          name="family_member_name"
          value="${escapeHtml(values.name || '')}"
        >
      </label>

      <label>
        Relationship
        <input
          type="text"
          name="family_member_relationship"
          value="${escapeHtml(values.relationship || '')}"
          placeholder="Child, parent..."
        >
      </label>

      <button type="button" class="remove-family-member">
        Remove
      </button>
    `;

    row
      .querySelector('.remove-family-member')
      ?.addEventListener('click', () => row.remove());

    familyMembersContainer.appendChild(row);
  };

  const collectFamilyMembers = () => {
    if (!familyMembersContainer) return [];

    return [...familyMembersContainer.querySelectorAll('.family-row')]
      .map((row) => {
        const name = row.querySelector(
          '[name="family_member_name"]'
        )?.value.trim();

        const relationship = row.querySelector(
          '[name="family_member_relationship"]'
        )?.value.trim();

        return {
          name,
          relationship
        };
      })
      .filter((member) => member.name || member.relationship);
  };

  const collectInterests = () =>
    [...form.querySelectorAll('input[name="interests"]:checked')]
      .map((input) => input.value);

  const renderPlans = () => {
    if (!planOptions) return;

    const visiblePlans = membershipPlans
      .filter(
        (plan) =>
          plan.active !== false &&
          plan.visible !== false
      )
      .sort(
        (a, b) =>
          Number(a.display_order || 0) -
          Number(b.display_order || 0)
      );

    if (!visiblePlans.length) {
      planOptions.innerHTML = `
        <div class="admin-empty">
          Membership plans are currently unavailable.
        </div>
      `;
      return;
    }

    planOptions.innerHTML = visiblePlans
      .map((plan, index) => {
        const id = `membership-plan-${index}`;

        return `
          <div class="plan-option">
            <input
              id="${id}"
              type="radio"
              name="membership_plan"
              value="${escapeHtml(plan.id)}"
              ${index === 0 ? 'checked' : ''}
            >

            <label for="${id}">
              <span>
                ${escapeHtml(plan.name)}
              </span>

              <strong>
                ${money(plan.price)}
              </strong>

              <small>
                ${escapeHtml(
                  plan.description ||
                    (
                      plan.billing_type === 'annual'
                        ? 'per year'
                        : plan.billing_type || ''
                    )
                )}
              </small>
            </label>
          </div>
        `;
      })
      .join('');

    planOptions
      .querySelectorAll('input[name="membership_plan"]')
      .forEach((input) => {
        input.addEventListener('change', updatePaymentSummary);
      });

    renderPlanPreview();
    updatePaymentSummary();
  };

  const renderPlanPreview = () => {
    if (!planPreview) return;

    const plans = membershipPlans
      .filter(
        (plan) =>
          plan.active !== false &&
          plan.visible !== false
      )
      .sort(
        (a, b) =>
          Number(a.display_order || 0) -
          Number(b.display_order || 0)
      )
      .slice(0, 3);

    if (!plans.length) return;

    planPreview.innerHTML = plans
      .map(
        (plan) => `
          <article>
            <span>${escapeHtml(plan.name)}</span>
            <strong>${money(plan.price)}</strong>
            <small>
              ${
                plan.billing_type === 'annual'
                  ? 'per year'
                  : escapeHtml(plan.billing_type || '')
              }
            </small>
          </article>
        `
      )
      .join('');
  };

  const updatePaymentSummary = () => {
    const plan = getSelectedPlan();

    if (paymentPlanName) {
      paymentPlanName.textContent = plan?.name || '—';
    }

    if (paymentAmount) {
      paymentAmount.textContent = plan
        ? money(plan.price)
        : '—';
    }

    if (paymentEmail) {
      paymentEmail.textContent =
        siteSettings.interac_email ||
        'aavanmembers@gmail.com';
    }
  };

  const loadMembershipPlans = async () => {
    if (!supabase) {
      membershipPlans = fallbackPlans;
      renderPlans();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('active', true)
        .order('display_order', {
          ascending: true
        });

      if (error) throw error;

      membershipPlans =
        Array.isArray(data) && data.length
          ? data
          : fallbackPlans;

    } catch (error) {
      console.warn(
        'Unable to load membership plans. Using defaults.',
        error
      );

      membershipPlans = fallbackPlans;
    }

    renderPlans();
  };

  const loadSiteSettings = async () => {
    if (!supabase) {
      updatePaymentSummary();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'interac_email',
          'payment_instructions'
        ]);

      if (error) throw error;

      (data || []).forEach((row) => {
        siteSettings[row.setting_key] =
          row.setting_value;
      });

    } catch (error) {
      console.warn(
        'Unable to load site settings.',
        error
      );
    }

    updatePaymentSummary();
  };

  const generateApplicationReference = () => {
    const year = new Date().getFullYear();

    const random = Math.floor(
      10000 + Math.random() * 90000
    );

    return `AAV-${year}-${random}`;
  };

  const buildApplicationPayload = () => {
    const data = new FormData(form);
    const plan = getSelectedPlan();

    return {
      application_reference:
        generateApplicationReference(),

      full_name:
        String(data.get('full_name') || '').trim(),

      email:
        String(data.get('email') || '').trim(),

      phone:
        String(data.get('phone') || '').trim(),

      address:
        String(data.get('address') || '').trim(),

      city:
        String(data.get('city') || '').trim(),

      province:
        String(data.get('province') || '').trim(),

      postal_code:
        String(data.get('postal_code') || '').trim(),

      date_of_birth:
        data.get('date_of_birth') || null,

      spouse_name:
        String(data.get('spouse_name') || '').trim(),

      family_members:
        collectFamilyMembers(),

      interests:
        collectInterests(),

      notes:
        String(data.get('notes') || '').trim(),

      membership_plan_id:
        plan?.id || null,

      membership_plan_name:
        plan?.name || '',

      membership_amount:
        Number(plan?.price || 0),

      interac_email:
        siteSettings.interac_email ||
        'aavanmembers@gmail.com',

      interac_reference:
        String(
          data.get('interac_reference') || ''
        ).trim(),

      payment_status:
        'pending_payment',

      membership_status:
        'pending_payment'
    };
  };

  const submitApplication = async (payload) => {
    if (!supabase) {
      throw new Error(
        'Membership service is not connected.'
      );
    }

    const { error } = await supabase
      .from('membership_applications')
      .insert(payload);

    if (error) throw error;
  };

  const resetMembership = () => {
    form?.reset();

    currentStep = 1;
    showStep(1);

    if (familyMembersContainer) {
      familyMembersContainer.innerHTML = '';
    }

    if (successPanel) {
      successPanel.hidden = true;
    }

    if (form) {
      form.hidden = false;
    }

    setMessage('');

    renderPlans();
  };

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      if (!validateCurrentStep()) return;

      showStep(currentStep + 1);
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      showStep(currentStep - 1);
    });
  }

  progressSteps.forEach((button) => {
    button.addEventListener('click', () => {
      const targetStep = Number(button.dataset.stepJump);

      if (targetStep <= currentStep) {
        showStep(targetStep);
      }
    });
  });

  addFamilyMemberButton?.addEventListener(
    'click',
    () => addFamilyMemberRow()
  );

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    const payload = buildApplicationPayload();

    if (!payload.membership_plan_id) {
      setMessage(
        'Please select a membership plan.',
        true
      );
      return;
    }

    try {
      submitButton.disabled = true;
      submitButton.textContent =
        'Submitting application...';

      setMessage('');

      await submitApplication(payload);

      if (referenceOutput) {
        referenceOutput.textContent =
          payload.application_reference;
      }

      form.hidden = true;
      successPanel.hidden = false;

    } catch (error) {
      console.error(
        'Membership application error:',
        error
      );

      setMessage(
        error.message ||
          'Unable to submit the application. Please try again.',
        true
      );

    } finally {
      submitButton.disabled = false;
      submitButton.textContent =
        'Submit Application';
    }
  });

  document
    .querySelectorAll('[data-membership-close]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        window.setTimeout(resetMembership, 250);
      });
    });

  loadMembershipPlans();
  loadSiteSettings();

  showStep(1);

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.membership = {
    reloadPlans: async () => {
      await loadMembershipPlans();
      await loadSiteSettings();
    }
  };
})();
