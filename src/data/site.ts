/**
 * Single source of truth for brand facts, navigation, offers and integrations.
 * Everything here comes from the live yahiafouad.com content — nothing invented.
 * To add a new offer later, append to `offers` (and optionally a page); the
 * homepage, programs hub and footer pick it up automatically.
 */

export const PRODUCTION_ORIGIN = 'https://yahiafouad.com';

export const brand = {
  nameAr: 'يحيى فؤاد',
  nameEn: 'Yahia Fouad',
  roleAr: 'استشاري علاقات أسرية',
  rolesEn: ['Consultant', 'Motivation Speaker'],
  community: 'رفيق الوعي',
  message: 'رسالتي ليست أن أعلّم… بل أن أُذكّر.',
  messageFollow: 'أُذكّرك بذاتك… بنورك… بصوتك الداخلي الذي نسيته وسط الضوضاء.',
  values:
    'قيم رحلتي تنبع من يقينٍ راسخ: أن الإنسان يستحق أن يُرى، أن يُفهَم، وأن يُحب حتى وهو في أشد لحظات ضعفه.',
  vision:
    'رؤيتي هي عالمٌ يرى فيه كل فرد ذاته بنورٍ مختلف، يصالح ماضيه دون إنكار، ويخلق سلامه الداخلي من الداخل لا من الظروف.',
  mission: [
    { from: 'الألم', to: 'وعي' },
    { from: 'التشتت', to: 'بوصلة' },
    { from: 'الصمت', to: 'صوتٍ له معنى' },
  ],
  missionText: 'مهمتي أن أُترجم الألم إلى وعي، وأن أُحوّل التشتت إلى بوصلة، والصمت إلى صوتٍ له معنى.',
};

export const contact = {
  email: 'info@yahiafouad.com',
  phoneDisplay: '01096140101',
  phoneIntl: '+201096140101',
  locationAr: 'روكسي، القاهرة',
  locationEn: 'Roxy, Cairo',
};

export const nav = [
  { label: 'الرئيسية', href: '/' },
  { label: 'عن يحيى', href: '/about-us/' },
  { label: 'الاستشارات', href: '/consultations/' },
  { label: 'البرامج', href: '/programs/' },
  { label: 'المحتوى', href: '/articles/' },
  { label: 'تجارب العملاء', href: '/ourreviwe/' },
];

/** Live WordPress URLs that keep working unchanged (booking engine, checkout, workshop form, terms). */
export const live = {
  booking: `${PRODUCTION_ORIGIN}/booking-app/`,
  workshop: `${PRODUCTION_ORIGIN}/gratitude-workshop/`,
  terms: `${PRODUCTION_ORIGIN}/الشروط-والأحكام-و-سياسة-الخصوصية/`,
  privacy: `${PRODUCTION_ORIGIN}/الشروط-والأحكام-و-سياسة-الخصوصية/#privicy`,
  account: `${PRODUCTION_ORIGIN}/my-account-2-2/`,
  restBase: `${PRODUCTION_ORIGIN}/wp-json`,
};

/**
 * Session types — IDs are the JetEngine/JetAppointments service IDs used by the
 * live booking form (`service_id`). Prices are read live from the slots API at
 * booking time; the values here are only the fallback shown before it loads.
 */
export const sessionTypes = [
  {
    id: 5959,
    key: 'consult',
    name: 'جلسة استشارية',
    short: 'مساحة خاصة لتحدٍّ محدد',
    description:
      'مساحة خاصة لمناقشة التحديات اللي بتقابلك سواء في حياتك الشخصية أو العائلية. تقدر تعبر فيها عن مخاوفك أو تساؤلاتك، وتاخد توجيه عملي مبني على فهم حقيقي وخبرة في العلاقات.',
    forWho: 'لمن يمر بتحدٍّ شخصي أو أسري ويحتاج توجيهًا عمليًا واضحًا.',
    priceFallback: 1500,
  },
  {
    id: 5960,
    key: 'private',
    name: 'جلسة خاصة',
    short: 'جلسة فردية معمّقة',
    description:
      'جلسات فردية معمقة مع د. يحيى فؤاد، تركّز على موضوعات محددة أو مواقف خاصة بتحتاج مساحة آمنة للنقاش والتوجيه الشخصي.',
    forWho: 'لمن يريد أن يفهم نفسه بعمق ويرتّب مشاعره في مساحة آمنة.',
    priceFallback: 3000,
  },
  {
    id: 5961,
    key: 'family',
    name: 'جلسة عائلية',
    short: 'للأسرة مجتمعة',
    description:
      'لما تكون المشكلة تخص أكتر من فرد في الأسرة — بنجمع العيلة في جلسة هدفها تحسين التواصل، حل النزاعات، وبناء علاقة صحية بين الجميع. بنساعد كل طرف يسمع التاني ويتفاهم معاه.',
    forWho: 'لما تكون المشكلة تخص أكثر من فرد في البيت.',
    priceFallback: 4500,
  },
] as const;

/** Booking rules published on the live booking page. */
export const bookingTerms = [
  'يتم تأكيد الحجز بعد إتمام عملية الدفع بالكامل.',
  'جميع الجلسات تتم بسرية تامة، ولا يُسمح بتسجيلها أو مشاركة أي جزء منها بأي وسيلة.',
  'يمكن تأجيل الجلسة قبل موعدها بحد أقصى 48 ساعة، وفي حال التأجيل بعد ذلك لا يمكن استرداد المبلغ.',
  'يمكن إلغاء الجلسة واسترداد المبلغ إذا تم الإلغاء قبل 4 أيام من موعدها.',
  'في حالة عدم الحضور في الموعد المحدد، يتم خصم كامل قيمة الجلسة ولا يمكن استرجاعها.',
];

