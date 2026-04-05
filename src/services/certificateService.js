import html2canvas from 'html2canvas';

/**
 * Generates a certificate PNG by rendering a hidden DOM element.
 * @param {Object} opts
 * @param {string} opts.studentName
 * @param {string} opts.courseName
 * @param {string} opts.certificateId
 * @param {string} opts.completionDate   — ISO or formatted string
 * @param {string} [opts.category]
 * @returns {Promise<string>}  — data URL (PNG)
 */
export async function generateCertificatePng(opts) {
  const { studentName, courseName, certificateId, completionDate, category = 'Islamic Studies' } = opts;

  // Build a temporary DOM node
  const container = document.createElement('div');
  container.style.cssText = `
    position:fixed; left:-9999px; top:-9999px;
    width:900px; height:636px;
    font-family:'Cinzel','Times New Roman',serif;
    background:#0A1628;
    border:3px solid #D4A853;
    box-sizing:border-box;
    overflow:hidden;
  `;

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;600;700;900&family=Nunito:wght@400;600;700;800&display=swap');
      * { box-sizing:border-box; margin:0; padding:0; }
    </style>

    <!-- Corner ornaments -->
    <svg style="position:absolute;top:0;left:0;width:120px;height:120px" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0 L120 0 L0 120 Z" fill="#D4A853" fill-opacity="0.08"/>
      <path d="M10 0 L10 80 M0 10 L80 10" stroke="#D4A853" stroke-width="1.5" stroke-opacity="0.5"/>
      <circle cx="10" cy="10" r="4" fill="#D4A853" fill-opacity="0.7"/>
    </svg>
    <svg style="position:absolute;top:0;right:0;width:120px;height:120px;transform:scaleX(-1)" viewBox="0 0 120 120" fill="none">
      <path d="M0 0 L120 0 L0 120 Z" fill="#D4A853" fill-opacity="0.08"/>
      <path d="M10 0 L10 80 M0 10 L80 10" stroke="#D4A853" stroke-width="1.5" stroke-opacity="0.5"/>
      <circle cx="10" cy="10" r="4" fill="#D4A853" fill-opacity="0.7"/>
    </svg>
    <svg style="position:absolute;bottom:0;left:0;width:120px;height:120px;transform:scaleY(-1)" viewBox="0 0 120 120" fill="none">
      <path d="M0 0 L120 0 L0 120 Z" fill="#D4A853" fill-opacity="0.08"/>
      <path d="M10 0 L10 80 M0 10 L80 10" stroke="#D4A853" stroke-width="1.5" stroke-opacity="0.5"/>
      <circle cx="10" cy="10" r="4" fill="#D4A853" fill-opacity="0.7"/>
    </svg>
    <svg style="position:absolute;bottom:0;right:0;width:120px;height:120px;transform:scale(-1)" viewBox="0 0 120 120" fill="none">
      <path d="M0 0 L120 0 L0 120 Z" fill="#D4A853" fill-opacity="0.08"/>
      <path d="M10 0 L10 80 M0 10 L80 10" stroke="#D4A853" stroke-width="1.5" stroke-opacity="0.5"/>
      <circle cx="10" cy="10" r="4" fill="#D4A853" fill-opacity="0.7"/>
    </svg>

    <!-- Geometric background pattern -->
    <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.03" viewBox="0 0 900 636">
      <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M30 0 L60 30 L30 60 L0 30 Z" fill="none" stroke="#D4A853" stroke-width="1"/>
        <circle cx="30" cy="30" r="8" fill="none" stroke="#D4A853" stroke-width="0.5"/>
      </pattern>
      <rect width="900" height="636" fill="url(#geo)"/>
    </svg>

    <!-- Inner border -->
    <div style="
      position:absolute; inset:16px;
      border:1px solid rgba(212,168,83,0.3);
      pointer-events:none;
    "></div>

    <!-- Content -->
    <div style="
      position:relative; z-index:1;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      height:100%; padding:48px;
    ">
      <!-- Arabic Bismillah -->
      <div style="
        font-family:'Amiri',serif; font-size:22px; color:#D4A853;
        margin-bottom:8px; text-align:center; opacity:0.9;
      ">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</div>

      <!-- Logo/Brand -->
      <div style="
        font-family:'Cinzel',serif; font-size:32px; font-weight:900;
        color:#D4A853; letter-spacing:4px; margin-bottom:4px;
        text-transform:uppercase;
      ">AL KAWSER</div>
      <div style="
        font-size:11px; color:#8B9BB4; letter-spacing:6px;
        text-transform:uppercase; margin-bottom:24px;
      ">ISLAMIC LEARNING PLATFORM</div>

      <!-- Gold divider -->
      <div style="
        width:200px; height:1px;
        background:linear-gradient(to right,transparent,#D4A853,transparent);
        margin-bottom:24px;
      "></div>

      <!-- Certificate title -->
      <div style="
        font-family:'Cinzel',serif; font-size:13px; letter-spacing:5px;
        color:#8B9BB4; text-transform:uppercase; margin-bottom:16px;
      ">Certificate of Completion</div>

      <!-- This is to certify -->
      <div style="
        font-family:'Nunito',sans-serif; font-size:14px; color:#B8AC98;
        margin-bottom:12px;
      ">This is to certify that</div>

      <!-- Student Name -->
      <div style="
        font-family:'Cinzel',serif; font-size:36px; font-weight:700;
        color:#E8DCC8; margin-bottom:12px;
        text-shadow:0 0 30px rgba(212,168,83,0.3);
      ">${studentName}</div>

      <!-- Description -->
      <div style="
        font-family:'Nunito',sans-serif; font-size:14px; color:#B8AC98;
        margin-bottom:8px;
      ">has successfully completed the course</div>

      <!-- Course Name -->
      <div style="
        font-family:'Cinzel',serif; font-size:22px; font-weight:600;
        color:#D4A853; margin-bottom:24px; text-align:center;
        max-width:600px; line-height:1.4;
      ">${courseName}</div>

      <!-- Gold divider -->
      <div style="
        width:120px; height:1px;
        background:linear-gradient(to right,transparent,#D4A853,transparent);
        margin-bottom:24px;
      "></div>

      <!-- Footer row -->
      <div style="
        display:flex; justify-content:space-between; align-items:center;
        width:100%; max-width:600px;
      ">
        <div style="text-align:center;">
          <div style="
            width:100px; height:1px; background:#1C2E4A; margin-bottom:6px;
          "></div>
          <div style="font-family:'Nunito',sans-serif;font-size:11px;color:#8B9BB4;">
            ${new Date(completionDate).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div style="font-size:10px;color:#4A5E78;margin-top:2px;">Completion Date</div>
        </div>

        <!-- Seal -->
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="none" stroke="#D4A853" stroke-width="1.5" stroke-dasharray="4 3"/>
          <circle cx="40" cy="40" r="30" fill="rgba(212,168,83,0.08)" stroke="#D4A853" stroke-width="1"/>
          <text x="40" y="37" text-anchor="middle" font-family="'Amiri',serif" font-size="10" fill="#D4A853">الكوثر</text>
          <text x="40" y="50" text-anchor="middle" font-family="'Cinzel',serif" font-size="7" fill="#8B9BB4" letter-spacing="1">VERIFIED</text>
        </svg>

        <div style="text-align:center;">
          <div style="
            width:100px; height:1px; background:#1C2E4A; margin-bottom:6px;
          "></div>
          <div style="font-family:'Nunito',sans-serif;font-size:11px;color:#8B9BB4;">
            ${certificateId}
          </div>
          <div style="font-size:10px;color:#4A5E78;margin-top:2px;">Certificate ID</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0A1628',
      logging: false,
    });
    return canvas.toDataURL('image/png', 0.95);
  } finally {
    document.body.removeChild(container);
  }
}

/** Trigger browser download of the certificate PNG */
export function downloadCertificate(dataUrl, filename = 'al-kawser-certificate.png') {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
