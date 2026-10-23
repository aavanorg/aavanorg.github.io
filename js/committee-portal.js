(() => {
  const supabase = window.AAVAN?.supabase;

  const portal = document.getElementById('committeePortal');
  const authPanel = document.getElementById('authPanel');
  const pendingPanel = document.getElementById('pendingPanel');
  const dashboard = document.getElementById('dashboard');
  const setupNotice = document.getElementById('setupNotice');

  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');

  const authModeTitle = document.getElementById('authModeTitle');
  const authModeCopy = document.getElementById('authModeCopy');

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');

  const signupName = document.getElementById('signupName');
  const signupEmail = document.getElementById('signupEmail');
  const signupPassword = document.getElementById('signupPassword');
  const signupPasswordConfirm = document.getElementById('signupPasswordConfirm');

  const loginMessage = document.getElementById('loginMessage');
  const signupMessage = document.getElementById('signupMessage');

  const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

  const pendingTitle = document.getElementById('pendingTitle');
  const pendingCopy = document.getElementById('pendingCopy');

  const logoutBtn = document.getElementById('logoutBtn');
  const pendingLogoutBtn = document.getElementById('pendingLogoutBtn');

  const headerIdentity = document.getElementById('headerIdentity');

  let currentUser = null;
  let currentProfile = null;

  const setMessage = (element, text = '', isError = false) => {
    if (!element) return;

    element.textContent = text;
    element.classList.toggle('error', Boolean(isError));
  };

  const showOnly = (target) => {
    [authPanel, pendingPanel, dashboard, setupNotice].forEach((panel) => {
      if (!panel) return;
      panel.hidden = panel !== target;
    });
  };

  const setAuthMode = (mode) => {
    const loginMode = mode === 'login';

    loginTab?.classList.toggle('active', loginMode);
    signupTab?.classList.toggle('active', !loginMode);

    loginTab?.setAttribute('aria-selected', String(loginMode));
    signupTab?.setAttribute('aria-selected', String(!loginMode));

    if (loginForm) {
      loginForm.hidden = !loginMode;
    }

    if (signupForm) {
      signupForm.hidden = loginMode;
    }

    if (authModeTitle) {
      authModeTitle.textContent = loginMode
        ? 'Sign in.'
        : 'Request access.';
    }

    if (authModeCopy) {
      authModeCopy.textContent = loginMode
        ? 'Use your approved committee email and password.'
        : 'Create your personal committee account. An Admin must approve access before you can use committee tools.';
    }

    setMessage(loginMessage);
    setMessage(signupMessage);
  };

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  const routeAuthenticatedUser = async (user) => {
    currentUser = user;

    try {
      const profile = await loadProfile(user.id);
      currentProfile = profile;

      if (headerIdentity) {
        headerIdentity.textContent =
          profile.full_name || user.email || 'Committee member';
      }

      if (profile.status === 'active') {
        showOnly(dashboard);

        logoutBtn.hidden = false;

        await window.AAVAN?.admin?.configureDashboard?.(
          user,
          profile
        );

        return;
      }

      showOnly(pendingPanel);

      logoutBtn.hidden = true;

      if (profile.status === 'disabled') {
        pendingTitle.textContent = 'Access disabled.';
        pendingCopy.textContent =
          'Your committee account has been disabled. Contact an AAVAN Admin if you believe this is a mistake.';
      } else {
        pendingTitle.textContent = 'Approval required.';
        pendingCopy.textContent =
          'Your account exists, but an AAVAN Admin has not approved committee access yet.';
      }

    } catch (error) {
      console.error('Profile loading error:', error);

      showOnly(setupNotice);

      if (headerIdentity) {
        headerIdentity.textContent = 'Profile unavailable';
      }
    }
  };

  const routeSignedOutUser = () => {
    currentUser = null;
    currentProfile = null;

    showOnly(authPanel);

    logoutBtn.hidden = true;

    if (headerIdentity) {
      headerIdentity.textContent = 'Secure committee workspace';
    }

    setAuthMode('login');
  };

  loginTab?.addEventListener('click', () => {
    setAuthMode('login');
  });

  signupTab?.addEventListener('click', () => {
    setAuthMode('signup');
  });

  loginForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    setMessage(loginMessage);

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
      setMessage(
        loginMessage,
        'Enter your email and password.',
        true
      );

      return;
    }

    try {
      const submitButton = loginForm.querySelector(
        'button[type="submit"]'
      );

      submitButton.disabled = true;
      submitButton.textContent = 'Signing in...';

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error('Unable to sign in.');
      }

      await routeAuthenticatedUser(data.user);

    } catch (error) {
      setMessage(
        loginMessage,
        error.message || 'Unable to sign in.',
        true
      );

    } finally {
      const submitButton = loginForm.querySelector(
        'button[type="submit"]'
      );

      submitButton.disabled = false;
      submitButton.textContent = 'Sign in';
    }
  });

  signupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    setMessage(signupMessage);

    const fullName = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupPasswordConfirm.value;

    if (!fullName || !email || !password || !confirmPassword) {
      setMessage(
        signupMessage,
        'Complete all required fields.',
        true
      );

      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        signupMessage,
        'Passwords do not match.',
        true
      );

      return;
    }

    if (password.length < 8) {
      setMessage(
        signupMessage,
        'Password must be at least 8 characters.',
        true
      );

      return;
    }

    try {
      const submitButton = signupForm.querySelector(
        'button[type="submit"]'
      );

      submitButton.disabled = true;
      submitButton.textContent = 'Requesting access...';

      const redirectTo = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        throw error;
      }

      signupForm.reset();

      setMessage(
        signupMessage,
        'Request received. Please verify your email. Your committee access will remain pending until an Admin approves your account.'
      );

      if (data?.session && data?.user) {
        await routeAuthenticatedUser(data.user);
      }

    } catch (error) {
      setMessage(
        signupMessage,
        error.message || 'Unable to request access.',
        true
      );

    } finally {
      const submitButton = signupForm.querySelector(
        'button[type="submit"]'
      );

      submitButton.disabled = false;
      submitButton.textContent = 'Request committee access';
    }
  });

  forgotPasswordBtn?.addEventListener('click', async () => {
    const email =
      loginEmail?.value.trim() ||
      window.prompt('Enter your committee email address');

    if (!email) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/`
        }
      );

      if (error) {
        throw error;
      }

      setMessage(
        loginMessage,
        'Password reset email sent. Check your inbox.'
      );

    } catch (error) {
      setMessage(
        loginMessage,
        error.message || 'Unable to send reset email.',
        true
      );
    }
  });

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }

    routeSignedOutUser();
  };

  logoutBtn?.addEventListener('click', signOut);
  pendingLogoutBtn?.addEventListener('click', signOut);

  const initializeAuth = async () => {
    if (!supabase) {
      showOnly(setupNotice);
      return;
    }

    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session?.user) {
        await routeAuthenticatedUser(session.user);
      } else {
        routeSignedOutUser();
      }

    } catch (error) {
      console.error('Auth initialization error:', error);
      showOnly(setupNotice);
    }
  };

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (
      event === 'SIGNED_IN' &&
      session?.user
    ) {
      await routeAuthenticatedUser(session.user);
      return;
    }

    if (event === 'SIGNED_OUT') {
      routeSignedOutUser();
    }
  });

  initializeAuth();

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.portal = {
    refreshProfile: async () => {
      if (!currentUser) return;

      await routeAuthenticatedUser(currentUser);
    }
  };
})();
