/**
 * KHULASA - MAIN APPLICATION CONTROLLER
 * Material Design 3 interactive logic, tabs navigation, 3-page reader, and integrations.
 */

const App = {
  activeTab: 'home',
  currentCategory: 'all',
  searchQuery: '',
  activeBook: null,
  activeReaderPage: 0,
  touchStartX: 0,
  touchEndX: 0,
  onlineSearchResults: [],

  init() {
    ThemeEngine.init();
    AudioPlayer.init();

    // Load any previously AI-generated books from storage
    const savedAIBooks = AISummarizer.getSavedAIBooks();
    savedAIBooks.forEach(book => {
      if (!BOOKS_DATA.some(b => b.id === book.id)) {
        BOOKS_DATA.unshift(book);
      }
    });

    // Populate API key input if stored
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    if (apiKeyInput) {
      apiKeyInput.value = AISummarizer.getApiKey();
    }

    this.bindEvents();
    this.renderAll();
    this.startDailyCountdown();
  },

  bindEvents() {
    // Top app bar scroll elevation
    window.addEventListener('scroll', () => {
      const topBar = document.querySelector('.top-app-bar');
      if (topBar) {
        if (window.scrollY > 10) {
          topBar.classList.add('scrolled');
        } else {
          topBar.classList.remove('scrolled');
        }
      }
    });

    // Navigation Bar Items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = item.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // Search input
    const searchInput = document.getElementById('books-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderBooksGrid();
      });
    }

    // Category chips
    document.querySelectorAll('.m3-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.m3-filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category || 'all';
        this.renderBooksGrid();
      });
    });

    // Saved Subtabs (Favorites / Quotes / Notes)
    document.querySelectorAll('.saved-subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.saved-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const subtab = btn.dataset.subtab;
        this.renderSavedSubtab(subtab);
      });
    });

    // Settings: Theme mode
    document.querySelectorAll('.mode-segmented-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-segmented-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        ThemeEngine.setTheme(mode);
        this.showToast(`تم تفعيل المظهر: ${mode === 'dark' ? 'الداكن' : mode === 'sepia' ? 'الدافئ' : 'الفاتح'}`);
      });
    });

    // Settings: Palette picker
    document.querySelectorAll('.palette-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.palette-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const palette = btn.dataset.palette;
        ThemeEngine.setPalette(palette);
        this.showToast('تم تطبيق لوحة ألوان Material You');
      });
    });

    // Modal Overlays click outside to close
    document.querySelectorAll('.m3-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Reader swipe gestures
    const readerViewport = document.getElementById('reader-viewport');
    if (readerViewport) {
      readerViewport.addEventListener('touchstart', (e) => {
        this.touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      readerViewport.addEventListener('touchend', (e) => {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleReaderSwipe();
      }, { passive: true });
    }

    // Text selection inside reader
    document.addEventListener('selectionchange', () => {
      this.handleTextSelection();
    });
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update Nav bar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    // Update views
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh data in view if needed
    if (tabName === 'saved') {
      const activeBtn = document.querySelector('.saved-subtab-btn.active');
      const subtab = activeBtn ? activeBtn.dataset.subtab : 'favs';
      this.renderSavedSubtab(subtab);
    } else if (tabName === 'stats') {
      this.renderStatsView();
    }
  },

  renderAll() {
    this.renderDailyBookHero();
    this.renderBooksGrid();
    this.renderStatsBar();
  },

  // 1. RENDER HERO DAILY BOOK
  renderDailyBookHero() {
    const dailyBook = getDailyBook();
    const heroContainer = document.getElementById('daily-book-hero-container');
    if (!heroContainer || !dailyBook) return;

    const isFav = StorageManager.isFavorite(dailyBook.id);

    heroContainer.innerHTML = `
      <div class="daily-hero-card" style="border-top: 4px solid ${dailyBook.themeSeed}">
        <div class="daily-hero-badge">
          <span class="material-symbols-rounded filled" style="font-size: 16px;">auto_awesome</span>
          <span>كتاب اليوم المختار • 3 صفحات</span>
        </div>

        <div class="daily-hero-content">
          <div class="daily-details">
            <h2>${dailyBook.title}</h2>
            <div class="daily-author">
              <span class="material-symbols-rounded" style="font-size: 18px;">person</span>
              <span>${dailyBook.author}</span>
            </div>

            <div style="font-size: 16px; font-weight: 800; color: var(--md-sys-color-primary); margin: 10px 0 6px; line-height: 1.5;">
              «${this.getSmartHookQuestion(dailyBook)}»
            </div>

            <div class="daily-summary-quote">
              "${dailyBook.summaryQuote}"
            </div>

            <div class="daily-meta-chips">
              <span class="meta-chip">
                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--md-sys-color-primary);">timer</span>
                <span>${dailyBook.readTime}</span>
              </span>
              <span class="meta-chip">
                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--md-sys-color-tertiary);">category</span>
                <span>${dailyBook.categoryName}</span>
              </span>
              <span class="meta-chip">
                <span class="material-symbols-rounded filled" style="font-size: 16px; color: #f59f00;">star</span>
                <span>${dailyBook.rating}</span>
              </span>
            </div>

            <div class="hero-actions">
              <button class="m3-btn-filled" onclick="App.openReader('${dailyBook.id}')">
                <span class="material-symbols-rounded filled">menu_book</span>
                <span>ابدأ قراءة الـ 3 صفحات</span>
              </button>
              <button class="m3-btn-tonal" onclick="App.quickPlayAudio('${dailyBook.id}')">
                <span class="material-symbols-rounded filled">volume_up</span>
                <span>استماع صوتي</span>
              </button>
              <button class="m3-icon-btn ${isFav ? 'active' : ''}" style="color: ${isFav ? '#e03131' : 'inherit'}" onclick="App.toggleFav('${dailyBook.id}', this)" title="إضافة للمفضلة">
                <span class="material-symbols-rounded ${isFav ? 'filled' : ''}">favorite</span>
              </button>
            </div>
          </div>

          <div class="daily-cover-wrap">
            <div class="book-cover" style="background: ${dailyBook.gradient};">
              <div class="cover-badge">${dailyBook.coverBadge}</div>
              <div>
                <div class="cover-title">${dailyBook.title}</div>
                <div class="cover-author">${dailyBook.author.split('(')[0]}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getSmartHookQuestion(book) {
    if (!book) return 'كيف تصنع من أفعالك اليومية نقطة انطلاق لتغيير مصيرك؟';
    if (book.hookQuestion) return book.hookQuestion;
    const cat = (book.category || '').toLowerCase();
    const title = (book.title || '').toLowerCase();
    if (title.includes('مال') || title.includes('ثرو') || cat.includes('business')) {
      return 'هل الثروة الحقيقية هي ما تنفقه وتستعرضه، أم ما تدخره ليمنحك الحرية؟';
    } else if (title.includes('تفكير') || title.includes('إيجاب') || cat.includes('psychology')) {
      return 'كيف تحرر عقلك من التفكير السلبي وتستعيد ثقتك الكاملة لمواجهة أي تحدٍ؟';
    } else if (title.includes('عادة') || title.includes('عادات')) {
      return 'كيف تبني عادة تدوم طويلاً دون أن تفقد شغفك في اليوم الرابع؟';
    } else if (title.includes('تركيز') || title.includes('عميق') || cat.includes('productivity')) {
      return 'كيف تستعيد تركيزك العميق في عالم مصمم لتشتيت انتباهك كل دقيقة؟';
    }
    return 'كيف تصنع من جوهر هذه الأفكار قوة يومية ملموسة تغير بها واقعك؟';
  },

  // 2. RENDER BOOKS GRID
  renderBooksGrid() {
    const homeGrid = document.getElementById('books-grid');
    const libGrid = document.getElementById('library-books-grid');

    let filtered = BOOKS_DATA;

    // Filter by Category
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(b => b.category === this.currentCategory);
    }

    // Filter by Search Query
    if (this.searchQuery) {
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(this.searchQuery) ||
        b.author.toLowerCase().includes(this.searchQuery) ||
        b.summaryQuote.toLowerCase().includes(this.searchQuery)
      );
    }

    const cardsHtml = filtered.length === 0 ? `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-symbols-rounded empty-state-icon">search_off</span>
        <div class="empty-state-title">لم يتم العثور على كتب مطابقة</div>
        <div class="empty-state-desc">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً.</div>
      </div>
    ` : filtered.map(book => {
      const isFav = StorageManager.isFavorite(book.id);
      return `
        <div class="book-card" onclick="App.openReader('${book.id}')">
          <div class="card-mini-cover" style="background: ${book.gradient};">
            <span class="cover-badge" style="font-size: 8px;">3 صفحات</span>
            <div>
              <div class="cover-title">${book.title}</div>
              <div class="cover-author">${book.author.split('(')[0]}</div>
            </div>
          </div>

          <div class="book-card-info">
            <div>
              <div class="card-top">
                <h3 class="card-title">${book.title}</h3>
                <button class="card-fav-btn ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFav('${book.id}', this)" title="المفضلة">
                  <span class="material-symbols-rounded ${isFav ? 'filled' : ''}" style="font-size: 20px;">favorite</span>
                </button>
              </div>
              <div class="card-author">${book.author}</div>
              <div class="card-concept">"${book.summaryQuote}"</div>
            </div>

            <div class="card-bottom-meta">
              <span class="card-badge-3pages">
                <span class="material-symbols-rounded" style="font-size: 12px; vertical-align: middle;">menu_book</span>
                3 صفحات
              </span>
              <span>
                <span class="material-symbols-rounded" style="font-size: 13px; vertical-align: middle; color: var(--md-sys-color-primary);">timer</span>
                ${book.readTime}
              </span>
              <span>
                <span class="material-symbols-rounded filled" style="font-size: 13px; vertical-align: middle; color: #f59f00;">star</span>
                ${book.rating}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (homeGrid) homeGrid.innerHTML = cardsHtml;
    if (libGrid) libGrid.innerHTML = cardsHtml;
  },

  // 3. STATS STRIP ON HOME
  renderStatsBar() {
    const stats = StorageManager.getStats();
    const streakElem = document.getElementById('stat-streak-val');
    const booksElem = document.getElementById('stat-books-val');
    const timerElem = document.getElementById('stat-timer-val');

    if (streakElem) streakElem.textContent = `${stats.streakCount} أيام`;
    if (booksElem) booksElem.textContent = `${stats.completedCount} كتب`;
    if (timerElem) timerElem.textContent = `${stats.readingMinutes} دقيقة`;
  },

  // 4. FAVORITE TOGGLE
  toggleFav(bookId, btn) {
    const isFav = StorageManager.toggleFavorite(bookId);
    if (btn) {
      btn.classList.toggle('active', isFav);
      const icon = btn.querySelector('.material-symbols-rounded');
      if (icon) {
        icon.classList.toggle('filled', isFav);
      }
    }
    this.showToast(isFav ? 'تمت إضافة الكتاب إلى المفضلة ❤️' : 'تم الحذف من المفضلة');
    if (this.activeTab === 'saved') {
      this.renderSavedSubtab('favs');
    }
  },

  // ==========================================================================
  // 3-PAGE INTERACTIVE READER
  // ==========================================================================
  openReader(bookId, startPage = 0) {
    const book = BOOKS_DATA.find(b => b.id === bookId);
    if (!book) return;

    this.activeBook = book;
    this.activeReaderPage = startPage;

    // Apply book seed
    ThemeEngine.applyBookSeed(book.themeSeed);

    const readerScreen = document.getElementById('reader-screen');
    const readerTitle = document.getElementById('reader-book-title');
    const readerAuthor = document.getElementById('reader-book-author');
    const readerSlider = document.getElementById('reader-slider');

    if (readerTitle) readerTitle.textContent = book.title;
    if (readerAuthor) readerAuthor.textContent = book.author;

    // Render 3 pages HTML
    if (readerSlider) {
      readerSlider.innerHTML = book.pages.map(page => `
        <div class="reader-page">
          <div class="reader-page-inner">
            <div class="page-badge-header">
              <span class="material-symbols-rounded filled" style="font-size: 16px;">filter_3</span>
              <span>الصفحة ${page.pageNumber} من 3</span>
            </div>

            <h2 class="page-headline">${page.pageTitle}</h2>

            <div class="reader-lead">${page.lead}</div>

            ${page.paragraphs.map(p => `
              <p class="reader-paragraph">${p}</p>
            `).join('')}

            ${page.box ? `
              <div class="reader-highlight-box">
                <div class="box-title">
                  <span class="material-symbols-rounded filled">lightbulb</span>
                  <span>${page.box.title}</span>
                </div>
                <div>${page.box.text}</div>
              </div>
            ` : ''}

            <div class="takeaways-card">
              <div class="takeaways-title">
                <span class="material-symbols-rounded filled">check_circle</span>
                <span>النقاط الجوهرية للصفحة:</span>
              </div>
              ${page.takeaways.map(t => `
                <div class="takeaway-item">
                  <span class="material-symbols-rounded takeaway-icon">arrow_left</span>
                  <span>${t}</span>
                </div>
              `).join('')}
            </div>

            <div class="page-quote-block">
              "${page.quote}"
              <div style="text-align: left; margin-top: 8px;">
                <button class="m3-btn-outlined" style="font-size: 12px; padding: 4px 12px;" onclick="App.openQuoteStudio('${page.quote.replace(/'/g, "\\'")}')">
                  <span class="material-symbols-rounded" style="font-size: 16px;">photo_camera</span>
                  <span>صناعة بطاقة مشاركة</span>
                </button>
              </div>
            </div>

            ${page.pageNumber === 3 ? `
              <div class="completion-celebration">
                <span class="celebration-icon">🎉</span>
                <div class="celebration-title">أحسنت! أتممت قراءة ملخص الكتاب بالكامل</div>
                <div class="celebration-desc">تمت إضافة نقاط القراءة وحفظ إنجاز اليوم في سجلك.</div>
                <div class="celebration-actions">
                  <button class="m3-btn-filled" onclick="App.openNoteModal()">
                    <span class="material-symbols-rounded">edit_note</span>
                    <span>تدوين خاطرة أو ملاحظة</span>
                  </button>
                  <button class="m3-btn-tonal" onclick="PdfExporter.exportBook(App.activeBook)">
                    <span class="material-symbols-rounded">download</span>
                    <span>تصدير PDF</span>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    this.updateReaderPagePosition();
    if (readerScreen) readerScreen.classList.add('active');

    // Update reader font size
    StorageManager.setReaderFontSize(StorageManager.getReaderFontSize());
  },

  closeReader() {
    const readerScreen = document.getElementById('reader-screen');
    if (readerScreen) readerScreen.classList.remove('active');
    AudioPlayer.hideAudioBar();
    ThemeEngine.resetBookSeed();
    this.renderStatsBar();
  },

  goToReaderPage(pageIndex) {
    if (pageIndex < 0 || pageIndex > 2) return;
    this.activeReaderPage = pageIndex;
    this.updateReaderPagePosition();

    // If audio is playing, switch to new page audio
    if (AudioPlayer.isPlaying && this.activeBook) {
      AudioPlayer.playPage(this.activeBook, this.activeReaderPage);
    }

    // If on page 3, mark as completed
    if (pageIndex === 2 && this.activeBook) {
      StorageManager.markBookCompleted(this.activeBook.id);
    }
  },

  nextReaderPage() {
    if (this.activeReaderPage < 2) {
      this.goToReaderPage(this.activeReaderPage + 1);
    }
  },

  prevReaderPage() {
    if (this.activeReaderPage > 0) {
      this.goToReaderPage(this.activeReaderPage - 1);
    }
  },

  updateReaderPagePosition() {
    const slider = document.getElementById('reader-slider');
    const indicatorText = document.getElementById('page-indicator-text');
    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');

    if (slider) {
      // In RTL, positive translateX shifts left
      slider.style.transform = `translateX(${this.activeReaderPage * 33.3333}%)`;
    }

    if (indicatorText) {
      indicatorText.textContent = `الصفحة ${this.activeReaderPage + 1} من 3`;
    }

    // Update Step Pills
    document.querySelectorAll('.page-step-pill').forEach((pill, idx) => {
      pill.classList.toggle('active', idx === this.activeReaderPage);
      pill.classList.toggle('completed', idx < this.activeReaderPage);
    });

    // Update buttons
    if (prevBtn) prevBtn.disabled = this.activeReaderPage === 0;
    if (nextBtn) {
      if (this.activeReaderPage === 2) {
        nextBtn.innerHTML = `<span>إنهاء</span><span class="material-symbols-rounded filled">check</span>`;
        nextBtn.onclick = () => App.closeReader();
      } else {
        nextBtn.innerHTML = `<span>الصفحة التالية</span><span class="material-symbols-rounded">arrow_back</span>`;
        nextBtn.onclick = () => App.nextReaderPage();
      }
    }

    // Scroll active page to top
    const pages = document.querySelectorAll('.reader-page');
    if (pages[this.activeReaderPage]) {
      pages[this.activeReaderPage].scrollTop = 0;
    }
  },

  handleReaderSwipe() {
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left (in RTL, next page)
        this.nextReaderPage();
      } else {
        // Swipe right (in RTL, prev page)
        this.prevReaderPage();
      }
    }
  },

  // Quick Play Audio from Hero/Reader
  quickPlayAudio(bookId) {
    const book = BOOKS_DATA.find(b => b.id === bookId);
    if (!book) return;
    this.openReader(bookId, 0);
    AudioPlayer.playPage(book, 0);
  },

  toggleCurrentAudio() {
    if (AudioPlayer.isPlaying) {
      AudioPlayer.togglePlay();
    } else if (this.activeBook) {
      AudioPlayer.playPage(this.activeBook, this.activeReaderPage);
    }
  },

  // ==========================================================================
  // TEXT SELECTION & QUOTE SAVING
  // ==========================================================================
  handleTextSelection() {
    const selection = window.getSelection();
    const toolbar = document.getElementById('text-selection-toolbar');
    if (!toolbar) return;

    if (selection && selection.toString().trim().length > 10) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      toolbar.style.top = `${Math.max(10, rect.top - 50)}px`;
      toolbar.style.left = `${rect.left + rect.width / 2}px`;
      toolbar.classList.add('active');
    } else {
      toolbar.classList.remove('active');
    }
  },

  saveSelectedQuote() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text || !this.activeBook) return;

    const newQ = StorageManager.saveQuote(
      this.activeBook.id,
      this.activeBook.title,
      this.activeBook.author,
      text
    );

    if (newQ) {
      this.showToast('تم حفظ الاقتباس في مفضلتك ✨');
    } else {
      this.showToast('الاقتباس محفوظ مسبقاً');
    }

    const toolbar = document.getElementById('text-selection-toolbar');
    if (toolbar) toolbar.classList.remove('active');
    window.getSelection().removeAllRanges();
  },

  createCardFromSelection() {
    const selection = window.getSelection();
    const text = selection ? selection.toString().trim() : '';
    if (!text) return;
    this.openQuoteStudio(text);
  },

  // ==========================================================================
  // SOCIAL QUOTE CARD STUDIO
  // ==========================================================================
  openQuoteStudio(quoteText) {
    if (!this.activeBook && !quoteText) return;
    const quote = quoteText || (this.activeBook ? this.activeBook.summaryQuote : '');
    const author = this.activeBook ? this.activeBook.author : 'خلاصة';
    const bookTitle = this.activeBook ? this.activeBook.title : 'كتاب اليوم';
    const seed = this.activeBook ? this.activeBook.themeSeed : '#3b5ba9';

    const canvas = CardGenerator.generateCard({
      quote,
      author,
      bookTitle,
      gradientColor1: seed,
      gradientColor2: '#121316'
    });

    const previewContainer = document.getElementById('quote-card-preview-wrap');
    if (previewContainer) {
      previewContainer.innerHTML = '';
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.borderRadius = '16px';
      canvas.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
      previewContainer.appendChild(canvas);
    }

    // Set download action
    const downloadBtn = document.getElementById('btn-download-quote-card');
    if (downloadBtn) {
      downloadBtn.onclick = () => CardGenerator.downloadCard(canvas, `khulasa-${Date.now()}.png`);
    }

    // Set share action
    const shareBtn = document.getElementById('btn-share-quote-card');
    if (shareBtn) {
      shareBtn.onclick = () => CardGenerator.shareCard(canvas, bookTitle, quote);
    }

    // Open sheet
    const overlay = document.getElementById('modal-quote-studio');
    if (overlay) overlay.classList.add('active');
  },

  // ==========================================================================
  // NOTE TAKING MODAL
  // ==========================================================================
  openNoteModal() {
    const overlay = document.getElementById('modal-add-note');
    const noteBookTitle = document.getElementById('note-modal-book-title');
    const noteInput = document.getElementById('note-modal-input');

    if (noteBookTitle && this.activeBook) {
      noteBookTitle.textContent = `ملاحظة حول: ${this.activeBook.title}`;
    }
    if (noteInput) noteInput.value = '';
    if (overlay) overlay.classList.add('active');
  },

  submitNote() {
    const noteInput = document.getElementById('note-modal-input');
    const text = noteInput ? noteInput.value.trim() : '';
    if (!text || !this.activeBook) return;

    StorageManager.saveNote(this.activeBook.id, this.activeBook.title, text);
    this.showToast('تم تدوين الملاحظة بنجاح 📝');

    const overlay = document.getElementById('modal-add-note');
    if (overlay) overlay.classList.remove('active');

    if (this.activeTab === 'saved') {
      this.renderSavedSubtab('notes');
    }
  },

  // ==========================================================================
  // SAVED TAB & SUBTABS
  // ==========================================================================
  renderSavedSubtab(subtab = 'favs') {
    const container = document.getElementById('saved-content-container');
    if (!container) return;

    if (subtab === 'favs') {
      const favIds = StorageManager.getFavorites();
      const favBooks = BOOKS_DATA.filter(b => favIds.includes(b.id));

      if (favBooks.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-rounded empty-state-icon">favorite_border</span>
            <div class="empty-state-title">قائمة المفضلة فارغة</div>
            <div class="empty-state-desc">اضغط على أيقونة القلب على أي كتاب لإضافته هنا.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="books-grid">
          ${favBooks.map(b => `
            <div class="book-card" onclick="App.openReader('${b.id}')">
              <div class="card-mini-cover" style="background: ${b.gradient};">
                <span class="cover-badge" style="font-size: 8px;">3 صفحات</span>
                <div>
                  <div class="cover-title">${b.title}</div>
                  <div class="cover-author">${b.author.split('(')[0]}</div>
                </div>
              </div>
              <div class="book-card-info">
                <div>
                  <div class="card-top">
                    <h3 class="card-title">${b.title}</h3>
                    <button class="card-fav-btn active" onclick="event.stopPropagation(); App.toggleFav('${b.id}', this)">
                      <span class="material-symbols-rounded filled" style="font-size: 20px;">favorite</span>
                    </button>
                  </div>
                  <div class="card-author">${b.author}</div>
                  <div class="card-concept">"${b.summaryQuote}"</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (subtab === 'quotes') {
      const quotes = StorageManager.getSavedQuotes();
      if (quotes.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-rounded empty-state-icon">format_quote</span>
            <div class="empty-state-title">لا توجد اقتباسات محفوظة</div>
            <div class="empty-state-desc">حدد أي نص داخل قارئ الـ 3 صفحات أو اضغط زر الحفظ.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="quotes-list">
          ${quotes.map(q => `
            <div class="quote-card">
              <div class="quote-text">"${q.text}"</div>
              <div class="quote-source">
                <span><strong>${q.bookTitle}</strong> — ${q.author}</span>
                <div class="quote-actions">
                  <button class="m3-icon-btn" onclick="App.openQuoteStudio('${q.text.replace(/'/g, "\\'")}')" title="بطاقة صورة">
                    <span class="material-symbols-rounded" style="font-size: 18px;">photo_camera</span>
                  </button>
                  <button class="m3-icon-btn" onclick="StorageManager.deleteQuote('${q.id}'); App.renderSavedSubtab('quotes');" title="حذف">
                    <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (subtab === 'notes') {
      const notes = StorageManager.getNotes();
      if (notes.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <span class="material-symbols-rounded empty-state-icon">edit_note</span>
            <div class="empty-state-title">لا توجد ملاحظات مدونة</div>
            <div class="empty-state-desc">دون أفكارك وخلاصاتك أثناء القراءة لتثبيت المعرفة.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="notes-list">
          ${notes.map(n => `
            <div class="note-card">
              <div class="note-header">
                <span class="note-book-title">${n.bookTitle}</span>
                <span class="note-date">${n.date}</span>
              </div>
              <div class="note-body">${n.content}</div>
              <div style="text-align: left;">
                <button class="m3-icon-btn" onclick="StorageManager.deleteNote('${n.id}'); App.renderSavedSubtab('notes');" title="حذف الملاحظة">
                  <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  // ==========================================================================
  // STATS & STREAK VIEW
  // ==========================================================================
  renderStatsView() {
    const stats = StorageManager.getStats();
    const streakNum = document.getElementById('view-stats-streak-num');
    const compCount = document.getElementById('view-stats-comp-count');
    const minsCount = document.getElementById('view-stats-mins-count');
    const quotesCount = document.getElementById('view-stats-quotes-count');

    if (streakNum) streakNum.textContent = stats.streakCount;
    if (compCount) compCount.textContent = stats.completedCount;
    if (minsCount) minsCount.textContent = stats.readingMinutes;
    if (quotesCount) quotesCount.textContent = stats.savedQuotesCount;

    // Badges update
    const badges = [
      { id: 'b1', name: 'القارئ المبتدئ', desc: 'أتمم أول ملخص كتاب', unlocked: stats.completedCount >= 1, icon: '🌱' },
      { id: 'b2', name: 'شعلة الاستمرار', desc: 'حافظ على 3 أيام متتالية', unlocked: stats.streakCount >= 3, icon: '🔥' },
      { id: 'b3', name: 'باحث المعرفة', desc: 'أتمم قراءة 5 كتب', unlocked: stats.completedCount >= 5, icon: '🎓' },
      { id: 'b4', name: 'جامع الحكمة', desc: 'احفظ 3 اقتباسات ملهمة', unlocked: stats.savedQuotesCount >= 3, icon: '💎' },
      { id: 'b5', name: 'موسوعي فكري', desc: 'أتمم قراءة جميع الملخصات', unlocked: stats.completedCount >= BOOKS_DATA.length, icon: '👑' }
    ];

    const badgesContainer = document.getElementById('badges-grid-container');
    if (badgesContainer) {
      badgesContainer.innerHTML = badges.map(b => `
        <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
          <span class="badge-icon">${b.icon}</span>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>
      `).join('');
    }
  },

  // ==========================================================================
  // READER DISPLAY SETTINGS (FONT SIZE)
  // ==========================================================================
  changeFontSize(delta) {
    let current = StorageManager.getReaderFontSize();
    current = Math.min(26, Math.max(14, current + delta));
    StorageManager.setReaderFontSize(current);

    const valElem = document.getElementById('reader-font-size-val');
    if (valElem) valElem.textContent = `${current}px`;
  },

  // DAILY COUNTDOWN TIMER
  startDailyCountdown() {
    const timerElem = document.getElementById('daily-countdown-timer');
    if (!timerElem) return;

    function update() {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow - now;

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      timerElem.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    update();
    setInterval(update, 1000);
  },

  // ==========================================================================
  // ONLINE GOOGLE BOOKS SEARCH & AI SUMMARIZER
  // ==========================================================================
  async searchOnlineBooks() {
    const input = document.getElementById('online-book-search-input');
    const query = input ? input.value.trim() : '';
    if (!query) {
      this.showToast('يرجى كتابة اسم كتاب أو مؤلف للبحث أونلاين');
      return;
    }

    const container = document.getElementById('online-books-results-container');
    const loadingElem = document.getElementById('ai-loading-container');
    const stepText = document.getElementById('ai-loading-step-text');

    if (loadingElem && stepText) {
      stepText.textContent = `جاري البحث في Google Books عن: "${query}"...`;
      loadingElem.classList.add('active');
    }
    if (container) container.style.display = 'none';

    try {
      this.onlineSearchResults = await AISummarizer.searchGoogleBooks(query);
      if (loadingElem) loadingElem.classList.remove('active');

      if (this.onlineSearchResults.length === 0) {
        this.showToast('لم يتم العثور على نتائج من Google Books. جرب عنواناً آخر.');
        return;
      }

      this.renderOnlineSearchResults();
    } catch (err) {
      if (loadingElem) loadingElem.classList.remove('active');
      this.showToast('حدث خطأ أثناء الاتصال بالإنترنت.');
      console.error(err);
    }
  },

  renderOnlineSearchResults() {
    const container = document.getElementById('online-books-results-container');
    if (!container) return;

    container.innerHTML = this.onlineSearchResults.map((b, idx) => `
      <div class="online-book-result-card">
        ${b.thumbnail ? `<img src="${b.thumbnail}" class="online-book-thumb" alt="${b.title}">` : `
          <div class="online-book-thumb" style="display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(135deg,var(--md-sys-color-primary),var(--md-sys-color-tertiary));font-size:20px;font-weight:bold;">
            ${b.title.charAt(0)}
          </div>
        `}
        <div class="online-book-info">
          <div class="online-book-title">${b.title}</div>
          <div class="online-book-author">${b.authors} (${b.publishedDate})</div>
          <div class="online-book-desc">${b.description}</div>
          <button class="m3-btn-filled" onclick="App.summarizeOnlineBook(${idx})" style="font-size: 12px; padding: 6px 14px;">
            <span class="material-symbols-rounded" style="font-size: 16px;">auto_awesome</span>
            <span>لخّص في 3 صفحات بالذكاء الاصطناعي ⚡</span>
          </button>
        </div>
      </div>
    `).join('');

    container.style.display = 'flex';
  },

  async summarizeOnlineBook(index) {
    const bookMeta = this.onlineSearchResults[index];
    if (!bookMeta) return;

    const loadingElem = document.getElementById('ai-loading-container');
    const stepText = document.getElementById('ai-loading-step-text');
    const resultsContainer = document.getElementById('online-books-results-container');

    if (resultsContainer) resultsContainer.style.display = 'none';
    if (loadingElem) loadingElem.classList.add('active');

    try {
      const generatedBook = await AISummarizer.generate3PageSummary(bookMeta, (statusMsg) => {
        if (stepText) stepText.textContent = statusMsg;
      });

      // Save generated book
      AISummarizer.saveAIBook(generatedBook);

      if (loadingElem) loadingElem.classList.remove('active');
      this.showToast(`تم إعداد وتلخيص "${generatedBook.title}" في 3 صفحات! 🎉`);

      // Refresh libraries
      this.renderBooksGrid();

      // Immediately launch 3-page interactive reader
      this.openReader(generatedBook.id, 0);
    } catch (err) {
      if (loadingElem) loadingElem.classList.remove('active');
      this.showToast('حدث خطأ أثناء معالجة الملخص.');
      console.error(err);
    }
  },

  saveGeminiApiKey() {
    const input = document.getElementById('gemini-api-key-input');
    const key = input ? input.value.trim() : '';
    AISummarizer.setApiKey(key);
    this.showToast(key ? 'تم حفظ مفتاح Gemini API بنجاح 🔑' : 'تم مسح مفتاح API');
  },

  // SNACKBAR TOAST
  showToast(message) {
    const toast = document.getElementById('m3-snackbar');
    const toastText = document.getElementById('snackbar-text');
    if (toast && toastText) {
      toastText.textContent = message;
      toast.classList.add('show');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }
  }
};

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Bind Enter key for online search input
  const onlineInput = document.getElementById('online-book-search-input');
  if (onlineInput) {
    onlineInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        App.searchOnlineBooks();
      }
    });
  }
});