/** Availability published by the live calendar (JetAppointments settings). */
export const availability = {
  weekdays: [0, 1, 2, 3, 4], // Sun–Thu (JS getDay)
  hours: '10:00 – 18:00',
  slotMinutes: 60,
  timezone: 'Africa/Cairo',
};

export type OfferStatus = 'available' | 'free' | 'soon' | 'open';

export const offers: {
  key: string;
  eyebrow: string;
  title: string;
  what: string;
  forWho: string;
  helps: string;
  status: OfferStatus;
  statusLabel: string;
  cta: { label: string; href: string; external?: boolean };
}[] = [
  {
    key: 'consultations',
    eyebrow: '٠١',
    title: 'الاستشارات',
    what: 'جلسات استشارية وخاصة وعائلية، مدة كل جلسة ساعة، بسرية تامة.',
    forWho: 'لمن يمر بتحدٍّ محدد ويحتاج من يسمعه بعمق ويوجّهه من خبرة حقيقية.',
    helps: 'الخلافات الزوجية والأسرية، التعامل مع الأبناء والمراهقين، ترتيب المشاعر وفهم الذات.',
    status: 'available',
    statusLabel: 'متاحة للحجز',
    cta: { label: 'احجز استشارتك', href: '/booking-app/' },
  },
  {
    key: 'programs',
    eyebrow: '٠٢',
    title: 'البرامج',
    what: 'برامج مسجّلة تتعلّمها في الوقت الذي يناسبك، وترجع لها متى احتجت.',
    forWho: 'لمن يريد أن يتعلّم ويطبّق خطوة بخطوة، بعيدًا عن ضغط المواعيد.',
    helps: 'بناء فهم أعمق للعلاقات والتربية، بأدوات عملية تطبّقها في بيتك.',
    status: 'soon',
    statusLabel: 'قريبًا',
    cta: { label: 'اكتشف البرامج', href: '/programs/#programs' },
  },
  {
    key: 'workshops',
    eyebrow: '٠٣',
    title: 'الورش',
    what: 'ورش عملية قصيرة، كل ورشة تتعمّق في موقف واحد من حياة البيت.',
    forWho: 'للآباء والأمهات الذين يريدون خطوة صغيرة… تفرق في البيت.',
    helps: 'الورشة الحالية: «ابني ناكر الجميل… ولا أنا نسيت أعلّمه التقدير؟»',
    status: 'free',
    statusLabel: 'ورشة مجانية',
    cta: { label: 'سجّل في الورشة مجانًا', href: `${PRODUCTION_ORIGIN}/gratitude-workshop/`, external: true },
  },
  {
    key: 'community',
    eyebrow: '٠٤',
    title: 'رفيق الوعي',
    what: 'مجتمع واعٍ يحتضن كل من يسعى لفهم ذاته، وشفاء جروحه، ومرافقة غيره في رحلة العودة لنفسه.',
    forWho: 'لكل من تعب من السطحية، واشتاق للعمق.',
    helps: 'مشاركة الآراء وتبادل الخبرات تحت إشراف يحيى، في رحلة وعي مستمرة.',
    status: 'open',
    statusLabel: 'مجتمع',
    cta: { label: 'انضم لقائمة رفيق', href: '/programs/#community' },
  },
];

/** Interviews & media appearances listed on the live About page. */
export const media = [
  { title: 'برنامج يحكي أن', img: 'media-v1', href: 'https://www.youtube.com/watch?v=89U_yC4ALcE', kind: 'تلفزيون' },
  { title: 'برنامج سفيرة عزيزة', img: 'media-v2', href: 'https://www.youtube.com/watch?v=Re8pLSHAEdg', kind: 'تلفزيون' },
  { title: 'برنامج سفيرة عزيزة', img: 'media-v3', href: 'https://www.youtube.com/watch?v=-qlglnEQJT4', kind: 'تلفزيون' },
  { title: 'العلاقات السامة', img: 'media-v4', href: 'https://www.youtube.com/watch?v=Ea8lZWG0HLk', kind: 'تلفزيون' },
  { title: 'برنامج يحكي أن', img: 'media-v5', href: 'https://www.facebook.com/watch/?v=7915079228521875', kind: 'تلفزيون' },
  { title: 'راديو 9090', img: 'media-v6', href: 'https://www.youtube.com/watch?v=89U_yC4ALcE', kind: 'راديو' },
];

export const categories = {
  parenting: { label: 'التربية', pillar: '/التربية/' },
  relationships: { label: 'العلاقات', pillar: '/العلاقات/' },
  self: { label: 'تطوير الذات', pillar: '/تطوير-الذات/' },
} as const;

/**
 * Integrations. Analytics only loads on the production host, so preview
 * deployments never pollute real data. Set the GA4 id when available.
 */
export const integrations = {
  ga4Id: '' as string, // e.g. 'G-XXXXXXX' (Site Kit is installed but no tag is currently emitted)
  productionHosts: ['yahiafouad.com', 'www.yahiafouad.com'],
  /** Newsletter endpoint (Mail Mint form on WordPress). Empty = preview mode. */
  newsletterEndpoint: '' as string,
};
