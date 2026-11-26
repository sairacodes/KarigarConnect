export interface CityOption {
  name: string;
  urduName: string;
  province: string;
  provinceUrdu: string;
}

export interface ProvinceCityGroup {
  province: string;
  urduName: string;
  cities: Array<{ name: string; urduName: string }>;
}

export const PAKISTAN_PROVINCE_GROUPS: ProvinceCityGroup[] = [
  {
    province: 'Islamabad Capital Territory',
    urduName: 'وفاقی دارالحکومت اسلام آباد',
    cities: [
      { name: 'Islamabad', urduName: 'اسلام آباد' },
    ],
  },
  {
    province: 'Punjab',
    urduName: 'پنجاب',
    cities: [
      { name: 'Lahore', urduName: 'لاہور' },
      { name: 'Rawalpindi', urduName: 'راولپنڈی' },
      { name: 'Faisalabad', urduName: 'فیصل آباد' },
      { name: 'Multan', urduName: 'ملتان' },
      { name: 'Gujranwala', urduName: 'گوجرانوالہ' },
      { name: 'Sialkot', urduName: 'سیالکوٹ' },
      { name: 'Bahawalpur', urduName: 'بہاولپور' },
      { name: 'Sargodha', urduName: 'سرگودھا' },
      { name: 'Sheikhupura', urduName: 'شیخوپورہ' },
      { name: 'Jhang', urduName: 'جھنگ' },
      { name: 'Gujrat', urduName: 'گجرات' },
      { name: 'Kasur', urduName: 'قصور' },
      { name: 'Rahim Yar Khan', urduName: 'رحیم یار خان' },
      { name: 'Sahiwal', urduName: 'ساہیوال' },
      { name: 'Okara', urduName: 'اوکاڑہ' },
      { name: 'Wah Cantt', urduName: 'واہ کینٹ' },
      { name: 'Taxila', urduName: 'ٹیکسلا' },
      { name: 'Chakwal', urduName: 'چکوال' },
      { name: 'Jhelum', urduName: 'جہلم' },
      { name: 'Attock', urduName: 'اٹک' },
      { name: 'Mianwali', urduName: 'میانوالی' },
      { name: 'Bhakkar', urduName: 'بھکر' },
      { name: 'Khushab', urduName: 'خوشاب' },
      { name: 'Layyah', urduName: 'لیہ' },
      { name: 'Dera Ghazi Khan', urduName: 'ڈیرہ غازی خان' },
      { name: 'Rajanpur', urduName: 'راجن پور' },
      { name: 'Muzaffargarh', urduName: 'مظفر گڑھ' },
      { name: 'Vehari', urduName: 'وہاڑی' },
      { name: 'Khanewal', urduName: 'خانیوال' },
      { name: 'Lodhran', urduName: 'لودھراں' },
      { name: 'Bahawalnagar', urduName: 'بہاولنگر' },
      { name: 'Chiniot', urduName: 'چنیوٹ' },
      { name: 'Toba Tek Singh', urduName: 'ٹوبہ ٹیک سنگھ' },
      { name: 'Hafizabad', urduName: 'حافظ آباد' },
      { name: 'Mandi Bahauddin', urduName: 'منڈی بہاؤالدین' },
      { name: 'Narowal', urduName: 'نارووال' },
      { name: 'Pakpattan', urduName: 'پاکپتن' },
      { name: 'Nankana Sahib', urduName: 'ننکانہ صاحب' },
      { name: 'Murree', urduName: 'مری' },
      { name: 'Kamoke', urduName: 'کامونکی' },
      { name: 'Wazirabad', urduName: 'وزیر آباد' },
    ],
  },
  {
    province: 'Sindh',
    urduName: 'سندھ',
    cities: [
      { name: 'Karachi', urduName: 'کراچی' },
      { name: 'Hyderabad', urduName: 'حیدرآباد' },
      { name: 'Sukkur', urduName: 'سکھر' },
      { name: 'Larkana', urduName: 'لاڑکانہ' },
      { name: 'Nawabshah', urduName: 'نواب شاہ' },
      { name: 'Mirpurkhas', urduName: 'میرپور خاص' },
      { name: 'Jacobabad', urduName: 'جیکب آباد' },
      { name: 'Shikarpur', urduName: 'شکارپور' },
      { name: 'Khairpur', urduName: 'خیرپور' },
      { name: 'Dadu', urduName: 'دادو' },
      { name: 'Thatta', urduName: 'ٹھٹھہ' },
      { name: 'Badin', urduName: 'بدین' },
      { name: 'Umerkot', urduName: 'عمرکوٹ' },
      { name: 'Tharparkar', urduName: 'تھرپارکر' },
      { name: 'Sanghar', urduName: 'سانگھڑ' },
      { name: 'Jamshoro', urduName: 'جامشورو' },
      { name: 'Tando Allahyar', urduName: 'ٹنڈو الہیار' },
      { name: 'Tando Muhammad Khan', urduName: 'ٹنڈو محمد خان' },
      { name: 'Kotri', urduName: 'کوٹری' },
      { name: 'Ghotki', urduName: 'گھوٹکی' },
    ],
  },
  {
    province: 'Khyber Pakhtunkhwa',
    urduName: 'خیبر پختونخوا',
    cities: [
      { name: 'Peshawar', urduName: 'پشاور' },
      { name: 'Mardan', urduName: 'مردان' },
      { name: 'Abbottabad', urduName: 'ایبٹ آباد' },
      { name: 'Mingora', urduName: 'مینگورہ' },
      { name: 'Swat', urduName: 'سوات' },
      { name: 'Kohat', urduName: 'کوہاٹ' },
      { name: 'Dera Ismail Khan', urduName: 'ڈیرہ اسماعیل خان' },
      { name: 'Bannu', urduName: 'بنوں' },
      { name: 'Charsadda', urduName: 'چارسدہ' },
      { name: 'Nowshera', urduName: 'نوشہرہ' },
      { name: 'Swabi', urduName: 'صوابی' },
      { name: 'Mansehra', urduName: 'مانسہرہ' },
      { name: 'Haripur', urduName: 'ہری پور' },
      { name: 'Chitral', urduName: 'چترال' },
      { name: 'Dir', urduName: 'دیر' },
      { name: 'Buner', urduName: 'بونیر' },
      { name: 'Malakand', urduName: 'مالاکنڈ' },
      { name: 'Karak', urduName: 'کرک' },
      { name: 'Lakki Marwat', urduName: 'لکی مروت' },
      { name: 'Tank', urduName: 'ٹانک' },
      { name: 'Hangu', urduName: 'ہنگو' },
      { name: 'Parachinar', urduName: 'پاڑہ چنار' },
    ],
  },
  {
    province: 'Balochistan',
    urduName: 'بلوچستان',
    cities: [
      { name: 'Quetta', urduName: 'کوئٹہ' },
      { name: 'Gwadar', urduName: 'گوادر' },
      { name: 'Turbat', urduName: 'تربت' },
      { name: 'Khuzdar', urduName: 'خضدار' },
      { name: 'Hub', urduName: 'حب' },
      { name: 'Chaman', urduName: 'چمن' },
      { name: 'Sibi', urduName: 'سبی' },
      { name: 'Zhob', urduName: 'ژوب' },
      { name: 'Loralai', urduName: 'لورالائی' },
      { name: 'Pishin', urduName: 'پشین' },
      { name: 'Kalat', urduName: 'قلات' },
      { name: 'Mastung', urduName: 'مستونگ' },
      { name: 'Nushki', urduName: 'نوشکی' },
      { name: 'Panjgur', urduName: 'پنجگور' },
      { name: 'Dera Murad Jamali', urduName: 'ڈیرہ مراد جمالی' },
    ],
  },
  {
    province: 'Gilgit-Baltistan',
    urduName: 'گلگت بلتستان',
    cities: [
      { name: 'Gilgit', urduName: 'گلگت' },
      { name: 'Skardu', urduName: 'سکردو' },
      { name: 'Hunza', urduName: 'ہنزہ' },
      { name: 'Chilas', urduName: 'چلاس' },
      { name: 'Ghizer', urduName: 'غذر' },
      { name: 'Astore', urduName: 'استور' },
      { name: 'Nagar', urduName: 'نگر' },
    ],
  },
  {
    province: 'Azad Jammu & Kashmir',
    urduName: 'آزاد جموں و کشمیر',
    cities: [
      { name: 'Muzaffarabad', urduName: 'مظفرآباد' },
      { name: 'Mirpur', urduName: 'میرپور' },
      { name: 'Rawalakot', urduName: 'راولاکوٹ' },
      { name: 'Kotli', urduName: 'کوٹلی' },
      { name: 'Bagh', urduName: 'باغ' },
      { name: 'Bhimber', urduName: 'بھمبر' },
      { name: 'Neelum', urduName: 'نیلم' },
    ],
  },
];

export const ALL_CITIES_FLAT: CityOption[] = PAKISTAN_PROVINCE_GROUPS.flatMap((group) =>
  group.cities.map((c) => ({
    name: c.name,
    urduName: c.urduName,
    province: group.province,
    provinceUrdu: group.urduName,
  }))
);

export function findCityOption(cityName: string): CityOption | undefined {
  const normalized = cityName.trim().toLowerCase();
  if (!normalized) return undefined;
  return ALL_CITIES_FLAT.find(
    (c) => c.name.toLowerCase() === normalized || c.urduName.toLowerCase() === normalized
  );
}

export function getCityDisplayLabel(cityName: string, lang: 'en' | 'ur'): string {
  const match = findCityOption(cityName);
  if (!match) return cityName;
  return lang === 'ur' ? `${match.urduName} (${match.name})` : match.name;
}
