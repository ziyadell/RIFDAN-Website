// The single source for every number and sentence on the page.
// Numbers come from site-data.json (generated from metrics.json) and are only formatted here.
// [[x]] marks a figure that gets the highlight sweep.
import data from './data/site-data.json';

const f = data.facts;
const v = data.validation;
export const num = (x: number, d = 0) => x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
/**
 * Percentages and signed values keep their left-to-right form inside Arabic text
 * (27.2%, +0.038) through invisible bidi isolates, everywhere they appear.
 */
const isolate = (text: string) => text.replace(
  /A sample of donations for different IDs in Ehsan|K-Means|\d[\d.,:]*%?[–-]\d[\d.,:]*%?(?!-)|(?:Log-rank p|p|C-index|Adjusted Rand) = [\d.]+|ODC Attribution License|[−+]\d[\d.,]*%?|\d[\d.,]*%/g,
  // Short statistical expressions also stay on one line; the long dataset name may wrap.
  (m) => `\u2066${m.length > 30 ? m : m.replace(/ /g, '\u00A0')}\u2069`,
);
export const pct = (x: number, d = 1) => isolate(`${num(x, d)}%`);
const signed = (x: number, d: number) => `${x < 0 ? '−' : '+'}${num(Math.abs(x), d)}`;
/** Applies isolate to every string in a content block once; values already isolated stay as they are. */
const fixBidi = <T,>(value: T): T => {
  if (typeof value === 'string') return isolate(value.replace(/[⁦⁩]/g, '').replace(/ /g, ' ')) as T;
  if (Array.isArray(value)) return value.map(fixBidi) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fixBidi(v)])) as T;
  return value;
};

const base = import.meta.env.BASE_URL;
export const asset = (path: string) => `${base}${path}`;

export const urls = {
  dashboard: asset('dashboard/RIFDAN_Dashboard.html'),
  report: asset('report/RIFDAN_Report.pdf'),
  source: 'https://open.data.gov.sa/ar/datasets/view/cc3b177a-5e5d-4845-bb92-6119b1322b05',
  license: 'https://open.data.gov.sa/ar/pages/policies/license',
  repo: 'https://github.com/ziyadell/RIFDAN-Data-Analytics',
  linkedIn: 'https://www.linkedin.com/in/ziyad-jammah-008a28263',
  x: 'https://x.com/ziyadles',
};

export const brand = {
  name: 'رفدان | RIFDAN',
  slogan: 'من البيانات إلى استدامة العطاء',
};

export const nav = [
  { href: '#decision', label: 'القرار', sections: ['decision'] },
  { href: '#stats', label: 'النتائج', sections: ['stats', 'value', 'return', 'model', 'journey'] },
  { href: '#dashboard', label: 'اللوحة', sections: ['dashboard'] },
  { href: '#recommendations', label: 'التوصيات', sections: ['recommendations'] },
  { href: '#limits', label: 'الحدود', sections: ['limits'] },
];

export const cta = { dashboard: 'افتح اللوحة التفاعلية', report: 'اقرأ التقرير التنفيذي' };

const period = '14 ديسمبر 2020 و13 يوليو 2023';

export const hero = fixBidi({
  description: 'يحلل رفدان عينة مفتوحة من تبرعات منصة إحسان ليحدد أين تتركّز قيمة العطاء، وما أكبر تدخّل قابل للقياس تستطيع جهة غير ربحية اختباره لرفع استدامته.',
  facts: [
    { value: num(f.transactions), label: 'عملية تبرع' },
    { value: `${num(f.totalAmount)} ر.س`, label: 'إجمالي مبالغ العينة' },
    { value: num(f.initiatives), label: 'مبادرة' },
    { value: num(f.donors), label: 'معرّفاً مرصوداً' },
  ],
  scope: `عينة تاريخية بين ${period}؛ لا تمثل كامل المنصة أو القطاع.`,
});

