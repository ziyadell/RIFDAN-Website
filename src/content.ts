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
  /K-Means|\d[\d.,:]*%?[–-]\d[\d.,:]*%?(?!-)|(?:Log-rank p|p|C-index|Adjusted Rand) = [\d.]+|[−+]\d[\d.,]*%?|\d[\d.,]*%/g,
  // Short statistical expressions also stay on one line.
  (m) => `\u2066${m.replace(/ /g, '\u00A0')}\u2069`,
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
  { href: '#decision', label: 'الأولوية', sections: ['decision'] },
  { href: '#stats', label: 'النتائج', sections: ['stats', 'value', 'return', 'model', 'journey'] },
  { href: '#dashboard', label: 'اللوحة', sections: ['dashboard'] },
  { href: '#recommendations', label: 'التوصيات', sections: ['recommendations'] },
  { href: '#limits', label: 'الحدود', sections: ['limits'] },
];

export const cta = { dashboard: 'افتح اللوحة التفاعلية', report: 'اقرأ التقرير التنفيذي' };

const period = 'من 14 ديسمبر 2020 إلى 13 يوليو 2023';

export const hero = fixBidi({
  description: 'يحلل رفدان عينة مفتوحة من تبرعات منصة إحسان، ويبيّن أين تتركز المبالغ، ومتى يعود المتبرع، وما الخطوات التي تستحق أن تختبرها الجهات غير الربحية أولاً.',
  facts: [
    { value: num(f.transactions), label: 'عملية تبرع' },
    { value: `${num(f.totalAmount)} ر.س`, label: 'إجمالي مبالغ العينة' },
    { value: num(f.initiatives), label: 'مبادرة' },
    { value: num(f.donors), label: 'معرّفاً للمتبرعين' },
  ],
  scope: `بيانات الفترة ${period}، وهي عينة لا تمثل المنصة كلها ولا القطاع.`,
});

export const decision = fixBidi({
  heading: 'الأولوية المقترحة',
  figure: pct(f.top1Share),
  figureLabel: 'من مبالغ العينة تعود إلى معرّف متبرع واحد',
  statement: 'ابدأ بمعالجة اعتماد المبالغ على معرّف متبرع واحد',
  why: `لم يظهر هذا المعرّف إلا في ${num(f.top1Txn)} عملية، ومع ذلك يغيّر الأرقام الإجمالية كلها. والمعرّف مستعار، فقد يكون شخصاً أو مؤسسة أو جهة وسيطة، ولا تكفي البيانات لمعرفة ذلك.`,
  steps: [
    { verb: 'تحقّق', text: 'تأكد مع فريق البيانات من حقيقة هذا المعرّف قبل البناء عليه.' },
    { verb: 'اعرض', text: 'اعرض الوسيط إلى جانب المتوسط، مرة مع المعرّف ومرة بدونه.' },
    { verb: 'نوّع', text: 'ضع خطة لتوسيع قاعدة المتبرعين حتى لا تعتمد المبالغ على عدد قليل منهم.' },
  ],
  next: 'بعد ذلك نفّذ خطة «اختبار رحلة تشجع على التبرع الثاني»، وحدّد قبل بدء التجربة المعيار الذي ستحكم به على نتيجتها. هذه كلها مقترحات تحتاج إلى اختبار، وليست نتائج مثبتة.',
  toggle: {
    title: 'قارن المتوسطين مع هذا المعرّف وبدونه',
    note: 'يكفي معرّف واحد لتغيير المتوسط، ولذلك يُقرأ المتوسط دائماً مع الوسيط.',
    with: 'مع المعرّف الأكبر',
    without: 'بدون المعرّف الأكبر',
    rows: [
      { label: 'متوسط مبلغ العملية', with: `${num(f.mean, 1)} ر.س`, without: `${num(f.meanTxnWithoutTop1, 1)} ر.س` },
      { label: 'متوسط ما تبرع به المعرّف', with: `${num(f.meanDonor)} ر.س`, without: `${num(f.meanDonorWithoutTop1)} ر.س` },
    ],
  },
});

