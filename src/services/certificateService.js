import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import React from 'react';
import CertificateCanvas from '../components/certificates/CertificateCanvas';

export function buildCertificateVerificationUrl(certificateId) {
  if (!certificateId) return '';
  const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (publicSiteUrl) {
    return `${publicSiteUrl}/verify-certificate/${encodeURIComponent(certificateId)}`;
  }
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/verify-certificate/${encodeURIComponent(certificateId)}`;
  }
  return `${window.location.origin}/verify-certificate/${encodeURIComponent(certificateId)}`;
}

async function waitForImages(container) {
  const images = Array.from(container.querySelectorAll('img'));
  if (!images.length) return;

  await Promise.all(images.map((img) => (
    img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        })
  )));
}

async function buildQrDataUrl(certificateId) {
  if (!certificateId) return '';
  const payload = buildCertificateVerificationUrl(certificateId);
  try {
    return await QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0B5D3B',
        light: '#FFFFFF',
      },
    });
  } catch {
    return '';
  }
}

async function renderCertificateToCanvas(opts, { scale = 3 } = {}) {
  const qrDataUrl = opts.qrDataUrl || await buildQrDataUrl(opts.certificateId);
  const resolvedOpts = { ...opts, qrDataUrl };
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;';

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  `;
  container.appendChild(style);

  const rootEl = document.createElement('div');
  container.appendChild(rootEl);
  document.body.appendChild(container);

  const root = createRoot(rootEl);
  root.render(React.createElement(CertificateCanvas, resolvedOpts));

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
  await waitForImages(container);

  const canvas = await html2canvas(rootEl, {
    scale,
    useCORS: true,
    backgroundColor: '#FDFBF7',
    logging: false,
  });

  root.unmount();
  document.body.removeChild(container);

  return canvas;
}

export async function generateCertificatePng(opts, { scale = 3 } = {}) {
  const canvas = await renderCertificateToCanvas(opts, { scale });
  return canvas.toDataURL('image/png', 0.98);
}

export async function generateCertificatePdf(opts) {
  const canvas = await renderCertificateToCanvas(opts, { scale: 3 });
  const png = canvas.toDataURL('image/png', 0.98);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.addImage(png, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  return pdf.output('blob');
}

/** Trigger browser download of a certificate file */
export function downloadCertificate(data, filename) {
  const link = document.createElement('a');
  if (data instanceof Blob) {
    const url = URL.createObjectURL(data);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  link.href = data;
  link.download = filename;
  link.click();
}
