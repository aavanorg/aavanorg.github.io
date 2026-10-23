(() => {
  const supabase = window.AAVAN?.supabase;

  if (!supabase) {
    console.warn('AAVAN events: Supabase is not available.');
    return;
  }

  const dynamicEvents =
    document.getElementById('dynamic-events');

  const featuredEventSlot =
    document.getElementById('featured-event-slot');

  const emptyState =
    document.getElementById('events-empty');

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

    const [year, month, day] =
      String(dateValue)
        .split('-')
        .map(Number);

    if (!year || !month || !day) {
      return String(dateValue);
    }

    const date = new Date(
      year,
      month - 1,
      day
    );

    return new Intl.DateTimeFormat(
      'en-CA',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }
    ).format(date);
  };

  const formatTime = (timeValue) => {
    if (!timeValue) return '';

    const [hours, minutes] =
      String(timeValue)
        .split(':')
        .map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return String(timeValue);
    }

    const date = new Date();

    date.setHours(
      hours,
      minutes,
      0,
      0
    );

    return new Intl.DateTimeFormat(
      'en-CA',
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    ).format(date);
  };

  const getEventImage = (event) =>
    event.image_url || '';

  const getEventFinalDate = (event) =>
    event.end_date ||
    event.event_date ||
    '';

  const getEventDateLabel = (event) => {
    if (!event.event_date) {
      return '';
    }

    if (
      event.end_date &&
      event.end_date !== event.event_date
    ) {
      return (
        `${formatDate(event.event_date)} – ` +
        `${formatDate(event.end_date)}`
      );
    }

    return formatDate(
      event.event_date
    );
  };

  const buildDetails = (event) => {
    const details = [];

    const dateLabel =
      getEventDateLabel(event);

    if (dateLabel) {
      details.push(dateLabel);
    }

    if (event.start_time) {
      details.push(
        formatTime(
          event.start_time
        )
      );
    }

    if (event.venue) {
      details.push(
        event.venue
      );
    }

    return details;
  };

  const hasTextContent = (event) =>
    Boolean(
      event.title ||
      event.description ||
      event.event_date ||
      event.end_date ||
      event.start_time ||
      event.venue ||
      event.registration_url
    );

  const buildFeaturedText = (event) => {
    const details =
      buildDetails(event);

    const titleMarkup =
      event.title
        ? `
          <h3>
            ${escapeHtml(event.title)}
          </h3>
        `
        : '';

    const descriptionMarkup =
      event.description
        ? `
          <p>
            ${escapeHtml(event.description)}
          </p>
        `
        : '';

    const detailsMarkup =
      details.length
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
        : '';

    const linkMarkup =
      event.registration_url
        ? `
          <a
            class="inline-arrow"
            href="${escapeHtml(event.registration_url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Event details
            <span>→</span>
          </a>
        `
        : '';

    if (
      !titleMarkup &&
      !descriptionMarkup &&
      !detailsMarkup &&
      !linkMarkup
    ) {
      return '';
    }

    return `
      <div class="event-feature-copy">
        ${titleMarkup}
        ${descriptionMarkup}
        ${detailsMarkup}
        ${linkMarkup}
      </div>
    `;
  };

  const renderFeaturedEvent = (event) => {
    if (
      !featuredEventSlot ||
      !event
    ) {
      return;
    }

    const imageUrl =
      getEventImage(event);

    const imageMarkup =
      imageUrl
        ? `
          <div class="event-feature-media">
            <img
              src="${escapeHtml(imageUrl)}"
              alt="${escapeHtml(
                event.title ||
                'AAVAN event'
              )}"
            >
          </div>
        `
        : '';

    const textMarkup =
      buildFeaturedText(event);

    featuredEventSlot.innerHTML = `
      <article
        class="event-feature reveal visible ${
          !textMarkup
            ? 'event-feature-image-only'
            : ''
        }"
      >
        ${imageMarkup}
        ${textMarkup}
      </article>
    `;
  };

  const renderEventCards = (events) => {
    if (!dynamicEvents) {
      return;
    }

    dynamicEvents.innerHTML =
      events
        .map((event) => {
          const imageUrl =
            getEventImage(event);

          const details =
            buildDetails(event);

          const imageMarkup =
            imageUrl
              ? `
                <img
                  src="${escapeHtml(imageUrl)}"
                  alt="${escapeHtml(
                    event.title ||
                    'AAVAN event'
                  )}"
                >
              `
              : '';

          const detailsMarkup =
            details.length
              ? `
                <span>
                  ${escapeHtml(
                    details.join(' • ')
                  )}
                </span>
              `
              : '';

          const titleMarkup =
            event.title
              ? `
                <h3>
                  ${escapeHtml(event.title)}
                </h3>
              `
              : '';

          const descriptionMarkup =
            event.description
              ? `
                <p>
                  ${escapeHtml(event.description)}
                </p>
              `
              : '';

          const registrationMarkup =
            event.registration_url
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

          const textMarkup =
            detailsMarkup ||
            titleMarkup ||
            descriptionMarkup ||
            registrationMarkup
              ? `
                <div>
                  ${detailsMarkup}
                  ${titleMarkup}
                  ${descriptionMarkup}
                  ${registrationMarkup}
                </div>
              `
              : '';

          return `
            <article
              class="event-mini reveal visible ${
                !textMarkup
                  ? 'event-mini-image-only'
                  : ''
              }"
            >
              ${imageMarkup}
              ${textMarkup}
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
      const todayString =
        getLocalDateString();

      const {
        data,
        error
      } = await supabase
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
          featured,
          created_at
        `)
        .eq(
          'published',
          true
        );

      if (error) {
        throw error;
      }

      const events =
        (Array.isArray(data)
          ? data
          : [])
          .filter((event) => {
            const finalDate =
              getEventFinalDate(
                event
              );

            /*
              No date:
              keep visible until manually unpublished/deleted.

              Date present:
              keep visible through the final date,
              then hide the next day.
            */
            if (!finalDate) {
              return true;
            }

            return (
              finalDate >=
              todayString
            );
          })
          .filter((event) =>
            Boolean(
              event.image_url ||
              hasTextContent(event)
            )
          )
          .sort((a, b) => {
            if (
              Boolean(a.featured) !==
              Boolean(b.featured)
            ) {
              return a.featured
                ? -1
                : 1;
            }

            if (
              a.event_date &&
              b.event_date
            ) {
              return String(
                a.event_date
              ).localeCompare(
                String(
                  b.event_date
                )
              );
            }

            if (
              a.event_date &&
              !b.event_date
            ) {
              return -1;
            }

            if (
              !a.event_date &&
              b.event_date
            ) {
              return 1;
            }

            return String(
              b.created_at || ''
            ).localeCompare(
              String(
                a.created_at || ''
              )
            );
          });

      if (!events.length) {
        clearPublicEvents();
        return;
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      const featured =
        events.find(
          (event) =>
            event.featured
        ) ||
        events[0];

      renderFeaturedEvent(
        featured
      );

      const remainingEvents =
        events
          .filter(
            (event) =>
              event.id !==
              featured.id
          )
          .slice(0, 6);

      renderEventCards(
        remainingEvents
      );

    } catch (error) {
      console.error(
        'Unable to load public events:',
        error
      );
    }
  };

  loadPublicEvents();

  window.AAVAN =
    window.AAVAN || {};

  window.AAVAN.events = {
    reload:
      loadPublicEvents
  };
})();
