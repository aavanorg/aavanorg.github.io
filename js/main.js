(() => {
  const body = document.body;
  const year = document.getElementById('year');

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* =========================================================
     MOBILE NAVIGATION
     ========================================================= */

  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.getElementById('siteNav');

  const closeMobileNav = () => {
    if (!menuToggle || !siteNav) return;
    siteNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('click', (event) => {
      if (
        siteNav.classList.contains('open') &&
        !siteNav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMobileNav();
      }
    });
  }

  /* =========================================================
     REVEAL ANIMATIONS
     ========================================================= */

  const revealItems = [...document.querySelectorAll('.reveal')];

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -30px 0px'
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('visible'));
  }

  /* =========================================================
     MEMBERSHIP MODAL
     ========================================================= */

  const membershipModal = document.getElementById('membershipModal');
  const membershipOpenButtons = document.querySelectorAll(
    '[data-membership-open]'
  );
  const membershipCloseButtons = document.querySelectorAll(
    '[data-membership-close]'
  );

  const openMembership = () => {
    if (!membershipModal) return;

    membershipModal.hidden = false;
    membershipModal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');

    window.setTimeout(() => {
      const firstInput = membershipModal.querySelector(
        'input:not([type="hidden"]), button'
      );
      firstInput?.focus();
    }, 50);
  };

  const closeMembership = () => {
    if (!membershipModal) return;

    membershipModal.hidden = true;
    membershipModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  };

  membershipOpenButtons.forEach((button) => {
    button.addEventListener('click', openMembership);
  });

  membershipCloseButtons.forEach((button) => {
    button.addEventListener('click', closeMembership);
  });

  /* =========================================================
     COMMITTEE PORTAL
     ========================================================= */

  const committeePortal = document.getElementById('committeePortal');
  const committeeLoginButtons = document.querySelectorAll(
    '[data-committee-login]'
  );
  const portalCloseButtons = document.querySelectorAll(
    '[data-portal-close], #committeePortalClose'
  );

  const openCommitteePortal = () => {
    if (!committeePortal) return;

    committeePortal.hidden = false;
    committeePortal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');

    window.setTimeout(() => {
      const firstFocusable = committeePortal.querySelector(
        'input:not([hidden]), button:not([hidden])'
      );
      firstFocusable?.focus();
    }, 50);
  };

  const closeCommitteePortal = () => {
    if (!committeePortal) return;

    committeePortal.hidden = true;
    committeePortal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  };

  committeeLoginButtons.forEach((button) => {
    button.addEventListener('click', openCommitteePortal);
  });

  portalCloseButtons.forEach((button) => {
    button.addEventListener('click', closeCommitteePortal);
  });

  /* =========================================================
     KEYBOARD ACCESSIBILITY
     ========================================================= */

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    if (membershipModal && !membershipModal.hidden) {
      closeMembership();
      return;
    }

    if (committeePortal && !committeePortal.hidden) {
      closeCommitteePortal();
      return;
    }

    closeMobileNav();
  });

  /* =========================================================
     SMOOTH INTERNAL LINKS
     ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');

      if (!targetId || targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      const header = document.querySelector('.site-header');
      const offset = header ? header.offsetHeight + 14 : 14;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });

      closeMobileNav();
    });
  });

  /* =========================================================
     ACTIVE NAV HIGHLIGHT
     ========================================================= */

  const sectionLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')]
    .map((link) => {
      const selector = link.getAttribute('href');
      const section = document.querySelector(selector);

      if (!section) return null;

      return {
        link,
        section
      };
    })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sectionLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible.length) return;

        sectionLinks.forEach(({ link }) => {
          link.removeAttribute('aria-current');
        });

        const match = sectionLinks.find(
          ({ section }) => section === visible[0].target
        );

        if (match) {
          match.link.setAttribute('aria-current', 'page');
        }
      },
      {
        threshold: [0.25, 0.5, 0.75],
        rootMargin: '-18% 0px -55% 0px'
      }
    );

    sectionLinks.forEach(({ section }) => {
      sectionObserver.observe(section);
    });
  }

  /* =========================================================
     SAFE OUTSIDE CLICK HANDLING FOR MODALS
     ========================================================= */

  if (membershipModal) {
    membershipModal.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal-backdrop')) {
        closeMembership();
      }
    });
  }

  if (committeePortal) {
    committeePortal.addEventListener('click', (event) => {
      if (
        event.target.classList.contains('committee-portal-backdrop')
      ) {
        closeCommitteePortal();
      }
    });
  }

  /* =========================================================
     GLOBAL HELPERS
     ========================================================= */

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.ui = {
    openMembership,
    closeMembership,
    openCommitteePortal,
    closeCommitteePortal
  };
})();
