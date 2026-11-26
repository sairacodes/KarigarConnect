import { SERVICE_CATALOG, getServiceBySlugOrId } from '../data/serviceCatalog';
import { TradeRecord } from './storage/types';

export type ProblemUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface ProblemFinderAnalysis {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  categoryUrduName: string;
  groupName: string;
  groupUrduName: string;
  urgency: ProblemUrgency;
  likelyCause: string;
  likelyCauseUrdu: string;
  roughMinPkr: number;
  roughMaxPkr: number;
  safetyTip: string;
  safetyTipUrdu: string;
  source: 'gemini' | 'offline_estimator';
  isEstimateOnly: true;
}

interface KeywordRule {
  slug: string;
  keywords: string[];
  urgency?: ProblemUrgency;
  causeEn: string;
  causeUr: string;
  tipEn: string;
  tipUr: string;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    slug: 'electrician',
    keywords: [
      'spark', 'breaker', 'trip', 'short circuit', 'wiring', 'socket', 'switch', 'fan', 'voltage', 'bijli', 'current', 'tar', 'board', 'mcb', 'earthing', 'light', 'بجلی', 'شارٹ', 'بریکر', 'سوئچ', 'پنکھا', 'تار',
    ],
    urgency: 'HIGH',
    causeEn: 'Possible loose terminal, overloaded breaker, moisture ingress, or insulation breakdown in the circuit.',
    causeUr: 'سرکٹ میں ڈھیلا کنکشن، اوور لوڈ بریکر، نمی یا تار کی انسولیشن خراب ہو سکتی ہے۔',
    tipEn: 'Switch off the main DB breaker immediately if you smell burning plastic or see sparks.',
    tipUr: 'جلنے کی بو یا چنگاری نظر آئے تو فوراً مین بریکر بند کر دیں۔',
  },
  {
    slug: 'plumber',
    keywords: [
      'leak', 'pipe', 'tap', 'sink', 'drain', 'flush', 'toilet', 'geyser', 'motor', 'water', 'paani', 'pani', 'nal', 'tanki', 'sewer', 'پانی', 'لیک', 'نل', 'پائپ', 'گیزر', 'موٹر', 'ٹینکی',
    ],
    urgency: 'HIGH',
    causeEn: 'Worn washer/spindle seal, cracked PPR joint, blocked trap, or geyser thermostat/relief valve drip.',
    causeUr: 'نل کا واشر، پائپ جوائنٹ میں دراڑ، بند ٹریپ یا گیزر والو کی خرابی ہو سکتی ہے۔',
    tipEn: 'Close the local isolation valve or tank supply line to prevent water damage while waiting.',
    tipUr: 'نقصان سے بچنے کے لیے قریبی والو یا ٹینکی کی مین سپلائی بند کر دیں۔',
  },
  {
    slug: 'ac-technician',
    keywords: [
      'ac', 'air conditioner', 'cooling', 'thanda', 'split', 'inverter', 'gas', 'compressor', 'ice', 'drip', 'اے سی', 'ٹھنڈا', 'گیس', 'کمپریسر',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Clogged indoor evaporator coils, low refrigerant pressure from a flare leak, or capacitor fault.',
    causeUr: 'انڈور کوائلز میں مٹی، گیس کم ہونا یا کیپیسٹر کا مسئلہ ہو سکتا ہے۔',
    tipEn: 'Turn off the AC if water leaks onto an electrical socket or the indoor fan freezes.',
    tipUr: 'اگر بجلی کے بورڈ پر پانی ٹپک رہا ہو یا برف جم رہی ہو تو اے سی بند کر دیں۔',
  },
  {
    slug: 'ups-solar-technician',
    keywords: [
      'ups', 'solar', 'inverter', 'battery', 'panel', 'backup', 'charging', 'سولر', 'یو پی ایس', 'بیٹری', 'انورٹر',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Sulfated battery plates, loose DC lug, or inverter changeover relay issue.',
    causeUr: 'بیٹری پلیٹس کی کمزوری، ڈھیلا ڈی سی ٹرمینل یا انورٹر چینج اوور ریلے کا فالٹ ہو سکتا ہے۔',
    tipEn: 'Keep the battery room ventilated and never bridge DC cables without a breaker.',
    tipUr: 'بیٹری والی جگہ کو ہوادار رکھیں اور بغیر بریکر کے تار نہ جوڑیں۔',
  },
  {
    slug: 'appliance-repair',
    keywords: [
      'fridge', 'refrigerator', 'washing machine', 'microwave', 'oven', 'freezer', 'spinner', 'فریج', 'واشنگ مشین', 'مائیکروویو',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Failed overload/PTC relay, blocked drain pump, or worn drive belt / thermostat sensor.',
    causeUr: 'فریج ریلے، بند ڈرین پمپ، بیلٹ یا تھرموسٹیٹ سینسر میں خرابی ہو سکتی ہے۔',
    tipEn: 'Unplug the appliance before checking seals or opening inspection covers.',
    tipUr: 'معائنہ کرنے سے پہلے آلے کا پلگ نکال دیں۔',
  },
  {
    slug: 'carpenter',
    keywords: [
      'door', 'lock', 'hinge', 'wood', 'cabinet', 'cupboard', 'wardrobe', 'almari', 'bed', 'chair', 'lakri', 'darwaza', 'لکڑی', 'دروازہ', 'الماری', 'فرنیچر', 'کابینہ',
    ],
    urgency: 'LOW',
    causeEn: 'Swollen timber frame from humidity, stripped hinge screws, or misaligned drawer runners.',
    causeUr: 'نمی سے لکڑی کا پھولنا، ڈھیلے قبضے یا دراز کے چینل خراب ہو سکتے ہیں۔',
    tipEn: 'Avoid forcing jammed wooden doors to prevent splitting the frame.',
    tipUr: 'پھنسے ہوئے دروازے کو زور سے نہ کھینچیں تاکہ فریم نہ ٹوٹے۔',
  },
  {
    slug: 'painter-polish',
    keywords: [
      'paint', 'seepage', 'damp', 'wall', 'ceiling', 'peel', 'polish', 'deco', 'rang', 'deewar', 'پینٹ', 'پالش', 'دیوار', 'نمی', 'سیم',
    ],
    urgency: 'LOW',
    causeEn: 'Moisture seepage behind plaster requiring waterproofing primer, scraping, and putty re-skimming.',
    causeUr: 'دیوار کے پیچھے نمی/سیم کی وجہ سے پینٹ اکھڑ رہا ہے، واٹر پروفنگ اور پٹی ضروری ہے۔',
    tipEn: 'Ensure any plumbing leak behind the wall is fixed before repainting.',
    tipUr: 'پینٹ کروانے سے پہلے دیوار کے پیچھے پائپ کی لیکج ضرور ٹھیک کروائیں۔',
  },
  {
    slug: 'pest-termite-control',
    keywords: [
      'termite', 'deemak', 'cockroach', 'ant', 'bedbug', 'mosquito', 'pest', 'insect', 'دیمک', 'لال بیگ', 'کیڑے', 'مچھر',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Active insect/termite colony nesting in damp wood frames, kitchen crevices, or drains.',
    causeUr: 'نمی والی لکڑی، کچن کی درزوں یا نالیوں میں کیڑوں/دیمک کی کالونی موجود ہے۔',
    tipEn: 'Cover food items and keep children/pets away during gel or spray application.',
    tipUr: 'اسپرے یا جیل کے دوران کھانے پینے کی اشیاء ڈھانپ دیں اور بچوں کو دور رکھیں۔',
  },
  {
    slug: 'beauty-parlour-at-home',
    keywords: [
      'facial', 'wax', 'threading', 'manicure', 'pedicure', 'parlour', 'salon', 'hair', 'beauty', 'بیوٹی', 'فیشل', 'پارلر', 'ویکس',
    ],
    urgency: 'LOW',
    causeEn: 'Home personal grooming & beauty care request best matched with a verified female professional.',
    causeUr: 'گھر پر بیوٹی کیئر سروس کے لیے تصدیق شدہ خاتون پروفیشنل کا انتخاب مناسب ہے۔',
    tipEn: 'Confirm sealed single-use kits and allergy preferences before starting the session.',
    tipUr: 'سروس شروع کرنے سے پہلے صاف اور سیل بند کٹ کی تصدیق کریں۔',
  },
  {
    slug: 'mechanic',
    keywords: [
      'car', 'engine', 'brake', 'oil', 'clutch', 'radiator', 'start', 'overheat', 'gadi', 'gaari', 'گاڑی', 'کار', 'بریک', 'انجن',
    ],
    urgency: 'HIGH',
    causeEn: 'Worn brake pads, weak battery/starter, cooling leak, or overdue engine tune-up.',
    causeUr: 'بریک پیڈ گھس جانا، بیٹری/سٹارٹر کمزور ہونا یا کولنگ سسٹم میں خرابی ہو سکتی ہے۔',
    tipEn: 'Do not drive if brake pedal feels spongy or engine temperature gauge hits red.',
    tipUr: 'اگر بریک ڈھیلی ہو یا گاڑی گرم ہو رہی ہو تو گاڑی نہ چلائیں۔',
  },
  {
    slug: 'bike-mechanic',
    keywords: [
      'bike', 'motorcycle', '70', '125', 'chain', 'carburetor', 'kick', 'بائیک', 'موٹر سائیکل',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Dirty carburetor jet, spark plug fouling, or stretched drive chain.',
    causeUr: 'کاربوریٹر میں کچرا، سپارک پلگ یا چین کی ایڈجسٹمنٹ درکار ہو سکتی ہے۔',
    tipEn: 'Check fuel petcock and kill switch position before roadside towing.',
    tipUr: 'پٹرول والو اور کل سوئچ ضرور چیک کر لیں۔',
  },
  {
    slug: 'water-tank-cleaning',
    keywords: [
      'tank', 'tanki', 'mud', 'dirty water', 'algae', 'ٹینکی', 'گندہ پانی',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Sediment buildup, algae growth, or unsealed manhole cover allowing dust inside water storage.',
    causeUr: 'پانی کی ٹینکی میں گاد، کائی یا ڈھکن کھلا رہنے سے مٹی جمع ہو گئی ہے۔',
    tipEn: 'Flush taps briefly after tank chlorination before using drinking water.',
    tipUr: 'ٹینکی صاف کروانے کے بعد پینے سے پہلے نل تھوڑی دیر چلا لیں۔',
  },
  {
    slug: 'sofa-carpet-curtain-cleaning',
    keywords: [
      'sofa', 'carpet', 'rug', 'mattress', 'curtain', 'stain', 'صوفہ', 'قالین', 'پردے', 'داغ',
    ],
    urgency: 'LOW',
    causeEn: 'Embedded fabric dust and spill stains requiring hot/shampoo extraction.',
    causeUr: 'کپڑے میں دھول اور داغ جمے ہوئے ہیں جن کے لیے شیمپو ایکسٹریکشن صفائی بہتر ہے۔',
    tipEn: 'Ensure good room airflow after wash so cushions dry completely within hours.',
    tipUr: 'صفائی کے بعد کمرہ ہوادار رکھیں تاکہ صوفہ جلدی خشک ہو جائے۔',
  },
  {
    slug: 'mobile-phone-repair',
    keywords: [
      'phone', 'mobile', 'screen', 'battery', 'charging port', 'broken glass', 'موبائل', 'فون', 'سکرین', 'چارجنگ',
    ],
    urgency: 'LOW',
    causeEn: 'Cracked digitizer, degraded lithium battery, or lint/solder fault inside USB port.',
    causeUr: 'ٹوٹا ہوا گلاس، کمزور بیٹری یا چارجنگ جیک کی خرابی ہو سکتی ہے۔',
    tipEn: 'Back up important data before handing over a damaged phone.',
    tipUr: 'مرمت سے پہلے اپنے ضروری ڈیٹا کا بیک اپ ضرور لے لیں۔',
  },
  {
    slug: 'laptop-computer-repair',
    keywords: [
      'laptop', 'computer', 'pc', 'slow', 'windows', 'ssd', 'keyboard', 'hinge', 'لیپ ٹاپ', 'کمپیوٹر', 'ونڈوز',
    ],
    urgency: 'LOW',
    causeEn: 'Dry thermal paste causing throttling, failing HDD, or OS corruption.',
    causeUr: 'تھرمل پیسٹ خشک ہونے سے ہیٹنگ یا ہارڈ ڈرائیو سست ہو سکتی ہے۔',
    tipEn: 'Avoid blocking laptop vents on beds or cushions while waiting for service.',
    tipUr: 'لیپ ٹاپ کو تکیے یا بستر پر رکھ کر استعمال نہ کریں۔',
  },
  {
    slug: 'cctv-intercom-installer',
    keywords: [
      'cctv', 'camera', 'dvr', 'intercom', 'doorbell', 'کیمرہ', 'سی سی ٹی وی', 'انٹرکام',
    ],
    urgency: 'MEDIUM',
    causeEn: 'Loose BNC/power adapter, full DVR drive, or cut outdoor coaxial cable.',
    causeUr: 'کیمرہ پاور سپلائی، ڈھیلا کنیکٹر یا تار کٹنے کا مسئلہ ہو سکتا ہے۔',
    tipEn: 'Check whether the 12V camera power adapter LED is lit before replacing the camera.',
    tipUr: 'پہلے کیمرے کے 12 وولٹ پاور سپلائی کی لائٹ چیک کر لیں۔',
  },
  {
    slug: 'locksmith',
    keywords: [
      'key', 'locked out', 'padlock', 'cylinder', 'chabi', 'tala', 'چابی', 'تالا',
    ],
    urgency: 'HIGH',
    causeEn: 'Broken cylinder pin, jammed latch spring, or lost key requiring non-destructive entry.',
    causeUr: 'تالے کا سلنڈر جام ہونا یا چابی گم ہونے کا مسئلہ ہے۔',
    tipEn: 'Do not force bent keys inside the cylinder as they may snap flush inside.',
    tipUr: 'ٹیڑھی چابی کو زور سے نہ گھمائیں ورنہ اندر ٹوٹ سکتی ہے۔',
  },
];

function runOfflineKeywordEstimator(
  description: string,
  trades: TradeRecord[]
): ProblemFinderAnalysis {
  const lower = description.toLowerCase();

  let bestRule: KeywordRule | null = null;
  let bestScore = 0;

  for (const rule of KEYWORD_RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        score += kw.length >= 5 ? 3 : 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  // Emergency override words
  const isEmergency =
    lower.includes('fire') ||
    lower.includes('spark') ||
    lower.includes('smoke') ||
    lower.includes('gas leak') ||
    lower.includes('flood') ||
    lower.includes('آگ') ||
    lower.includes('چنگاری') ||
    lower.includes('گیس لیک') ||
    lower.includes('dhuan');

  const chosenSlug = bestRule?.slug || 'handyman-general-repair';
  const liveTrade =
    trades.find((t) => t.slug === chosenSlug && t.isActive) ||
    trades.find((t) => t.slug === 'handyman-general-repair') ||
    trades[0];
  const staticDef = getServiceBySlugOrId(liveTrade?.slug || chosenSlug) || SERVICE_CATALOG[0];

  const guideItems = (liveTrade?.priceGuide && liveTrade.priceGuide.length > 0
    ? liveTrade.priceGuide
    : staticDef.defaultPriceGuide);
  const minPkr = guideItems.length > 0 ? Math.min(...guideItems.map((g) => g.minPkr)) : 800;
  const maxPkr = guideItems.length > 0 ? Math.max(...guideItems.map((g) => g.maxPkr)) : 3500;

  return {
    categoryId: liveTrade?.id || staticDef.id,
    categorySlug: liveTrade?.slug || staticDef.slug,
    categoryName: liveTrade?.name || staticDef.name,
    categoryUrduName: liveTrade?.urduName || staticDef.urduName,
    groupName: liveTrade?.group || staticDef.group,
    groupUrduName: liveTrade?.urduGroup || staticDef.urduGroup,
    urgency: isEmergency ? 'EMERGENCY' : bestRule?.urgency || 'MEDIUM',
    likelyCause:
      bestRule?.causeEn ||
      'General inspection needed to check wear, mounting, or functional fault on site.',
    likelyCauseUrdu:
      bestRule?.causeUr ||
      'موقع پر معائنہ کر کے خرابی کی اصل وجہ اور مرمت کا اندازہ لگانا ضروری ہے۔',
    roughMinPkr: minPkr,
    roughMaxPkr: maxPkr,
    safetyTip:
      bestRule?.tipEn ||
      'Keep the work area clear and wait for a verified professional before attempting risky repairs.',
    safetyTipUrdu:
      bestRule?.tipUr ||
      'کام کی جگہ خالی رکھیں اور خود خطرناک مرمت کرنے سے گریز کریں۔',
    source: 'offline_estimator',
    isEstimateOnly: true,
  };
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return {
      base64: btoa(binary),
      mimeType: file.type || 'image/jpeg',
    };
  } catch {
    return null;
  }
}

export async function analyzeHomeProblem(params: {
  description: string;
  imageFile?: File | null;
  lang: 'en' | 'ur';
  trades: TradeRecord[];
}): Promise<ProblemFinderAnalysis> {
  const { description, imageFile, lang, trades } = params;
  const activeTrades = trades.filter((t) => t.isActive);

  let imagePayload: { base64: string; mimeType: string } | null = null;
  if (imageFile) {
    imagePayload = await fileToBase64(imageFile);
  }

  try {
    const categories = activeTrades.map((t) => {
      const def = getServiceBySlugOrId(t.slug);
      const pg = t.priceGuide?.length ? t.priceGuide : def?.defaultPriceGuide || [];
      const minPkr = pg.length ? Math.min(...pg.map((p) => p.minPkr)) : 800;
      const maxPkr = pg.length ? Math.max(...pg.map((p) => p.maxPkr)) : 3500;
      return {
        slug: t.slug,
        name: t.name,
        group: t.group || def?.group || 'Home Services',
        minPkr,
        maxPkr,
      };
    });

    const resp = await fetch('/api/problem-finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: description || (imageFile ? `Uploaded image: ${imageFile.name}` : ''),
        lang,
        categories,
        imageBase64: imagePayload?.base64,
        imageMimeType: imagePayload?.mimeType,
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (!data.fallbackRequired && data.result && data.result.categorySlug) {
        const matchedTrade =
          activeTrades.find((t) => t.slug === data.result.categorySlug) ||
          activeTrades.find((t) => t.slug === 'handyman-general-repair') ||
          activeTrades[0];
        const def = getServiceBySlugOrId(matchedTrade?.slug);
        return {
          categoryId: matchedTrade?.id || def?.id || 'trade_handyman',
          categorySlug: matchedTrade?.slug || def?.slug || 'handyman-general-repair',
          categoryName: matchedTrade?.name || def?.name || 'Handyman',
          categoryUrduName: matchedTrade?.urduName || def?.urduName || 'ہینڈی مین',
          groupName: matchedTrade?.group || def?.group || 'Home Repair & Maintenance',
          groupUrduName: matchedTrade?.urduGroup || def?.urduGroup || 'گھر کی مرمت',
          urgency: (['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].includes(data.result.urgency)
            ? data.result.urgency
            : 'MEDIUM') as ProblemUrgency,
          likelyCause: String(data.result.likelyCause || ''),
          likelyCauseUrdu: String(data.result.likelyCauseUrdu || data.result.likelyCause || ''),
          roughMinPkr: Math.max(200, Math.round(Number(data.result.roughMinPkr || 800))),
          roughMaxPkr: Math.max(500, Math.round(Number(data.result.roughMaxPkr || 3000))),
          safetyTip: String(data.result.safetyTip || ''),
          safetyTipUrdu: String(data.result.safetyTipUrdu || data.result.safetyTip || ''),
          source: 'gemini',
          isEstimateOnly: true,
        };
      }
    }
  } catch {
    // Offline or non-Vite environment fallback
  }

  return runOfflineKeywordEstimator(
    `${description} ${imageFile?.name || ''}`.trim(),
    activeTrades
  );
}
