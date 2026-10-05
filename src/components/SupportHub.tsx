import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Truck,
  ShieldCheck,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  X,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  BookOpen,
  ArrowRight,
  PackageCheck,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Language, Currency } from '../types';

interface SupportHubProps {
  language: Language;
  currency: Currency;
  onNavigateTab?: (tabId: 'map' | 'courier' | 'food_ride' | 'track' | 'account' | 'flutter_code') => void;
  onNotify?: (msg: string) => void;
}

export interface FaqItem {
  id: string;
  category: 'routes' | 'pricing' | 'vans' | 'safety';
  questionEn: string;
  questionKm: string;
  answerEn: string;
  answerKm: string;
  tagsEn: string[];
  tagsKm: string[];
  popularRoute?: string;
  popularPrice?: string;
}

export const FAQ_DATABASE: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'routes',
    questionEn: 'How long does delivery take from Phnom Penh to Siem Reap via National Road 6, and what is the typical cost?',
    questionKm: 'តើការផ្ញើឥវ៉ាន់ពីភ្នំពេញទៅសៀមរាបតាមផ្លូវជាតិលេខ ៦ ចំណាយពេលប៉ុន្មានម៉ោង និងតម្លៃប៉ុន្មាន?',
    answerEn: 'Deliveries along the Phnom Penh - Siem Reap corridor via National Road 6 typically take 5 to 7 hours by express van. Most van operators (such as CamExpress Van, Virak Buntham, and Larryta) run morning batches (8:00 AM, 10:00 AM) and afternoon batches (1:30 PM, 3:30 PM). Standard parcel rates range from 4,000 to 8,000 KHR ($1.00 - $2.00 USD) for parcels under 3 kg for station pickup at Phsar Chas or Chroy Changvar depots. Direct doorstep delivery in downtown Siem Reap adds approximately 2,000 to 4,000 KHR.',
    answerKm: 'ការផ្ញើឥវ៉ាន់តាមផ្លូវជាតិលេខ ៦ ពីភ្នំពេញទៅសៀមរាប ចំណាយពេលប្រហែលពី ៥ ទៅ ៧ ម៉ោងតាមរថយន្តវ៉ែនអេចប្រេស។ ក្រុមហ៊ុនឡានវ៉ែនភាគច្រើនមានជើងចេញពេលព្រឹក (ម៉ោង ៨:០០, ១០:០០) និងពេលរសៀល (ម៉ោង ១:៣០, ៣:៣០)។ តម្លៃស្តង់ដារសម្រាប់កញ្ចប់ក្រោម ៣ គីឡូក្រាម គឺចន្លោះពី ៤,០០០ ដល់ ៨,០០០ រៀល ($១.០០ - $២.០០) សម្រាប់ការទៅយកនៅស្ថានីយ (ផ្សារចាស់ ឬជ្រោយចង្វារ)។ ប្រសិនបើជ្រើសរើសសេវាដឹកដល់ផ្ទះផ្ទាល់ក្នុងក្រុងសៀមរាប គិតបន្ថែមប្រមាណ ២,០០០ ទៅ ៤,០០០ រៀល។',
    tagsEn: ['Siem Reap', 'National Road 6', 'Van Express', 'Transit Time', 'Pricing'],
    tagsKm: ['សៀមរាប', 'ផ្លូវជាតិលេខ ៦', 'ឡានវ៉ែន', 'រយៈពេល', 'តម្លៃ'],
    popularRoute: 'Phnom Penh ⇄ Siem Reap (NR6)',
    popularPrice: '4,000 - 8,000 KHR',
  },
  {
    id: 'faq-2',
    category: 'pricing',
    questionEn: 'How does Cash on Delivery (COD) work across Cambodian provinces, and are there extra fees?',
    questionKm: 'តើការប្រមូលប្រាក់ជំនួស (COD) តាមបណ្តាខេត្តដំណើរការយ៉ាងដូចម្តេច ហើយមានគិតកម្រៃសេវាបន្ថែមដែរឬទេ?',
    answerEn: 'On CamDelivery, community van fleets collect cash directly upon parcel handover to the customer. Under our 0% middleman mission, there are NO platform commissions deducted from your COD funds. The courier collects the exact invoice amount, confirms receipt with a digital signature or photo, and remits the funds instantly to the seller via Bakong KHQR, ABA Pay, or cash depot withdrawal within 2 to 4 hours of delivery completion.',
    answerKm: 'នៅលើ CamDelivery អ្នកដឹកជញ្ជូននឹងប្រមូលលុយសុទ្ធផ្ទាល់ពីដៃអ្នកទទួលពេលប្រគល់ឥវ៉ាន់។ ក្រោមគោលការណ៍ឥតគិតថ្លៃ 0% កម្រៃជើងសារ គ្មានការកាត់ប្រាក់កម្រៃណាមួយពីប្រាក់ COD របស់អ្នកលក់ឡើយ។ អ្នកដឹកជញ្ជូននឹងប្រមូលប្រាក់គ្រប់ចំនួន ថតរូបបញ្ជាក់ការទទួល និងផ្ទេរប្រាក់ត្រឡប់មកអ្នកលក់វិញភ្លាមៗតាមរយៈ Bakong KHQR, ABA Pay ឬបើកប្រាក់សុទ្ធនៅស្ថានីយក្នុងរង្វង់ ២ ទៅ ៤ ម៉ោងក្រោយដឹកដល់។',
    tagsEn: ['COD', 'Bakong KHQR', 'Commission 0%', 'Payment', 'Merchant Payout'],
    tagsKm: ['COD', 'បាគង KHQR', 'មិនកាត់ភាគរយ 0%', 'ការទូទាត់', 'ប្រាក់អ្នកលក់'],
    popularPrice: '0% Platform Fee • Free Remittance',
  },
  {
    id: 'faq-3',
    category: 'routes',
    questionEn: 'What is the transit time and cost for Phnom Penh to Sihanoukville and Kampot via the Expressway?',
    questionKm: 'តើការដឹកជញ្ជូនពីភ្នំពេញទៅក្រុងព្រះសីហនុ និងកំពត តាមផ្លូវល្បឿនលឿនចំណាយពេល និងតម្លៃប៉ុន្មាន?',
    answerEn: 'Via the Phnom Penh - Sihanoukville Expressway (PSEM), express van transit is reduced to just 2.5 to 3.5 hours. Standard small parcels (under 2 kg) cost approximately 5,000 to 7,000 KHR ($1.25 - $1.75 USD). Deliveries heading to Kampot Province travel via National Road 3 (NR3), taking roughly 3 to 4 hours with rates between 4,000 and 6,000 KHR. Many coastal vans depart every 60-90 minutes from Central Phnom Penh hubs.',
    answerKm: 'តាមរយៈផ្លូវល្បឿនលឿនភ្នំពេញ-ព្រះសីហនុ ការដឹកជញ្ជូនតាមរថយន្តវ៉ែនចំណាយពេលត្រឹមតែ ២.៥ ទៅ ៣.៥ ម៉ោងប៉ុណ្ណោះ។ តម្លៃកញ្ចប់តូច (ក្រោម ២ គីឡូ) គឺចន្លោះពី ៥,០០០ ដល់ ៧,០០០ រៀល ($១.២៥ - $១.៧៥)។ ចំពោះការផ្ញើទៅខេត្តកំពត តាមផ្លូវជាតិលេខ ៣ ចំណាយពេលប្រហែល ៣ ទៅ ៤ ម៉ោង ក្នុងតម្លៃពី ៤,០០០ ដល់ ៦,០០០ រៀល ដោយមានឡានចេញរៀងរាល់ ៦០ ទៅ ៩០ នាទីពីភ្នំពេញ។',
    tagsEn: ['Expressway', 'Sihanoukville', 'Kampot', 'National Road 3', 'Fast Dispatch'],
    tagsKm: ['ផ្លូវល្បឿនលឿន', 'ព្រះសីហនុ', 'កំពត', 'ផ្លូវជាតិលេខ ៣', 'ចេញដំណើរញឹកញាប់'],
    popularRoute: 'Phnom Penh ⇄ Sihanoukville / Kampot',
    popularPrice: '5,000 - 7,000 KHR (~3 hrs)',
  },
  {
    id: 'faq-4',
    category: 'pricing',
    questionEn: 'How is parcel price calculated for lightweight but bulky boxes (Volumetric Weight)?',
    questionKm: 'តើតម្លៃដឹកជញ្ជូនត្រូវបានគណនាយ៉ាងដូចម្តេចសម្រាប់ទំនិញទំហំធំតែទម្ងន់ស្រាល (Volumetric Weight)?',
    answerEn: 'Cambodian interprovincial carriers calculate chargeable weight as the greater of actual gross weight (kg) or volumetric weight. The industry-standard formula is: (Length × Width × Height in centimeters) ÷ 5,000 = Volumetric Weight in kg. For example, a 40×30×20 cm shoebox weighs 4.8 kg volumetric, even if the actual contents only weigh 1.2 kg. Use our built-in Smart Packaging tool to find the most cost-effective box dimensions.',
    answerKm: 'ក្រុមហ៊ុនដឹកជញ្ជូនអន្តរខេត្តនៅកម្ពុជា គិតថ្លៃដឹកដោយយកទម្ងន់ណាដែលធំជាង រវាងទម្ងន់ជាក់ស្តែង (គីឡូក្រាម) និងទម្ងន់មាឌ (Volumetric Weight)។ រូបមន្តស្តង់ដារឡូជីស្ទីកគឺ៖ (បណ្តោយ × ទទឹង × កម្ពស់ ជាសង់ទីម៉ែត្រ) ÷ ៥,០០០ = ទម្ងន់មាឌជាគីឡូក្រាម។ ឧទាហរណ៍ ប្រអប់ទំហំ ៤០×៣០×២០ សង់ទីម៉ែត្រ ស្មើនឹង ៤.៨ គីឡូក្រាមមាឌ ទោះបីជាទម្ងន់ជាក់ស្តែងត្រឹមតែ ១.២ គីឡូក៏ដោយ។ អ្នកអាចប្រើឧបករណ៍ "Smart Packaging" របស់យើងដើម្បីរកទំហំប្រអប់ដែលសន្សំសំចៃបំផុត។',
    tagsEn: ['Volumetric Weight', 'Dimensions', 'Packaging', 'Formula', 'Calculation'],
    tagsKm: ['ទម្ងន់មាឌ', 'ទំហំប្រអប់', 'ការវេចខ្ចប់', 'រូបមន្តគណនា', 'ការសន្សំសំចៃ'],
    popularPrice: 'Formula: (L×W×H)/5000',
  },
  {
    id: 'faq-5',
    category: 'vans',
    questionEn: 'What is the difference between Station/Depot Pickup and Door-to-Door Delivery?',
    questionKm: 'តើអ្វីជាភាពខុសគ្នារវាងការផ្ញើឥវ៉ាន់ទៅយកនៅស្ថានីយ (Depot Pickup) និងសេវាដឹកដល់ផ្ទះ (Door-to-Door)?',
    answerEn: 'With Station/Depot Pickup, the sender drops the parcel at a van terminal (e.g. Virak Buntham, Capitol, or CamExpress hub), and the receiver collects it directly from the provincial depot station upon SMS notification. This is the cheapest method (3,000 - 5,000 KHR). Door-to-Door Delivery includes dispatch by a local motorbike rider to the recipient’s exact doorstep or shop in provincial town centers (usually 6,000 - 10,000 KHR total).',
    answerKm: 'ចំពោះការទៅយកនៅស្ថានីយ (Depot Pickup) អ្នកផ្ញើយកឥវ៉ាន់ទៅដាក់នៅការិយាល័យឡានវ៉ែន ហើយអ្នកទទួលត្រូវទៅយកដោយផ្ទាល់នៅសាខាខេត្តពេលទទួលបានសារ SMS។ នេះជាវិធីសន្សំសំចៃបំផុត (៣,០០០ - ៥,០០០ រៀល)។ ចំណែកសេវាដឹកដល់មាត់ទ្វារផ្ទះ (Door-to-Door) រួមបញ្ចូលអ្នកជិះម៉ូតូដឹកបន្តជូនដល់មុខផ្ទះ ឬមុខហាងរបស់អ្នកទទួលក្នុងទីរួមខេត្ត (តម្លៃសរុបចន្លោះ ៦,០០០ ដល់ ១០,០០០ រៀល)។',
    tagsEn: ['Station Pickup', 'Doorstep Delivery', 'Depot', 'Local Rider', 'Comparison'],
    tagsKm: ['យកនៅស្ថានីយ', 'ដឹកដល់ផ្ទះ', 'ឃ្លាំងសាខា', 'អ្នកដឹកម៉ូតូ', 'ការប្រៀបធៀប'],
    popularPrice: 'Depot: 3,000 KHR • Door: 7,000 KHR',
  },
  {
    id: 'faq-6',
    category: 'routes',
    questionEn: 'How are remote Northeastern provinces (Kratie, Stung Treng, Mondulkiri, Ratanakiri) serviced?',
    questionKm: 'តើការផ្ញើឥវ៉ាន់ទៅកាន់ទិសឦសាន (ក្រចេះ ស្ទឹងត្រែង មណ្ឌលគិរី រតនគិរី) ដំណើរការយ៉ាងដូចម្តេច?',
    answerEn: 'Northeastern routes travel via National Road 7 (NR7) and National Road 73/76. Van departures from Phnom Penh hubs (typically Chroy Changvar and Prek Pnov) depart daily in the early morning (6:30 AM - 8:00 AM) and late evening (8:00 PM). Transit to Kratie and Kampong Cham takes 4 to 6 hours; transit to Sen Monorom (Mondulkiri) and Banlung (Ratanakiri) takes 8 to 12 hours. Rates average 6,000 to 12,000 KHR ($1.50 - $3.00 USD).',
    answerKm: 'ផ្លូវឆ្ពោះទៅទិសឦសាន រត់កាត់ផ្លូវជាតិលេខ ៧ (NR7) និងផ្លូវជាតិលេខ ៧៣/៧៦។ ឡានវ៉ែនចេញពីភ្នំពេញ (ស្ថានីយជ្រោយចង្វារ និងព្រែកព្នៅ) ចេញជារៀងរាល់ថ្ងៃនៅពេលព្រឹកព្រលឹម (៦:៣០ - ៨:០០ ព្រឹក) និងពេលយប់ (៨:០០ យប់)។ ទៅកាន់ក្រចេះ និងកំពង់ចាម ចំណាយពេល ៤ ទៅ ៦ ម៉ោង រីឯទៅកាន់សែនមនោរម្យ (មណ្ឌលគិរី) និងបានលុង (រតនគិរី) ចំណាយពេល ៨ ទៅ ១២ ម៉ោង។ តម្លៃជាមធ្យមពី ៦,០០០ ដល់ ១២,០០០ រៀល ($១.៥០ - $៣.០០)។',
    tagsEn: ['Mondulkiri', 'Ratanakiri', 'Kratie', 'National Road 7', 'Northeast'],
    tagsKm: ['មណ្ឌលគិរី', 'រតនគិរី', 'ក្រចេះ', 'ផ្លូវជាតិលេខ ៧', 'ទិសឦសាន'],
    popularRoute: 'Phnom Penh ⇄ Mondulkiri / Ratanakiri',
    popularPrice: '6,000 - 12,000 KHR (~8-12 hrs)',
  },
  {
    id: 'faq-7',
    category: 'safety',
    questionEn: 'Can I send fragile goods, electronics, or fresh agricultural produce like Kampot durian?',
    questionKm: 'តើអាចផ្ញើទំនិញងាយបែក គ្រឿងអេឡិចត្រូនិច ឬកសិផលស្រស់ៗដូចជា ធុរេនកំពត បានដែរឬទេ?',
    answerEn: 'Yes! For electronics and fragile goods, carriers require at least two layers of 10mm bubble wrap and corner cushioning, sealed with heavy-duty tape and marked "FRAGILE / ឥវ៉ាន់ងាយបែក". For fresh agricultural produce (such as Kampot durian, mangoes, and seafood), select early morning departures (before 8:00 AM) or dedicated refrigerated/cold-chain vans (CamCold Fresh) to ensure arrival within the same day without spoilage.',
    answerKm: 'ពិតជាអាចផ្ញើបាន! សម្រាប់គ្រឿងអេឡិចត្រូនិច និងរបស់ងាយបែក ក្រុមហ៊ុនតម្រូវឱ្យរុំផ្លាស្ទិកពពុះខ្យល់យ៉ាងតិច ២ ជាន់ និងមានទ្រនាប់ការពារគែមជ្រុង បិទស្កុតឱ្យណែន និងបិទស្លាក "FRAGILE / ឥវ៉ាន់ងាយបែក"។ សម្រាប់កសិផលស្រស់ៗ (ដូចជា ធុរេនកំពត ស្វាយ និងគ្រឿងសមុទ្រ) សូមជ្រើសរើសជើងចេញពេលព្រឹកព្រលឹម (មុនម៉ោង ៨:០០ ព្រឹក) ឬរថយន្តទូត្រជាក់ (CamCold Fresh) ដើម្បីធានាទៅដល់ក្នុងថ្ងៃតែមួយដោយមិនខូចគុណភាព។',
    tagsEn: ['Fragile', 'Electronics', 'Fresh Fruit', 'Cold Chain', 'Packaging'],
    tagsKm: ['ងាយបែក', 'អេឡិចត្រូនិច', 'ផ្លែឈើស្រស់', 'ទូត្រជាក់', 'ការរៀបចំ'],
    popularPrice: 'Cold-Chain: +2,000 KHR fee',
  },
  {
    id: 'faq-8',
    category: 'safety',
    questionEn: 'What happens if a parcel tracking status is delayed or has not updated for several hours?',
    questionKm: 'តើត្រូវធ្វើដូចម្តេចប្រសិនបើស្ថានភាពតាមដានកញ្ចប់ឥវ៉ាន់មិនទាន់ update លើសពី ៤ ម៉ោង ឬមកដល់យឺត?',
    answerEn: 'Interprovincial vans often transit through highway stretches with intermittent mobile network coverage (e.g. portions of NR6 in Kampong Thom or mountain passes in Koh Kong). Our system utilizes GPS breadcrumb projection to estimate current vehicle location. You can tap the "Live Chat" button to contact the verified driver directly, call the station depot hotline, or tap "Verify ID" to view the driver’s official identity credential for peace of mind.',
    answerKm: 'ឡានវ៉ែនអន្តរខេត្តជួនកាលឆ្លងកាត់តំបន់ដាច់ស្រយាលដែលមានសេវាទូរស័ព្ទខ្សោយ (ដូចជាកំណាត់ផ្លូវជាតិលេខ ៦ ក្នុងខេត្តកំពង់ធំ ឬផ្លូវភ្នំកោះកុង)។ ប្រព័ន្ធ CamDelivery ប្រើបច្ចេកវិទ្យា GPS Breadcrumb Projection ដើម្បីប៉ាន់ស្មានទីតាំងជាក់ស្តែងរបស់រថយន្ត។ អ្នកអាចចុចប៊ូតុង "ឆាតផ្ទាល់ (Live Chat)" ដើម្បីទាក់ទងអ្នកដឹកផ្ទាល់ ខលទៅលេខទូរស័ព្ទស្ថានីយ ឬចុច "ផ្ទៀងផ្ទាត់ ID" ដើម្បីមើលព័ត៌មានអត្តសញ្ញាណប័ណ្ណរបស់អ្នកដឹក។',
    tagsEn: ['Tracking Issue', 'Delay', 'Driver Chat', 'Support Hotline', 'Peace of Mind'],
    tagsKm: ['បញ្ហាតាមដាន', 'យឺតយ៉ាវ', 'ឆាតអ្នកដឹក', 'ទូរស័ព្ទជំនួយ', 'ទំនុកចិត្ត'],
    popularPrice: '24/7 Free Live Tracking Assistance',
  }
];