export const decision = fixBidi({
  heading: 'القرار الموصى به',
  figure: pct(f.top1Share),
  figureLabel: 'من مبالغ العينة ترتبط بمعرّف متبرع مرصود واحد',
  statement: 'ابدأ بمعالجة الاعتماد المرتفع على معرّف متبرع مرصود واحد',
  why: `يظهر هذا المعرّف في ${num(f.top1Txn)} عملية فقط، فتصبح الأرقام الإجمالية حساسة له. والمعرّف مستعار ولا يعني بالضرورة شخصاً واحداً: قد يمثل مؤسسة أو وسيطاً أو متبرعاً كبيراً، وهذا غير مؤكد من البيانات.`,
  steps: [
    { verb: 'تحقّق', text: 'راجع طبيعة المعرّف مع فريق البيانات قبل أي استنتاج.' },
    { verb: 'اعرض', text: 'اعرض المؤشرات بوسيط المبلغ، ومع المعرّف وبدونه.' },
    { verb: 'نوّع', text: 'ابنِ خطة تنويع لقاعدة المتبرعين.' },
  ],
  next: 'ثم شغّل خطة «اختبار رحلة تشجع على التبرع الثاني» بقاعدة قرار تُعلن قبل بدء التجربة. وكل ذلك مقترحات للاختبار، لا نتائج مثبتة.',
  toggle: {
    title: 'جرّب بنفسك: كيف تتغير المتوسطات؟',
    note: 'معرّف واحد يكفي لتحريك المتوسط، ولهذا يُقرأ مع الوسيط لا وحده.',
    with: 'مع المعرّف الأكبر',
    without: 'بدون المعرّف الأكبر',
    rows: [
      { label: 'متوسط مبلغ العملية', with: `${num(f.mean, 1)} ر.س`, without: `${num(f.meanTxnWithoutTop1, 1)} ر.س` },
      { label: 'متوسط إجمالي المعرّف', with: `${num(f.meanDonor)} ر.س`, without: `${num(f.meanDonorWithoutTop1)} ر.س` },
    ],
  },
});

export const stats = fixBidi({
  heading: 'ما تخفيه الأرقام الإجمالية',
  lead: `${num(f.totalAmount)} ر.س عبر ${num(f.transactions)} عملية و${num(f.initiatives)} مبادرة و${num(f.donors)} معرّفاً مرصوداً. الإجمالي وحده لا يكشف كيف توزعت هذه القيمة.`,
  pairs: [
    {
      title: 'التبرع المعتاد',
      items: [
        { value: f.median, decimals: 0, suffix: ' ر.س', label: 'وسيط مبلغ العملية' },
        { value: f.mean, decimals: 1, suffix: ' ر.س', label: 'متوسط مبلغ العملية' },
      ],
      note: `الفرق بينهما سببه مبالغ كبيرة قليلة: ${pct(f.shareLe10Txn)} من العمليات 10 ر.س فأقل، وتمثل ${pct(f.shareLe10Amount)} من المبالغ.`,
    },
    {
      title: 'تركّز المبالغ',
      items: [
        { value: f.top1Share, decimals: 1, suffix: '%', label: 'حصة أكبر معرّف' },
        { value: f.top10PctShare, decimals: 1, suffix: '%', label: 'حصة أعلى 10% من المعرّفات' },
      ],
      note: `ومبادرة «مشروع» وحدها ${pct(f.topInitiativeShare)} من المبالغ، بينما «التبرع الدوري» ${pct(f.recurringTxnShare)} من العمليات مقابل ${pct(f.recurringAmountShare)} من المبالغ.`,
    },
  ],
});

const band210 = data.bands[1];
const band5k = data.bands[5];
export const value = fixBidi({
  heading: 'أين تقع القيمة',
  lead: 'النشاط في طرف، والقيمة في الطرف الآخر.',
  callouts: [
    { band: '2–10 ر.س', text: `تضم [[${pct(band210.count_pct)}]] من العمليات، ولا تمثل سوى ${pct(band210.amount_pct)} من المبالغ.` },
    { band: '5,000 ر.س فأكثر', text: `تضم ${pct(band5k.count_pct)} من العمليات، وتمثل [[${pct(band5k.amount_pct)}]] من المبالغ.` },
  ],
  note: 'حصص وصفية من العينة، ولا تفسّر سبب التوزيع.',
});

