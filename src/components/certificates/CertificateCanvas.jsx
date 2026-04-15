import React from 'react';
import logoAsset from '../../assets/logo.png';
import logo1Asset from '../../assets/logo1.png';
import logo2Asset from '../../assets/logo2.png';
import sealAsset from '../../assets/seal.png';
import signatureAsset from '../../assets/signature.png';

const COLORS = {
  green: '#0B5D3B',
  greenSoft: 'rgba(11,93,59,0.12)',
  gold: '#C9A646',
  goldDeep: '#8E6B1A',
  goldSoft: 'rgba(201,166,70,0.24)',
  goldGlow: 'rgba(201,166,70,0.12)',
  creamTop: '#FDFBF7',
  creamMid: '#F7EED8',
  creamBottom: '#F1E2BF',
  textSoft: '#6A7468',
};

export const CERTIFICATE_WIDTH = 993;
export const CERTIFICATE_HEIGHT = 1404;

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        width: '100%',
        minHeight: 98,
        padding: '18px 18px 16px',
        borderRadius: 18,
        border: `1px solid ${COLORS.goldSoft}`,
        background: 'rgba(255,255,255,0.82)',
        boxShadow: `0 10px 24px ${COLORS.goldGlow}`,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.22em',
          color: COLORS.textSoft,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 15,
          fontWeight: 700,
          color: COLORS.green,
          wordBreak: 'break-word',
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DefaultSeal() {
  return (
    <div
      style={{
        width: 112,
        height: 112,
        borderRadius: '999px',
        background: 'radial-gradient(circle at 30% 30%, #F4E3AF, #C9A646 56%, #8E6B1A)',
        boxShadow: '0 12px 22px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#4F3B10',
        fontFamily: '"Playfair Display", serif',
        fontWeight: 700,
        fontSize: 11,
        padding: 12,
        lineHeight: 1.2,
        boxSizing: 'border-box',
      }}
    >
      <div>
        Trusted by Muslims
        <div style={{ marginTop: 6, fontSize: 9, fontWeight: 600 }}>
          Faith • Trust
        </div>
      </div>
    </div>
  );
}

function DiamondRule() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <div style={{ width: 48, height: 1, background: COLORS.goldSoft }} />
      <div
        style={{
          width: 8,
          height: 8,
          border: `1px solid ${COLORS.gold}`,
          borderRadius: 2,
          transform: 'rotate(45deg)',
        }}
      />
      <div
        style={{
          width: 8,
          height: 8,
          border: `1px solid ${COLORS.gold}`,
          borderRadius: 2,
          transform: 'rotate(45deg)',
        }}
      />
      <div style={{ width: 48, height: 1, background: COLORS.goldSoft }} />
    </div>
  );
}