export const SupportHub: React.FC<SupportHubProps> = ({
  language,
  currency,
  onNavigateTab,
  onNotify,
}) => {
  const isKm = language === 'km';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'routes' | 'pricing' | 'vans' | 'safety'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, 'yes' | 'no'>>({});
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return FAQ_DATABASE.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const haystack = [
        item.questionEn,
        item.questionKm,
        item.answerEn,
        item.answerKm,
        ...(item.tagsEn || []),
        ...(item.tagsKm || []),
        item.popularRoute || '',
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleFeedback = (id: string, vote: 'yes' | 'no') => {
    setHelpfulFeedback((prev) => ({ ...prev, [id]: vote }));
    if (onNotify) {
      onNotify(
        vote === 'yes'
          ? (isKm ? '❤️ អរគុណសម្រាប់ការវាយតម្លៃរបស់អ្នក!' : '❤️ Thanks for your helpful feedback!')
          : (isKm ? '🙏 យើងនឹងកែលម្អព័ត៌មានបន្ថែមទៀត!' : '🙏 We will work on improving this answer!')
      );
    }
  };

  const handleCopyAnswer = (item: FaqItem) => {
    const text = isKm
      ? `សំណួរ៖ ${item.questionKm}\n\nចម្លើយ៖ ${item.answerKm}\n\n(ប្រភព៖ CamDelivery Free - កម្មវិធីដឹកជញ្ជូនឯករាជ្យកម្ពុជា)`
      : `Question: ${item.questionEn}\n\nAnswer: ${item.answerEn}\n\n(Source: CamDelivery Free - Independent Cambodia Logistics)`;

    navigator.clipboard.writeText(text);
    setCopiedFaqId(item.id);
    setTimeout(() => setCopiedFaqId(null), 2500);

    if (onNotify) {
      onNotify(isKm ? '📋 បានចម្លងសំណួរ និងចម្លើយ!' : '📋 FAQ answer copied to clipboard!');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Support Hub Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-950 text-white p-5 md:p-8 border border-rose-900/40 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mb-3 shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{isKm ? 'មជ្ឈមណ្ឌលជំនួយ & សំណួរឆ្លើយ (SupportHub FAQ)' : 'CamDelivery Support Hub & Route FAQ'}</span>
          </div>

          <h2 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">
            {isKm 
              ? 'សំណួរញឹកញាប់អំពីផ្លូវដឹកជញ្ជូន និងតម្លៃទូទាំង ២៥ ខេត្ត-ក្រុង'
              : 'Frequently Asked Questions: Cambodia Routes & Pricing'}
          </h2>

          <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">
            {isKm
              ? 'ស្វែងយល់លម្អិតអំពីពេលវេលាដឹកតាមផ្លូវជាតិ (ផ្លូវជាតិលេខ ៦, ៤, ៣, ៧), តម្លៃតាមឡានវ៉ែន, ការប្រមូលលុយជំនួស COD 0%, និងវិធីវេចខ្ចប់ប្រកបដោយសុវត្ថិភាព។'
              : 'Clear answers on national highway transit times (NR6, NR4, NR3, NR7), interprovincial van rates, 0% commission COD remittances, and protective parcel packaging.'}
          </p>

          {/* Quick Search Input with Real-Time Filter */}
          <div className="mt-5 relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-rose-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isKm
                  ? 'ស្វែងរកសំណួរ (ឧ. សៀមរាប, តម្លៃដឹក, COD, ផ្លូវជាតិលេខ ៦, របស់ងាយបែក)...'
                  : 'Search delivery routes, pricing, COD, Siem Reap, packaging...'
              }
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30 text-white text-xs sm:text-sm placeholder:text-slate-400 shadow-inner outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all' as const, labelEn: 'All Topics', labelKm: 'ប្រធានបទទាំងអស់', icon: Sparkles, count: FAQ_DATABASE.length },
          { id: 'routes' as const, labelEn: 'Delivery Routes', labelKm: 'ផ្លូវដឹក & ខេត្ត-ក្រុង', icon: MapPin, count: FAQ_DATABASE.filter(f => f.category === 'routes').length },
          { id: 'pricing' as const, labelEn: 'Pricing & COD', labelKm: 'តម្លៃដឹក & COD', icon: DollarSign, count: FAQ_DATABASE.filter(f => f.category === 'pricing').length },
          { id: 'vans' as const, labelEn: 'Vans & Stations', labelKm: 'ឡានវ៉ែន & ស្ថានីយ', icon: Truck, count: FAQ_DATABASE.filter(f => f.category === 'vans').length },
          { id: 'safety' as const, labelEn: 'Safety & Packaging', labelKm: 'សុវត្ថិភាព & វេចខ្ចប់', icon: ShieldCheck, count: FAQ_DATABASE.filter(f => f.category === 'safety').length },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComp = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-rose-400'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-rose-500'}`} />
              <span>{isKm ? cat.labelKm : cat.labelEn}</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search results summary */}
      {searchQuery && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            {isKm 
              ? `បានរកឃើញ ${filteredFaqs.length} ចម្លើយសម្រាប់ពាក្យគន្លឹះ "${searchQuery}"`
              : `Found ${filteredFaqs.length} matching answers for "${searchQuery}"`}
          </span>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-rose-600 font-bold hover:underline"
          >
            {isKm ? 'សម្អាតការស្វែងរក' : 'Clear Filter'}
          </button>
        </div>
      )}

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
              {isKm ? 'មិនមានចម្លើយត្រូវគ្នានឹងពាក្យគន្លឹះនេះទេ' : 'No matching questions found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isKm
                ? 'សូមសាកល្បងស្វែងរកដោយប្រើពាក្យទូទៅដូចជា "សៀមរាប", "តម្លៃ", "COD", "ឡានវ៉ែន" ឬទាក់ទងមកកាន់លេខជំនួយផ្ទាល់។'
                : 'Try searching with generic terms such as "Siem Reap", "Price", "COD", "Expressway" or contact our community hotline.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              {isKm ? 'បង្ហាញសំណួរទាំងអស់ឡើងវិញ' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedFaqId === faq.id;
            const hasVoted = helpfulFeedback[faq.id];
            const isCopied = copiedFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition shadow-xs overflow-hidden ${
                  isExpanded
                    ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Accordion Header / Question */}
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 mt-0.5 transition ${
                      isExpanded
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100'
                    }`}>
                      Q{idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {faq.popularRoute && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {faq.popularRoute}
                          </span>
                        )}
                        {faq.popularPrice && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                            {faq.popularPrice}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                        {isKm ? faq.questionKm : faq.questionEn}
                      </h3>
                    </div>
                  </div>

                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition shrink-0 ${
                    isExpanded
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 rotate-180'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                  </div>
                </button>

                {/* Accordion Body / In-Depth Answer */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200 space-y-3">
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      {isKm ? faq.answerKm : faq.answerEn}
                    </p>

                    {/* Bilingual toggle reference for dual-language users */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                        {isKm ? '🇬🇧 English Reference:' : '🇰🇭 ភាសាខ្មែរ (Khmer):'}
                      </span>
                      <p className="italic">
                        {isKm ? faq.answerEn : faq.answerKm}
                      </p>
                    </div>

                    {/* Tags & Action Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Topic Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(isKm ? faq.tagsKm : faq.tagsEn).map((tag, tidx) => (
                          <span
                            key={tidx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Helpful Vote & Copy Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {isKm ? 'តើចម្លើយនេះមានប្រយោជន៍ទេ?' : 'Was this helpful?'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleFeedback(faq.id, 'yes')}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            hasVoted === 'yes'
                              ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                          title="Yes, helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFeedback(faq.id, 'no')}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            hasVoted === 'no'
                              ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                          title="No, needs improvement"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyAnswer(faq)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer ml-1"
                          title="Copy Answer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Action Contact & Direct Support Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Hotline Support Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {isKm ? 'ទូរស័ព្ទបន្ទាន់ Hotline' : 'Direct Helpline'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKm ? 'ភាសាខ្មែរ & English (២៤/៧)' : 'Khmer & English (24/7)'}
              </p>
            </div>
          </div>
          <a
            href="tel:023888999"
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>023 888 999</span>
          </a>
        </div>

        {/* Telegram Community Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {isKm ? 'សហគមន៍តេឡេក្រាម' : 'Telegram Community'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKm ? 'ឆ្លើយតបរហ័ស ពីក្រុមការងារ' : 'Instant live dispatcher help'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onNotify) {
                onNotify(isKm ? '📢 តំណភ្ជាប់ Telegram Support: @CamDeliverySupport' : '📢 Telegram Support: @CamDeliverySupport');
              }
            }}
            className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>@CamDeliverySupport</span>
          </button>
        </div>

        {/* Route Calculator Shortcut */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                {isKm ? 'ប្រៀបធៀបតម្លៃឡានវ៉ែន' : 'Compare Van Fleets'}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isKm ? 'ពិនិត្យតម្លៃដឹក ២៥ ខេត្ត' : 'Check 25-province van rates'}
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('courier')}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>{isKm ? 'បើកតារាងតម្លៃ' : 'Open Price Comparator'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