export const returning = fixBidi({
  heading: 'متى يعود المتبرع',
  lead: 'تحليل بقاء كابلان-ماير يقيس المدة بين أول تبرع مرصود والتبرع التالي، ويعامل من لم يعد حتى نهاية الفترة كمشاهدة مراقَبة لا كحالة فشل.',
  facts: [
    { value: num(f.cohort), label: 'معرّفاً في الفوج' },
    { value: pct(f.return30), label: 'عودة خلال 30 يوماً' },
    { value: `${num(f.medianDays)} يوماً`, label: 'وسيط زمن العودة' },
    { value: num(f.censored), label: 'مشاهدة مراقَبة' },
  ],
  kmTitle: 'نسبة من لم يعودوا بعد، بحسب الأيام منذ أول تبرع مرصود',
  kmNote: `يبدأ المنحنى من 100%، ويهبط في اليوم نفسه لأن بعض المعرّفات تبرعت مرتين في يوم واحد. يعرض الرسم ${num(data.km.length)} نقطة من أصل ${num(data.kmSourcePoints)} في المصدر.`,
  coxHeading: 'الباب الذي دخل منه، لا حجم أول تبرع',
  coxBefore: `بالمقارنة الثنائية يبدو أن من تبرع أولاً بالوسيط فأقل يعود أسرع: ${pct(f.lowMedian30)} مقابل ${pct(f.highMedian30)} خلال 30 يوماً (Log-rank p = ${num(f.logRankP, 4)}).`,
  coxAfter: `لكن بعد ضبط المبادرة في نموذج Cox يزول أثر حجم أول تبرع: نسبة خطر [[${num(f.coxFirstAmountHr, 3)}]] بقيمة p = ${num(f.coxFirstAmountP, 2)}، وC-index = ${num(f.coxConcordance, 3)}. فالعوامل المتاحة تفسّر جزءاً صغيراً من التباين.`,
  cohortTitle: 'العودة خلال 30 يوماً بحسب شهر الدخول',
  cohortText: `والمعدل ليس ثابتاً: ${num(f.cohortCount)} فوجاً شهرياً تتراوح عودتها بين ${pct(f.cohortMin)} و${pct(f.cohortMax)} بوسيط ${pct(f.cohortMedian)}.`,
  cohortNote: 'تظهر فقط الأشهر التي دخل فيها 30 معرّفاً فأكثر.',
});

export const model = fixBidi({
  heading: 'ما لا يثبته النموذج',
  lead: 'أربع نتائج متقدمة، ومعها ما لا يصح استنتاجه منها.',
  coxTitle: 'نسب الخطر في نموذج Cox مع فواصل ثقة 95%',
  coxNote: 'الأقل من 1 يعني عودة أبطأ، والأعلى يعني عودة أسرع، مقارنةً بالمرجع: مبادرة «إغاثة» ووسيلة «أبل باي». وفرضية تناسب المخاطر لم تُختبر.',
  cards: [
    {
      title: 'التنبؤ بالعودة خلال 90 يوماً',
      figure: `AUC ${num(f.auc, 3)}`,
      vs: `مقابل ${num(f.baselineAuc, 3)} لخط الأساس`,
      text: `تحسن محدود على نافذة اختبار واحدة. فاصل ثقة 95% للفرق من ${signed(f.aucLo, 3)} إلى ${signed(f.aucHi, 3)}، فيشمل الصفر.`,
    },
    {
      title: 'نافذة الذروة: الجمعة 16:00–18:59',
      figure: pct(f.peakTxnShare),
      vs: 'من العمليات',
      text: `كثافة لا قيمة: اختبار الفرق لا يجد مبلغاً أعلى. حجم الأثر الرتبي ${signed(f.peakRankEffect, 3)}، والفاصلان العنقوديان يشملان الصفر.`,
    },
    {
      title: 'قيمة نقطة مئوية واحدة',
      figure: `${num(f.sizingLow)}–${num(f.sizingHigh)} ر.س`,
      vs: `${pct(f.sizingLowShare, 2)}–${pct(f.sizingHighShare, 2)} من الإجمالي`,
      text: 'رافعة صغيرة بمقياس العينة. الحد الأعلى ارتباط وصفي لا أثر سببي، ولا يشمل كلفة التنفيذ.',
    },
    {
      title: 'تقسيم المعرّفات إلى ثلاث شرائح',
      figure: `Silhouette ${num(f.silhouette, 2)}`,
      vs: `شريحتان تحققان ${num(f.silhouetteBest, 3)}`,
      text: `اختيرت ثلاث شرائح لأغراض عملية لا إحصائية. والتقسيم ثابت عبر أربع بذور عشوائية (Adjusted Rand = ${num(f.ariMin, 2)}).`,
    },
  ],
});

