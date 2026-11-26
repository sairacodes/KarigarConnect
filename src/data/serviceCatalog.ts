import { FairPriceItem } from '../services/storage/types';

export interface ServiceCategoryDef {
  id: string;
  slug: string;
  name: string;
  urduName: string;
  group: string;
  urduGroup: string;
  description: string;
  icon: string;
  defaultPriceGuide: FairPriceItem[];
}

export interface ServiceGroupMeta {
  group: string;
  urduGroup: string;
  icon: string;
}

export const SERVICE_GROUPS: ServiceGroupMeta[] = [
  { group: 'Home Repair & Maintenance', urduGroup: 'گھر کی مرمت اور دیکھ بھال', icon: 'wrench' },
  { group: 'Cleaning & Pest Control', urduGroup: 'صفائی اور کیڑے مار سروسز', icon: 'sparkles' },
  { group: 'Beauty & Wellness at Home', urduGroup: 'گھر پر بیوٹی اور ویلنس', icon: 'heart' },
  { group: 'Automotive', urduGroup: 'گاڑی اور بائیک سروسز', icon: 'car' },
  { group: 'Household Help & Family', urduGroup: 'گھریلو مدد اور خاندان', icon: 'home' },
  { group: 'Moving & Logistics', urduGroup: 'شفٹنگ اور لاجسٹکس', icon: 'truck' },
  { group: 'Events & Occasions', urduGroup: 'تقریبات اور مواقع', icon: 'camera' },
  { group: 'Device Repair', urduGroup: 'ڈیوائس اور ٹیک مرمت', icon: 'cpu' },
];

const G1 = SERVICE_GROUPS[0];
const G2 = SERVICE_GROUPS[1];
const G3 = SERVICE_GROUPS[2];
const G4 = SERVICE_GROUPS[3];
const G5 = SERVICE_GROUPS[4];
const G6 = SERVICE_GROUPS[5];
const G7 = SERVICE_GROUPS[6];
const G8 = SERVICE_GROUPS[7];

