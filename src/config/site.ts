// One place for public contact details and the site's official address.
//
// WHATSAPP_NUMBER: put your real number here in international format without "+" or spaces,
// e.g. '923001234567'. While it is empty, every WhatsApp button on the site stays hidden,
// so judges never click a fake number.
export const WHATSAPP_NUMBER: string = '';

// Shown on the Contact page. Use a real inbox you check.
export const SUPPORT_EMAIL = 'support@karigarconnect.pk';

// The one public URL to share everywhere (deck, QR codes, social).
export const SITE_URL = 'https://karigar-connect-gray.vercel.app';

export const hasWhatsApp = WHATSAPP_NUMBER.trim().length > 0;

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function whatsappDisplay() {
  const n = WHATSAPP_NUMBER;
  if (!n) return '';
  return n.startsWith('92') ? `+92 ${n.slice(2, 5)} ${n.slice(5)}` : `+${n}`;
}