export const journey = fixBidi({
  heading: 'من البيانات إلى القرار',
  lead: 'هذه خطوات عمل لا قمع تحويل: لكل مرحلة وحدة قياسها، فلا تُقارن أرقامها ببعضها.',
  stages: [
    {
      id: 'data',
      title: 'البيانات',
      figure: num(f.rawRecords),
      figureLabel: 'سجلاً خاماً',
      text: `عينة مفتوحة من منصة البيانات المفتوحة السعودية بستة حقول، بين ${period}. وبصمة الملف المحلَّل موثقة في المستودع، دون إعادة نشره.`,
    },
    {
      id: 'preparation',
      title: 'التجهيز',
      figure: num(f.transactions),
      figureLabel: 'عملية بعد التنظيف',
      text: `توحيد الأعمدة والتواريخ والمبالغ، واستبعاد سجل واحد بمبلغ غير رقمي. ووُسمت ${num(f.duplicates)} حالة تكرار مطابق دون حذف، مع قياس أثرها.`,
    },
    {
      id: 'analysis',
      title: 'التحليل',
      figure: num(f.cohort),
      figureLabel: 'معرّفاً في تحليل العودة',
      text: 'وصف الاتجاهات والتركّز، ثم كابلان-ماير ونموذج Cox لزمن العودة، وتقسيم K-Means، وتنبؤ يُقيَّم على نافذة زمنية لاحقة.',
    },
    {
      id: 'insights',
      title: 'الرؤى',
      figure: num(data.themesTotal),
      figureLabel: 'موضوعات مرتّبة بالحجم المالي',
      text: 'لكل موضوع ملاحظة ومؤشر وتفسير محتمل وحدٌّ للاستنتاج، ويبقى الوصف منفصلاً عن السبب.',
    },
    {
      id: 'decision',
      title: 'دعم القرار',
      figure: num(data.plans.length),
      figureLabel: 'خطط تجربة ومتابعة',
      text: 'قرار موصى به، وخطط بقاعدة قرار تُعلن مسبقاً، ولوحة تفاعلية يراجع فيها الفريق الأرقام بنفسه.',
    },
  ],
});