export default function CertificateCanvas({
  studentName = 'Student',
  courseName = 'Course Title',
  certificateId = 'AK-XXXXXXX',
  completionDate = new Date().toISOString(),
  category = 'Islamic Studies',
  logoUrl = '',
  sealUrl = '',
  signatureUrl = '',
  qrDataUrl = '',
}) {
  const formattedDate = formatDate(completionDate);
  const resolvedLogo = logoUrl || logoAsset;
  const resolvedSeal = sealUrl || sealAsset;
  const resolvedSignature = signatureUrl || signatureAsset;

  return (
    <div
      style={{
        position: 'relative',
        width: `${CERTIFICATE_WIDTH}px`,
        height: `${CERTIFICATE_HEIGHT}px`,
        background: `
          radial-gradient(circle at 50% 24%, rgba(201,166,70,0.16) 0%, rgba(201,166,70,0.06) 24%, rgba(255,255,255,0) 58%),
          radial-gradient(circle at 12% 12%, rgba(11,93,59,0.07) 0%, rgba(11,93,59,0) 18%),
          radial-gradient(circle at 88% 14%, rgba(11,93,59,0.05) 0%, rgba(11,93,59,0) 16%),
          linear-gradient(180deg, ${COLORS.creamTop} 0%, ${COLORS.creamMid} 58%, ${COLORS.creamBottom} 100%)
        `,
        color: COLORS.green,
        boxSizing: 'border-box',
        overflow: 'hidden',
        borderRadius: 24,
        border: `2px solid ${COLORS.gold}`,
        fontFamily: '"Inter", "Lato", sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 14,
          borderRadius: 22,
          border: `1px solid ${COLORS.goldSoft}`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 28,
          borderRadius: 18,
          border: '1px solid rgba(11,93,59,0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 32,
          borderRadius: 18,
          backgroundImage: `
            linear-gradient(45deg, rgba(201,166,70,0.04) 25%, transparent 25%, transparent 75%, rgba(201,166,70,0.04) 75%, rgba(201,166,70,0.04)),
            linear-gradient(45deg, rgba(201,166,70,0.04) 25%, transparent 25%, transparent 75%, rgba(201,166,70,0.04) 75%, rgba(201,166,70,0.04))
          `,
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
          opacity: 0.22,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 318,
          height: 176,
          borderTopLeftRadius: 180,
          borderTopRightRadius: 180,
          border: `2px solid ${COLORS.goldSoft}`,
          borderBottom: 'none',
          opacity: 0.72,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 42,
          top: 42,
          width: 54,
          height: 54,
          borderTop: `2px solid ${COLORS.goldSoft}`,
          borderLeft: `2px solid ${COLORS.goldSoft}`,
          borderTopLeftRadius: 34,
          opacity: 0.85,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 742,
          transform: 'translateX(-50%)',
          width: 250,
          textAlign: 'center',
          opacity: 0.11,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: '"Amiri", serif',
            fontSize: 82,
            lineHeight: 1.04,
            color: COLORS.goldDeep,
          }}
        >
          وَقُل رَّبِّ
          <br />
          زِدْنِي عِلْمًا
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          padding: '62px 66px 72px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {resolvedLogo ? (
            <img
              src={resolvedLogo}
              alt="Logo"
              style={{
                width: 92,
                height: 92,
                objectFit: 'contain',
                margin: '0 auto',
                display: 'block',
              }}
            />
          ) : null}

          <div
            style={{
              marginTop: 14,
              fontFamily: '"Amiri", serif',
              fontSize: 24,
              color: COLORS.green,
            }}
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </div>

          <div
            style={{
              marginTop: 12,
              fontFamily: '"Playfair Display", serif',
              fontSize: 15,
              letterSpacing: '0.2em',
              color: COLORS.green,
            }}
          >
            AL KAWSER ACADEMY
          </div>

          <div
            style={{
              marginTop: 6,
              fontFamily: '"Amiri", serif',
              fontSize: 18,
              color: COLORS.textSoft,
            }}
          >
            أكاديمية الكوثر
          </div>

          <div
            style={{
              marginTop: 36,
              fontFamily: '"Amiri", serif',
              fontSize: 38,
              color: COLORS.green,
            }}
          >
            شهادة إتمام
          </div>

          <div
            style={{
              marginTop: 14,
              fontFamily: '"Playfair Display", serif',
              fontSize: 56,
              lineHeight: 1.08,
              color: COLORS.goldDeep,
            }}
          >
            Certificate of Completion
          </div>

          <div style={{ marginTop: 14 }}>
            <DiamondRule />
          </div>

          <div
            style={{
              marginTop: 22,
              maxWidth: 640,
              marginInline: 'auto',
              fontSize: 14,
              lineHeight: 1.82,
              color: COLORS.textSoft,
            }}
          >
            With gratitude and recognition for sincere effort in seeking beneficial knowledge,
            this certificate is presented in honor of successful completion.
          </div>

          <div
            style={{
              marginTop: 28,
              fontSize: 11,
              letterSpacing: '0.24em',
              color: COLORS.gold,
            }}
          >
            PRESENTED TO
          </div>

          <div
            style={{
              marginTop: 20,
              fontFamily: '"Playfair Display", serif',
              fontSize: 54,
              fontWeight: 700,
              color: COLORS.green,
              lineHeight: 1.04,
            }}
          >
            {studentName}
          </div>

          <div
            style={{
              width: 362,
              height: 1,
              margin: '18px auto 0',
              background: `linear-gradient(90deg, transparent 0%, ${COLORS.goldSoft} 16%, ${COLORS.goldSoft} 84%, transparent 100%)`,
            }}
          />

          <div
            style={{
              marginTop: 18,
              fontSize: 11,
              letterSpacing: '0.2em',
              color: COLORS.gold,
            }}
          >
            FOR SUCCESSFULLY COMPLETING
          </div>

          <div
            style={{
              marginTop: 16,
              fontFamily: '"Playfair Display", serif',
              fontSize: 36,
              lineHeight: 1.16,
              color: COLORS.goldDeep,
              maxWidth: 580,
              marginInline: 'auto',
            }}
          >
            {courseName}
          </div>

          <div
            style={{
              marginTop: 28,
              fontFamily: '"Amiri", serif',
              fontSize: 26,
              color: COLORS.green,
            }}
          >
            رَبِّ زِدْنِي عِلْمًا
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              letterSpacing: '0.18em',
              color: COLORS.gold,
            }}
          >
            A prayer for beneficial knowledge
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 66,
            right: 66,
            bottom: 86,
            display: 'grid',
            gridTemplateColumns: '322px 120px 160px 194px',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >
            <div style={{ width: 202, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              {resolvedSignature ? (
                <img
                  src={resolvedSignature}
                  alt="Signature"
                  style={{ width: 154, height: 60, objectFit: 'contain', display: 'block' }}
                />
              ) : null}

              <div style={{ width: 162, height: 1, background: COLORS.goldSoft, marginTop: 8 }} />

              <div
                style={{
                  marginTop: 10,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: COLORS.textSoft,
                }}
              >
                AUTHORIZED SIGNATURE
              </div>

              <div style={{ marginTop: 6, fontSize: 11, color: COLORS.goldDeep }}>
                Al Kawser Academy
              </div>
            </div>

            <div style={{ paddingBottom: 6, marginLeft: -8 }}>
              {resolvedSeal ? (
                <img
                  src={resolvedSeal}
                  alt="Seal"
                  style={{ width: 108, height: 108, objectFit: 'contain' }}
                />
              ) : (
                <DefaultSeal />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {qrDataUrl ? (
              <div
                style={{
                  padding: 6,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.9)',
                  border: `1px solid ${COLORS.goldSoft}`,
                  boxShadow: `0 10px 20px ${COLORS.goldGlow}`,
                }}
              >
                <img
                  src={qrDataUrl}
                  alt="Verify certificate"
                  style={{ width: 96, height: 96, display: 'block' }}
                />
              </div>
            ) : null}

            <div
              style={{
                marginTop: 10,
                fontSize: 10,
                letterSpacing: '0.18em',
                color: COLORS.textSoft,
                textAlign: 'center',
              }}
            >
              VERIFY QR
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img
              src={logo1Asset}
              alt="Logo 1"
              style={{ width: 88, height: 88, objectFit: 'contain' }}
            />
            <InfoCard label="COMPLETION DATE" value={formattedDate} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <img
              src={logo2Asset}
              alt="Logo 2"
              style={{ width: 88, height: 88, objectFit: 'contain' }}
            />
            <InfoCard label="CERTIFICATE NO -" value={certificateId} />
          </div>
        </div>
      </div>
    </div>
  );
}
