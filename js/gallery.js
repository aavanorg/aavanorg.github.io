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

  /* Public gallery */
  const publicGalleryYear =
    document.getElementById('publicGalleryYear');

  const publicGalleryAlbums =
    document.getElementById('publicGalleryAlbums');

  const galleryFallback =
    document.getElementById('galleryFallback');

  /* Admin gallery */
  const newAlbumBtn =
    document.getElementById('newAlbumBtn');

  const uploadPhotosBtn =
    document.getElementById('uploadPhotosBtn');

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
    element.classList.toggle('error', Boolean(isError));
  };

  const currentYear =
    new Date().getFullYear();

  const getCoverImage = (album) =>
    album.cover_image_url ||
    'assets/images/community-group.jpg';

  const refreshYearSelect = (
    select,
    albums,
    firstLabel
  ) => {
    if (!select) return;

    const selected = select.value || 'all';

    const years = [
      ...new Set(
        albums
          .map((album) => Number(album.album_year))
          .filter(Boolean)
      )
    ].sort((a, b) => b - a);

    select.innerHTML = `
      <option value="all">${firstLabel}</option>
      ${years
        .map(
          (year) =>
            `<option value="${year}">${year}</option>`
        )
        .join('')}
    `;

    if (
      selected === 'all' ||
      years.includes(Number(selected))
    ) {
      select.value = selected;
    }
  };

  /* =========================================================
     PUBLIC GALLERY
     ========================================================= */

  const publicGalleryMediaTabs =
    Array.from(
      document.querySelectorAll('[data-gallery-media]')
    );

  let publicAlbums = [];
  let publicMediaFilter = 'all';

  const getAlbumMediaType = (album) => {
    const declaredType =
      String(
        album.media_type ||
        album.album_type ||
        ''
      )
        .trim()
        .toLowerCase();

    if (
      declaredType === 'video' ||
      declaredType === 'videos'
    ) {
      return 'videos';
    }

    return 'photos';
  };

  const closePublicAlbumModal = () => {
    const modal =
      document.getElementById('publicGalleryModal');

    if (!modal) return;

    modal.hidden = true;
    document.body.style.overflow = '';
  };

  const createPublicAlbumModal = () => {
    let modal =
      document.getElementById('publicGalleryModal');

    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'publicGalleryModal';
    modal.className = 'gallery-viewer';
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
        <header class="gallery-viewer-header">
          <div>
            <span id="galleryViewerMeta"></span>
            <h2 id="galleryViewerTitle">Gallery</h2>
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
          id="galleryViewerPhotos"
          class="gallery-viewer-grid"
        ></div>
      </section>
    `;

    document.body.appendChild(modal);

    modal
      .querySelectorAll('[data-gallery-viewer-close]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          closePublicAlbumModal
        );
      });

    return modal;
  };

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;

      const modal =
        document.getElementById('publicGalleryModal');

      if (!modal || modal.hidden) return;

      closePublicAlbumModal();
    }
  );

  const openPublicAlbum = async (album) => {
    const modal =
      createPublicAlbumModal();

    const title =
      modal.querySelector('#galleryViewerTitle');

    const meta =
      modal.querySelector('#galleryViewerMeta');

    const photosGrid =
      modal.querySelector('#galleryViewerPhotos');

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

    if (photosGrid) {
      photosGrid.innerHTML = `
        <div class="admin-loading">
          Loading memories…
        </div>
      `;
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const mediaType =
      getAlbumMediaType(album);

    if (mediaType === 'videos') {
      if (photosGrid) {
        photosGrid.innerHTML = `
          <div class="admin-empty">
            Video viewing will appear here once
            video records are connected to the
            AAVAN gallery archive.
          </div>
        `;
      }

      return;
    }

    const {
      data,
      error
    } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('album_id', album.id)
      .order('featured', {
        ascending: false
      })
      .order('display_order', {
        ascending: true
      })
      .order('created_at', {
        ascending: true
      });

    if (error) {
      console.error(
        'Public album photos error:',
        error
      );

      if (photosGrid) {
        photosGrid.innerHTML = `
          <div class="admin-empty">
            Unable to load this album.
          </div>
        `;
      }

      return;
    }

    const photos =
      Array.isArray(data)
        ? data
        : [];

    if (!photos.length) {
      if (photosGrid) {
        photosGrid.innerHTML = `
          <div class="admin-empty">
            Photos for this album are coming soon.
          </div>
        `;
      }

      return;
    }

    if (!photosGrid) return;

    photosGrid.innerHTML =
      photos
        .map((photo) => `
          <figure>
            <img
              src="${escapeHtml(photo.image_url)}"
              alt="${escapeHtml(
                photo.alt_text ||
                photo.caption ||
                album.title ||
                'AAVAN gallery photo'
              )}"
              loading="lazy"
            >

            ${
              photo.caption
                ? `
                    <figcaption>
                      ${escapeHtml(photo.caption)}
                    </figcaption>
                  `
                : ''
            }
          </figure>
        `)
        .join('');
  };

  const getPublicFilteredAlbums = () => {
    const selectedYear =
      publicGalleryYear?.value ||
      'all';

    return publicAlbums.filter(
      (album) => {
        const matchesYear =
          selectedYear === 'all' ||
          String(album.album_year) ===
            String(selectedYear);

        const mediaType =
          getAlbumMediaType(album);

        const matchesMedia =
          publicMediaFilter === 'all' ||
          mediaType === publicMediaFilter;

        return matchesYear && matchesMedia;
      }
    );
  };

  const renderPublicAlbumCard = (album) => {
    const mediaType =
      getAlbumMediaType(album);

    const mediaLabel =
      mediaType === 'videos'
        ? 'Video'
        : 'Photos';

    return `
      <button
        class="gallery-album-card"
        type="button"
        data-public-album="${escapeHtml(album.id)}"
      >
        <img
          src="${escapeHtml(getCoverImage(album))}"
          alt="${escapeHtml(
            album.title ||
            'AAVAN gallery album'
          )}"
          loading="lazy"
        >

        <span class="gallery-album-card-copy">
          <small>
            ${escapeHtml(
              [
                album.event_name ||
                  'AAVAN Community',
                album.album_year,
                mediaLabel
              ]
                .filter(Boolean)
                .join(' • ')
            )}
          </small>

          <strong>
            ${escapeHtml(
              album.title ||
              'Community memories'
            )}
          </strong>

          ${
            album.description
              ? `
                  <span>
                    ${escapeHtml(album.description)}
                  </span>
                `
              : ''
          }
        </span>
      </button>
    `;
  };

  const attachPublicAlbumActions = () => {
    if (!publicGalleryAlbums) return;

    publicGalleryAlbums
      .querySelectorAll('[data-public-album]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          () => {
            const album =
              publicAlbums.find(
                (item) =>
                  String(item.id) ===
                  String(
                    button.dataset.publicAlbum
                  )
              );

            if (album) {
              openPublicAlbum(album);
            }
          }
        );
      });
  };

  const renderPublicAlbums = () => {
    if (!publicGalleryAlbums) return;

    const filtered =
      getPublicFilteredAlbums();

    if (!filtered.length) {
      publicGalleryAlbums.innerHTML = '';

      if (galleryFallback) {
        galleryFallback.hidden = false;

        const heading =
          galleryFallback.querySelector('h3');

        const copy =
          galleryFallback.querySelector('p');

        if (publicMediaFilter === 'videos') {
          if (heading) {
            heading.textContent =
              'Video memories are coming.';
          }

          if (copy) {
            copy.textContent =
              'The archive is ready for video collections once video records are added to the gallery system.';
          }
        } else {
          if (heading) {
            heading.textContent =
              'More memories are coming.';
          }

          if (copy) {
            copy.textContent =
              'Photos and videos from our community archive will appear here as albums are published.';
          }
        }
      }

      return;
    }

    if (galleryFallback) {
      galleryFallback.hidden = true;
    }

    const groupedByYear =
      filtered.reduce(
        (groups, album) => {
          const year =
            Number(album.album_year) ||
            'Archive';

          if (!groups[year]) {
            groups[year] = [];
          }

          groups[year].push(album);
          return groups;
        },
        {}
      );

    const years =
      Object.keys(groupedByYear)
        .sort((a, b) => {
          if (a === 'Archive') return 1;
          if (b === 'Archive') return -1;

          return Number(b) - Number(a);
        });

    publicGalleryAlbums.innerHTML =
      years
        .map((year) => {
          const albums =
            groupedByYear[year];

          return `
            <section
              class="gallery-year-group"
              data-gallery-year="${escapeHtml(year)}"
            >
              <header class="gallery-year-heading">
                <span>
                  ${
                    year === 'Archive'
                      ? 'ARCHIVE'
                      : escapeHtml(year)
                  }
                </span>

                <div>
                  <h3>
                    ${
                      year === 'Archive'
                        ? 'Community archive'
                        : `${escapeHtml(year)} memories`
                    }
                  </h3>

                  <p>
                    ${albums.length}
                    ${albums.length === 1
                      ? 'event album'
                      : 'event albums'}
                  </p>
                </div>
              </header>

              <div class="gallery-year-grid">
                ${albums
                  .map(renderPublicAlbumCard)
                  .join('')}
              </div>
            </section>
          `;
        })
        .join('');

    attachPublicAlbumActions();
  };

  const setPublicMediaFilter = (filter) => {
    publicMediaFilter =
      ['all', 'photos', 'videos']
        .includes(filter)
        ? filter
        : 'all';

    publicGalleryMediaTabs
      .forEach((button) => {
        const isActive =
          button.dataset.galleryMedia ===
          publicMediaFilter;

        button.classList.toggle(
          'active',
          isActive
        );

        button.setAttribute(
          'aria-pressed',
          isActive
            ? 'true'
            : 'false'
        );
      });

    renderPublicAlbums();
  };

  publicGalleryMediaTabs
    .forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          setPublicMediaFilter(
            button.dataset.galleryMedia ||
            'all'
          );
        }
      );
    });

  const loadPublicGallery = async () => {
    if (!publicGalleryAlbums) return;

    publicGalleryAlbums.innerHTML = `
      <div class="admin-loading">
        Loading community memories…
      </div>
    `;

    try {
      const {
        data,
        error
      } = await supabase
        .from('gallery_albums')
        .select('*')
        .eq('published', true)
        .order('album_year', {
          ascending: false
        })
        .order('display_order', {
          ascending: true
        })
        .order('created_at', {
          ascending: false
        });

      if (error) throw error;

      publicAlbums =
        Array.isArray(data)
          ? data
          : [];

      refreshYearSelect(
        publicGalleryYear,
        publicAlbums,
        'All years'
      );

      if (publicGalleryYear) {
        publicGalleryYear.onchange =
          renderPublicAlbums;
      }

      renderPublicAlbums();

    } catch (error) {
      console.error(
        'Public gallery error:',
        error
      );

      publicAlbums = [];
      publicGalleryAlbums.innerHTML = '';

      if (galleryFallback) {
        galleryFallback.hidden = false;
      }
    }
  };

  /* =========================================================
     ADMIN CONTEXT
     ========================================================= */

  const setAdminContext = ({
    user,
    profile
  } = {}) => {
    currentUser = user || currentUser;
    currentProfile = profile || currentProfile;

    if (newAlbumBtn) {
      newAlbumBtn.hidden = !canEdit();
    }

    if (uploadPhotosBtn) {
      uploadPhotosBtn.hidden = !canEdit();
    }
  };

  /* =========================================================
     ADMIN ALBUMS
     ========================================================= */

  const resetAlbumForm = () => {
    albumForm?.reset();

    if (albumId) albumId.value = '';

    if (albumYear) {
      albumYear.value = String(currentYear);
    }

    if (albumPublished) {
      albumPublished.checked = false;
    }

    if (albumPhotoUpload) {
      albumPhotoUpload.value = '';
    }

    if (albumSelectedPhotos) {
      albumSelectedPhotos.hidden = true;
      albumSelectedPhotos.innerHTML = '';
    }

    if (albumFormTitle) {
      albumFormTitle.textContent =
        'Create album';
    }

    setMessage(albumMessage);
  };

  const loadAdminEvents = async () => {
    if (!albumEventId) return;

    const {
      data,
      error
    } = await supabase
      .from('events')
      .select('id,title,event_date')
      .order('event_date', {
        ascending: false
      });

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
      albumEventId.value || '';

    albumEventId.innerHTML = `
      <option value="">No linked event</option>
      ${adminEvents
        .map((event) => `
          <option value="${event.id}">
            ${escapeHtml(event.title)}
            ${event.event_date
              ? ` — ${escapeHtml(event.event_date)}`
              : ''}
          </option>
        `)
        .join('')}
    `;

    albumEventId.value = current;
  };

  const populateQuickPhotoAlbumSelect = () => {
    if (!quickPhotoAlbumSelect) return;

    const currentValue =
      quickPhotoAlbumSelect.value || '';

    quickPhotoAlbumSelect.innerHTML = `
      <option value="">Select an album</option>
      ${adminAlbums
        .map((album) => `
          <option value="${album.id}">
            ${escapeHtml(album.title)}
            ${album.album_year ? ` — ${escapeHtml(album.album_year)}` : ''}
          </option>
        `)
        .join('')}
    `;

    if (
      currentValue &&
      adminAlbums.some(
        (album) =>
          String(album.id) ===
          String(currentValue)
      )
    ) {
      quickPhotoAlbumSelect.value =
        currentValue;
    }
  };

  const renderAdminAlbums = () => {
    if (!albumsList) return;

    const year =
      galleryYearFilter?.value || 'all';

    const search =
      galleryAlbumSearch?.value
        .trim()
        .toLowerCase() || '';

    const filtered =
      adminAlbums.filter((album) => {
        const matchesYear =
          year === 'all' ||
          String(album.album_year) === year;

        const haystack =
          `${album.title || ''} ${album.event_name || ''}`
            .toLowerCase();

        const matchesSearch =
          !search ||
          haystack.includes(search);

        return matchesYear && matchesSearch;
      });

    if (!filtered.length) {
      albumsList.innerHTML = `
        <div class="admin-empty">
          No gallery albums match this view.
        </div>
      `;
      return;
    }

    albumsList.innerHTML =
      filtered.map((album) => `
        <article class="admin-row">

          <div class="admin-row-main">
            <strong>
              ${escapeHtml(album.title)}
            </strong>

            <span>
              ${escapeHtml(
                album.event_name ||
                'General gallery'
              )}
            </span>
          </div>

          <div class="admin-row-meta">
            <span>Year</span>
            <strong>
              ${escapeHtml(album.album_year)}
            </strong>
          </div>

          <div class="admin-row-meta">
            <span>Status</span>
            <span class="status-pill ${
              album.published
                ? 'published'
                : ''
            }">
              ${
                album.published
                  ? 'Published'
                  : 'Draft'
              }
            </span>
          </div>

          <div class="admin-row-actions">
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
      `).join('');

    attachAlbumActions();
  };

  const loadAlbums = async () => {
    if (!albumsList) return;

    albumsList.innerHTML =
      '<div class="admin-loading">Loading albums…</div>';

    const {
      data,
      error
    } = await supabase
      .from('gallery_albums')
      .select('*')
      .order('album_year', {
        ascending: false
      })
      .order('display_order', {
        ascending: true
      })
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(
        'Gallery albums error:',
        error
      );

      albumsList.innerHTML = `
        <div class="admin-empty">
          Unable to load gallery albums.
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

    populateQuickPhotoAlbumSelect();
    renderAdminAlbums();
  };

  uploadPhotosBtn?.addEventListener(
    'click',
    async () => {
      if (!canEdit()) return;

      setMessage(
        quickPhotoUploadMessage
      );

      if (quickPhotoUploadForm) {
        quickPhotoUploadForm.reset();
      }

      if (!adminAlbums.length) {
        await loadAlbums();
      }

      populateQuickPhotoAlbumSelect();

      if (quickPhotoUploadPanel) {
        quickPhotoUploadPanel.hidden = false;
        quickPhotoUploadPanel.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  );

  cancelQuickPhotoUploadBtn?.addEventListener(
    'click',
    () => {
      quickPhotoUploadForm?.reset();

      setMessage(
        quickPhotoUploadMessage
      );

      if (quickPhotoUploadPanel) {
        quickPhotoUploadPanel.hidden = true;
      }
    }
  );

  newAlbumBtn?.addEventListener(
    'click',
    async () => {
      if (!canEdit()) return;

      resetAlbumForm();
      await loadAdminEvents();

      if (albumFormPanel) {
        albumFormPanel.hidden = false;
        albumFormPanel.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  );

  cancelAlbumEditBtn?.addEventListener(
    'click',
    () => {
      resetAlbumForm();

      if (albumFormPanel) {
        albumFormPanel.hidden = true;
      }
    }
  );

  albumEventId?.addEventListener(
    'change',
    () => {
      const selected =
        adminEvents.find(
          (event) =>
            String(event.id) ===
            String(albumEventId.value)
        );

      if (!selected) return;

      if (
        albumEventName &&
        !albumEventName.value.trim()
      ) {
        albumEventName.value =
          selected.title || '';
      }

      if (
        albumYear &&
        selected.event_date
      ) {
        albumYear.value =
          String(selected.event_date)
            .slice(0, 4);
      }
    }
  );

  albumPhotoUpload?.addEventListener(
    'change',
    () => {
      if (!albumSelectedPhotos) return;

      const files =
        Array.from(
          albumPhotoUpload.files || []
        );

      if (!files.length) {
        albumSelectedPhotos.hidden = true;
        albumSelectedPhotos.innerHTML = '';
        return;
      }

      albumSelectedPhotos.hidden = false;
      albumSelectedPhotos.innerHTML = `
        <strong>
          ${files.length} photo${files.length === 1 ? '' : 's'} selected
        </strong>

        <div class="album-selected-photos__list">
          ${files
            .map(
              (file, index) => `
                <span>
                  ${index + 1}. ${escapeHtml(file.name)}
                </span>
              `
            )
            .join('')}
        </div>
      `;
    }
  );

  albumForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (!canEdit()) return;

      const title =
        albumTitle.value.trim();

      const year =
        Number(albumYear.value);

      const selectedFiles =
        Array.from(
          albumPhotoUpload?.files || []
        );

      if (!title || !year) {
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
            ? `Saving album and uploading ${selectedFiles.length} photo${selectedFiles.length === 1 ? '' : 's'}…`
            : 'Saving album…'
        );

        const payload = {
          title,
          album_year: year,
          event_name:
            albumEventName.value.trim() ||
            null,
          event_id:
            albumEventId.value ||
            null,
          description:
            albumDescription.value.trim() ||
            null,
          published:
            albumPublished.checked,
          updated_by:
            currentUser.id
        };

        let savedAlbumId =
          albumId.value || null;

        if (savedAlbumId) {
          const {
            error: updateError
          } = await supabase
            .from('gallery_albums')
            .update(payload)
            .eq('id', savedAlbumId);

          if (updateError) {
            throw updateError;
          }
        } else {
          payload.created_by =
            currentUser.id;

          const {
            data: insertedAlbum,
            error: insertError
          } = await supabase
            .from('gallery_albums')
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

        if (selectedFiles.length) {
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
          albumFormPanel.hidden = true;
        }

        await loadAlbums();
        await loadPublicGallery();

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

  galleryYearFilter?.addEventListener(
    'change',
    renderAdminAlbums
  );

  galleryAlbumSearch?.addEventListener(
    'input',
    renderAdminAlbums
  );

  const attachAlbumActions = () => {
    document
      .querySelectorAll('[data-album-edit]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            const album =
              adminAlbums.find(
                (item) =>
                  String(item.id) ===
                  String(button.dataset.albumEdit)
              );

            if (!album) return;

            await loadAdminEvents();

            albumId.value =
              album.id || '';

            albumTitle.value =
              album.title || '';

            albumYear.value =
              album.album_year ||
              currentYear;

            albumEventName.value =
              album.event_name || '';

            albumEventId.value =
              album.event_id || '';

            albumDescription.value =
              album.description || '';

            albumPublished.checked =
              Boolean(album.published);

            if (albumFormTitle) {
              albumFormTitle.textContent =
                'Edit album';
            }

            if (albumFormPanel) {
              albumFormPanel.hidden = false;
              albumFormPanel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        );
      });

    document
      .querySelectorAll('[data-album-delete]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            if (!canEdit()) return;

            const confirmed =
              window.confirm(
                'Delete this album and all of its photo records?'
              );

            if (!confirmed) return;

            const { error } =
              await supabase
                .from('gallery_albums')
                .delete()
                .eq(
                  'id',
                  button.dataset.albumDelete
                );

            if (error) {
              window.alert(error.message);
              return;
            }

            await loadAlbums();
            await loadPublicGallery();
          }
        );
      });

    document
      .querySelectorAll('[data-album-photos]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            const album =
              adminAlbums.find(
                (item) =>
                  String(item.id) ===
                  String(button.dataset.albumPhotos)
              );

            if (!album) return;

            activeAlbumId = album.id;

            if (albumPhotosTitle) {
              albumPhotosTitle.textContent =
                album.title;
            }

            if (albumPhotosPanel) {
              albumPhotosPanel.hidden = false;
              albumPhotosPanel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }

            await loadAlbumPhotos();
          }
        );
      });
  };

  /* =========================================================
     ADMIN PHOTOS
     ========================================================= */

  const uploadGalleryPhoto = async (
    file,
    albumIdValue
  ) => {
    const extension =
      file.name.split('.').pop()?.toLowerCase() ||
      'jpg';

    const filename =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `albums/${albumIdValue}/${filename}`;

    const {
      error
    } = await supabase.storage
      .from('gallery-images')
      .upload(
        path,
        file,
        {
          cacheControl: '3600',
          upsert: false
        }
      );

    if (error) throw error;

    const { data } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(path);

    return {
      publicUrl:
        data?.publicUrl || null,
      storagePath:
        path
    };
  };

  const uploadFilesToAlbum = async (
    albumIdValue,
    files,
    onProgress = null
  ) => {
    const selectedFiles =
      Array.from(files || []);

    if (!selectedFiles.length) {
      return;
    }

    const {
      data: existingPhotos,
      error: existingPhotosError
    } = await supabase
      .from('gallery_photos')
      .select('id')
      .eq('album_id', albumIdValue)
      .limit(1);

    if (existingPhotosError) {
      throw existingPhotosError;
    }

    const albumHasNoPhotos =
      !existingPhotos?.length;

    for (
      let index = 0;
      index < selectedFiles.length;
      index += 1
    ) {
      const file =
        selectedFiles[index];

      if (onProgress) {
        onProgress(
          `Uploading photo ${index + 1} of ${selectedFiles.length}…`
        );
      }

      const uploaded =
        await uploadGalleryPhoto(
          file,
          albumIdValue
        );

      if (!uploaded.publicUrl) {
        throw new Error(
          `Unable to create public URL for ${file.name}.`
        );
      }

      const isCover =
        albumHasNoPhotos &&
        index === 0;

      const {
        error: insertError
      } = await supabase
        .from('gallery_photos')
        .insert({
          album_id:
            albumIdValue,

          image_url:
            uploaded.publicUrl,

          alt_text:
            file.name
              .replace(/\.[^.]+$/, '')
              .replaceAll('-', ' ')
              .replaceAll('_', ' '),

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
          error: coverError
        } = await supabase
          .from('gallery_albums')
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

  quickPhotoUploadForm?.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (!canEdit()) return;

      const targetAlbumId =
        quickPhotoAlbumSelect?.value || '';

      const files =
        Array.from(
          quickPhotoFiles?.files || []
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

        quickPhotoUploadForm?.reset();

        await loadAlbums();
        await loadPublicGallery();

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

  const loadAlbumPhotos = async () => {
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
      .from('gallery_photos')
      .select('*')
      .eq('album_id', activeAlbumId)
      .order('featured', {
        ascending: false
      })
      .order('display_order', {
        ascending: true
      })
      .order('created_at', {
        ascending: true
      });

    if (error) {
      albumPhotosGrid.innerHTML = `
        <div class="admin-empty">
          Unable to load album photos.
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
          No photos uploaded to this album yet.
        </div>
      `;
      return;
    }

    albumPhotosGrid.innerHTML =
      photos.map((photo) => `
        <article class="admin-gallery-photo">
          <img
            src="${escapeHtml(photo.image_url)}"
            alt="${escapeHtml(
              photo.alt_text ||
              photo.caption ||
              'Gallery photo'
            )}"
          >

          <div>
            <span class="status-pill ${
              photo.featured
                ? 'published'
                : ''
            }">
              ${
                photo.featured
                  ? 'Cover'
                  : 'Photo'
              }
            </span>

            ${
              photo.caption
                ? `<p>${escapeHtml(photo.caption)}</p>`
                : '<p>No caption</p>'
            }

            ${
              canEdit()
                ? `
                  <div class="admin-row-actions">
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
      `).join('');

    attachPhotoActions(photos);
  };

  galleryPhotoUpload?.addEventListener(
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
          galleryPhotoUpload.files || []
        );

      if (!files.length) return;

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

        galleryPhotoUpload.value = '';

        setMessage(
          galleryUploadMessage,
          'Photos uploaded successfully.'
        );

        await loadAlbumPhotos();
        await loadAlbums();
        await loadPublicGallery();

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

  const attachPhotoActions = (
    photos
  ) => {
    document
      .querySelectorAll('[data-photo-caption]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            const photo =
              photos.find(
                (item) =>
                  String(item.id) ===
                  String(button.dataset.photoCaption)
              );

            if (!photo) return;

            const caption =
              window.prompt(
                'Photo caption',
                photo.caption || ''
              );

            if (caption === null) return;

            const { error } =
              await supabase
                .from('gallery_photos')
                .update({
                  caption:
                    caption.trim() || null
                })
                .eq(
                  'id',
                  photo.id
                );

            if (error) {
              window.alert(error.message);
              return;
            }

            await loadAlbumPhotos();
            await loadPublicGallery();
          }
        );
      });

    document
      .querySelectorAll('[data-photo-cover]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            const photo =
              photos.find(
                (item) =>
                  String(item.id) ===
                  String(button.dataset.photoCover)
              );

            if (!photo) return;

            const {
              error: clearError
            } = await supabase
              .from('gallery_photos')
              .update({
                featured: false
              })
              .eq(
                'album_id',
                activeAlbumId
              );

            if (clearError) {
              window.alert(clearError.message);
              return;
            }

            const {
              error: featureError
            } = await supabase
              .from('gallery_photos')
              .update({
                featured: true
              })
              .eq(
                'id',
                photo.id
              );

            if (featureError) {
              window.alert(featureError.message);
              return;
            }

            const {
              error: albumError
            } = await supabase
              .from('gallery_albums')
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
              window.alert(albumError.message);
              return;
            }

            await loadAlbumPhotos();
            await loadAlbums();
            await loadPublicGallery();
          }
        );
      });

    document
      .querySelectorAll('[data-photo-delete]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            const photo =
              photos.find(
                (item) =>
                  String(item.id) ===
                  String(button.dataset.photoDelete)
              );

            if (!photo) return;

            const confirmed =
              window.confirm(
                'Delete this photo from the album?'
              );

            if (!confirmed) return;

            const { error } =
              await supabase
                .from('gallery_photos')
                .delete()
                .eq(
                  'id',
                  photo.id
                );

            if (error) {
              window.alert(error.message);
              return;
            }

            if (photo.featured) {
              const {
                data: remaining
              } = await supabase
                .from('gallery_photos')
                .select('*')
                .eq(
                  'album_id',
                  activeAlbumId
                )
                .order(
                  'created_at',
                  {
                    ascending: true
                  }
                )
                .limit(1);

              const next =
                remaining?.[0];

              if (next) {
                await supabase
                  .from('gallery_photos')
                  .update({
                    featured: true
                  })
                  .eq(
                    'id',
                    next.id
                  );

                await supabase
                  .from('gallery_albums')
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
                  .from('gallery_albums')
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

            await loadAlbumPhotos();
            await loadAlbums();
            await loadPublicGallery();
          }
        );
      });
  };

  closeAlbumPhotosBtn?.addEventListener(
    'click',
    () => {
      activeAlbumId = null;
      setMessage(galleryUploadMessage);

      if (albumPhotosPanel) {
        albumPhotosPanel.hidden = true;
      }
    }
  );

  /* =========================================================
     ADMIN LOAD ENTRY
     ========================================================= */

  const loadAdmin = async ({
    user,
    profile
  } = {}) => {
    setAdminContext({
      user,
      profile
    });

    await Promise.all([
      loadAlbums(),
      loadAdminEvents()
    ]);
  };

  /* =========================================================
     INITIAL PUBLIC LOAD
     ========================================================= */

  loadPublicGallery();

  window.AAVAN = window.AAVAN || {};

  window.AAVAN.gallery = {
    reload: loadPublicGallery,
    setAdminContext,
    loadAdmin
  };
})();
