/**
 * KHULASA - LOCAL STORAGE MANAGER
 * Manages bookmarks, user notes, highlighted quotes, and reading progress.
 */

const StorageManager = {
  KEYS: {
    FAVORITES: 'khulasa_favs',
    NOTES: 'khulasa_notes',
    SAVED_QUOTES: 'khulasa_quotes',
    COMPLETED_BOOKS: 'khulasa_completed',
    READING_MINUTES: 'khulasa_reading_mins',
    LAST_READ_DATE: 'khulasa_last_read_date',
    STREAK_COUNT: 'khulasa_streak_count',
    READER_FONT_SIZE: 'khulasa_reader_fs'
  },

  // --- FAVORITES ---
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES)) || [];
    } catch {
      return [];
    }
  },

  isFavorite(bookId) {
    const favs = this.getFavorites();
    return favs.includes(bookId);
  },

  toggleFavorite(bookId) {
    let favs = this.getFavorites();
    if (favs.includes(bookId)) {
      favs = favs.filter(id => id !== bookId);
    } else {
      favs.push(bookId);
    }
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favs));
    return favs.includes(bookId);
  },

  // --- NOTES ---
  getNotes() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.NOTES)) || [];
    } catch {
      return [];
    }
  },

  saveNote(bookId, bookTitle, content) {
    if (!content.trim()) return null;
    const notes = this.getNotes();
    const newNote = {
      id: 'note_' + Date.now(),
      bookId,
      bookTitle,
      content: content.trim(),
      date: new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
    };
    notes.unshift(newNote);
    localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
    return newNote;
  },

  deleteNote(noteId) {
    let notes = this.getNotes();
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
  },

  // --- SAVED QUOTES ---
  getSavedQuotes() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.SAVED_QUOTES)) || [];
    } catch {
      return [];
    }
  },

  saveQuote(bookId, bookTitle, author, text) {
    if (!text.trim()) return null;
    const quotes = this.getSavedQuotes();
    // Prevent duplicates
    if (quotes.some(q => q.text === text.trim())) return null;

    const newQuote = {
      id: 'quote_' + Date.now(),
      bookId,
      bookTitle,
      author,
      text: text.trim(),
      date: new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
    };
    quotes.unshift(newQuote);
    localStorage.setItem(this.KEYS.SAVED_QUOTES, JSON.stringify(quotes));
    return newQuote;
  },

  deleteQuote(quoteId) {
    let quotes = this.getSavedQuotes();
    quotes = quotes.filter(q => q.id !== quoteId);
    localStorage.setItem(this.KEYS.SAVED_QUOTES, JSON.stringify(quotes));
  },

  // --- COMPLETED BOOKS & READ STATS ---
  getCompletedBooks() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.COMPLETED_BOOKS)) || [];
    } catch {
      return [];
    }
  },

  markBookCompleted(bookId) {
    const completed = this.getCompletedBooks();
    if (!completed.includes(bookId)) {
      completed.push(bookId);
      localStorage.setItem(this.KEYS.COMPLETED_BOOKS, JSON.stringify(completed));
    }
    this.recordReadingActivity();
  },

  recordReadingActivity(minutes = 4) {
    const currentMins = parseInt(localStorage.getItem(this.KEYS.READING_MINUTES) || '0', 10);
    localStorage.setItem(this.KEYS.READING_MINUTES, (currentMins + minutes).toString());

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem(this.KEYS.LAST_READ_DATE);
    let streak = parseInt(localStorage.getItem(this.KEYS.STREAK_COUNT) || '0', 10);

    if (!lastDate) {
      streak = 1;
    } else if (lastDate === today) {
      // Already read today, maintain streak
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        streak += 1;
      } else {
        streak = 1; // Streak reset if missed a day
      }
    }

    localStorage.setItem(this.KEYS.LAST_READ_DATE, today);
    localStorage.setItem(this.KEYS.STREAK_COUNT, streak.toString());
  },

  getStats() {
    return {
      completedCount: this.getCompletedBooks().length,
      readingMinutes: parseInt(localStorage.getItem(this.KEYS.READING_MINUTES) || '12', 10),
      streakCount: parseInt(localStorage.getItem(this.KEYS.STREAK_COUNT) || '1', 10),
      savedQuotesCount: this.getSavedQuotes().length,
      notesCount: this.getNotes().length
    };
  },

  // --- READER FONT SIZE ---
  getReaderFontSize() {
    return parseInt(localStorage.getItem(this.KEYS.READER_FONT_SIZE) || '18', 10);
  },

  setReaderFontSize(size) {
    localStorage.setItem(this.KEYS.READER_FONT_SIZE, size.toString());
    document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
  }
};