export const stats = fixBidi({
  heading: 'ما تخفيه الأرقام الإجمالية',
  lead: `${num(f.totalAmount)} ر.س في ${num(f.transactions)} عملية على ${num(f.initiatives)} مبادرة، من ${num(f.donors)} معرّفاً. لكن الإجمالي لا يبيّن كيف توزعت هذه المبالغ.`,
  pairs: [
    {
      title: 'مبلغ التبرع المعتاد',
      items: [
        { value: f.median, decimals: 0, suffix: ' ر.س', label: 'وسيط مبلغ العملية' },
        { value: f.mean, decimals: 1, suffix: ' ر.س', label: 'متوسط مبلغ العملية' },
      ],
      note: `يتسع الفرق بينهما بسبب عدد قليل من المبالغ الكبيرة؛ فـ${pct(f.shareLe10Txn)} من العمليات قيمتها 10 ر.س أو أقل، ومجموعها ${pct(f.shareLe10Amount)} من المبالغ.`,
    },
    {
      title: 'تركّز المبالغ',
      items: [
        { value: f.top1Share, decimals: 1, suffix: '%', label: 'حصة أكبر معرّف' },
        { value: f.top10PctShare, decimals: 1, suffix: '%', label: 'حصة أعلى 10% من المعرّفات' },
      ],
      note: `وتستحوذ مبادرة «مشروع» وحدها على ${pct(f.topInitiativeShare)} من المبالغ، أما «التبرع الدوري» فنصيبه ${pct(f.recurringTxnShare)} من العمليات و${pct(f.recurringAmountShare)} من المبالغ.`,
    },
  ],
});

const band210 = data.bands[1];
const band5k = data.bands[5];
export const value = fixBidi({
  heading: 'أين تقع القيمة',
  lead: 'معظم العمليات صغيرة، بينما يأتي جزء كبير من المبالغ من عمليات قليلة.',
  callouts: [
    { band: '2–10 ر.س', text: `تضم [[${pct(band210.count_pct)}]] من العمليات، ولا تمثل سوى ${pct(band210.amount_pct)} من المبالغ.` },
    { band: '5,000 ر.س فأكثر', text: `تضم ${pct(band5k.count_pct)} من العمليات، وتمثل [[${pct(band5k.amount_pct)}]] من المبالغ.` },
  ],
  note: 'هذه نسب تصف العينة، ولا تفسر سبب هذا التوزيع.',
});

export const returning = fixBidi({
  heading: 'متى يعود المتبرع',
  lead: 'يقيس تحليل البقاء (كابلان-ماير) المدة بين أول تبرع في العينة والتبرع الذي يليه. ومن لم يعد حتى نهاية الفترة لا يُحسب منقطعاً، بل تُعد مشاهدته غير مكتملة (مراقَبة).',
  facts: [
    { value: num(f.cohort), label: 'معرّفاً في الفوج' },
    { value: pct(f.return30), label: 'عادوا خلال 30 يوماً' },
    { value: `${num(f.medianDays)} يوماً`, label: 'وسيط مدة العودة' },
    { value: num(f.censored), label: 'مشاهدة مراقَبة' },
  ],
  kmTitle: 'نسبة من لم يعودوا بعد، بحسب عدد الأيام منذ أول تبرع',
  kmNote: `يبدأ المنحنى من 100% وينخفض في يومه الأول، لأن بعض المعرّفات تبرعت مرتين في اليوم ذاته. ويعرض الرسم ${num(data.km.length)} نقطة من أصل ${num(data.kmSourcePoints)} في البيانات الأصلية.`,
  coxHeading: 'المبادرة الأولى، لا مبلغ التبرع الأول',
  coxBefore: `عند المقارنة بين فئتين فقط، يبدو أن من كان أول تبرع له بقيمة الوسيط أو أقل يعود أسرع: ${pct(f.lowMedian30)} مقابل ${pct(f.highMedian30)} خلال 30 يوماً (Log-rank p = ${num(f.logRankP, 4)}).`,
  coxAfter: `لكن هذا الأثر يختفي في نموذج Cox بعد ضبط أثر المبادرة: نسبة الخطر [[${num(f.coxFirstAmountHr, 3)}]] وقيمة p = ${num(f.coxFirstAmountP, 2)}. وقدرة النموذج على التمييز محدودة (C-index = ${num(f.coxConcordance, 3)})، أي أن العوامل المتاحة لا تفسر إلا جزءاً صغيراً من الاختلاف في سرعة العودة.`,
  cohortTitle: 'العودة خلال 30 يوماً بحسب شهر الدخول',
  cohortText: `ويختلف المعدل من شهر إلى آخر: في ${num(f.cohortCount)} فوجاً شهرياً تراوحت نسبة العودة بين ${pct(f.cohortMin)} و${pct(f.cohortMax)}، بوسيط ${pct(f.cohortMedian)}.`,
  cohortNote: 'لا تظهر إلا الأشهر التي دخل فيها 30 معرّفاً أو أكثر.',
});

