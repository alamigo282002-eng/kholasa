/**
 * KHULASA - ENHANCED WEB SPEECH SYNTHESIS AUDIO PLAYER (TTS)
 * Features:
 * - Granular chunk-by-chunk Arabic narration
 * - Play / Pause / Replay 10s (prev chunk) / Forward 10s (next chunk)
 * - 5 Speed levels (0.75x, 1.0x, 1.25x, 1.5x, 2.0x)
 * - Pitch control
 * - Real-time progress & status feedback
 */

const AudioPlayer = {
  synth: window.speechSynthesis || null,
  currentUtterance: null,
  isPlaying: false,
  isPaused: false,
  playbackRate: 1.0,
  pitch: 1.0,
  currentBook: null,
  currentPageIndex: 0,
  speechVoices: [],
  chunks: [],
  currentChunkIndex: 0,

  init() {
    if (this.synth) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  },

  loadVoices() {
    if (!this.synth) return;
    this.speechVoices = this.synth.getVoices();
  },

  getArabicVoice() {
    return (
      this.speechVoices.find(v => v.lang.startsWith('ar') || v.lang.includes('ar-EG') || v.lang.includes('ar-SA')) ||
      this.speechVoices[0] ||
      null
    );
  },

  playPage(book, pageIndex = 0) {
    if (!this.synth) {
      alert('المتصفح الحالي لا يدعم ميزة تحويل النص إلى صوت.');
      return;
    }

    this.stop();
    this.currentBook = book;
    this.currentPageIndex = pageIndex;

    const page = book.pages[pageIndex];
    if (!page) return;

    // Build chunks
    const rawChunks = [
      page.pageTitle,
      page.lead,
      ...(page.paragraphs || []),
      page.box ? `${page.box.title}: ${page.box.text}` : '',
      ...(page.takeaways || []).map(t => `نقطة هامة: ${t}`),
      page.quote ? `اقتباس: ${page.quote}` : ''
    ].filter(Boolean);

    this.chunks = rawChunks;
    this.currentChunkIndex = 0;

    this.showAudioBar(book.title, pageIndex + 1);
    this.speakCurrentChunk();
  },

  speakCurrentChunk() {
    if (!this.synth || !this.chunks.length) return;
    if (this.currentChunkIndex >= this.chunks.length) {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentChunkIndex = 0;
      this.updateUI();
      return;
    }

    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const text = this.chunks[this.currentChunkIndex];
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = 'ar-SA';
    this.currentUtterance.rate = this.playbackRate;
    this.currentUtterance.pitch = this.pitch;

    const arVoice = this.getArabicVoice();
    if (arVoice) {
      this.currentUtterance.voice = arVoice;
    }

    this.currentUtterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.updateUI();
    };

    this.currentUtterance.onend = () => {
      if (this.isPlaying && !this.isPaused) {
        this.currentChunkIndex++;
        if (this.currentChunkIndex < this.chunks.length) {
          this.speakCurrentChunk();
        } else {
          this.isPlaying = false;
          this.isPaused = false;
          this.updateUI();
        }
      }
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      this.isPlaying = false;
      this.isPaused = false;
      this.updateUI();
    };

    this.synth.speak(this.currentUtterance);
  },

  togglePlay() {
    if (!this.synth) return;

    if (this.synth.speaking) {
      if (this.synth.paused) {
        this.synth.resume();
        this.isPaused = false;
        this.isPlaying = true;
      } else {
        this.synth.pause();
        this.isPaused = true;
        this.isPlaying = false;
      }
    } else if (this.currentBook) {
      if (this.chunks.length && this.currentChunkIndex < this.chunks.length) {
        this.speakCurrentChunk();
      } else {
        this.playPage(this.currentBook, this.currentPageIndex);
      }
    }
    this.updateUI();
  },

  replay10() {
    if (!this.chunks.length) return;
    this.currentChunkIndex = Math.max(0, this.currentChunkIndex - 1);
    this.speakCurrentChunk();
  },

  forward10() {
    if (!this.chunks.length) return;
    if (this.currentChunkIndex < this.chunks.length - 1) {
      this.currentChunkIndex++;
      this.speakCurrentChunk();
    }
  },

  cycleSpeed() {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(this.playbackRate);
    this.playbackRate = speeds[(currentIndex + 1) % speeds.length];

    const speedBtn = document.getElementById('audio-speed-btn');
    if (speedBtn) {
      speedBtn.textContent = `${this.playbackRate}x`;
    }

    if (this.isPlaying) {
      this.speakCurrentChunk();
    }
  },

  setPitch(val) {
    this.pitch = Math.max(0.5, Math.min(2.0, val));
    if (this.isPlaying) {
      this.speakCurrentChunk();
    }
  },

  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.currentChunkIndex = 0;
    this.updateUI();
  },

  showAudioBar(title, pageNum) {
    const bar = document.getElementById('floating-audio-bar');
    const label = document.getElementById('audio-text-label');
    if (bar && label) {
      label.textContent = `${title} • ص ${pageNum}`;
      bar.classList.remove('hidden');
      if (this.isPlaying) {
        bar.classList.add('playing');
      }
    }
    this.updateUI();
  },

  hideAudioBar() {
    this.stop();
    const bar = document.getElementById('floating-audio-bar');
    if (bar) {
      bar.classList.add('hidden');
      bar.classList.remove('playing');
    }
  },

  updateUI() {
    const playFabIcon = document.getElementById('audio-play-icon');
    const bar = document.getElementById('floating-audio-bar');
    const chunkLabel = document.getElementById('audio-chunk-label');

    if (playFabIcon) {
      playFabIcon.textContent = this.isPlaying && !this.isPaused ? 'pause' : 'play_arrow';
    }
    if (chunkLabel && this.chunks.length) {
      const current = Math.min(this.chunks.length, this.currentChunkIndex + 1);
      chunkLabel.textContent = `فقرة ${current} من ${this.chunks.length}`;
    }
    if (bar) {
      if (this.isPlaying && !this.isPaused) {
        bar.classList.add('playing');
      } else {
        bar.classList.remove('playing');
      }
    }
  }
};