export const SERVICE_CATALOG: ServiceCategoryDef[] = [
  // Group 1: Home Repair & Maintenance (13)
  {
    id: 'trade_electrician',
    slug: 'electrician',
    name: 'Electrician',
    urduName: 'الیکٹریشن',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Residential and light commercial electrical wiring, distribution board setup, safety earthing, and circuit diagnostics.',
    icon: 'zap',
    defaultPriceGuide: [
      { id: 'pg_elec_1', serviceLabel: 'Inspection / Fault Visit', serviceUrduLabel: 'معائنہ / فالٹ چیک', minPkr: 700, maxPkr: 1500, unit: 'per visit' },
      { id: 'pg_elec_2', serviceLabel: 'Socket / Switch / Fan Installation', serviceUrduLabel: 'ساکٹ / سوئچ / پنکھا انسٹالیشن', minPkr: 500, maxPkr: 1500, unit: 'per point' },
      { id: 'pg_elec_3', serviceLabel: 'Breaker Box / DB Servicing', serviceUrduLabel: 'بریکر باکس مرمت', minPkr: 1800, maxPkr: 4500, unit: 'per job' },
    ],
  },
  {
    id: 'trade_plumber',
    slug: 'plumber',
    name: 'Plumber',
    urduName: 'پلمبر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'PPR/uPVC pipe fitting, leak repair, geyser & water motor installation, bathroom fixtures, and drainage clearing.',
    icon: 'droplets',
    defaultPriceGuide: [
      { id: 'pg_plm_1', serviceLabel: 'Tap / Mixer / Leak Fix', serviceUrduLabel: 'نل یا لیکج مرمت', minPkr: 700, maxPkr: 1800, unit: 'per job' },
      { id: 'pg_plm_2', serviceLabel: 'Geyser / Water Motor Setup', serviceUrduLabel: 'گیزر / واٹر موٹر انسٹالیشن', minPkr: 1500, maxPkr: 3500, unit: 'per unit' },
      { id: 'pg_plm_3', serviceLabel: 'Drain / Blockage Clearing', serviceUrduLabel: 'نالی / سیوریج کھولنا', minPkr: 1000, maxPkr: 2800, unit: 'per job' },
    ],
  },
  {
    id: 'trade_carpenter',
    slug: 'carpenter',
    name: 'Carpenter',
    urduName: 'بڑھئی / کارپینٹر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Precision measuring, timber cutting, mortise-and-tenon joinery, furniture assembly, and surface finishing.',
    icon: 'hammer',
    defaultPriceGuide: [
      { id: 'pg_crp_1', serviceLabel: 'Door Lock / Hinge Alignment', serviceUrduLabel: 'دروازے کا تالا / قبضہ سیٹنگ', minPkr: 800, maxPkr: 2200, unit: 'per door' },
      { id: 'pg_crp_2', serviceLabel: 'Furniture Assembly / Repair', serviceUrduLabel: 'فرنیچر اسمبلی / مرمت', minPkr: 1500, maxPkr: 4500, unit: 'per item' },
    ],
  },
  {
    id: 'trade_ac_technician',
    slug: 'ac-technician',
    name: 'AC Technician',
    urduName: 'اے سی ٹیکنیشن',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Split/inverter AC installation, master foam servicing, refrigerant leak checking & refilling, and PCB diagnostics.',
    icon: 'wind',
    defaultPriceGuide: [
      { id: 'pg_ac_1', serviceLabel: 'Master Service (Wash & Clean)', serviceUrduLabel: 'اے سی ماسٹر سروس', minPkr: 1800, maxPkr: 3000, unit: 'per unit' },
      { id: 'pg_ac_2', serviceLabel: 'Split AC Installation', serviceUrduLabel: 'سپلیٹ اے سی انسٹالیشن', minPkr: 3500, maxPkr: 6000, unit: 'per unit' },
      { id: 'pg_ac_3', serviceLabel: 'Gas Refill (R32/R410a/R22)', serviceUrduLabel: 'گیس ری فلنگ', minPkr: 4500, maxPkr: 9500, unit: 'per unit' },
    ],
  },
  {
    id: 'trade_painter',
    slug: 'painter-polish',
    name: 'Painter & Polish',
    urduName: 'پینٹر اور پالش',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Interior & exterior emulsion painting, dampness/seepage treatment, wall putty prep, and wood/deco polish.',
    icon: 'paintbrush',
    defaultPriceGuide: [
      { id: 'pg_pnt_1', serviceLabel: 'Single Room Repaint (Labor)', serviceUrduLabel: 'ایک کمرے کا پینٹ (مزدوری)', minPkr: 4500, maxPkr: 9500, unit: 'per room' },
      { id: 'pg_pnt_2', serviceLabel: 'Wood Door Polish / Deco', serviceUrduLabel: 'دروازہ پالش / ڈیکو', minPkr: 2500, maxPkr: 6500, unit: 'per door' },
    ],
  },
  {
    id: 'trade_mason',
    slug: 'mason-tile-fixer',
    name: 'Mason & Tile Fixer',
    urduName: 'راج مستری اور ٹائل فکسر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Brickwork, plastering, floor & wall ceramic/porcelain tiling, grouting, and waterproofing screeds.',
    icon: 'layers',
    defaultPriceGuide: [
      { id: 'pg_msn_1', serviceLabel: 'Small Plaster / Masonry Patch', serviceUrduLabel: 'پلستر / اینٹ کی مرمت', minPkr: 1800, maxPkr: 4500, unit: 'per day' },
      { id: 'pg_msn_2', serviceLabel: 'Tile Fixing (Labor)', serviceUrduLabel: 'ٹائل لگانا (مزدوری)', minPkr: 45, maxPkr: 95, unit: 'per sq ft' },
    ],
  },
  {
    id: 'trade_welder',
    slug: 'welder-steel-fabricator',
    name: 'Welder & Steel Fabricator',
    urduName: 'ویلڈر اور سٹیل فیبریکیٹر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Arc/MIG welding, security grilles, main gates, stair railings, and structural steel repairs.',
    icon: 'flame',
    defaultPriceGuide: [
      { id: 'pg_wld_1', serviceLabel: 'On-Site Welding Repair', serviceUrduLabel: 'موقع پر ویلڈنگ مرمت', minPkr: 1500, maxPkr: 4000, unit: 'per job' },
    ],
  },
  {
    id: 'trade_appliance',
    slug: 'appliance-repair',
    name: 'Appliance Repair (Fridge / Washing Machine / Microwave / Geyser)',
    urduName: 'گھریلو آلات کی مرمت (فریج، واشنگ مشین، مائیکروویو، گیزر)',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Diagnostics and repair for refrigerators, automatic washing machines, microwaves, and instant/gas geysers.',
    icon: 'refrigerator',
    defaultPriceGuide: [
      { id: 'pg_app_1', serviceLabel: 'Diagnostic & Minor Repair', serviceUrduLabel: 'معائنہ اور معمولی مرمت', minPkr: 1000, maxPkr: 2500, unit: 'per visit' },
      { id: 'pg_app_2', serviceLabel: 'Compressor / Drum Service', serviceUrduLabel: 'کمپریسر / ڈرم سروس', minPkr: 2500, maxPkr: 6500, unit: 'per job' },
    ],
  },
  {
    id: 'trade_ups_solar',
    slug: 'ups-solar-technician',
    name: 'UPS & Solar Technician',
    urduName: 'یو پی ایس اور سولر ٹیکنیشن',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Solar panel mounting, hybrid inverter wiring, battery bank balancing, DC breakers, and UPS changeover fixes.',
    icon: 'sun',
    defaultPriceGuide: [
      { id: 'pg_sol_1', serviceLabel: 'UPS / Battery Diagnostics', serviceUrduLabel: 'یو پی ایس / بیٹری چیک اپ', minPkr: 1000, maxPkr: 2500, unit: 'per visit' },
      { id: 'pg_sol_2', serviceLabel: 'Solar Panel Wash & Check', serviceUrduLabel: 'سولر پینل صفائی و چیک', minPkr: 1500, maxPkr: 4000, unit: 'per system' },
    ],
  },
  {
    id: 'trade_cctv_intercom',
    slug: 'cctv-intercom-installer',
    name: 'CCTV & Intercom Installer',
    urduName: 'سی سی ٹی وی اور انٹرکام انسٹالر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'IP/analog camera installation, DVR/NVR configuration, smart doorbells, and intercom wiring.',
    icon: 'cctv',
    defaultPriceGuide: [
      { id: 'pg_cctv_1', serviceLabel: 'Single Camera Setup & Cabling', serviceUrduLabel: 'کیمرہ انسٹالیشن', minPkr: 1500, maxPkr: 3500, unit: 'per camera' },
    ],
  },
  {
    id: 'trade_locksmith',
    slug: 'locksmith',
    name: 'Locksmith',
    urduName: 'تالہ چابی ساز (لاک سمتھ)',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Emergency home/car lock opening, smart/mortise lock replacement, and key duplication.',
    icon: 'key',
    defaultPriceGuide: [
      { id: 'pg_lck_1', serviceLabel: 'Lock Opening / Cylinder Change', serviceUrduLabel: 'تالا کھولنا / سلنڈر تبدیلی', minPkr: 1000, maxPkr: 3000, unit: 'per lock' },
    ],
  },
  {
    id: 'trade_glass_aluminum',
    slug: 'glass-aluminum-worker',
    name: 'Glass & Aluminum Worker',
    urduName: 'شیشہ اور ایلومینیم کاریگر',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Aluminum sliding window alignment, roller replacement, shower cubicles, and tempered glass fitting.',
    icon: 'grid',
    defaultPriceGuide: [
      { id: 'pg_gls_1', serviceLabel: 'Window Roller / Glass Fix', serviceUrduLabel: 'کھڑکی رولر / شیشہ فٹنگ', minPkr: 1200, maxPkr: 3500, unit: 'per window' },
    ],
  },
  {
    id: 'trade_handyman',
    slug: 'handyman-general-repair',
    name: 'Handyman (General Home Repair)',
    urduName: 'ہینڈی مین (عام گھریلو مرمت)',
    group: G1.group,
    urduGroup: G1.urduGroup,
    description: 'Curtain rods, TV wall mounting, shelf drilling, sealing bathroom silicone, and multi-task home fixes.',
    icon: 'tool',
    defaultPriceGuide: [
      { id: 'pg_hnd_1', serviceLabel: 'TV / Shelf Drilling & Mounting', serviceUrduLabel: 'ٹی وی / شیلف فٹنگ', minPkr: 900, maxPkr: 2200, unit: 'per job' },
    ],
  },

  // Group 2: Cleaning & Pest Control (6)
  {
    id: 'trade_deep_cleaning',
    slug: 'home-deep-cleaning',
    name: 'Home Deep Cleaning',
    urduName: 'گھر کی مکمل ڈیپ کلیننگ',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Full-room floor scrubbing, kitchen degreasing, bathroom descaling, and window track sanitization.',
    icon: 'sparkles',
    defaultPriceGuide: [
      { id: 'pg_cln_1', serviceLabel: '5-Marla / Apartment Deep Clean', serviceUrduLabel: '5 مرلہ / فلیٹ ڈیپ کلین', minPkr: 4500, maxPkr: 9500, unit: 'per home' },
    ],
  },
  {
    id: 'trade_sofa_carpet',
    slug: 'sofa-carpet-curtain-cleaning',
    name: 'Sofa / Carpet / Curtain Cleaning',
    urduName: 'صوفہ / قالین / پردوں کی صفائی',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Shampoo injection-extraction cleaning and stain treatment for sofas, rugs, mattresses, and curtains.',
    icon: 'sofa',
    defaultPriceGuide: [
      { id: 'pg_sf_1', serviceLabel: '5-Seater Sofa Shampoo Wash', serviceUrduLabel: '5 سیٹر صوفہ واش', minPkr: 2200, maxPkr: 4000, unit: 'per set' },
    ],
  },
  {
    id: 'trade_water_tank',
    slug: 'water-tank-cleaning',
    name: 'Water Tank Cleaning',
    urduName: 'پانی کی ٹینکی کی صفائی',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Sludge dewatering, pressure jet washing, antibacterial scrubbing, and chlorination of underground/overhead tanks.',
    icon: 'droplet',
    defaultPriceGuide: [
      { id: 'pg_wt_1', serviceLabel: 'Underground + Overhead Tank', serviceUrduLabel: 'زیر زمین اور اوپر والی ٹینکی', minPkr: 2500, maxPkr: 5500, unit: 'per job' },
    ],
  },
  {
    id: 'trade_pest_control',
    slug: 'pest-termite-control',
    name: 'Pest & Termite Control',
    urduName: 'کیڑے مکوڑے اور دیمک کنٹرول',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Safe gel baiting for cockroaches/ants, termite barrier drilling, and bedbug/mosquito fumigation.',
    icon: 'bug',
    defaultPriceGuide: [
      { id: 'pg_pst_1', serviceLabel: 'Standard Home Pest Spray/Gel', serviceUrduLabel: 'گھریلو پیسٹ کنٹرول', minPkr: 3000, maxPkr: 7000, unit: 'per visit' },
    ],
  },
  {
    id: 'trade_solar_cleaning',
    slug: 'solar-panel-cleaning',
    name: 'Solar Panel Cleaning',
    urduName: 'سولر پینل کلیننگ',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Spot-free soft-brush solar array washing and roof safety inspection to restore peak generation.',
    icon: 'sun',
    defaultPriceGuide: [
      { id: 'pg_slc_1', serviceLabel: 'Up to 10kW Solar Wash', serviceUrduLabel: '10 کلوواٹ تک سولر صفائی', minPkr: 1500, maxPkr: 3000, unit: 'per system' },
    ],
  },
  {
    id: 'trade_car_wash_home',
    slug: 'car-wash-detailing-at-home',
    name: 'Car Wash & Detailing at Home',
    urduName: 'گھر پر کار واش اور ڈیٹیلنگ',
    group: G2.group,
    urduGroup: G2.urduGroup,
    description: 'Mobile exterior foam wash, interior vacuuming, seat shampooing, and wax polish at your doorstep.',
    icon: 'car',
    defaultPriceGuide: [
      { id: 'pg_cw_1', serviceLabel: 'Full Exterior + Interior Wash', serviceUrduLabel: 'مکمل اندرونی و بیرونی واش', minPkr: 1200, maxPkr: 2800, unit: 'per car' },
    ],
  },

  // Group 3: Beauty & Wellness at Home (6)
  {
    id: 'trade_beauty_parlour',
    slug: 'beauty-parlour-at-home',
    name: 'Beauty Parlour at Home (Women)',
    urduName: 'گھر پر بیوٹی پارلر (خواتین)',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Hygienic home salon services by verified female beauticians: facials, waxing, threading, manicure/pedicure, and hair styling.',
    icon: 'sparkles',
    defaultPriceGuide: [
      { id: 'pg_bp_1', serviceLabel: 'Cleansing Facial & Threading', serviceUrduLabel: 'فیشل اور تھریڈنگ', minPkr: 2200, maxPkr: 5000, unit: 'per session' },
      { id: 'pg_bp_2', serviceLabel: 'Full Mani-Pedi & Wax Package', serviceUrduLabel: 'مینی پیڈی اور ویکس پیکج', minPkr: 2800, maxPkr: 6000, unit: 'per session' },
    ],
  },
  {
    id: 'trade_mehndi',
    slug: 'mehndi-artist',
    name: 'Mehndi Artist',
    urduName: 'مہندی آرٹسٹ',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Bridal, Eid, and party henna artistry using fresh natural organic mehndi cones.',
    icon: 'flower',
    defaultPriceGuide: [
      { id: 'pg_mhd_1', serviceLabel: 'Party / Casual Both Hands', serviceUrduLabel: 'پارٹی مہندی (دونوں ہاتھ)', minPkr: 1500, maxPkr: 4000, unit: 'per person' },
      { id: 'pg_mhd_2', serviceLabel: 'Bridal Full Hands & Feet', serviceUrduLabel: 'برائیڈل مہندی', minPkr: 8000, maxPkr: 20000, unit: 'per package' },
    ],
  },
  {
    id: 'trade_makeup_hair',
    slug: 'makeup-hair-stylist',
    name: 'Makeup & Hair Stylist',
    urduName: 'میک اپ اور ہیئر سٹائلسٹ',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Event, party, and bridal makeup with hygienic brush kits and blowout/updo hair styling.',
    icon: 'scissors',
    defaultPriceGuide: [
      { id: 'pg_mkp_1', serviceLabel: 'Party Makeup & Hair Styling', serviceUrduLabel: 'پارٹی میک اپ اور ہیئر', minPkr: 4500, maxPkr: 12000, unit: 'per look' },
    ],
  },
  {
    id: 'trade_mens_barber',
    slug: 'mens-barber-grooming',
    name: "Men's Barber & Grooming",
    urduName: 'مردانہ حجام اور گرومنگ',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Sanitized home haircuts, beard styling, hot towel shave, and groom facial care.',
    icon: 'scissors',
    defaultPriceGuide: [
      { id: 'pg_brb_1', serviceLabel: 'Haircut + Beard Trim at Home', serviceUrduLabel: 'ہیئر کٹ اور شیو / ٹرم', minPkr: 800, maxPkr: 2000, unit: 'per session' },
    ],
  },
  {
    id: 'trade_massage_physio',
    slug: 'massage-physiotherapy-helper',
    name: 'Massage & Physiotherapy Helper',
    urduName: 'مساج اور فزیوتھراپی ہیلپر',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Mobility exercises, relaxation oil massage, and post-strain comfort support at home.',
    icon: 'heart',
    defaultPriceGuide: [
      { id: 'pg_msg_1', serviceLabel: 'Home Recovery Session (45-60 min)', serviceUrduLabel: 'ہوم سیشن (45-60 منٹ)', minPkr: 2000, maxPkr: 4500, unit: 'per session' },
    ],
  },
  {
    id: 'trade_tailor',
    slug: 'tailor-alterations',
    name: 'Tailor & Alterations',
    urduName: 'درزی اور سلائی / آلٹریشن',
    group: G3.group,
    urduGroup: G3.urduGroup,
    description: 'Custom shalwar kameez stitching, bridal/party fittings, and home pick-up alterations.',
    icon: 'scissors',
    defaultPriceGuide: [
      { id: 'pg_tlr_1', serviceLabel: 'Unstitched Suit Stitching', serviceUrduLabel: 'سوٹ کی سلائی', minPkr: 1800, maxPkr: 4500, unit: 'per suit' },
    ],
  },

  // Group 4: Automotive (5)
  {
    id: 'trade_mechanic',
    slug: 'mechanic',
    name: 'Car Mechanic (Doorstep & Workshop)',
    urduName: 'آٹو مکینک (کار مکینک)',
    group: G4.group,
    urduGroup: G4.urduGroup,
    description: 'Automotive inspection, routine engine servicing, brake inspection, fault diagnostics, and preventive maintenance.',
    icon: 'wrench',
    defaultPriceGuide: [
      { id: 'pg_mch_1', serviceLabel: 'Doorstep Tuning / Oil Service', serviceUrduLabel: 'گھر پر ٹیوننگ / آئل سروس', minPkr: 1500, maxPkr: 3500, unit: 'per visit' },
      { id: 'pg_mch_2', serviceLabel: 'Brake Pad Replacement (Labor)', serviceUrduLabel: 'بریک پیڈ تبدیلی (مزدوری)', minPkr: 1200, maxPkr: 2800, unit: 'per axle' },
    ],
  },
  {
    id: 'trade_bike_mechanic',
    slug: 'bike-mechanic',
    name: 'Bike Mechanic',
    urduName: 'موٹر سائیکل مکینک',
    group: G4.group,
    urduGroup: G4.urduGroup,
    description: '70cc–150cc motorcycle tuning, clutch/chain adjustment, carburetor cleaning, and puncture repair.',
    icon: 'bike',
    defaultPriceGuide: [
      { id: 'pg_bkm_1', serviceLabel: 'Full Bike Tuning & Oil Change', serviceUrduLabel: 'مکمل بائیک ٹیوننگ (مزدوری)', minPkr: 450, maxPkr: 1000, unit: 'per visit' },
    ],
  },
  {
    id: 'trade_auto_electrician',
    slug: 'auto-electrician-battery',
    name: 'Auto Electrician & Battery Service',
    urduName: 'آٹو الیکٹریشن اور بیٹری سروس',
    group: G4.group,
    urduGroup: G4.urduGroup,
    description: 'Car jump-starts, alternator checks, starter motor repair, car AC electricals, and battery replacement.',
    icon: 'zap',
    defaultPriceGuide: [
      { id: 'pg_ael_1', serviceLabel: 'Jump Start & Alternator Test', serviceUrduLabel: 'جمپ سٹارٹ اور چارجنگ ٹیسٹ', minPkr: 800, maxPkr: 2000, unit: 'per visit' },
    ],
  },
  {
    id: 'trade_car_ac_denting',
    slug: 'car-ac-denting-painting',
    name: 'Car AC & Denting/Painting',
    urduName: 'کار اے سی اور ڈینٹنگ پینٹنگ',
    group: G4.group,
    urduGroup: G4.urduGroup,
    description: 'Car AC gas refill, condenser flushing, dry dent removal, and bumper touch-up.',
    icon: 'car',
    defaultPriceGuide: [
      { id: 'pg_cac_1', serviceLabel: 'Car AC Service & Gas Refill', serviceUrduLabel: 'کار اے سی سروس و گیس', minPkr: 3500, maxPkr: 7500, unit: 'per car' },
    ],
  },
  {
    id: 'trade_tyre_puncture',
    slug: 'tyre-puncture-roadside',
    name: 'Tyre & Puncture Roadside Help',
    urduName: 'ٹائر اور پنکچر روڈ سائیڈ مدد',
    group: G4.group,
    urduGroup: G4.urduGroup,
    description: 'Mobile tubeless puncture sealing, spare wheel swap, and roadside air inflation.',
    icon: 'circle',
    defaultPriceGuide: [
      { id: 'pg_tyr_1', serviceLabel: 'Roadside Puncture / Stepney Swap', serviceUrduLabel: 'روڈ سائیڈ پنکچر / ٹائر تبدیلی', minPkr: 600, maxPkr: 1500, unit: 'per visit' },
    ],
  },

  // Group 5: Household Help & Family (7)
  {
    id: 'trade_home_cook',
    slug: 'home-cook-chef',
    name: 'Home Cook / Chef',
    urduName: 'گھریلو کک / باورچی',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Hygienic Pakistani home meals, weekly meal prep, and hygienic dawat/family dinner cooking.',
    icon: 'utensils',
    defaultPriceGuide: [
      { id: 'pg_cok_1', serviceLabel: 'Dawat / Per-Session Home Cook', serviceUrduLabel: 'دعوت / ایک وقت کا کھانا', minPkr: 2500, maxPkr: 6000, unit: 'per session' },
    ],
  },
  {
    id: 'trade_housemaid',
    slug: 'housemaid-domestic-helper',
    name: 'Housemaid / Domestic Helper',
    urduName: 'گھریلو ملازمہ / صفائی ہیلپر',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Daily or hourly sweeping, mopping, dishwashing, laundry folding, and kitchen upkeep.',
    icon: 'home',
    defaultPriceGuide: [
      { id: 'pg_hmd_1', serviceLabel: 'Half-Day Cleaning Support', serviceUrduLabel: 'آدھے دن کی گھریلو صفائی', minPkr: 1200, maxPkr: 2500, unit: 'per visit' },
    ],
  },
  {
    id: 'trade_babysitter',
    slug: 'babysitter-ayah',
    name: 'Babysitter / Ayah',
    urduName: 'بے بی سٹر / آیا',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Trained child-safety caregiver for infants and toddlers with verified first-aid awareness.',
    icon: 'baby',
    defaultPriceGuide: [
      { id: 'pg_bby_1', serviceLabel: 'Day Care / Event Babysitting', serviceUrduLabel: 'ڈے کیئر / بچوں کی دیکھ بھال', minPkr: 1800, maxPkr: 4000, unit: 'per day' },
    ],
  },
  {
    id: 'trade_elder_care',
    slug: 'elder-care-attendant',
    name: 'Elder Care Attendant',
    urduName: 'بزرگوں کی دیکھ بھال کا اٹینڈنٹ',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Compassionate assistance with mobility, medication reminders, vitals tracking, and companionship.',
    icon: 'heart',
    defaultPriceGuide: [
      { id: 'pg_eld_1', serviceLabel: '12-Hour Care Shift', serviceUrduLabel: '12 گھنٹے کی شفٹ', minPkr: 2200, maxPkr: 4500, unit: 'per shift' },
    ],
  },
  {
    id: 'trade_driver',
    slug: 'driver-hourly-monthly',
    name: 'Driver (Hourly / Monthly)',
    urduName: 'ڈرائیور (فی گھنٹہ / ماہانہ)',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Verified manual and automatic car drivers for family errands, school runs, and outstation trips.',
    icon: 'car',
    defaultPriceGuide: [
      { id: 'pg_drv_1', serviceLabel: 'On-Demand City Driving (Up to 4h)', serviceUrduLabel: 'شہری ڈرائیونگ (4 گھنٹے تک)', minPkr: 1500, maxPkr: 3000, unit: 'per trip' },
    ],
  },
  {
    id: 'trade_gardener',
    slug: 'gardener-mali',
    name: 'Gardener (Mali)',
    urduName: 'مالی (باغبانی)',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Lawn mowing, hedge pruning, seasonal flower planting, and kitchen-garden pest care.',
    icon: 'sprout',
    defaultPriceGuide: [
      { id: 'pg_mli_1', serviceLabel: 'Lawn Trimming & Maintenance', serviceUrduLabel: 'لان کی کٹائی و دیکھ بھال', minPkr: 1200, maxPkr: 3000, unit: 'per visit' },
    ],
  },
  {
    id: 'trade_security_guard',
    slug: 'security-guard-chowkidar',
    name: 'Security Guard / Chowkidar',
    urduName: 'سیکیورٹی گارڈ / چوکیدار',
    group: G5.group,
    urduGroup: G5.urduGroup,
    description: 'Gate access logging, night patrol vigilance, CCTV monitoring, and emergency protocol readiness.',
    icon: 'shield',
    defaultPriceGuide: [
      { id: 'pg_grd_1', serviceLabel: 'Event / Relief Guard Shift', serviceUrduLabel: 'تقریب یا ریلیف گارڈ شفٹ', minPkr: 1800, maxPkr: 3500, unit: 'per shift' },
    ],
  },

  // Group 6: Moving & Logistics (4)
  {
    id: 'trade_packers_movers',
    slug: 'packers-and-movers',
    name: 'Packers & Movers',
    urduName: 'پیکرز اینڈ موورز (گھر شفٹنگ)',
    group: G6.group,
    urduGroup: G6.urduGroup,
    description: 'Bubble-wrap packing, furniture disassembly/reassembly, safe loading, and room-by-room placement.',
    icon: 'package',
    defaultPriceGuide: [
      { id: 'pg_mov_1', serviceLabel: '2-Bedroom Shifting Crew', serviceUrduLabel: '2 بیڈروم شفٹنگ ٹیم', minPkr: 12000, maxPkr: 28000, unit: 'per move' },
    ],
  },
  {
    id: 'trade_pickup_loader',
    slug: 'pickup-loader-rickshaw-transport',
    name: 'Pickup / Loader Rickshaw Transport',
    urduName: 'پک اپ / لوڈر رکشہ ٹرانسپورٹ',
    group: G6.group,
    urduGroup: G6.urduGroup,
    description: 'Local appliance, furniture, and market cargo transport with tie-down strapping.',
    icon: 'truck',
    defaultPriceGuide: [
      { id: 'pg_pck_1', serviceLabel: 'Intra-City Loader / Suzuki Trip', serviceUrduLabel: 'شہر کے اندر لوڈر ٹرپ', minPkr: 1800, maxPkr: 4500, unit: 'per trip' },
    ],
  },
  {
    id: 'trade_furniture_shifting',
    slug: 'furniture-shifting-helper',
    name: 'Furniture Shifting Helper',
    urduName: 'فرنیچر شفٹنگ ہیلپر',
    group: G6.group,
    urduGroup: G6.urduGroup,
    description: 'Careful lifting, stair maneuvering, and scratch-free room rearrangement for heavy items.',
    icon: 'box',
    defaultPriceGuide: [
      { id: 'pg_fsh_1', serviceLabel: 'Per-Helper Shifting Support', serviceUrduLabel: 'فی ہیلپر شفٹنگ', minPkr: 1500, maxPkr: 3000, unit: 'per helper' },
    ],
  },
  {
    id: 'trade_courier',
    slug: 'courier-errand-runner',
    name: 'Courier & Errand Runner',
    urduName: 'کوریئر اور کام کاج رنر',
    group: G6.group,
    urduGroup: G6.urduGroup,
    description: 'Same-day document delivery, pharmacy/hardware errands, and verified parcel handoff.',
    icon: 'send',
    defaultPriceGuide: [
      { id: 'pg_cor_1', serviceLabel: 'Single Point-to-Point Errand', serviceUrduLabel: 'شہر میں فوری ڈیلیوری', minPkr: 400, maxPkr: 1000, unit: 'per trip' },
    ],
  },

  // Group 7: Events & Occasions (5)
  {
    id: 'trade_photographer',
    slug: 'photographer-videographer',
    name: 'Photographer & Videographer',
    urduName: 'فوٹوگرافر اور ویڈیو گرافر',
    group: G7.group,
    urduGroup: G7.urduGroup,
    description: 'Family event, nikah, and corporate portrait photography/video with color-graded delivery.',
    icon: 'camera',
    defaultPriceGuide: [
      { id: 'pg_pht_1', serviceLabel: 'Event Coverage (3–4 Hours)', serviceUrduLabel: 'تقریب کوریج (3-4 گھنٹے)', minPkr: 8000, maxPkr: 20000, unit: 'per event' },
    ],
  },
  {
    id: 'trade_caterer',
    slug: 'caterer-daig-cook',
    name: 'Caterer & Daig Cook',
    urduName: 'کیٹرنگ اور دیگ کک',
    group: G7.group,
    urduGroup: G7.urduGroup,
    description: 'Traditional biryani, qorma, BBQ live stations, and chafing-dish setup for family gatherings.',
    icon: 'flame',
    defaultPriceGuide: [
      { id: 'pg_ctr_1', serviceLabel: 'Single Daig Cooking (Labor)', serviceUrduLabel: 'دیگ پکائی (مزدوری)', minPkr: 2500, maxPkr: 5000, unit: 'per daig' },
    ],
  },
  {
    id: 'trade_event_decor',
    slug: 'event-decorator-tent-setup',
    name: 'Event Decorator & Tent Setup',
    urduName: 'ایونٹ ڈیکوریشن اور ٹینٹ سروس',
    group: G7.group,
    urduGroup: G7.urduGroup,
    description: 'Floral backdrops, fairy lighting, mehndi stage decor, and marquee/kanat setup.',
    icon: 'sparkles',
    defaultPriceGuide: [
      { id: 'pg_dec_1', serviceLabel: 'Home Intimate Decor Setup', serviceUrduLabel: 'گھریلو سجاوٹ سیٹ اپ', minPkr: 7000, maxPkr: 18000, unit: 'per event' },
    ],
  },
  {
    id: 'trade_sound_lighting',
    slug: 'sound-lighting-technician',
    name: 'Sound & Lighting Technician',
    urduName: 'ساؤنڈ اور لائٹنگ ٹیکنیشن',
    group: G7.group,
    urduGroup: G7.urduGroup,
    description: 'PA speaker rigging, cordless mic balancing, stage LEDs, and clean cable safety.',
    icon: 'speaker',
    defaultPriceGuide: [
      { id: 'pg_snd_1', serviceLabel: 'Small Event PA + Mic Setup', serviceUrduLabel: 'ساؤنڈ و مائیک سیٹ اپ', minPkr: 4000, maxPkr: 10000, unit: 'per event' },
    ],
  },
  {
    id: 'trade_qurbani_butcher',
    slug: 'qurbani-butcher-qasai',
    name: 'Qurbani Butcher (Qasai)',
    urduName: 'قربانی قصائی',
    group: G7.group,
    urduGroup: G7.urduGroup,
    description: 'Hygienic slaughtering, clean portioning, bone cutting, and sanitary meat handling.',
    icon: 'scissors',
    defaultPriceGuide: [
      { id: 'pg_qsb_1', serviceLabel: 'Goat / Sheep Processing', serviceUrduLabel: 'بکرا / دنبہ قصائی سروس', minPkr: 4000, maxPkr: 9000, unit: 'per animal' },
    ],
  },

  // Group 8: Device Repair (4)
  {
    id: 'trade_mobile_repair',
    slug: 'mobile-phone-repair',
    name: 'Mobile Phone Repair',
    urduName: 'موبائل فون مرمت',
    group: G8.group,
    urduGroup: G8.urduGroup,
    description: 'Screen/battery swaps, charging port micro-soldering, and ESD-safe smartphone diagnostics.',
    icon: 'smartphone',
    defaultPriceGuide: [
      { id: 'pg_mob_1', serviceLabel: 'Charging Port / Battery Swap (Labor)', serviceUrduLabel: 'چارجنگ جیک / بیٹری تبدیلی', minPkr: 700, maxPkr: 2000, unit: 'per device' },
    ],
  },
  {
    id: 'trade_laptop_repair',
    slug: 'laptop-computer-repair',
    name: 'Laptop & Computer Repair',
    urduName: 'لیپ ٹاپ اور کمپیوٹر مرمت',
    group: G8.group,
    urduGroup: G8.urduGroup,
    description: 'SSD/RAM upgrades, thermal paste servicing, hinge/keyboard repair, and OS troubleshooting.',
    icon: 'laptop',
    defaultPriceGuide: [
      { id: 'pg_lap_1', serviceLabel: 'Thermal Service + OS Cleanup', serviceUrduLabel: 'تھرمل سروس اور سافٹ ویئر', minPkr: 1200, maxPkr: 3000, unit: 'per device' },
    ],
  },
  {
    id: 'trade_tv_led_repair',
    slug: 'tv-led-repair',
    name: 'TV & LED Repair',
    urduName: 'ٹی وی اور ایل ای ڈی مرمت',
    group: G8.group,
    urduGroup: G8.urduGroup,
    description: 'Backlight strip replacement, power-supply board repair, and smart TV wall installation.',
    icon: 'tv',
    defaultPriceGuide: [
      { id: 'pg_tv_1', serviceLabel: 'Inspection / Power Board Fix', serviceUrduLabel: 'پاور بورڈ / بیک لائٹ مرمت', minPkr: 1500, maxPkr: 4500, unit: 'per unit' },
    ],
  },
  {
    id: 'trade_printer_network',
    slug: 'printer-network-router-setup',
    name: 'Printer & Network / Router Setup',
    urduName: 'پرنٹر اور وائی فائی راؤٹر سیٹ اپ',
    group: G8.group,
    urduGroup: G8.urduGroup,
    description: 'Home mesh Wi-Fi coverage optimization, LAN cabling, printer sharing, and router security hardening.',
    icon: 'wifi',
    defaultPriceGuide: [
      { id: 'pg_net_1', serviceLabel: 'Wi-Fi Mesh & Router Optimization', serviceUrduLabel: 'وائی فائی راؤٹر اور نیٹ ورک سیٹ اپ', minPkr: 1200, maxPkr: 3000, unit: 'per visit' },
    ],
  },
];

export function getServiceBySlugOrId(slugOrId: string | null | undefined): ServiceCategoryDef | undefined {
  if (!slugOrId) return undefined;
  return SERVICE_CATALOG.find((s) => s.id === slugOrId || s.slug === slugOrId);
}
