(() => {
  const supabase = window.AAVAN?.supabase;

  if (!supabase) {
    console.warn('AAVAN events: Supabase is not available.');
    return;
  }

  const dynamicEvents = document.getElementById('dynamic-events');
  const featuredEventSlot = document.getElementById('featured-event-slot');
  const emptyState = document.getElementById('events-empty');

  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const formatDate = (dateValue) => {
    if (!dateValue) return '';

    const [year, month, day] = String(dateValue)
      .split('-')
      .map(Number);

    if (!year || !month || !day) return dateValue;

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    return new Intl.DateTimeFormat('en-CA', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';

    const [hours, minutes] = timeValue.split(':').map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return timeValue;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return new Intl.DateTimeFormat('en-CA', {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const getEventImage = (event) => {
    if (event.image_url) return event.image_url;

    return 'assets/images/bihu-community.jpg';
  };

  const buildDetails = (event) => {
    const details = [];

    if (event.event_date) {
      details.push(formatDate(event.event_date));
    }

    if (event.start_time) {
      details.push(formatTime(event.start_time));
    }

    if (event.venue) {
      details.push(event.venue);
    }

    return details;
  };

  const renderFeaturedEvent = (event) => {
    if (!featuredEventSlot || !event) return;

    const details = buildDetails(event);
    const registrationUrl = event.registration_url
      ? escapeHtml(event.registration_url)
      : '#contact';

    const registrationLabel = event.registration_url
      ? 'Event details'
      : 'Contact AAVAN';

    featuredEventSlot.innerHTML = `
      <article class="event-feature reveal visible">

        <div class="event-feature-media">
          <img
            src="${escapeHtml(getEventImage(event))}"
            alt="${escapeHtml(event.title)}"
          >
          <span class="event-badge">
            Featured event
          </span>
        </div>

        <div class="event-feature-copy">
          <p class="event-kicker">
            UPCOMING EVENT
          </p>

          <h3>
            ${escapeHtml(event.title)}
          </h3>

          <p>
            ${escapeHtml(
              event.description ||
              'Join the AAVAN community for this upcoming event.'
            )}
          </p>

          <div class="event-details">
            ${details
              .map(
                (detail) =>
                  `<span>${escapeHtml(detail)}</span>`
              )
              .join('')}
          </div>

          <a
            class="inline-arrow"
            href="${registrationUrl}"
            ${
              event.registration_url
                ? 'target="_blank" rel="noopener noreferrer"'
                : ''
            }
          >
            ${registrationLabel}
            <span>→</span>
          </a>
        </div>

      </article>
    `;
  };

  const renderEventCards = (events) => {
    if (!dynamicEvents) return;

    dynamicEvents.innerHTML = events
      .map((event) => {
        const details = buildDetails(event);

        const registrationMarkup = event.registration_url
          ? `
            <a
              class="inline-arrow"
              href="${escapeHtml(event.registration_url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Details <span>→</span>
            </a>
          `
          : '';

        return `
          <article class="event-mini reveal visible">

            <img
              src="${escapeHtml(getEventImage(event))}"
              alt="${escapeHtml(event.title)}"
            >

            <div>
              <span>
                ${escapeHtml(
                  details.join(' • ') ||
                  'AAVAN Event'
                )}
              </span>

              <h3>
                ${escapeHtml(event.title)}
              </h3>

              <p>
                ${escapeHtml(
                  event.description ||
                  'Upcoming Assam Association Vancouver community event.'
                )}
              </p>

              ${registrationMarkup}
            </div>

          </article>
        `;
      })
      .join('');
  };

  const loadPublicEvents = async () => {
    try {
      const today = new Date();
      const todayString = today
        .toISOString()
        .slice(0, 10);

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          start_time,
          venue,
          description,
          image_url,
          registration_url,
          published,
          featured
        `)
        .eq('published', true)
        .gte('event_date', todayString)
        .order('featured', {
          ascending: false
        })
        .order('event_date', {
          ascending: true
        });

      if (error) throw error;

      const events = Array.isArray(data)
        ? data
        : [];

      if (!events.length) {
        if (emptyState) {
          emptyState.hidden = false;
        }

        return;
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      const featured =
        events.find((event) => event.featured) ||
        events[0];

      renderFeaturedEvent(featured);

      const remainingEvents = events
        .filter((event) => event.id !== featured.id)
        .slice(0, 6);

      if (remainingEvents.length) {
        renderEventCards(remainingEvents);
      } else if (dynamicEvents) {
        dynamicEvents.innerHTML = '';
      }

    } catch (error) {
      console.error(
        'Unable to load public events:',
        error
      );

      /*
        We intentionally leave the static fallback content
        visible if Supabase is temporarily unavailable.
      */
    }
  };

  loadPublicEvents();

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.events = {
    reload: loadPublicEvents
  };
})();
