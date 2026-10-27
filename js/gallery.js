(() => {
  const supabase = window.AAVAN?.supabase;

  if (!supabase) {
    console.warn('AAVAN gallery: Supabase is not available.');
    return;
  }

  let currentUser = null;
  let currentProfile = null;
  let activeAlbumId = null;

  let adminAlbums = [];
  let adminEvents = [];
  let adminVideos = [];

  let publicAlbums = [];
  let publicPhotos = [];
  let publicVideos = [];
  let activePublicMedia = 'all';

  const publicCarouselControllers = [];
  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  /* =========================================================
     DOM — PUBLIC GALLERY
     ========================================================= */

  const publicGalleryYear =
    document.getElementById('publicGalleryYear');

  const publicGalleryAlbums =
    document.getElementById('publicGalleryAlbums');

  const galleryFallback =
    document.getElementById('galleryFallback');

  const galleryYearsCount =
    document.getElementById('galleryYearsCount');

  const galleryAlbumsCount =
    document.getElementById('galleryAlbumsCount');

  const galleryPhotosCount =
    document.getElementById('galleryPhotosCount');

  const galleryVideosCount =
    document.getElementById('galleryVideosCount');

  /* =========================================================
     DOM — ADMIN GALLERY
     ========================================================= */

  const newAlbumBtn =
    document.getElementById('newAlbumBtn');

  const uploadPhotosBtn =
    document.getElementById('uploadPhotosBtn');

  const addVideoBtn =
    document.getElementById('addVideoBtn');

  const quickPhotoUploadPanel =
    document.getElementById('quickPhotoUploadPanel');

  const cancelQuickPhotoUploadBtn =
    document.getElementById('cancelQuickPhotoUploadBtn');

  const quickPhotoUploadForm =
    document.getElementById('quickPhotoUploadForm');

  const quickPhotoAlbumSelect =
    document.getElementById('quickPhotoAlbumSelect');

  const quickPhotoFiles =
    document.getElementById('quickPhotoFiles');

  const quickPhotoUploadMessage =
    document.getElementById('quickPhotoUploadMessage');

  const galleryYearFilter =
    document.getElementById('galleryYearFilter');

  const galleryAlbumSearch =
    document.getElementById('galleryAlbumSearch');

  const albumFormPanel =
    document.getElementById('albumFormPanel');

  const cancelAlbumEditBtn =
    document.getElementById('cancelAlbumEditBtn');

  const albumForm =
    document.getElementById('albumForm');

  const albumId =
    document.getElementById('albumId');

  const albumTitle =
    document.getElementById('albumTitle');

  const albumYear =
    document.getElementById('albumYear');

  const albumEventName =
    document.getElementById('albumEventName');

  const albumEventId =
    document.getElementById('albumEventId');

  const albumDescription =
    document.getElementById('albumDescription');

  const albumPublished =
    document.getElementById('albumPublished');

  const albumPhotoUpload =
    document.getElementById('albumPhotoUpload');

  const albumSelectedPhotos =
    document.getElementById('albumSelectedPhotos');

  const albumMessage =
    document.getElementById('albumMessage');

  const albumFormTitle =
    document.getElementById('albumFormTitle');

  const albumsList =
    document.getElementById('albumsList');

  const albumPhotosPanel =
    document.getElementById('albumPhotosPanel');

  const albumPhotosTitle =
    document.getElementById('albumPhotosTitle');

  const closeAlbumPhotosBtn =
    document.getElementById('closeAlbumPhotosBtn');

  const galleryPhotoUpload =
    document.getElementById('galleryPhotoUpload');

  const galleryUploadMessage =
    document.getElementById('galleryUploadMessage');

  const albumPhotosGrid =
    document.getElementById('albumPhotosGrid');

  const videoFormPanel =
    document.getElementById('videoFormPanel');

  const videoForm =
    document.getElementById('videoForm');

  const videoFormTitle =
    document.getElementById('videoFormTitle');

  const cancelVideoEditBtn =
    document.getElementById('cancelVideoEditBtn');

  const videoId =
    document.getElementById('videoId');

  const videoAlbumSelect =
    document.getElementById('videoAlbumSelect');

  const videoTitle =
    document.getElementById('videoTitle');

  const videoUrl =
    document.getElementById('videoUrl');

  const videoThumbnailUrl =
    document.getElementById('videoThumbnailUrl');

  const videoCaption =
    document.getElementById('videoCaption');

  const videoDisplayOrder =
    document.getElementById('videoDisplayOrder');

  const videoFeatured =
    document.getElementById('videoFeatured');

  const videoPublished =
    document.getElementById('videoPublished');

  const videoMessage =
    document.getElementById('videoMessage');

  const galleryVideosList =
    document.getElementById('galleryVideosList');

  const galleryAlbumCount =
    document.getElementById('galleryAlbumCount');

  const galleryPhotoCount =
    document.getElementById('galleryPhotoCount');

  const galleryVideoCount =
    document.getElementById('galleryVideoCount');

  const galleryAlbumLibraryCount =
    document.getElementById('galleryAlbumLibraryCount');

  const galleryVideoLibraryCount =
    document.getElementById('galleryVideoLibraryCount');

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

  const canEdit = () =>
    ['admin', 'editor'].includes(currentProfile?.role) &&
    currentProfile?.status === 'active';

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

  const currentYear =
    new Date().getFullYear();

  const getYouTubeId = (url = '') => {
    const value =
      String(url).trim();

    if (!value) return '';

    try {
      const parsed =
        new URL(value);

      if (
        parsed.hostname === 'youtu.be' ||
        parsed.hostname === 'www.youtu.be'
      ) {
        return parsed.pathname
          .replace('/', '')
          .split('/')[0];
      }

      if (
        parsed.hostname.includes(
          'youtube.com'
        )
      ) {
        if (
          parsed.pathname === '/watch'
        ) {
          return (
            parsed.searchParams.get('v') ||
            ''
          );
        }

        const parts =
          parsed.pathname
            .split('/')
            .filter(Boolean);

        if (
          ['embed', 'shorts', 'live']
            .includes(parts[0])
        ) {
          return parts[1] || '';
        }
      }

    } catch (error) {
      return '';
    }

    return '';
  };

  const getYouTubeThumbnail = (
    url = ''
  ) => {
    const id =
      getYouTubeId(url);

    return id
      ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      : '';
  };

  const getYouTubeEmbed = (
    url = ''
  ) => {
    const id =
      getYouTubeId(url);

    return id
      ? `https://www.youtube.com/embed/${id}`
      : '';
  };

  const getCoverImage = (album) => {
    if (album.cover_image_url) {
      return album.cover_image_url;
    }

    const albumPhotos =
      publicPhotos.filter(
        (photo) =>
          String(photo.album_id) ===
          String(album.id)
      );

    const featuredPhoto =
      albumPhotos.find(
        (photo) => photo.featured
      ) ||
      albumPhotos[0];

    if (featuredPhoto?.image_url) {
      return featuredPhoto.image_url;
    }

    const albumVideos =
      publicVideos.filter(
        (video) =>
          String(video.album_id) ===
          String(album.id)
      );

    const featuredVideo =
      albumVideos.find(
        (video) => video.featured
      ) ||
      albumVideos[0];

    if (featuredVideo) {
      return (
        featuredVideo.thumbnail_url ||
        getYouTubeThumbnail(
          featuredVideo.video_url
        ) ||
        'assets/images/bihu-community.jpg'
      );
    }

    return 'assets/images/bihu-community.jpg';
  };

  const refreshYearSelect = (
    select,
    albums,
    firstLabel = 'All years'
  ) => {
    if (!select) return;

    const selected =
      select.value || 'all';

    const years = [
      ...new Set(
        albums
          .map(
            (album) =>
              Number(album.album_year)
          )
          .filter(Boolean)
      )
    ].sort((a, b) => b - a);

    select.innerHTML = `
      <option value="all">
        ${escapeHtml(firstLabel)}
      </option>

      ${years
        .map(
          (year) => `
            <option value="${year}">
              ${year}
            </option>
          `
        )
        .join('')}
    `;

    if (
      selected === 'all' ||
      years.includes(
        Number(selected)
      )
    ) {
      select.value = selected;
    }
  };

  const getAlbumById = (
    id,
    albums = adminAlbums
  ) =>
    albums.find(
      (album) =>
        String(album.id) ===
        String(id)
    );

  const closeAdminEditors = (
    except = ''
  ) => {
    if (
      quickPhotoUploadPanel &&
      except !== 'photos'
    ) {
      quickPhotoUploadPanel.hidden = true;
    }

    if (
      albumFormPanel &&
      except !== 'album'
    ) {
      albumFormPanel.hidden = true;
    }

    if (
      videoFormPanel &&
      except !== 'video'
    ) {
      videoFormPanel.hidden = true;
    }
  };

  /* =========================================================
     ADMIN COUNTERS
     ========================================================= */

  const loadAdminCounts = async () => {
    if (
      !galleryAlbumCount &&
      !galleryPhotoCount &&
      !galleryVideoCount
    ) {
      return;
    }

    try {
      const [
        albumsResult,
        photosResult,
        videosResult
      ] = await Promise.all([
        supabase
          .from('gallery_albums')
          .select(
            'id',
            {
              count: 'exact',
              head: true
            }
          )
          .eq(
            'published',
            true
          ),

        supabase
          .from('gallery_photos')
          .select(
            'id',
            {
              count: 'exact',
              head: true
            }
          ),

        supabase
          .from('gallery_videos')
          .select(
            'id',
            {
              count: 'exact',
              head: true
            }
          )
      ]);

      if (galleryAlbumCount) {
        galleryAlbumCount.textContent =
          albumsResult.count ?? 0;
      }

      if (galleryPhotoCount) {
        galleryPhotoCount.textContent =
          photosResult.count ?? 0;
      }

      if (galleryVideoCount) {
        galleryVideoCount.textContent =
          videosResult.count ?? 0;
      }

    } catch (error) {
      console.error(
        'Gallery count error:',
        error
      );
    }
  };

  /* =========================================================
     PUBLIC ALBUM VIEWER
     ========================================================= */

  const createPublicAlbumModal =
    () => {

      let modal =
        document.getElementById(
          'publicGalleryModal'
        );

      if (modal) return modal;

      modal =
        document.createElement('div');

      modal.id =
        'publicGalleryModal';

      modal.className =
        'gallery-viewer';

      modal.hidden = true;

      modal.innerHTML = `
        <div
          class="gallery-viewer-backdrop"
          data-gallery-viewer-close
        ></div>

        <section
          class="gallery-viewer-shell"
          role="dialog"
          aria-modal="true"
          aria-labelledby="galleryViewerTitle"
        >

          <header
            class="gallery-viewer-header"
          >

            <div>
              <span
                id="galleryViewerMeta"
              ></span>

              <h2
                id="galleryViewerTitle"
              >
                Gallery
              </h2>
            </div>

            <button
              type="button"
              data-gallery-viewer-close
              aria-label="Close gallery"
            >
              ×
            </button>

          </header>

          <div
            id="galleryViewerContent"
            class="gallery-viewer-grid"
          ></div>

        </section>
      `;

      document.body.appendChild(
        modal
      );

      const closeModal = () => {
        modal.hidden = true;

        document.body.style
          .overflow = '';
      };

      modal
        .querySelectorAll(
          '[data-gallery-viewer-close]'
        )
        .forEach((button) => {
          button.addEventListener(
            'click',
            closeModal
          );
        });

      document.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key === 'Escape' &&
            !modal.hidden
          ) {
            closeModal();
          }
        }
      );

      return modal;
    };

  const openPublicAlbum =
    async (album) => {

      const modal =
        createPublicAlbumModal();

      const title =
        modal.querySelector(
          '#galleryViewerTitle'
        );

      const meta =
        modal.querySelector(
          '#galleryViewerMeta'
        );

      const content =
        modal.querySelector(
          '#galleryViewerContent'
        );

      if (title) {
        title.textContent =
          album.title || 'Gallery';
      }

      if (meta) {
        meta.textContent =
          [
            album.event_name,
            album.album_year
          ]
            .filter(Boolean)
            .join(' • ');
      }

      if (content) {
        content.innerHTML =
          '<div class="gallery-viewer-loading">Loading memories…</div>';
      }

      modal.hidden = false;

      document.body.style
        .overflow = 'hidden';

      const [
        photoResult,
        videoResult
      ] = await Promise.all([
        supabase
          .from('gallery_photos')
          .select('*')
          .eq(
            'album_id',
            album.id
          )
          .order(
            'featured',
            {
              ascending: false
            }
          )
          .order(
            'display_order',
            {
              ascending: true
            }
          )
          .order(
            'created_at',
            {
              ascending: true
            }
          ),

        supabase
          .from('gallery_videos')
          .select('*')
          .eq(
            'album_id',
            album.id
          )
          .eq(
            'published',
            true
          )
          .order(
            'featured',
            {
              ascending: false
            }
          )
          .order(
            'display_order',
            {
              ascending: true
            }
          )
          .order(
            'created_at',
            {
              ascending: true
            }
          )
      ]);

      if (photoResult.error) {
        console.error(
          'Album photo viewer error:',
          photoResult.error
        );
      }

      if (videoResult.error) {
        console.error(
          'Album video viewer error:',
          videoResult.error
        );
      }

      const photos =
        Array.isArray(
          photoResult.data
        )
          ? photoResult.data
          : [];

      const videos =
        Array.isArray(
          videoResult.data
        )
          ? videoResult.data
          : [];

      if (
        !photos.length &&
        !videos.length
      ) {
        content.innerHTML = `
          <div class="gallery-viewer-empty">

            <strong>
              More memories are coming.
            </strong>

            <span>
              This album does not have
              published photos or videos yet.
            </span>

          </div>
        `;

        return;
      }

      const photoMarkup =
        photos.map(
          (photo) => `
            <figure
              class="gallery-viewer-photo"
            >

              <img
                src="${escapeHtml(
                  photo.image_url
                )}"
                alt="${escapeHtml(
                  photo.alt_text ||
                  photo.caption ||
                  album.title
                )}"
                loading="lazy"
              >

              ${
                photo.caption
                  ? `
                    <figcaption>
                      ${escapeHtml(
                        photo.caption
                      )}
                    </figcaption>
                  `
                  : ''
              }

            </figure>
          `
        )
        .join('');

      const videoMarkup =
        videos.map((video) => {

          const embed =
            getYouTubeEmbed(
              video.video_url
            );

          if (!embed) return '';

          return `
            <article
              class="gallery-video-item"
            >

              <div
                class="gallery-video-frame"
              >

                <iframe
                  src="${escapeHtml(embed)}"
                  title="${escapeHtml(
                    video.title ||
                    'AAVAN video'
                  )}"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>

              </div>

              <div
                class="gallery-video-copy"
              >

                ${
                  video.title
                    ? `
                      <strong>
                        ${escapeHtml(
                          video.title
                        )}
                      </strong>
                    `
                    : ''
                }

                ${
                  video.caption
                    ? `
                      <p>
                        ${escapeHtml(
                          video.caption
                        )}
                      </p>
                    `
                    : ''
                }

              </div>

            </article>
          `;
        })
        .join('');

      content.innerHTML =
        photoMarkup +
        videoMarkup;
    };

  /* =========================================================
     PUBLIC CAROUSEL
     ========================================================= */

  const destroyPublicCarousels =
    () => {

      publicCarouselControllers
        .splice(0)
        .forEach(
          (controller) => {
            try {
              controller.destroy?.();

            } catch (error) {
              console.warn(
                'Gallery carousel cleanup warning:',
                error
              );
            }
          }
        );
    };

  const setupCarousel = (
    root
  ) => {

    const viewport =
      root.querySelector(
        '[data-carousel-viewport]'
      );

    const cards =
      Array.from(
        root.querySelectorAll(
          '.gallery-album-card'
        )
      );

    const prevButton =
      root.querySelector(
        '[data-carousel-prev]'
      );

    const nextButton =
      root.querySelector(
        '[data-carousel-next]'
      );

    const status =
      root.querySelector(
        '[data-carousel-status]'
      );

    if (
      !viewport ||
      !cards.length
    ) {
      return null;
    }

    let activeIndex = 0;
    let timer = null;
    let isPointerInside = false;
    let isFocusedInside = false;
    let touchStartX = null;

    const setCardClasses =
      () => {

        cards.forEach(
          (card, index) => {

            const count =
              cards.length;

            const previous =
              (
                activeIndex -
                1 +
                count
              ) % count;

            const next =
              (
                activeIndex +
                1
              ) % count;

            card.classList.toggle(
              'is-active',
              index === activeIndex
            );

            card.classList.toggle(
              'is-prev',
              count > 1 &&
              index === previous
            );

            card.classList.toggle(
              'is-next',
              count > 1 &&
              index === next
            );

            card.setAttribute(
              'aria-current',
              index === activeIndex
                ? 'true'
                : 'false'
            );

            card.tabIndex =
              index === activeIndex
                ? 0
                : -1;
          }
        );

        if (status) {
          status.textContent =
            `${activeIndex + 1} / ${cards.length}`;
        }
      };

    const centerActiveCard = (
      behavior = 'smooth'
    ) => {

      const card =
        cards[activeIndex];

      if (!card) return;

      const left =
        card.offsetLeft -
        (
          (
            viewport.clientWidth -
            card.offsetWidth
          ) / 2
        );

      viewport.scrollTo({
        left:
          Math.max(
            0,
            left
          ),

        behavior:
          reduceMotion
            ? 'auto'
            : behavior
      });
    };

    const goTo = (
      nextIndex,
      behavior = 'smooth'
    ) => {

      if (!cards.length) {
        return;
      }

      activeIndex =
        (
          nextIndex +
          cards.length
        ) %
        cards.length;

      setCardClasses();

      centerActiveCard(
        behavior
      );
    };

    const stopAutoplay = () => {
      if (timer) {
        window.clearInterval(
          timer
        );

        timer = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();

      if (
        reduceMotion ||
        cards.length < 2 ||
        isPointerInside ||
        isFocusedInside
      ) {
        return;
      }

      timer =
        window.setInterval(
          () => {
            goTo(
              activeIndex + 1
            );
          },
          4500
        );
    };

    const previous = () => {
      goTo(
        activeIndex - 1
      );

      startAutoplay();
    };

    const next = () => {
      goTo(
        activeIndex + 1
      );

      startAutoplay();
    };

    prevButton?.addEventListener(
      'click',
      previous
    );

    nextButton?.addEventListener(
      'click',
      next
    );

    cards.forEach(
      (card, index) => {

        card.addEventListener(
          'mouseenter',
          () => {
            if (
              index !== activeIndex
            ) {
              goTo(index);
            }
          }
        );

        card.addEventListener(
          'focus',
          () => {
            if (
              index !== activeIndex
            ) {
              goTo(index);
            }
          }
        );
      }
    );

    root.addEventListener(
      'mouseenter',
      () => {
        isPointerInside = true;

        stopAutoplay();
      }
    );

    root.addEventListener(
      'mouseleave',
      () => {
        isPointerInside = false;

        startAutoplay();
      }
    );

    root.addEventListener(
      'focusin',
      () => {
        isFocusedInside = true;

        stopAutoplay();
      }
    );

    root.addEventListener(
      'focusout',
      () => {

        window.setTimeout(
          () => {
            isFocusedInside =
              root.contains(
                document.activeElement
              );

            if (
              !isFocusedInside
            ) {
              startAutoplay();
            }
          },
          0
        );
      }
    );

    viewport.addEventListener(
      'touchstart',
      (event) => {

        touchStartX =
          event.touches?.[0]
            ?.clientX ??
          null;

        stopAutoplay();
      },
      {
        passive: true
      }
    );

    viewport.addEventListener(
      'touchend',
      (event) => {

        const touchEndX =
          event.changedTouches?.[0]
            ?.clientX ??
          null;

        if (
          touchStartX !== null &&
          touchEndX !== null
        ) {

          const delta =
            touchEndX -
            touchStartX;

          if (
            Math.abs(delta) >
            45
          ) {
            if (delta < 0) {
              next();
            } else {
              previous();
            }
          }
        }

        touchStartX = null;

        startAutoplay();
      },
      {
        passive: true
      }
    );

    const handleResize =
      () =>
        centerActiveCard(
          'auto'
        );

    window.addEventListener(
      'resize',
      handleResize
    );

    setCardClasses();

    window.requestAnimationFrame(
      () =>
        centerActiveCard(
          'auto'
        )
    );

    startAutoplay();

    if (
      cards.length < 2
    ) {
      root.classList.add(
        'is-single'
      );
    }

    return {
      destroy() {
        stopAutoplay();

        window.removeEventListener(
          'resize',
          handleResize
        );
      }
    };
  };

  const initializePublicCarousels =
    () => {

      destroyPublicCarousels();

      publicGalleryAlbums
        ?.querySelectorAll(
          '[data-gallery-carousel]'
        )
        .forEach(
          (carousel) => {

            const controller =
              setupCarousel(
                carousel
              );

            if (controller) {
              publicCarouselControllers
                .push(
                  controller
                );
            }
          }
        );
    };

  /* =========================================================
     PUBLIC ARCHIVE RENDER
     ========================================================= */

  const renderPublicAlbums =
    () => {

      if (
        !publicGalleryAlbums
      ) {
        return;
      }

      const year =
        publicGalleryYear
          ?.value ||
        'all';

      const filtered =
        publicAlbums.filter(
          (album) => {

            const matchesYear =
              year === 'all' ||
              String(
                album.album_year
              ) ===
              String(year);

            const photoCount =
              publicPhotos.filter(
                (photo) =>
                  String(
                    photo.album_id
                  ) ===
                  String(
                    album.id
                  )
              ).length;

            const videoCount =
              publicVideos.filter(
                (video) =>
                  String(
                    video.album_id
                  ) ===
                  String(
                    album.id
                  )
              ).length;

            let matchesMedia =
              true;

            if (
              activePublicMedia ===
              'photos'
            ) {
              matchesMedia =
                photoCount > 0;
            }

            if (
              activePublicMedia ===
              'videos'
            ) {
              matchesMedia =
                videoCount > 0;
            }

            return (
              matchesYear &&
              matchesMedia
            );
          }
        );

      destroyPublicCarousels();

      if (!filtered.length) {
        publicGalleryAlbums.innerHTML =
          '';

        if (galleryFallback) {
          galleryFallback.hidden =
            false;
        }

        return;
      }

      if (galleryFallback) {
        galleryFallback.hidden =
          true;
      }

      const grouped = {};

      filtered.forEach(
        (album) => {

          const yearKey =
            String(
              album.album_year ||
              'Archive'
            );

          grouped[yearKey] =
            grouped[yearKey] ||
            [];

          grouped[yearKey]
            .push(album);
        }
      );

      publicGalleryAlbums.innerHTML =
        Object.entries(grouped)
          .sort(
            ([a], [b]) =>
              Number(b) -
              Number(a)
          )
          .map(
            (
              [
                yearLabel,
                albums
              ]
            ) => {

              const cardsMarkup =
                albums
                  .map(
                    (album) => {

                      const photoCount =
                        publicPhotos
                          .filter(
                            (photo) =>
                              String(
                                photo.album_id
                              ) ===
                              String(
                                album.id
                              )
                          )
                          .length;

                      const videoCount =
                        publicVideos
                          .filter(
                            (video) =>
                              String(
                                video.album_id
                              ) ===
                              String(
                                album.id
                              )
                          )
                          .length;

                      return `
                        <button
                          class="gallery-album-card"
                          type="button"
                          data-public-album="${album.id}"
                          aria-label="Open ${escapeHtml(
                            album.title
                          )}"
                        >

                          <span
                            class="gallery-album-media"
                          >

                            <img
                              src="${escapeHtml(
                                getCoverImage(
                                  album
                                )
                              )}"
                              alt="${escapeHtml(
                                album.title
                              )}"
                              loading="lazy"
                            >

                            ${
                              videoCount
                                ? `
                                  <span
                                    class="gallery-album-video-badge"
                                    aria-hidden="true"
                                  >
                                    ▶
                                  </span>
                                `
                                : ''
                            }

                          </span>

                          <span
                            class="gallery-album-card-copy"
                          >

                            <small>
                              ${escapeHtml(
                                album.event_name ||
                                album.album_year ||
                                'AAVAN'
                              )}
                            </small>

                            <strong>
                              ${escapeHtml(
                                album.title
                              )}
                            </strong>

                            <span>
                              ${photoCount}
                              photo${
                                photoCount === 1
                                  ? ''
                                  : 's'
                              }

                              ${
                                videoCount
                                  ? ` • ${videoCount} video${
                                      videoCount === 1
                                        ? ''
                                        : 's'
                                    }`
                                  : ''
                              }
                            </span>

                          </span>

                        </button>
                      `;
                    }
                  )
                  .join('');

              return `
                <section
                  class="gallery-year-group"
                >

                  <div
                    class="gallery-year-heading"
                  >

                    <h3>
                      ${escapeHtml(
                        yearLabel
                      )}
                    </h3>

                    <span>
                      ${albums.length}
                      album${
                        albums.length === 1
                          ? ''
                          : 's'
                      }
                    </span>

                  </div>

                  <div
                    class="gallery-carousel"
                    data-gallery-carousel
                  >

                    <button
                      class="gallery-carousel-arrow gallery-carousel-arrow--prev"
                      type="button"
                      data-carousel-prev
                      aria-label="Previous album"
                    >
                      ←
                    </button>

                    <div
                      class="gallery-carousel-viewport"
                      data-carousel-viewport
                    >

                      <div
                        class="gallery-carousel-track"
                      >
                        ${cardsMarkup}
                      </div>

                    </div>

                    <button
                      class="gallery-carousel-arrow gallery-carousel-arrow--next"
                      type="button"
                      data-carousel-next
                      aria-label="Next album"
                    >
                      →
                    </button>

                    <div
                      class="gallery-carousel-meta"
                      aria-hidden="true"
                    >
                      <span
                        data-carousel-status
                      >
                        1 / ${albums.length}
                      </span>
                    </div>

                  </div>

                </section>
              `;
            }
          )
          .join('');

      publicGalleryAlbums
        .querySelectorAll(
          '[data-public-album]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              () => {

                const album =
                  publicAlbums.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .publicAlbum
                      )
                  );

                if (album) {
                  openPublicAlbum(
                    album
                  );
                }
              }
            );
          }
        );

      initializePublicCarousels();
    };

  const loadPublicGallery =
    async () => {

      if (
        !publicGalleryAlbums
      ) {
        return;
      }

      try {

        const [
          albumResult,
          photoResult,
          videoResult
        ] = await Promise.all([

          supabase
            .from('gallery_albums')
            .select('*')
            .eq(
              'published',
              true
            )
            .order(
              'album_year',
              {
                ascending: false
              }
            )
            .order(
              'display_order',
              {
                ascending: true
              }
            )
            .order(
              'created_at',
              {
                ascending: false
              }
            ),

          supabase
            .from('gallery_photos')
            .select(
              'id,album_id,image_url,alt_text,caption,featured,display_order,created_at'
            ),

          supabase
            .from('gallery_videos')
            .select(
              'id,album_id,title,video_url,thumbnail_url,caption,featured,display_order,published,created_at'
            )
            .eq(
              'published',
              true
            )
        ]);

        if (
          albumResult.error
        ) {
          throw albumResult.error;
        }

        if (
          photoResult.error
        ) {
          throw photoResult.error;
        }

        if (
          videoResult.error
        ) {
          throw videoResult.error;
        }

        publicAlbums =
          Array.isArray(
            albumResult.data
          )
            ? albumResult.data
            : [];

        publicPhotos =
          Array.isArray(
            photoResult.data
          )
            ? photoResult.data
            : [];

        publicVideos =
          Array.isArray(
            videoResult.data
          )
            ? videoResult.data
            : [];

        refreshYearSelect(
          publicGalleryYear,
          publicAlbums,
          'All years'
        );

        if (
          galleryAlbumsCount
        ) {
          galleryAlbumsCount
            .textContent =
            publicAlbums.length;
        }

        if (
          galleryPhotosCount
        ) {
          galleryPhotosCount
            .textContent =
            publicPhotos.length;
        }

        if (
          galleryVideosCount
        ) {
          galleryVideosCount
            .textContent =
            publicVideos.length;
        }

        if (
          galleryYearsCount
        ) {
          galleryYearsCount
            .textContent =
            new Set(
              publicAlbums
                .map(
                  (album) =>
                    album.album_year
                )
                .filter(Boolean)
            ).size;
        }

        renderPublicAlbums();

      } catch (error) {

        console.error(
          'Public gallery error:',
          error
        );

        if (galleryFallback) {
          galleryFallback.hidden =
            false;
        }
      }
    };

  publicGalleryYear
    ?.addEventListener(
      'change',
      renderPublicAlbums
    );

  document
    .querySelectorAll(
      '[data-gallery-media]'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            activePublicMedia =
              button.dataset
                .galleryMedia ||
              'all';

            document
              .querySelectorAll(
                '[data-gallery-media]'
              )
              .forEach(
                (item) => {
                  item.classList
                    .remove(
                      'active'
                    );
                }
              );

            button.classList.add(
              'active'
            );

            renderPublicAlbums();
          }
        );
      }
    );

  /* =========================================================
     ADMIN CONTEXT
     ========================================================= */

  const setAdminContext = ({
    user,
    profile
  } = {}) => {

    currentUser =
      user ||
      currentUser;

    currentProfile =
      profile ||
      currentProfile;

    if (newAlbumBtn) {
      newAlbumBtn.hidden =
        !canEdit();
    }

    if (uploadPhotosBtn) {
      uploadPhotosBtn.hidden =
        !canEdit();
    }

    if (addVideoBtn) {
      addVideoBtn.hidden =
        !canEdit();
    }
  };

  /* =========================================================
     ADMIN — ALBUMS
     ========================================================= */

  const resetAlbumForm = () => {
    albumForm?.reset();

    if (albumId) {
      albumId.value = '';
    }

    if (albumYear) {
      albumYear.value =
        String(currentYear);
    }

    if (albumPublished) {
      albumPublished.checked =
        false;
    }

    if (albumPhotoUpload) {
      albumPhotoUpload.value =
        '';
    }

    if (albumSelectedPhotos) {
      albumSelectedPhotos.hidden =
        true;

      albumSelectedPhotos.innerHTML =
        '';
    }

    if (albumFormTitle) {
      albumFormTitle.textContent =
        'Create album';
    }

    setMessage(
      albumMessage
    );
  };

  const loadAdminEvents =
    async () => {

      if (!albumEventId) {
        return;
      }

      const {
        data,
        error
      } = await supabase
        .from('events')
        .select(
          'id,title,event_date'
        )
        .order(
          'event_date',
          {
            ascending: false
          }
        );

      if (error) {
        console.error(
          'Gallery event list error:',
          error
        );

        return;
      }

      adminEvents =
        Array.isArray(data)
          ? data
          : [];

      const current =
        albumEventId.value ||
        '';

      albumEventId.innerHTML = `
        <option value="">
          No linked event
        </option>

        ${adminEvents
          .map(
            (event) => `
              <option
                value="${event.id}"
              >
                ${escapeHtml(
                  event.title
                )}
                ${
                  event.event_date
                    ? ` — ${escapeHtml(
                        event.event_date
                      )}`
                    : ''
                }
              </option>
            `
          )
          .join('')}
      `;

      albumEventId.value =
        current;
    };

  const populateAlbumSelect =
    (select) => {

      if (!select) return;

      const current =
        select.value ||
        '';

      select.innerHTML = `
        <option value="">
          Select an album
        </option>

        ${adminAlbums
          .map(
            (album) => `
              <option
                value="${album.id}"
              >
                ${escapeHtml(
                  album.title
                )}

                ${
                  album.album_year
                    ? ` — ${escapeHtml(
                        album.album_year
                      )}`
                    : ''
                }
              </option>
            `
          )
          .join('')}
      `;

      if (
        current &&
        adminAlbums.some(
          (album) =>
            String(
              album.id
            ) ===
            String(current)
        )
      ) {
        select.value =
          current;
      }
    };

  const populateAdminAlbumSelects =
    () => {

      populateAlbumSelect(
        quickPhotoAlbumSelect
      );

      populateAlbumSelect(
        videoAlbumSelect
      );
    };

  const renderAdminAlbums =
    () => {

      if (!albumsList) {
        return;
      }

      const year =
        galleryYearFilter
          ?.value ||
        'all';

      const search =
        galleryAlbumSearch
          ?.value
          .trim()
          .toLowerCase() ||
        '';

      const filtered =
        adminAlbums.filter(
          (album) => {

            const matchesYear =
              year === 'all' ||
              String(
                album.album_year
              ) ===
              String(year);

            const haystack =
              `${
                album.title ||
                ''
              } ${
                album.event_name ||
                ''
              }`
                .toLowerCase();

            return (
              matchesYear &&
              (
                !search ||
                haystack.includes(
                  search
                )
              )
            );
          }
        );

      if (
        galleryAlbumLibraryCount
      ) {
        galleryAlbumLibraryCount
          .textContent =
          filtered.length;
      }

      if (!filtered.length) {
        albumsList.innerHTML = `
          <div class="admin-empty">
            No gallery albums
            match this view.
          </div>
        `;

        return;
      }

      albumsList.innerHTML =
        filtered
          .map(
            (album) => `
              <article
                class="admin-row"
              >

                <div
                  class="admin-row-main"
                >

                  <strong>
                    ${escapeHtml(
                      album.title
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      album.event_name ||
                      'General gallery'
                    )}
                  </span>

                </div>

                <div
                  class="admin-row-meta"
                >

                  <span>
                    Year
                  </span>

                  <strong>
                    ${escapeHtml(
                      album.album_year
                    )}
                  </strong>

                </div>

                <div
                  class="admin-row-meta"
                >

                  <span>
                    Status
                  </span>

                  <span
                    class="status-pill ${
                      album.published
                        ? 'published'
                        : ''
                    }"
                  >
                    ${
                      album.published
                        ? 'Published'
                        : 'Draft'
                    }
                  </span>

                </div>

                <div
                  class="admin-row-actions"
                >

                  <button
                    type="button"
                    data-album-photos="${album.id}"
                  >
                    Manage Photos
                  </button>

                  ${
                    canEdit()
                      ? `
                        <button
                          type="button"
                          data-album-edit="${album.id}"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          class="danger"
                          data-album-delete="${album.id}"
                        >
                          Delete
                        </button>
                      `
                      : ''
                  }

                </div>

              </article>
            `
          )
          .join('');

      attachAlbumActions();
    };

  const loadAlbums =
    async () => {

      if (!albumsList) {
        return;
      }

      albumsList.innerHTML =
        '<div class="admin-loading">Loading albums…</div>';

      const {
        data,
        error
      } = await supabase
        .from('gallery_albums')
        .select('*')
        .order(
          'album_year',
          {
            ascending: false
          }
        )
        .order(
          'display_order',
          {
            ascending: true
          }
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );

      if (error) {
        console.error(
          'Gallery albums error:',
          error
        );

        albumsList.innerHTML = `
          <div class="admin-empty">
            Unable to load
            gallery albums.
          </div>
        `;

        return;
      }

      adminAlbums =
        Array.isArray(data)
          ? data
          : [];

      refreshYearSelect(
        galleryYearFilter,
        adminAlbums,
        'All years'
      );

      populateAdminAlbumSelects();

      renderAdminAlbums();
    };

  uploadPhotosBtn
    ?.addEventListener(
      'click',
      async () => {

        if (!canEdit()) {
          return;
        }

        closeAdminEditors(
          'photos'
        );

        setMessage(
          quickPhotoUploadMessage
        );

        quickPhotoUploadForm
          ?.reset();

        if (
          !adminAlbums.length
        ) {
          await loadAlbums();
        }

        populateAdminAlbumSelects();

        if (
          quickPhotoUploadPanel
        ) {
          quickPhotoUploadPanel
            .hidden = false;

          quickPhotoUploadPanel
            .scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }
      }
    );

  cancelQuickPhotoUploadBtn
    ?.addEventListener(
      'click',
      () => {

        quickPhotoUploadForm
          ?.reset();

        setMessage(
          quickPhotoUploadMessage
        );

        if (
          quickPhotoUploadPanel
        ) {
          quickPhotoUploadPanel
            .hidden = true;
        }
      }
    );

  newAlbumBtn
    ?.addEventListener(
      'click',
      async () => {

        if (!canEdit()) {
          return;
        }

        closeAdminEditors(
          'album'
        );

        resetAlbumForm();

        await loadAdminEvents();

        if (albumFormPanel) {
          albumFormPanel.hidden =
            false;

          albumFormPanel
            .scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }
      }
    );

  cancelAlbumEditBtn
    ?.addEventListener(
      'click',
      () => {

        resetAlbumForm();

        if (albumFormPanel) {
          albumFormPanel.hidden =
            true;
        }
      }
    );

  albumEventId
    ?.addEventListener(
      'change',
      () => {

        const selected =
          adminEvents.find(
            (event) =>
              String(event.id) ===
              String(
                albumEventId.value
              )
          );

        if (!selected) {
          return;
        }

        if (
          albumEventName &&
          !albumEventName.value
            .trim()
        ) {
          albumEventName.value =
            selected.title ||
            '';
        }

        if (
          albumYear &&
          selected.event_date
        ) {
          albumYear.value =
            String(
              selected.event_date
            ).slice(0, 4);
        }
      }
    );

  albumPhotoUpload
    ?.addEventListener(
      'change',
      () => {

        if (
          !albumSelectedPhotos
        ) {
          return;
        }

        const files =
          Array.from(
            albumPhotoUpload.files ||
            []
          );

        if (!files.length) {
          albumSelectedPhotos.hidden =
            true;

          albumSelectedPhotos.innerHTML =
            '';

          return;
        }

        albumSelectedPhotos.hidden =
          false;

        albumSelectedPhotos.innerHTML = `
          <strong>
            ${files.length}
            photo${
              files.length === 1
                ? ''
                : 's'
            }
            selected
          </strong>

          <div
            class="album-selected-photos__list"
          >

            ${files
              .map(
                (
                  file,
                  index
                ) => `
                  <span>
                    ${index + 1}.
                    ${escapeHtml(
                      file.name
                    )}
                  </span>
                `
              )
              .join('')}

          </div>
        `;
      }
    );

  albumForm
    ?.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();

        if (!canEdit()) {
          return;
        }

        const title =
          albumTitle.value
            .trim();

        const year =
          Number(
            albumYear.value
          );

        const selectedFiles =
          Array.from(
            albumPhotoUpload
              ?.files ||
            []
          );

        if (
          !title ||
          !year
        ) {
          setMessage(
            albumMessage,
            'Album title and year are required.',
            true
          );

          return;
        }

        try {

          setMessage(
            albumMessage,
            selectedFiles.length
              ? `Saving album and uploading ${selectedFiles.length} photo${
                  selectedFiles.length === 1
                    ? ''
                    : 's'
                }…`
              : 'Saving album…'
          );

          const payload = {
            title,

            album_year:
              year,

            event_name:
              albumEventName
                .value
                .trim() ||
              null,

            event_id:
              albumEventId.value ||
              null,

            description:
              albumDescription
                .value
                .trim() ||
              null,

            published:
              albumPublished
                .checked,

            updated_by:
              currentUser.id
          };

          let savedAlbumId =
            albumId.value ||
            null;

          if (savedAlbumId) {

            const {
              error:
                updateError
            } = await supabase
              .from(
                'gallery_albums'
              )
              .update(payload)
              .eq(
                'id',
                savedAlbumId
              );

            if (updateError) {
              throw updateError;
            }

          } else {

            payload.created_by =
              currentUser.id;

            const {
              data:
                insertedAlbum,
              error:
                insertError
            } = await supabase
              .from(
                'gallery_albums'
              )
              .insert(payload)
              .select('id')
              .single();

            if (insertError) {
              throw insertError;
            }

            savedAlbumId =
              insertedAlbum?.id;

            if (!savedAlbumId) {
              throw new Error(
                'Album was created but its ID could not be read.'
              );
            }
          }

          if (
            selectedFiles.length
          ) {
            await uploadFilesToAlbum(
              savedAlbumId,
              selectedFiles,
              (message) => {
                setMessage(
                  albumMessage,
                  message
                );
              }
            );
          }

          resetAlbumForm();

          if (albumFormPanel) {
            albumFormPanel.hidden =
              true;
          }

          await Promise.all([
            loadAlbums(),
            loadVideos(),
            loadAdminCounts(),
            loadPublicGallery()
          ]);

        } catch (error) {

          console.error(
            'Save album error:',
            error
          );

          setMessage(
            albumMessage,
            error.message ||
            'Unable to save album.',
            true
          );
        }
      }
    );

  galleryYearFilter
    ?.addEventListener(
      'change',
      renderAdminAlbums
    );

  galleryAlbumSearch
    ?.addEventListener(
      'input',
      renderAdminAlbums
    );

  const attachAlbumActions =
    () => {

      document
        .querySelectorAll(
          '[data-album-edit]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                const album =
                  getAlbumById(
                    button.dataset
                      .albumEdit
                  );

                if (!album) {
                  return;
                }

                closeAdminEditors(
                  'album'
                );

                await loadAdminEvents();

                albumId.value =
                  album.id ||
                  '';

                albumTitle.value =
                  album.title ||
                  '';

                albumYear.value =
                  album.album_year ||
                  currentYear;

                albumEventName.value =
                  album.event_name ||
                  '';

                albumEventId.value =
                  album.event_id ||
                  '';

                albumDescription.value =
                  album.description ||
                  '';

                albumPublished.checked =
                  Boolean(
                    album.published
                  );

                if (
                  albumFormTitle
                ) {
                  albumFormTitle
                    .textContent =
                    'Edit album';
                }

                if (
                  albumFormPanel
                ) {
                  albumFormPanel.hidden =
                    false;

                  albumFormPanel
                    .scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                }
              }
            );
          }
        );

      document
        .querySelectorAll(
          '[data-album-delete]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                if (!canEdit()) {
                  return;
                }

                const confirmed =
                  window.confirm(
                    'Delete this album and all of its photos and videos?'
                  );

                if (!confirmed) {
                  return;
                }

                const {
                  error
                } = await supabase
                  .from(
                    'gallery_albums'
                  )
                  .delete()
                  .eq(
                    'id',
                    button.dataset
                      .albumDelete
                  );

                if (error) {
                  window.alert(
                    error.message
                  );

                  return;
                }

                await Promise.all([
                  loadAlbums(),
                  loadVideos(),
                  loadAdminCounts(),
                  loadPublicGallery()
                ]);
              }
            );
          }
        );

      document
        .querySelectorAll(
          '[data-album-photos]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                const album =
                  getAlbumById(
                    button.dataset
                      .albumPhotos
                  );

                if (!album) {
                  return;
                }

                activeAlbumId =
                  album.id;

                if (
                  albumPhotosTitle
                ) {
                  albumPhotosTitle
                    .textContent =
                    album.title;
                }

                if (
                  albumPhotosPanel
                ) {
                  albumPhotosPanel.hidden =
                    false;

                  albumPhotosPanel
                    .scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                }

                await loadAlbumPhotos();
              }
            );
          }
        );
    };

  /* =========================================================
     ADMIN — PHOTO UPLOADS
     ========================================================= */

  const uploadGalleryPhoto =
    async (
      file,
      albumIdValue
    ) => {

      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg';

      const filename =
        `${crypto.randomUUID()}.${extension}`;

      const path =
        `albums/${albumIdValue}/${filename}`;

      const {
        error
      } = await supabase
        .storage
        .from(
          'gallery-images'
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              '3600',

            upsert:
              false
          }
        );

      if (error) {
        throw error;
      }

      const {
        data
      } = supabase.storage
        .from(
          'gallery-images'
        )
        .getPublicUrl(path);

      return {
        publicUrl:
          data?.publicUrl ||
          null,

        storagePath:
          path
      };
    };

  const uploadFilesToAlbum =
    async (
      albumIdValue,
      files,
      onProgress = null
    ) => {

      const selectedFiles =
        Array.from(
          files ||
          []
        );

      if (
        !selectedFiles.length
      ) {
        return;
      }

      const {
        data:
          existingPhotos,
        error:
          existingPhotosError
      } = await supabase
        .from(
          'gallery_photos'
        )
        .select('id')
        .eq(
          'album_id',
          albumIdValue
        )
        .limit(1);

      if (
        existingPhotosError
      ) {
        throw existingPhotosError;
      }

      const albumHasNoPhotos =
        !existingPhotos?.length;

      for (
        let index = 0;
        index <
        selectedFiles.length;
        index += 1
      ) {

        const file =
          selectedFiles[
            index
          ];

        onProgress?.(
          `Uploading photo ${
            index + 1
          } of ${
            selectedFiles.length
          }…`
        );

        const uploaded =
          await uploadGalleryPhoto(
            file,
            albumIdValue
          );

        if (
          !uploaded.publicUrl
        ) {
          throw new Error(
            `Unable to create public URL for ${file.name}.`
          );
        }

        const isCover =
          albumHasNoPhotos &&
          index === 0;

        const {
          error:
            insertError
        } = await supabase
          .from(
            'gallery_photos'
          )
          .insert({
            album_id:
              albumIdValue,

            image_url:
              uploaded.publicUrl,

            alt_text:
              file.name
                .replace(
                  /\.[^.]+$/,
                  ''
                )
                .replaceAll(
                  '-',
                  ' '
                )
                .replaceAll(
                  '_',
                  ' '
                ),

            featured:
              isCover,

            display_order:
              index,

            uploaded_by:
              currentUser.id
          });

        if (insertError) {
          throw insertError;
        }

        if (isCover) {

          const {
            error:
              coverError
          } = await supabase
            .from(
              'gallery_albums'
            )
            .update({
              cover_image_url:
                uploaded.publicUrl,

              updated_by:
                currentUser.id
            })
            .eq(
              'id',
              albumIdValue
            );

          if (coverError) {
            throw coverError;
          }
        }
      }
    };

  quickPhotoUploadForm
    ?.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();

        if (!canEdit()) {
          return;
        }

        const targetAlbumId =
          quickPhotoAlbumSelect
            ?.value ||
          '';

        const files =
          Array.from(
            quickPhotoFiles
              ?.files ||
            []
          );

        if (!targetAlbumId) {
          setMessage(
            quickPhotoUploadMessage,
            'Please choose an album.',
            true
          );

          return;
        }

        if (!files.length) {
          setMessage(
            quickPhotoUploadMessage,
            'Please choose at least one photo.',
            true
          );

          return;
        }

        try {

          await uploadFilesToAlbum(
            targetAlbumId,
            files,
            (message) => {
              setMessage(
                quickPhotoUploadMessage,
                message
              );
            }
          );

          setMessage(
            quickPhotoUploadMessage,
            'Photos uploaded successfully.'
          );

          quickPhotoUploadForm
            ?.reset();

          await Promise.all([
            loadAlbums(),
            loadAdminCounts(),
            loadPublicGallery()
          ]);

        } catch (error) {

          console.error(
            'Quick gallery upload error:',
            error
          );

          setMessage(
            quickPhotoUploadMessage,
            error.message ||
            'Unable to upload photos.',
            true
          );
        }
      }
    );

  const loadAlbumPhotos =
    async () => {

      if (
        !activeAlbumId ||
        !albumPhotosGrid
      ) {
        return;
      }

      albumPhotosGrid.innerHTML =
        '<div class="admin-loading">Loading photos…</div>';

      const {
        data,
        error
      } = await supabase
        .from(
          'gallery_photos'
        )
        .select('*')
        .eq(
          'album_id',
          activeAlbumId
        )
        .order(
          'featured',
          {
            ascending: false
          }
        )
        .order(
          'display_order',
          {
            ascending: true
          }
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );

      if (error) {
        albumPhotosGrid.innerHTML = `
          <div class="admin-empty">
            Unable to load
            album photos.
          </div>
        `;

        return;
      }

      const photos =
        Array.isArray(data)
          ? data
          : [];

      if (!photos.length) {
        albumPhotosGrid.innerHTML = `
          <div class="admin-empty">
            No photos uploaded
            to this album yet.
          </div>
        `;

        return;
      }

      albumPhotosGrid.innerHTML =
        photos
          .map(
            (photo) => `
              <article
                class="admin-gallery-photo"
              >

                <img
                  src="${escapeHtml(
                    photo.image_url
                  )}"
                  alt="${escapeHtml(
                    photo.alt_text ||
                    photo.caption ||
                    'Gallery photo'
                  )}"
                >

                <div>

                  <span
                    class="status-pill ${
                      photo.featured
                        ? 'published'
                        : ''
                    }"
                  >
                    ${
                      photo.featured
                        ? 'Cover'
                        : 'Photo'
                    }
                  </span>

                  <p>
                    ${escapeHtml(
                      photo.caption ||
                      'No caption'
                    )}
                  </p>

                  ${
                    canEdit()
                      ? `
                        <div
                          class="admin-row-actions"
                        >

                          <button
                            type="button"
                            data-photo-caption="${photo.id}"
                          >
                            Caption
                          </button>

                          ${
                            !photo.featured
                              ? `
                                <button
                                  type="button"
                                  data-photo-cover="${photo.id}"
                                >
                                  Make Cover
                                </button>
                              `
                              : ''
                          }

                          <button
                            type="button"
                            class="danger"
                            data-photo-delete="${photo.id}"
                          >
                            Delete
                          </button>

                        </div>
                      `
                      : ''
                  }

                </div>

              </article>
            `
          )
          .join('');

      attachPhotoActions(
        photos
      );
    };

  galleryPhotoUpload
    ?.addEventListener(
      'change',
      async () => {

        if (
          !canEdit() ||
          !activeAlbumId
        ) {
          return;
        }

        const files =
          Array.from(
            galleryPhotoUpload
              .files ||
            []
          );

        if (!files.length) {
          return;
        }

        try {

          await uploadFilesToAlbum(
            activeAlbumId,
            files,
            (message) => {
              setMessage(
                galleryUploadMessage,
                message
              );
            }
          );

          galleryPhotoUpload.value =
            '';

          setMessage(
            galleryUploadMessage,
            'Photos uploaded successfully.'
          );

          await Promise.all([
            loadAlbumPhotos(),
            loadAlbums(),
            loadAdminCounts(),
            loadPublicGallery()
          ]);

        } catch (error) {

          console.error(
            'Gallery upload error:',
            error
          );

          setMessage(
            galleryUploadMessage,
            error.message ||
            'Unable to upload photos.',
            true
          );
        }
      }
    );

  const attachPhotoActions =
    (photos) => {

      document
        .querySelectorAll(
          '[data-photo-caption]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                const photo =
                  photos.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .photoCaption
                      )
                  );

                if (!photo) {
                  return;
                }

                const caption =
                  window.prompt(
                    'Photo caption',
                    photo.caption ||
                    ''
                  );

                if (
                  caption === null
                ) {
                  return;
                }

                const {
                  error
                } = await supabase
                  .from(
                    'gallery_photos'
                  )
                  .update({
                    caption:
                      caption
                        .trim() ||
                      null
                  })
                  .eq(
                    'id',
                    photo.id
                  );

                if (error) {
                  window.alert(
                    error.message
                  );

                  return;
                }

                await Promise.all([
                  loadAlbumPhotos(),
                  loadPublicGallery()
                ]);
              }
            );
          }
        );

      document
        .querySelectorAll(
          '[data-photo-cover]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                const photo =
                  photos.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .photoCover
                      )
                  );

                if (!photo) {
                  return;
                }

                const {
                  error:
                    clearError
                } = await supabase
                  .from(
                    'gallery_photos'
                  )
                  .update({
                    featured:
                      false
                  })
                  .eq(
                    'album_id',
                    activeAlbumId
                  );

                if (clearError) {
                  window.alert(
                    clearError.message
                  );

                  return;
                }

                const {
                  error:
                    featureError
                } = await supabase
                  .from(
                    'gallery_photos'
                  )
                  .update({
                    featured:
                      true
                  })
                  .eq(
                    'id',
                    photo.id
                  );

                if (featureError) {
                  window.alert(
                    featureError.message
                  );

                  return;
                }

                const {
                  error:
                    albumError
                } = await supabase
                  .from(
                    'gallery_albums'
                  )
                  .update({
                    cover_image_url:
                      photo.image_url,

                    updated_by:
                      currentUser.id
                  })
                  .eq(
                    'id',
                    activeAlbumId
                  );

                if (albumError) {
                  window.alert(
                    albumError.message
                  );

                  return;
                }

                await Promise.all([
                  loadAlbumPhotos(),
                  loadAlbums(),
                  loadPublicGallery()
                ]);
              }
            );
          }
        );

      document
        .querySelectorAll(
          '[data-photo-delete]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                const photo =
                  photos.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .photoDelete
                      )
                  );

                if (!photo) {
                  return;
                }

                const confirmed =
                  window.confirm(
                    'Delete this photo from the album?'
                  );

                if (!confirmed) {
                  return;
                }

                const {
                  error
                } = await supabase
                  .from(
                    'gallery_photos'
                  )
                  .delete()
                  .eq(
                    'id',
                    photo.id
                  );

                if (error) {
                  window.alert(
                    error.message
                  );

                  return;
                }

                if (
                  photo.featured
                ) {

                  const {
                    data:
                      remaining
                  } = await supabase
                    .from(
                      'gallery_photos'
                    )
                    .select('*')
                    .eq(
                      'album_id',
                      activeAlbumId
                    )
                    .order(
                      'created_at',
                      {
                        ascending:
                          true
                      }
                    )
                    .limit(1);

                  const next =
                    remaining?.[0];

                  if (next) {

                    await supabase
                      .from(
                        'gallery_photos'
                      )
                      .update({
                        featured:
                          true
                      })
                      .eq(
                        'id',
                        next.id
                      );

                    await supabase
                      .from(
                        'gallery_albums'
                      )
                      .update({
                        cover_image_url:
                          next.image_url,

                        updated_by:
                          currentUser.id
                      })
                      .eq(
                        'id',
                        activeAlbumId
                      );

                  } else {

                    await supabase
                      .from(
                        'gallery_albums'
                      )
                      .update({
                        cover_image_url:
                          null,

                        updated_by:
                          currentUser.id
                      })
                      .eq(
                        'id',
                        activeAlbumId
                      );
                  }
                }

                await Promise.all([
                  loadAlbumPhotos(),
                  loadAlbums(),
                  loadAdminCounts(),
                  loadPublicGallery()
                ]);
              }
            );
          }
        );
    };

  closeAlbumPhotosBtn
    ?.addEventListener(
      'click',
      () => {

        activeAlbumId =
          null;

        setMessage(
          galleryUploadMessage
        );

        if (
          albumPhotosPanel
        ) {
          albumPhotosPanel.hidden =
            true;
        }
      }
    );

  /* =========================================================
     ADMIN — VIDEOS
     ========================================================= */

  const resetVideoForm =
    () => {

      videoForm?.reset();

      if (videoId) {
        videoId.value =
          '';
      }

      if (
        videoDisplayOrder
      ) {
        videoDisplayOrder.value =
          '0';
      }

      if (
        videoPublished
      ) {
        videoPublished.checked =
          true;
      }

      if (
        videoFeatured
      ) {
        videoFeatured.checked =
          false;
      }

      if (
        videoFormTitle
      ) {
        videoFormTitle.textContent =
          'Add video';
      }

      setMessage(
        videoMessage
      );
    };

  addVideoBtn
    ?.addEventListener(
      'click',
      async () => {

        if (!canEdit()) {
          return;
        }

        closeAdminEditors(
          'video'
        );

        resetVideoForm();

        if (
          !adminAlbums.length
        ) {
          await loadAlbums();
        }

        populateAdminAlbumSelects();

        if (
          videoFormPanel
        ) {
          videoFormPanel.hidden =
            false;

          videoFormPanel
            .scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }
      }
    );

  cancelVideoEditBtn
    ?.addEventListener(
      'click',
      () => {

        resetVideoForm();

        if (
          videoFormPanel
        ) {
          videoFormPanel.hidden =
            true;
        }
      }
    );

  videoUrl
    ?.addEventListener(
      'blur',
      () => {

        if (
          !videoThumbnailUrl ||
          videoThumbnailUrl
            .value
            .trim()
        ) {
          return;
        }

        const thumbnail =
          getYouTubeThumbnail(
            videoUrl.value
          );

        if (thumbnail) {
          videoThumbnailUrl.value =
            thumbnail;
        }
      }
    );

  videoForm
    ?.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();

        if (!canEdit()) {
          return;
        }

        const targetAlbum =
          videoAlbumSelect
            ?.value ||
          '';

        const title =
          videoTitle
            ?.value
            .trim() ||
          '';

        const url =
          videoUrl
            ?.value
            .trim() ||
          '';

        if (!targetAlbum) {
          setMessage(
            videoMessage,
            'Please choose an album.',
            true
          );

          return;
        }

        if (!title) {
          setMessage(
            videoMessage,
            'Video title is required.',
            true
          );

          return;
        }

        if (
          !getYouTubeId(url)
        ) {
          setMessage(
            videoMessage,
            'Please enter a valid YouTube URL.',
            true
          );

          return;
        }

        try {

          setMessage(
            videoMessage,
            'Saving video…'
          );

          const payload = {
            album_id:
              targetAlbum,

            title,

            video_url:
              url,

            thumbnail_url:
              videoThumbnailUrl
                ?.value
                .trim() ||
              getYouTubeThumbnail(
                url
              ) ||
              null,

            caption:
              videoCaption
                ?.value
                .trim() ||
              null,

            featured:
              Boolean(
                videoFeatured
                  ?.checked
              ),

            display_order:
              Number(
                videoDisplayOrder
                  ?.value ||
                0
              ),

            published:
              Boolean(
                videoPublished
                  ?.checked
              ),

            uploaded_by:
              currentUser.id
          };

          if (
            payload.featured
          ) {

            const {
              error:
                clearFeaturedError
            } = await supabase
              .from(
                'gallery_videos'
              )
              .update({
                featured:
                  false
              })
              .eq(
                'album_id',
                targetAlbum
              );

            if (
              clearFeaturedError
            ) {
              throw clearFeaturedError;
            }
          }

          if (
            videoId?.value
          ) {

            const {
              error
            } = await supabase
              .from(
                'gallery_videos'
              )
              .update(payload)
              .eq(
                'id',
                videoId.value
              );

            if (error) {
              throw error;
            }

          } else {

            const {
              error
            } = await supabase
              .from(
                'gallery_videos'
              )
              .insert(payload);

            if (error) {
              throw error;
            }
          }

          resetVideoForm();

          if (
            videoFormPanel
          ) {
            videoFormPanel.hidden =
              true;
          }

          await Promise.all([
            loadVideos(),
            loadAdminCounts(),
            loadPublicGallery()
          ]);

        } catch (error) {

          console.error(
            'Save video error:',
            error
          );

          setMessage(
            videoMessage,
            error.message ||
            'Unable to save video.',
            true
          );
        }
      }
    );

  const renderVideos =
    () => {

      if (
        !galleryVideosList
      ) {
        return;
      }

      if (
        galleryVideoLibraryCount
      ) {
        galleryVideoLibraryCount
          .textContent =
          adminVideos.length;
      }

      if (
        !adminVideos.length
      ) {
        galleryVideosList.innerHTML = `
          <div
            class="admin-video-empty"
            id="galleryVideosEmpty"
          >

            <div>

              <strong>
                No videos added yet
              </strong>

              <span>
                Use “+ Add Video”
                to connect the first
                YouTube video to an album.
              </span>

            </div>

          </div>
        `;

        return;
      }

      galleryVideosList.innerHTML =
        adminVideos
          .map(
            (video) => {

              const album =
                getAlbumById(
                  video.album_id
                );

              const thumbnail =
                video.thumbnail_url ||
                getYouTubeThumbnail(
                  video.video_url
                );

              return `
                <article
                  class="admin-row"
                >

                  <div
                    class="admin-row-main"
                    style="
                      display:flex;
                      align-items:center;
                      gap:14px;
                    "
                  >

                    ${
                      thumbnail
                        ? `
                          <img
                            src="${escapeHtml(
                              thumbnail
                            )}"
                            alt=""
                            style="
                              width:92px;
                              height:56px;
                              object-fit:cover;
                              border-radius:9px;
                              flex:0 0 auto;
                            "
                          >
                        `
                        : ''
                    }

                    <div>

                      <strong>
                        ${escapeHtml(
                          video.title ||
                          'Untitled video'
                        )}
                      </strong>

                      <span>
                        ${escapeHtml(
                          album?.title ||
                          'Album unavailable'
                        )}
                      </span>

                    </div>

                  </div>

                  <div
                    class="admin-row-meta"
                  >

                    <span>
                      Status
                    </span>

                    <span
                      class="status-pill ${
                        video.published
                          ? 'published'
                          : ''
                      }"
                    >
                      ${
                        video.published
                          ? 'Published'
                          : 'Draft'
                      }
                    </span>

                  </div>

                  <div
                    class="admin-row-meta"
                  >

                    <span>
                      Type
                    </span>

                    <strong>
                      ${
                        video.featured
                          ? 'Featured'
                          : 'Video'
                      }
                    </strong>

                  </div>

                  <div
                    class="admin-row-actions"
                  >

                    <a
                      href="${escapeHtml(
                        video.video_url
                      )}"
                      target="_blank"
                      rel="noopener"
                    >
                      View
                    </a>

                    ${
                      canEdit()
                        ? `
                          <button
                            type="button"
                            data-video-edit="${video.id}"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            class="danger"
                            data-video-delete="${video.id}"
                          >
                            Delete
                          </button>
                        `
                        : ''
                    }

                  </div>

                </article>
              `;
            }
          )
          .join('');

      attachVideoActions();
    };

  const loadVideos =
    async () => {

      if (
        !galleryVideosList
      ) {
        return;
      }

      galleryVideosList.innerHTML =
        '<div class="admin-loading">Loading videos…</div>';

      const {
        data,
        error
      } = await supabase
        .from(
          'gallery_videos'
        )
        .select('*')
        .order(
          'featured',
          {
            ascending:
              false
          }
        )
        .order(
          'display_order',
          {
            ascending:
              true
          }
        )
        .order(
          'created_at',
          {
            ascending:
              false
          }
        );

      if (error) {
        console.error(
          'Gallery videos error:',
          error
        );

        galleryVideosList.innerHTML = `
          <div
            class="admin-empty"
          >
            Unable to load videos.
          </div>
        `;

        return;
      }

      adminVideos =
        Array.isArray(data)
          ? data
          : [];

      renderVideos();
    };

  const attachVideoActions =
    () => {

      document
        .querySelectorAll(
          '[data-video-edit]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              () => {

                const video =
                  adminVideos.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .videoEdit
                      )
                  );

                if (!video) {
                  return;
                }

                closeAdminEditors(
                  'video'
                );

                populateAdminAlbumSelects();

                if (videoId) {
                  videoId.value =
                    video.id ||
                    '';
                }

                if (
                  videoAlbumSelect
                ) {
                  videoAlbumSelect.value =
                    video.album_id ||
                    '';
                }

                if (videoTitle) {
                  videoTitle.value =
                    video.title ||
                    '';
                }

                if (videoUrl) {
                  videoUrl.value =
                    video.video_url ||
                    '';
                }

                if (
                  videoThumbnailUrl
                ) {
                  videoThumbnailUrl.value =
                    video.thumbnail_url ||
                    '';
                }

                if (videoCaption) {
                  videoCaption.value =
                    video.caption ||
                    '';
                }

                if (
                  videoDisplayOrder
                ) {
                  videoDisplayOrder.value =
                    Number(
                      video.display_order ||
                      0
                    );
                }

                if (
                  videoFeatured
                ) {
                  videoFeatured.checked =
                    Boolean(
                      video.featured
                    );
                }

                if (
                  videoPublished
                ) {
                  videoPublished.checked =
                    Boolean(
                      video.published
                    );
                }

                if (
                  videoFormTitle
                ) {
                  videoFormTitle
                    .textContent =
                    'Edit video';
                }

                if (
                  videoFormPanel
                ) {
                  videoFormPanel.hidden =
                    false;

                  videoFormPanel
                    .scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                }
              }
            );
          }
        );

      document
        .querySelectorAll(
          '[data-video-delete]'
        )
        .forEach(
          (button) => {

            button.addEventListener(
              'click',
              async () => {

                if (!canEdit()) {
                  return;
                }

                const video =
                  adminVideos.find(
                    (item) =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .videoDelete
                      )
                  );

                if (!video) {
                  return;
                }

                const confirmed =
                  window.confirm(
                    `Delete "${video.title}"?`
                  );

                if (!confirmed) {
                  return;
                }

                const {
                  error
                } = await supabase
                  .from(
                    'gallery_videos'
                  )
                  .delete()
                  .eq(
                    'id',
                    video.id
                  );

                if (error) {
                  window.alert(
                    error.message
                  );

                  return;
                }

                await Promise.all([
                  loadVideos(),
                  loadAdminCounts(),
                  loadPublicGallery()
                ]);
              }
            );
          }
        );
    };

  /* =========================================================
     ADMIN LOAD + PUBLIC API
     ========================================================= */

  const loadAdmin =
    async ({
      user,
      profile
    } = {}) => {

      setAdminContext({
        user,
        profile
      });

      await Promise.all([
        loadAlbums(),
        loadAdminEvents(),
        loadVideos(),
        loadAdminCounts()
      ]);
    };

  loadPublicGallery();

  window.AAVAN =
    window.AAVAN ||
    {};

  window.AAVAN.gallery = {
    reload:
      loadPublicGallery,

    setAdminContext,

    loadAdmin
  };

})();