export const dashboard = fixBidi({
  heading: 'اللوحة التفاعلية',
  lead: 'في اللوحة الكاملة تصفّي المؤشرات بنطاق الأشهر والسنة والمبادرة ووسيلة الدفع، وتتغير الرسوم معك.',
  monthlyTitle: 'عدد العمليات شهرياً',
  monthlyNote: `أعلى شهر: أبريل 2023 بـ${num(f.peakMonthTxn)} عملية، ولا يثبت ذلك سبباً موسمياً. الشهران الأول والأخير جزئيان، ولا سجلات في فبراير 2021.`,
  hoursTitle: 'عدد العمليات بحسب الساعة',
  hoursNote: 'أعداد فقط لحماية الخصوصية. الأوقات كما وردت في المصدر، والمنطقة الزمنية غير موثقة.',
  shotsHeading: 'لقطات من اللوحة نفسها',
  light: 'فاتح',
  dark: 'داكن',
  themeGroup: 'مظهر اللقطات',
  shots: [
    { id: 'km', title: 'منحنى كابلان-ماير ونسب الخطر تحت شريط المرشحات', alt: 'صفحة زمن عودة المتبرع في اللوحة: شريط المرشحات في الأعلى، ثم أربع بطاقات، ثم منحنى كابلان-ماير ورسم نسب الخطر.' },
    { id: 'heatmap', title: 'خريطة النشاط: اليوم × الساعة', alt: 'خريطة حرارية لعدد العمليات بحسب يوم الأسبوع والساعة في اللوحة.' },
    { id: 'kpis', title: 'بطاقات المؤشرات الرئيسية', alt: 'ست بطاقات مؤشرات في رأس صفحة النظرة الشاملة في اللوحة.' },
  ],
  zoomHint: 'تكبير اللقطة',
  zoomClose: 'إغلاق المعاينة',
  // Measured in the real dashboard (see README): 6 tabs, 21 Plotly charts.
  counts: '6 صفحات · 21 رسماً · مرشحات حية · مشهد فاتح وداكن',
  ctaHeading: 'جرّب اللوحة بنفسك',
});

export const recommendations = fixBidi({
  heading: 'التوصيات',
  lead: `أربع توصيات تتصدر ${num(data.themesTotal)} موضوعات، مرتّبة بالحجم المالي المتأثر. الأولوية تعكس حصة المبالغ المرتبطة بالموضوع، لا عائداً متوقعاً ولا سهولة تنفيذ.`,
  columns: { title: 'التوصية', priority: 'الأولوية', share: 'الحصة من المبالغ' },
  items: data.recommendations.map((r, i) => ({ ...r, rank: `0${i + 1}`, shareText: pct(r.share) })),
  plansHeading: 'ثلاث خطط تجربة',
  plansLead: 'مقترحات للاختبار، لا نتائج تجارب منفّذة.',
  plans: data.plans,
  kpiLabel: 'مؤشر القياس',
  durationLabel: 'المدة المقترحة',
});

export const limits = fixBidi({
  heading: 'حدود التحليل',
  lead: 'ما لا تقوله هذه البيانات جزء من النتيجة.',
  items: [
    { title: 'النتائج وصفية لا سببية', text: 'الارتباطات الزمنية أو بين المبادرات ووسائل الدفع لا تثبت سبباً. أي أثر متوقع يُقاس في تجربة مضبوطة.' },
    { title: 'نطاق العينة', text: `${num(f.transactions)} عملية بين ${period}. عينة تاريخية ليست كامل تبرعات إحسان أو القطاع، ولا تصف الوضع الحالي.` },
    { title: 'لا تكاليف في المصدر', text: 'لذلك لا عائد على الاستثمار في أي توصية، وتقدير القيمة لا يشمل كلفة التنفيذ.' },
    { title: 'لا قنوات تسويقية', text: 'لذلك لا عزو لأثر حملة أو رسالة، والعودة المرصودة لا تثبت أثر أي منهما.' },
    { title: 'المعرّفات والخصوصية', text: 'المعرّفات مستعارة وقد لا تمثل أشخاصاً فريدين أو تاريخهم الكامل. لا يعرض الموقع معرّفات أو سجلات أفراد.' },
    { title: 'جودة السجلات', text: `من ${num(f.rawRecords)} سجلاً خاماً استُبعد سجل واحد بمبلغ غير صالح. ووُسمت ${num(f.duplicates)} حالة تكرار مطابق ولم تُحذف، لأن التطابق وحده لا يثبت أنها غير حقيقية.` },
    { title: 'حدود الاستنتاج والنمذجة', text: 'المنطقة الزمنية ووحدة المبلغ غير محددتين صراحة في قاموس المصدر. والأشهر الأولى والأخيرة جزئية، وتقييم النموذج استكشافي على نافذة اختبار واحدة.' },
  ],
});

