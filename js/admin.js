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

  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return '';

    const [year, month, day] = String(dateValue)
      .split('-')
      .map(Number);

    if (!year || !month || !day) return dateValue;

    const date = new Date(year, month - 1, day);

    return new Intl.DateTimeFormat('en-CA', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
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

  const getEventFinalDate = (event) =>
    event.end_date || event.event_date || '';

  const getEventDateLabel = (event) => {
    if (!event.event_date && !event.end_date) return '';

    if (!event.event_date && event.end_date) {
      return `Through ${formatDate(event.end_date)}`;
    }

    if (
      event.end_date &&
      event.end_date !== event.event_date
    ) {
      return `${formatDate(event.event_date)} – ${formatDate(event.end_date)}`;
    }

    return formatDate(event.event_date);
  };

  const buildDetails = (event) => {
    const details = [];
    const dateLabel = getEventDateLabel(event);

    if (dateLabel) {
      details.push(dateLabel);
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
    const hasTitle = Boolean(event.title?.trim());
    const hasDescription = Boolean(event.description?.trim());
    const hasDetails = details.length > 0;
    const hasLink = Boolean(event.registration_url);
    const hasCopy =
      hasTitle ||
      hasDescription ||
      hasDetails ||
      hasLink;

    const registrationMarkup = hasLink
      ? `
        <a
          class="inline-arrow"
          href="${escapeHtml(event.registration_url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Event details <span>→</span>
        </a>
      `
      : '';

    const copyMarkup = hasCopy
      ? `
        <div class="event-feature-copy">
          ${hasTitle
            ? `
              <p class="event-kicker">
                UPCOMING EVENT
              </p>

              <h3>
                ${escapeHtml(event.title)}
              </h3>
            `
            : ''}

          ${hasDescription
            ? `
              <p>
                ${escapeHtml(event.description)}
              </p>
            `
            : ''}

          ${hasDetails
            ? `
              <div class="event-details">
                ${details
                  .map(
                    (detail) =>
                      `<span>${escapeHtml(detail)}</span>`
                  )
                  .join('')}
              </div>
            `
            : ''}

          ${registrationMarkup}
        </div>
      `
      : '';

    featuredEventSlot.innerHTML = `
      <article class="event-feature reveal visible ${hasCopy ? '' : 'event-feature-image-only'}">

        <div class="event-feature-media">
          <img
            src="${escapeHtml(getEventImage(event))}"
            alt="${escapeHtml(event.title || 'AAVAN event')}"
          >
          ${event.featured
            ? `
              <span class="event-badge">
                Featured event
              </span>
            `
            : ''}
        </div>

        ${copyMarkup}

      </article>
    `;
  };

  const renderEventCards = (events) => {
    if (!dynamicEvents) return;

    dynamicEvents.innerHTML = events
      .map((event) => {
        const details = buildDetails(event);
        const hasTitle = Boolean(event.title?.trim());
        const hasDescription = Boolean(event.description?.trim());
        const hasDetails = details.length > 0;
        const hasLink = Boolean(event.registration_url);
        const hasCopy =
          hasTitle ||
          hasDescription ||
          hasDetails ||
          hasLink;

        const registrationMarkup = hasLink
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

        const copyMarkup = hasCopy
          ? `
            <div>
              ${hasDetails
                ? `
                  <span>
                    ${escapeHtml(details.join(' • '))}
                  </span>
                `
                : ''}

              ${hasTitle
                ? `
                  <h3>
                    ${escapeHtml(event.title)}
                  </h3>
                `
                : ''}

              ${hasDescription
                ? `
                  <p>
                    ${escapeHtml(event.description)}
                  </p>
                `
                : ''}

              ${registrationMarkup}
            </div>
          `
          : '';

        return `
          <article class="event-mini reveal visible ${hasCopy ? '' : 'event-mini-image-only'}">

            <img
              src="${escapeHtml(getEventImage(event))}"
              alt="${escapeHtml(event.title || 'AAVAN event')}"
            >

            ${copyMarkup}

          </article>
        `;
      })
      .join('');
  };

  const clearPublicEvents = () => {
    if (featuredEventSlot) {
      featuredEventSlot.innerHTML = '';
    }

    if (dynamicEvents) {
      dynamicEvents.innerHTML = '';
    }

    if (emptyState) {
      emptyState.hidden = false;
    }
  };

  const loadPublicEvents = async () => {
    try {
      const todayString = getLocalDateString();

      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          event_date,
          end_date,
          start_time,
          venue,
          description,
          image_url,
          registration_url,
          published,
          featured
        `)
        .eq('published', true)
        .order('featured', {
          ascending: false
        })
        .order('event_date', {
          ascending: true
        });

      if (error) throw error;

      const events = (Array.isArray(data) ? data : [])
        .filter((event) => {
          const finalDate =
            getEventFinalDate(event);

          /*
            Undated posts stay visible until a committee member
            unpublishes or deletes them. Dated events disappear
            automatically after their final date.
          */
          if (!finalDate) return true;

          return finalDate >= todayString;
        })
        .sort((a, b) => {
          if (Boolean(a.featured) !== Boolean(b.featured)) {
            return a.featured ? -1 : 1;
          }

          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;

          return String(a.event_date)
            .localeCompare(String(b.event_date));
        });

      if (!events.length) {
        clearPublicEvents();
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

      renderEventCards(remainingEvents);

    } catch (error) {
      console.error(
        'Unable to load public events:',
        error
      );

      /*
        Static HTML fallback is intentionally left in place
        only when Supabase cannot be reached at all.
      */
    }
  };

  loadPublicEvents();

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.events = {
    reload: loadPublicEvents
  };
})();
