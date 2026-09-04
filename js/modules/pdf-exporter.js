/**
 * KHULASA - PDF & PRINT EXPORTER
 * Exports the 3-page book summary in an elegant printable sheet format.
 */

const PdfExporter = {
  exportBook(book) {
    if (!book) return;

    // Create an iframe to render clean printable HTML
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;

    const pagesHtml = book.pages.map(page => `
      <div class="print-page">
        <div class="page-header">
          <span class="page-num">صفحة ${page.pageNumber} من 3</span>
          <h2 class="page-title">${page.pageTitle}</h2>
        </div>
        <p class="page-lead">${page.lead}</p>
        ${page.paragraphs.map(p => `<p class="page-p">${p}</p>`).join('')}
        ${page.box ? `
          <div class="print-box">
            <strong>${page.box.title}:</strong> ${page.box.text}
          </div>
        ` : ''}
        <div class="print-takeaways">
          <h4>النقاط المستخلصة:</h4>
          <ul>
            ${page.takeaways.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>
        <blockquote class="print-quote">"${page.quote}"</blockquote>
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>ملخص كتاب ${book.title} - تطبيق خلاصة</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Readex+Pro:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 20mm 15mm;
          }
          body {
            font-family: 'Cairo', 'Readex Pro', sans-serif;
            color: #1a1a1a;
            line-height: 1.7;
            direction: rtl;
            background: #fff;
            padding: 20px;
          }
          .doc-header {
            text-align: center;
            border-bottom: 2px solid #3b5ba9;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .doc-brand {
            font-size: 14px;
            color: #3b5ba9;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .doc-title {
            font-size: 26px;
            font-weight: 800;
            color: #111;
            margin: 4px 0;
          }
          .doc-author {
            font-size: 15px;
            color: #666;
          }
          .print-page {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px dashed #ccc;
            page-break-inside: avoid;
          }
          .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
          }
          .page-num {
            background: #e8eefb;
            color: #3b5ba9;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
          }
          .page-title {
            font-size: 18px;
            font-weight: 700;
            color: #2b3a67;
            margin: 0;
          }
          .page-lead {
            font-size: 14.5px;
            font-weight: 600;
            color: #333;
            margin-bottom: 12px;
          }
          .page-p {
            font-size: 13.5px;
            color: #444;
            text-align: justify;
            margin-bottom: 10px;
          }
          .print-box {
            background: #f4f6fa;
            border-right: 4px solid #3b5ba9;
            padding: 10px 14px;
            margin: 12px 0;
            font-size: 13px;
            border-radius: 4px;
          }
          .print-takeaways {
            margin: 12px 0;
            background: #fafafa;
            padding: 10px 14px;
            border-radius: 6px;
          }
          .print-takeaways h4 {
            margin: 0 0 6px 0;
            font-size: 13px;
            color: #3b5ba9;
          }
          .print-takeaways ul {
            margin: 0;
            padding-right: 20px;
            font-size: 12.5px;
          }
          .print-quote {
            margin: 12px 0;
            padding: 8px 14px;
            background: #fdf3e7;
            border-right: 3px solid #e8590c;
            font-style: italic;
            font-size: 13px;
          }
          .doc-footer {
            text-align: center;
            font-size: 11px;
            color: #888;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <div class="doc-brand">خُـلاصة • كتاب كل يوم في 3 صفحات</div>
          <h1 class="doc-title">${book.title}</h1>
          <div class="doc-author">المؤلف: ${book.author} (${book.originalTitle})</div>
        </div>
        ${pagesHtml}
        <div class="doc-footer">
          تم تصدير هذا الملخص بواسطة تطبيق <strong>خلاصة</strong> © ${new Date().getFullYear()}
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Trigger print
    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 2000);
    }, 500);
  }
};
