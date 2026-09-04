/**
 * KHULASA - SOCIAL MEDIA QUOTE CARD STUDIO (HTML5 CANVAS)
 * Generates aesthetic Material You quote cards for Instagram, Twitter & WhatsApp.
 */

const CardGenerator = {
  generateCard({ quote, author, bookTitle, gradientColor1 = '#3b5ba9', gradientColor2 = '#1e293b' }) {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1080; // 1:1 Instagram Square
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, gradientColor1);
    gradient.addColorStop(1, gradientColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Background Grid & Glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.15, 250, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(width * 0.15, height * 0.85, 300, 0, Math.PI * 2);
    ctx.fill();

    // 3. Inner Card Frame (Glassmorphism effect)
    const cardMargin = 70;
    const cardRadius = 36;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;

    this.drawRoundedRect(
      ctx,
      cardMargin,
      cardMargin,
      width - cardMargin * 2,
      height - cardMargin * 2,
      cardRadius
    );
    ctx.fill();
    ctx.stroke();

    // 4. Header: Khulasa Branding & Daily Book Badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Readex Pro", "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('خُـلاصة 📚', width - cardMargin - 50, cardMargin + 80);

    ctx.font = '500 24px "Readex Pro", "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('كتاب كل يوم في 3 صفحات', width - cardMargin - 50, cardMargin + 120);

    // 5. Quote Symbol
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 160px "Georgia", serif';
    ctx.textAlign = 'right';
    ctx.fillText('“', width - cardMargin - 40, cardMargin + 250);

    // 6. Quote Text (Multi-line text wrapper with RTL support)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Readex Pro", "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    const maxTextWidth = width - cardMargin * 2 - 100;
    const lineHeight = 66;
    const startY = 380;

    this.wrapText(ctx, `"${quote}"`, width - cardMargin - 50, startY, maxTextWidth, lineHeight);

    // 7. Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardMargin + 50, height - cardMargin - 180);
    ctx.lineTo(width - cardMargin - 50, height - cardMargin - 180);
    ctx.stroke();

    // 8. Footer: Book Title & Author
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Readex Pro", "Cairo", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(bookTitle, width - cardMargin - 50, height - cardMargin - 120);

    ctx.font = '400 24px "Readex Pro", "Cairo", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`— ${author}`, width - cardMargin - 50, height - cardMargin - 75);

    // Watermark tag
    ctx.font = '500 20px "Readex Pro", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('khulasa.app', cardMargin + 50, height - cardMargin - 80);

    return canvas;
  },

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  },

  downloadCard(canvas, filename = 'khulasa-quote.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  },

  async shareCard(canvas, title, text) {
    if (navigator.share && navigator.canShare) {
      try {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'khulasa-quote.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text,
              files: [file]
            });
          } else {
            await navigator.share({ title, text, url: window.location.href });
          }
        });
      } catch (err) {
        console.warn('Share error:', err);
      }
    } else {
      this.downloadCard(canvas);
    }
  }
};