export const model = fixBidi({
  heading: 'ما لا يثبته النموذج',
  lead: 'أربع نتائج من التحليلات الإحصائية، وما لا يصح استنتاجه من كل منها.',
  coxTitle: 'نسب الخطر في نموذج Cox مع فواصل ثقة 95%',
  coxNote: 'القيمة الأقل من 1 تعني عودة أبطأ، والأعلى منه عودة أسرع، مقارنة بالفئة المرجعية: مبادرة «إغاثة» ووسيلة الدفع «أبل باي». ولم تُختبر فرضية تناسب المخاطر.',
  cards: [
    {
      title: 'التنبؤ بالعودة خلال 90 يوماً',
      figure: `AUC ${num(f.auc, 3)}`,
      vs: `مقابل ${num(f.baselineAuc, 3)} لخط الأساس`,
      text: `تحسّن محدود، قيس على فترة اختبار واحدة. ويمتد فاصل الثقة 95% للفرق من ${signed(f.aucLo, 3)} إلى ${signed(f.aucHi, 3)}، أي أنه يشمل الصفر.`,
    },
    {
      title: 'وقت الذروة: الجمعة 16:00–18:59',
      figure: pct(f.peakTxnShare),
      vs: 'من العمليات',
      text: `يكثر فيه عدد العمليات لا قيمتها؛ فالاختبار لا يجد أن المبالغ فيه أعلى. حجم الأثر الرتبي ${signed(f.peakRankEffect, 3)}، وكلا فاصلي الثقة العنقوديين يشمل الصفر.`,
    },
    {
      title: 'قيمة نقطة مئوية واحدة',
      figure: `${num(f.sizingLow)}–${num(f.sizingHigh)} ر.س`,
      vs: `${pct(f.sizingLowShare, 2)}–${pct(f.sizingHighShare, 2)} من الإجمالي`,
      text: 'أثر صغير بحجم هذه العينة. والحد الأعلى مبني على ارتباط وصفي لا على أثر سببي، ولا يحتسب كلفة التنفيذ.',
    },
    {
      title: 'تقسيم المعرّفات إلى ثلاث شرائح',
      figure: `Silhouette ${num(f.silhouette, 2)}`,
      vs: `والتقسيم إلى شريحتين يحقق ${num(f.silhouetteBest, 3)}`,
      text: `اختيرت ثلاث شرائح لأغراض عملية، لا لأنها الأفضل إحصائياً. ويبقى التقسيم نفسه عند تغيير البذرة العشوائية أربع مرات (Adjusted Rand = ${num(f.ariMin, 2)}).`,
    },
  ],
});

export const journey = fixBidi({
  heading: 'من البيانات إلى التوصيات',
  lead: 'هذه مراحل العمل بالترتيب، ولكل مرحلة وحدة قياس مختلفة، فلا تصح المقارنة بين أرقامها.',
  stages: [
    {
      id: 'data',
      title: 'البيانات',
      figure: num(f.rawRecords),
      figureLabel: 'سجلاً خاماً',
      text: `عينة مفتوحة من منصة البيانات المفتوحة السعودية، فيها ستة حقول، وتغطي الفترة ${period}. ووُثّقت بصمة الملف في المستودع دون إعادة نشر الملف نفسه.`,
    },
    {
      id: 'preparation',
      title: 'التجهيز',
      figure: num(f.transactions),
      figureLabel: 'عملية بعد التنظيف',
      text: `وُحّدت صيغ الأعمدة والتواريخ والمبالغ، واستُبعد سجل واحد مبلغه غير رقمي. أما السجلات المكررة تماماً (${num(f.duplicates)} حالة) فوُسمت ولم تُحذف، وقيس أثرها على النتائج.`,
    },
    {
      id: 'analysis',
      title: 'التحليل',
      figure: num(f.cohort),
      figureLabel: 'معرّفاً في تحليل العودة',
      text: 'تحليل وصفي للاتجاهات والتركّز، ثم كابلان-ماير ونموذج Cox لمدة العودة، وتقسيم المعرّفات بخوارزمية K-Means، ونموذج تنبؤ قيس أداؤه على فترة زمنية لاحقة.',
    },
    {
      id: 'insights',
      title: 'الاستنتاجات',
      figure: num(data.themesTotal),
      figureLabel: 'موضوعات مرتبة بحسب حجم المبالغ',
      text: 'لكل موضوع ملاحظة ومؤشر وتفسير محتمل وحدود لما يصح استنتاجه، مع فصل ما تصفه البيانات عن أسبابه المحتملة.',
    },
    {
      id: 'decision',
      title: 'دعم القرار',
      figure: num(data.plans.length),
      figureLabel: 'خطط تجربة ومتابعة',
      text: 'أولوية مقترحة، وخطط يُحدَّد معيار الحكم عليها مسبقاً، ولوحة تفاعلية يراجع فيها الفريق الأرقام بنفسه.',
    },
  ],
});