export const outputs = fixBidi({
  heading: 'المخرجات',
  validationHeading: 'نتائج التحقق في مستودع المشروع',
  validationNote: 'نتائج مسجّلة عند إعداد الإصدار على GitHub. وهي فحوص لمستودع المشروع، ولا تشمل اختبارات هذا الموقع.',
  validation: [
    { value: `${v.project.passed}/${v.project.total}`, title: 'تحقق المشروع', script: v.project.script, text: 'يعيد اشتقاق النتائج من الملف الخام بكود مستقل، ويفحص اتساق البيانات والمخرجات والتوثيق.' },
    { value: `${v.dashboard.passed}/${v.dashboard.total}`, title: 'تحقق اللوحة', script: v.dashboard.script, text: 'منطق اللوحة وحالات التصفية في jsdom مع Plotly بديل، لا العرض في متصفح فعلي.' },
    { value: `${v.publicRelease.passed}/${v.publicRelease.total}`, title: 'تحقق الإصدار العام', script: v.publicRelease.script, text: 'خلو المنشور من ملفات البيانات والمعرّفات، والتراخيص والإسناد، وخصوصية المخرجات. ولا يشمل قراءة الصور.' },
    { value: `${v.notebook.cells} خلية`, title: 'دفتر Jupyter', script: 'analysis.ipynb', text: `${v.notebook.codeCells} خلية كود نُفّذت كلها دون أخطاء، و${v.notebook.markdownCells} خلية نصية (Markdown).` },
  ],
  dashboard: { title: 'اللوحة التفاعلية', text: 'استكشف المؤشرات والرسوم بالمرشحات، في ملف واحد يعمل دون خادم.', action: cta.dashboard },
  report: { title: 'التقرير التنفيذي', text: 'المنهجية والنتائج والتوصيات وحدود التحليل في موجز للقراءة.', action: 'افتح التقرير' },
  repo: { title: 'مستودع GitHub', text: 'الكود ودفتر التحليل وسكربتات التحقق.', action: 'افتح المستودع' },
  source: { title: 'مصدر البيانات', text: 'العينة المفتوحة في منصة البيانات المفتوحة السعودية.', action: 'افتح المصدر' },
});

export const footer = fixBidi({
  star: 'إذا ألهمك رفدان، ادعم المشروع بنجمة على GitHub',
  about: 'تحليل وصفي لعينة مفتوحة من بيانات التبرعات في منصة إحسان.',
  explore: 'استكشف',
  resources: 'المخرجات',
  contact: 'تواصل ومصدر',
  dashboard: 'اللوحة التفاعلية',
  report: 'التقرير التنفيذي',
  source: 'مصدر البيانات',
  linkedIn: 'LinkedIn',
  x: 'منصة إكس',
  // Clause 6.2 notice as worded in the release's ATTRIBUTION_AR.md, with its two URLs as links.
  attributionBefore: 'يحتوي هذا العمل على معلومات من مجموعة البيانات «A sample of donations for different IDs in Ehsan» المنشورة في ',
  attributionPlatform: 'منصة البيانات المفتوحة السعودية',
  attributionMiddle: ' والمتاحة بموجب ',
  attributionLicense: 'رخصة البيانات المفتوحة (ODC Attribution License)',
  attributionAfter: '، النسخة 2.0. الملف المنظف والتجميعات والنتائج من إعداد مؤلف المشروع، ولا تعني اعتماد مانح الترخيص لها.',
});

export const chartText = fixBidi({
  transactions: 'من العمليات',
  amounts: 'من المبالغ',
  bandAxis: 'شريحة مبلغ العملية (ر.س)',
  tableSummary: 'عرض القيم في جدول',
  keyHint: 'استخدم مفاتيح الأسهم للتنقل بين القيم.',
});

export const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return `${monthNames[m - 1]} ${y}`;
};

export const coxLabel = (term: string) => {
  if (term === 'log_first_amount') return 'مبلغ أول تبرع (لوغاريتمي)';
  if (term.startsWith('ini_')) return `مبادرة: ${term.slice(4)}`;
  return `وسيلة: ${term.slice(4)}`;
};

export { data };
