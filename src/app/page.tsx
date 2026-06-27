import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Package, Users, TrendingUp, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white">PasalSathi</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">सुविधाहरू</a>
            <a href="#pricing" className="hover:text-white transition-colors">मूल्य</a>
            <a href="#about" className="hover:text-white transition-colors">बारेमा</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              लगइन
            </Link>
            <Link href="/signup" className="text-sm bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95">
              सुरु गर्नुहोस्
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-red-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            नेपाली व्यापारको लागि बनाइएको
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            <span className="text-white">आफ्नो पसलको</span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              हिसाब किताब
            </span>
            <br />
            <span className="text-white">सजिलोसँग।</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            किराना होस् या हार्डवेयर — PasalSathi ले तपाईंको पसलको आम्दानी, खर्च, उधारो, स्टक र स्टाफ सबै एकै ठाउँमा राख्छ।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="group flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-2xl shadow-orange-600/25 w-full sm:w-auto justify-center">
              निःशुल्क सुरु गर्नुहोस्
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 text-gray-400 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/10 hover:border-white/20 transition-all w-full sm:w-auto justify-center">
              लगइन गर्नुहोस्
            </Link>
          </div>

          <p className="text-sm text-gray-600 mt-5">३० दिन नि:शुल्क • कुनै क्रेडिट कार्ड चाहिँदैन</p>
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-1 shadow-2xl">
            <div className="bg-[#111] rounded-[20px] p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Fake dashboard widgets */}
              {[
                { label: 'आजको आम्दानी', value: 'NPR 12,500', color: 'text-green-400', bg: 'bg-green-500/10' },
                { label: 'आजको खर्च', value: 'NPR 3,200', color: 'text-red-400', bg: 'bg-red-500/10' },
                { label: 'आजको नाफा', value: 'NPR 9,300', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'कुल उधारो', value: 'NPR 45,000', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'कम स्टक', value: '3 सामान', color: 'text-red-400', bg: 'bg-red-500/10' },
                { label: 'स्टाफ उपस्थित', value: '5 / 6', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              ].map((w) => (
                <div key={w.label} className={`${w.bg} rounded-2xl p-4 border border-white/5`}>
                  <p className="text-xs text-gray-500 mb-1">{w.label}</p>
                  <p className={`text-xl font-bold ${w.color}`}>{w.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Logos / trust */}
      <section className="py-12 border-y border-white/5 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-600 mb-6">नेपालभर विश्वास गरिएको</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-600 text-sm font-medium">
            {['किराना पसल', 'हार्डवेयर', 'फार्मेसी', 'कपडा पसल', 'थोक व्यापार', 'रेस्टुरेन्ट'].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              सबै कुरा एकै ठाउँमा
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              पाँच शक्तिशाली मोड्युलहरू जसले तपाईंको पसललाई डिजिटल बनाउँछ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp size={24} />,
                color: 'from-green-500/20 to-green-500/5 border-green-500/20',
                iconColor: 'text-green-400',
                title: 'हिसाब',
                nepali: 'आम्दानी र खर्च',
                desc: 'प्रत्येक दिनको आम्दानी र खर्च रेकर्ड गर्नुहोस्। वर्गीकरण, भुक्तानी माध्यम र विवरण सहित।',
              },
              {
                icon: <BookOpen size={24} />,
                color: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
                iconColor: 'text-amber-400',
                title: 'खाता',
                nepali: 'ग्राहक उधारो',
                desc: 'कसको कति उधारो बाँकी छ? SMS रिमाइन्डर पठाउनुहोस् र भुक्तानी ट्र्याक गर्नुहोस्।',
              },
              {
                icon: <Package size={24} />,
                color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
                iconColor: 'text-blue-400',
                title: 'गोदाम',
                nepali: 'स्टक व्यवस्थापन',
                desc: 'सामानको स्टक ट्र्याक गर्नुहोस्। कम भएको सामानको अलर्ट पाउनुहोस्।',
              },
              {
                icon: <Users size={24} />,
                color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
                iconColor: 'text-purple-400',
                title: 'स्टाफ',
                nepali: 'कर्मचारी व्यवस्थापन',
                desc: 'हाजिरी राख्नुहोस्, तलब हिसाब गर्नुहोस् र भुक्तानी रेकर्ड गर्नुहोस्।',
              },
              {
                icon: <BarChart3 size={24} />,
                color: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
                iconColor: 'text-orange-400',
                title: 'रिपोर्ट',
                nepali: 'मासिक विश्लेषण',
                desc: 'मासिक नाफा/नोक्सान, खाता संकलन दर, धेरै बिकेका सामान — सबै एकै ठाउँमा।',
              },
              {
                icon: <Star size={24} />,
                color: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',
                iconColor: 'text-pink-400',
                title: 'सजिलो प्रयोग',
                nepali: 'नेपाली भाषामा',
                desc: 'ठूलो अक्षर, सरल डिजाइन। ज्येष्ठ नागरिकदेखि युवासम्म सबैले सजिलै प्रयोग गर्न सकिन्छ।',
              },
            ].map((f) => (
              <div key={f.title}
                className={`bg-gradient-to-br ${f.color} border rounded-3xl p-6 hover:scale-[1.02] transition-transform`}>
                <div className={`${f.iconColor} mb-4`}>{f.icon}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white">{f.title}</h3>
                  <span className="text-xs text-gray-500">{f.nepali}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/10 to-transparent pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">सरल मूल्य</h2>
            <p className="text-gray-400 text-lg">कुनै लुकेको शुल्क छैन। जुनसुकै बेला बदल्न सकिन्छ।</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'सानो', price: 499, popular: false,
                color: 'border-white/10',
                badge: 'bg-green-500/20 text-green-400',
                features: ['२ स्टाफसम्म', '५० ग्राहकसम्म', '१०० सामानसम्म', '२० SMS/महिना', 'आधारभूत रिपोर्ट'],
              },
              {
                name: 'मध्यम', price: 1199, popular: true,
                color: 'border-orange-500/50',
                badge: 'bg-orange-500/20 text-orange-400',
                features: ['१० स्टाफसम्म', '३०० ग्राहकसम्म', '५०० सामानसम्म', '१०० SMS/महिना', 'PDF रिपोर्ट'],
              },
              {
                name: 'ठूलो', price: 2499, popular: false,
                color: 'border-white/10',
                badge: 'bg-purple-500/20 text-purple-400',
                features: ['असीमित स्टाफ', 'असीमित ग्राहक', 'असीमित सामान', 'असीमित SMS', 'PDF + Excel + IRD'],
              },
            ].map((plan) => (
              <div key={plan.name}
                className={`relative bg-white/[0.03] border ${plan.color} rounded-3xl p-7 ${plan.popular ? 'ring-1 ring-orange-500/50 shadow-2xl shadow-orange-500/10' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    सबैभन्दा लोकप्रिय
                  </div>
                )}
                <div className="mb-6">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.badge}`}>{plan.name}</span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">NPR {plan.price.toLocaleString()}</span>
                  <span className="text-gray-500 text-sm">/महिना</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-400">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500'
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}>
                  ३० दिन नि:शुल्क सुरु गर्नुहोस्
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-600/20 via-red-600/10 to-transparent border border-orange-500/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              आजै सुरु गर्नुहोस्
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              ३० दिन नि:शुल्क। कुनै क्रेडिट कार्ड चाहिँदैन।
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-2xl shadow-orange-600/30">
              निःशुल्क खाता खोल्नुहोस्
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">PasalSathi</span>
          </div>
          <p className="text-gray-600 text-sm">© 2025 PasalSathi · नेपाली व्यापारको लागि बनाइएको</p>
          <div className="flex gap-6 text-sm text-gray-600">
            <Link href="/login" className="hover:text-white transition-colors">लगइन</Link>
            <Link href="/signup" className="hover:text-white transition-colors">दर्ता</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