export const dashboard = fixBidi({
  heading: 'اللوحة التفاعلية',
  lead: 'في اللوحة الكاملة يمكنك تصفية المؤشرات بالفترة والسنة والمبادرة ووسيلة الدفع، فتتحدث الرسوم مباشرة.',
  monthlyTitle: 'عدد العمليات شهرياً',
  monthlyNote: `أعلى الأشهر أبريل 2023 بـ${num(f.peakMonthTxn)} عملية، ولا يكفي ذلك لإثبات أثر موسمي. والشهران الأول والأخير غير مكتملين، ولا توجد سجلات لشهر فبراير 2021.`,
  hoursTitle: 'عدد العمليات بحسب الساعة',
  hoursNote: 'يعرض الرسم أعداد العمليات دون مبالغها حفاظاً على الخصوصية. والأوقات كما وردت في المصدر، ولم تُذكر فيه المنطقة الزمنية.',
  shotsHeading: 'لقطات من اللوحة',
  light: 'فاتح',
  dark: 'داكن',
  themeGroup: 'مظهر اللقطات',
  shots: [
    { id: 'km', title: 'صفحة مدة العودة: منحنى كابلان-ماير ونسب الخطر', alt: 'صفحة مدة عودة المتبرع في اللوحة: شريط المرشحات في الأعلى، ثم أربع بطاقات، ثم منحنى كابلان-ماير ورسم نسب الخطر.' },
    { id: 'heatmap', title: 'عدد العمليات بحسب اليوم والساعة', alt: 'خريطة حرارية لعدد العمليات بحسب يوم الأسبوع والساعة في اللوحة.' },
    { id: 'kpis', title: 'بطاقات المؤشرات الرئيسية', alt: 'ست بطاقات مؤشرات في رأس صفحة النظرة الشاملة في اللوحة.' },
  ],
  zoomHint: 'تكبير اللقطة',
  zoomClose: 'إغلاق المعاينة',
  // Measured in the real dashboard (see README): 6 tabs, 21 Plotly charts.
  counts: '6 صفحات · 21 رسماً · مرشحات تفاعلية · مظهر فاتح وداكن',
  ctaHeading: 'استكشف اللوحة بنفسك',
});

export const recommendations = fixBidi({
  heading: 'التوصيات',
  lead: `هذه أعلى أربع توصيات من بين ${num(data.themesTotal)} موضوعات، رُتّبت بحسب حجم المبالغ المرتبطة بكل موضوع. فالأولوية هنا تعكس حصة المبالغ، لا العائد المتوقع ولا سهولة التنفيذ.`,
  columns: { title: 'التوصية', priority: 'الأولوية', share: 'الحصة من المبالغ' },
  items: data.recommendations.map((r, i) => ({ ...r, rank: `0${i + 1}`, shareText: pct(r.share) })),
  plansHeading: 'ثلاث خطط مقترحة',
  plansLead: 'خطتان للاختبار وخطة للمتابعة، ولم يُنفَّذ أيٌّ منها بعد.',
  plans: data.plans,
  kpiLabel: 'مؤشر القياس',
  durationLabel: 'المدة المقترحة',
});

export const limits = fixBidi({
  heading: 'حدود التحليل',
  lead: 'معرفة ما لا تقوله البيانات جزء من فهم النتائج.',
  items: [
    { title: 'النتائج وصفية لا سببية', text: 'العلاقة بين التبرع وتوقيته أو مبادرته أو وسيلة دفعه لا تثبت سبباً، وأي أثر متوقع يحتاج إلى تجربة مضبوطة لقياسه.' },
    { title: 'نطاق العينة', text: `${num(f.transactions)} عملية في الفترة ${period}، وهي عينة تاريخية لا تشمل كل تبرعات منصة إحسان ولا القطاع، ولا تصف الوضع الحالي.` },
    { title: 'لا بيانات عن التكاليف', text: 'لذلك لا تتضمن التوصيات أي تقدير للعائد على الاستثمار، ولا يدخل في تقدير القيمة ما يكلفه التنفيذ.' },
    { title: 'لا بيانات عن قنوات التسويق', text: 'لذلك لا يمكن نسبة أي أثر إلى حملة أو رسالة بعينها، وعودة المتبرعين لا تثبت أن لأيٍّ منهما أثراً.' },
    { title: 'المعرّفات والخصوصية', text: 'المعرّفات مستعارة، وقد لا يقابل كل معرّف شخصاً واحداً، ولا يشمل سجله كل تبرعات صاحبه. ولا يعرض الموقع أي معرّف أو سجل فردي.' },
    { title: 'جودة السجلات', text: `استُبعد سجل واحد من أصل ${num(f.rawRecords)} سجلاً لأن مبلغه غير صالح. أما السجلات المكررة تماماً (${num(f.duplicates)} حالة) فوُسمت ولم تُحذف، لأن التطابق وحده لا يعني أنها أخطاء.` },
    { title: 'حدود المصدر والنموذج', text: 'لا يحدد قاموس بيانات المصدر المنطقة الزمنية ولا وحدة المبلغ صراحة. والشهران الأول والأخير غير مكتملين، وتقييم نموذج التنبؤ استكشافي على فترة اختبار واحدة.' },
  ],
});

