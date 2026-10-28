// WhatsApp notifications through Meta's WhatsApp Business Cloud API.
//
// Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send for real. Without them every message
// is only written to the server log ("dry run"), so the site works the same while you set up.
// Messages the business starts must use templates approved in WhatsApp Manager. The template
// names and wording this file expects are listed in the README, under "WhatsApp notifications".

const env = process.env;

function config() {
  return {
    token: env.WHATSAPP_TOKEN,
    phoneId: env.WHATSAPP_PHONE_NUMBER_ID,
    version: env.WHATSAPP_API_VERSION || 'v25.0',
    lang: env.WHATSAPP_TEMPLATE_LANG || 'en',
    countryCode: (env.DEFAULT_COUNTRY_CODE || '233').replace(/\D/g, ''),
  };
}

const enabled = () => Boolean(config().token && config().phoneId);
const countryCode = () => config().countryCode;

// Turns local numbers like "024 123 4567" or "+233 24 123 4567" into the digits-only
// international form WhatsApp expects (233241234567). Returns '' when it can't be a phone number.
function toWhatsApp(phone) {
  const cc = config().countryCode;
  const raw = String(phone || '').trim();
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? digits : '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = cc + digits.slice(1);
  else if (digits.length === 9) digits = cc + digits; // local number typed without the leading 0
  return digits.length >= 11 && digits.length <= 15 ? digits : '';
}

// Template text can't contain new lines, tabs or long runs of spaces, and can't be empty.
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, 900) || '-';

async function sendOne({ to, template, params }) {
  const { token, phoneId, version, lang } = config();
  if (!token || !phoneId) {
    // Dashboard keys are hidden so private links don't end up in the logs.
    console.log(`[whatsapp dry run] ${template} → ${to}: ${params.map(clean).join(' | ').replace(/key=[^\s|]+/g, 'key=…')}`);
    return;
  }
  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        components: [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: clean(p) })) }],
      },
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${res.status} ${(err.error && err.error.message) || 'request failed'}`);
  }
}

// Sends every queued message in parallel. A failed message is logged, never thrown,
// so a WhatsApp outage can't break a booking that has already been saved.
async function sendAll(messages) {
  const results = await Promise.allSettled(messages.map(sendOne));
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`WhatsApp ${messages[i].template} to ${messages[i].to} failed: ${r.reason.message}`);
  });
}

module.exports = { enabled, countryCode, toWhatsApp, sendAll };