export const outputs = fixBidi({
  heading: 'المخرجات',
  validationHeading: 'نتائج التحقق في مستودع المشروع',
  validationNote: 'نتائج سُجّلت عند إعداد الإصدار المنشور على GitHub، وهي تخص مستودع التحليل لا هذا الموقع.',
  validation: [
    { value: `${v.project.passed}/${v.project.total}`, title: 'تحقق المشروع', script: v.project.script, text: 'يعيد حساب النتائج من الملف الخام بكود مستقل، ويتأكد من اتساق البيانات والمخرجات والتوثيق.' },
    { value: `${v.dashboard.passed}/${v.dashboard.total}`, title: 'تحقق اللوحة', script: v.dashboard.script, text: 'يختبر منطق اللوحة وحالات التصفية في بيئة jsdom مع نسخة بديلة من Plotly، ولا يختبر العرض في متصفح فعلي.' },
    { value: `${v.publicRelease.passed}/${v.publicRelease.total}`, title: 'تحقق الإصدار العام', script: v.publicRelease.script, text: 'يتأكد من خلو الإصدار المنشور من ملفات البيانات والمعرّفات، ومن وجود التراخيص والإسناد، ومن خصوصية المخرجات، ولا يفحص محتوى الصور.' },
    { value: `${v.notebook.cells} خلية`, title: 'دفتر Jupyter', script: 'analysis.ipynb', text: `${v.notebook.codeCells} خلية كود نُفّذت كلها دون أخطاء، و${v.notebook.markdownCells} خلية نصية (Markdown).` },
  ],
  dashboard: { title: 'اللوحة التفاعلية', text: 'المؤشرات والرسوم مع المرشحات، في ملف واحد يعمل في المتصفح دون خادم.', action: cta.dashboard },
  report: { title: 'التقرير التنفيذي', text: 'ملخص للمنهجية والنتائج والتوصيات وحدود التحليل.', action: 'افتح التقرير' },
  repo: { title: 'مستودع GitHub', text: 'الكود ودفتر التحليل وسكربتات التحقق.', action: 'افتح المستودع' },
  source: { title: 'مصدر البيانات', text: 'العينة المفتوحة في منصة البيانات المفتوحة السعودية.', action: 'افتح المصدر' },
});

export const footer = fixBidi({
  star: 'إن أفادك رفدان، فادعم المشروع بنجمة على GitHub',
  about: 'تحليل وصفي لعينة مفتوحة من بيانات التبرعات في منصة إحسان.',
  explore: 'الأقسام',
  resources: 'المخرجات',
  contact: 'التواصل والمصدر',
  dashboard: 'اللوحة التفاعلية',
  report: 'التقرير التنفيذي',
  source: 'مصدر البيانات',
  linkedIn: 'LinkedIn',
  x: 'منصة إكس',
  // Clause 6.2 notice as worded in the release's ATTRIBUTION_AR.md, with its two URLs as links.
  // English names are isolated with <bdi> in the markup: WebKit does not wrap long runs inside isolate control characters.
  attributionBefore: 'يحتوي هذا العمل على معلومات من مجموعة البيانات «',
  attributionDataset: 'A sample of donations for different IDs in Ehsan',
  attributionPublished: '» المنشورة في ',
  attributionPlatform: 'منصة البيانات المفتوحة السعودية',
  attributionMiddle: ' والمتاحة بموجب ',
  attributionLicense: 'رخصة البيانات المفتوحة (',
  attributionLicenseName: 'ODC Attribution License',
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
