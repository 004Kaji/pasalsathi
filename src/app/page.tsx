import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, Package, Users, TrendingUp, CheckCircle, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1C1917] overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F5F0E8]/90 backdrop-blur-xl border-b border-[#D5CFC6]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#C84B2F] rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-[#1C1917]">PasalSathi</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#6B6560]">
            <a href="#features" className="hover:text-[#1C1917] transition-colors">सुविधाहरू</a>
            <a href="#pricing" className="hover:text-[#1C1917] transition-colors">मूल्य</a>
            <a href="#about" className="hover:text-[#1C1917] transition-colors">बारेमा</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#6B6560] hover:text-[#1C1917] transition-colors px-4 py-2">
              लगइन
            </Link>
            <Link href="/signup" className="text-sm bg-[#C84B2F] hover:opacity-90 text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-95">
              सुरु गर्नुहोस्
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background glow — subtle on cream */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#C84B2F]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#D5CFC6] rounded-full px-4 py-1.5 text-sm text-[#6B6560] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#4A7055] animate-pulse" />
            नेपाली व्यापारको लागि बनाइएको
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            <span className="text-[#1C1917]">आफ्नो पसलको</span>
            <br />
            <span className="text-[#C84B2F]">
              हिसाब किताब
            </span>
            <br />
            <span className="text-[#1C1917]">सजिलोसँग।</span>
          </h1>

          <p className="text-xl text-[#6B6560] max-w-2xl mx-auto mb-10 leading-relaxed">
            किराना होस् या हार्डवेयर — PasalSathi ले तपाईंको पसलको आम्दानी, खर्च, उधारो, स्टक र स्टाफ सबै एकै ठाउँमा राख्छ।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="group flex items-center gap-3 bg-[#C84B2F] hover:opacity-90 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-[#C84B2F]/20 w-full sm:w-auto justify-center">
              निःशुल्क सुरु गर्नुहोस्
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 text-[#6B6560] hover:text-[#1C1917] px-8 py-4 rounded-2xl font-semibold text-lg border border-[#D5CFC6] hover:border-[#9B948E] bg-white transition-all w-full sm:w-auto justify-center">
              लगइन गर्नुहोस्
            </Link>
          </div>

          <p className="text-sm text-[#9B948E] mt-5">३० दिन नि:शुल्क • कुनै क्रेडिट कार्ड चाहिँदैन</p>
        </div>

        {/* App preview mockup */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F0E8] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="bg-white border border-[#D5CFC6] rounded-3xl p-1 shadow-xl">
            <div className="bg-[#F5F0E8] rounded-[20px] p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'आजको आम्दानी', value: 'NPR 12,500', color: 'text-[#4A7055]', bg: 'bg-[#4A7055]/10 border-[#4A7055]/20' },
                { label: 'आजको खर्च', value: 'NPR 3,200', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' },
                { label: 'आजको नाफा', value: 'NPR 9,300', color: 'text-blue-700', bg: 'bg-blue-500/10 border-blue-500/20' },
                { label: 'कुल उधारो', value: 'NPR 45,000', color: 'text-[#C9933A]', bg: 'bg-[#C9933A]/10 border-[#C9933A]/20' },
                { label: 'कम स्टक', value: '3 सामान', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20' },
                { label: 'स्टाफ उपस्थित', value: '5 / 6', color: 'text-purple-700', bg: 'bg-purple-500/10 border-purple-500/20' },
              ].map((w) => (
                <div key={w.label} className={`${w.bg} rounded-2xl p-4 border`}>
                  <p className="text-xs text-[#9B948E] mb-1">{w.label}</p>
                  <p className={`text-xl font-bold ${w.color}`}>{w.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust logos */}
      <section className="py-12 border-y border-[#D5CFC6] px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-[#9B948E] mb-6">नेपालभर विश्वास गरिएको</p>
          <div className="flex flex-wrap justify-center gap-8 text-[#6B6560] text-sm font-medium">
            {['किराना पसल', 'हार्डवेयर', 'फार्मेसी', 'कपडा पसल', 'थोक व्यापार', 'रेस्टुरेन्ट'].map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84B2F]" />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1C1917] mb-4">
              सबै कुरा एकै ठाउँमा
            </h2>
            <p className="text-[#6B6560] text-lg max-w-xl mx-auto">
              पाँच शक्तिशाली मोड्युलहरू जसले तपाईंको पसललाई डिजिटल बनाउँछ
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp size={24} />,
                color: 'from-green-500/10 to-green-500/5 border-green-500/20',
                iconColor: 'text-[#4A7055]',
                title: 'हिसाब',
                nepali: 'आम्दानी र खर्च',
                desc: 'प्रत्येक दिनको आम्दानी र खर्च रेकर्ड गर्नुहोस्। वर्गीकरण, भुक्तानी माध्यम र विवरण सहित।',
              },
              {
                icon: <BookOpen size={24} />,
                color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
                iconColor: 'text-[#C9933A]',
                title: 'खाता',
                nepali: 'ग्राहक उधारो',
                desc: 'कसको कति उधारो बाँकी छ? SMS रिमाइन्डर पठाउनुहोस् र भुक्तानी ट्र्याक गर्नुहोस्।',
              },
              {
                icon: <Package size={24} />,
                color: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
                iconColor: 'text-blue-600',
                title: 'गोदाम',
                nepali: 'स्टक व्यवस्थापन',
                desc: 'सामानको स्टक ट्र्याक गर्नुहोस्। कम भएको सामानको अलर्ट पाउनुहोस्।',
              },
              {
                icon: <Users size={24} />,
                color: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
                iconColor: 'text-purple-600',
                title: 'स्टाफ',
                nepali: 'कर्मचारी व्यवस्थापन',
                desc: 'हाजिरी राख्नुहोस्, तलब हिसाब गर्नुहोस् र भुक्तानी रेकर्ड गर्नुहोस्।',
              },
              {
                icon: <BarChart3 size={24} />,
                color: 'from-[#C84B2F]/10 to-[#C84B2F]/5 border-[#C84B2F]/20',
                iconColor: 'text-[#C84B2F]',
                title: 'रिपोर्ट',
                nepali: 'मासिक विश्लेषण',
                desc: 'मासिक नाफा/नोक्सान, खाता संकलन दर, धेरै बिकेका सामान — सबै एकै ठाउँमा।',
              },
              {
                icon: <Star size={24} />,
                color: 'from-pink-500/10 to-pink-500/5 border-pink-500/20',
                iconColor: 'text-pink-600',
                title: 'सजिलो प्रयोग',
                nepali: 'नेपाली भाषामा',
                desc: 'ठूलो अक्षर, सरल डिजाइन। ज्येष्ठ नागरिकदेखि युवासम्म सबैले सजिलै प्रयोग गर्न सकिन्छ।',
              },
            ].map((f) => (
              <div key={f.title}
                className={`bg-gradient-to-br ${f.color} border rounded-3xl p-6 hover:scale-[1.02] transition-transform`}>
                <div className={`${f.iconColor} mb-4`}>{f.icon}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-xl font-bold text-[#1C1917]">{f.title}</h3>
                  <span className="text-xs text-[#9B948E]">{f.nepali}</span>
                </div>
                <p className="text-[#6B6560] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative">
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#1C1917] mb-4">सरल मूल्य</h2>
            <p className="text-[#6B6560] text-lg">कुनै लुकेको शुल्क छैन। जुनसुकै बेला बदल्न सकिन्छ।</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'सानो', price: 499, popular: false,
                color: 'border-[#D5CFC6]',
                badge: 'bg-[#4A7055]/10 text-[#4A7055]',
                features: ['२ स्टाफसम्म', '५० ग्राहकसम्म', '१०० सामानसम्म', '२० SMS/महिना', 'आधारभूत रिपोर्ट'],
              },
              {
                name: 'मध्यम', price: 1199, popular: true,
                color: 'border-[#C84B2F]/40',
                badge: 'bg-[#C84B2F]/10 text-[#C84B2F]',
                features: ['१० स्टाफसम्म', '३०० ग्राहकसम्म', '५०० सामानसम्म', '१०० SMS/महिना', 'PDF रिपोर्ट'],
              },
              {
                name: 'ठूलो', price: 2499, popular: false,
                color: 'border-[#D5CFC6]',
                badge: 'bg-purple-500/10 text-purple-600',
                features: ['असीमित स्टाफ', 'असीमित ग्राहक', 'असीमित सामान', 'असीमित SMS', 'PDF + Excel + IRD'],
              },
            ].map((plan) => (
              <div key={plan.name}
                className={`relative bg-white border ${plan.color} rounded-3xl p-7 shadow-sm ${plan.popular ? 'ring-1 ring-[#C84B2F]/30 shadow-[#C84B2F]/10' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C84B2F] text-white text-xs font-bold px-4 py-1 rounded-full">
                    सबैभन्दा लोकप्रिय
                  </div>
                )}
                <div className="mb-6">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.badge}`}>{plan.name}</span>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-black text-[#1C1917]">NPR {plan.price.toLocaleString()}</span>
                  <span className="text-[#9B948E] text-sm">/महिना</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-[#6B6560]">
                      <CheckCircle size={16} className="text-[#4A7055] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className={`block text-center py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-[#C84B2F] text-white hover:opacity-90'
                      : 'bg-[#F5F0E8] text-[#1C1917] hover:bg-[#EDE8DF] border border-[#D5CFC6]'
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
          <div className="bg-white border border-[#D5CFC6] rounded-3xl p-12 shadow-sm">
            <h2 className="text-4xl md:text-5xl font-black text-[#1C1917] mb-4">
              आजै सुरु गर्नुहोस्
            </h2>
            <p className="text-[#6B6560] text-lg mb-8">
              ३० दिन नि:शुल्क। कुनै क्रेडिट कार्ड चाहिँदैन।
            </p>
            <Link href="/signup"
              className="inline-flex items-center gap-3 bg-[#C84B2F] hover:opacity-90 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-[#C84B2F]/20">
              निःशुल्क खाता खोल्नुहोस्
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#D5CFC6] py-10 px-6 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#C84B2F] rounded-lg flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#1C1917]">PasalSathi</span>
          </div>
          <p className="text-[#9B948E] text-sm">© 2025 PasalSathi · नेपाली व्यापारको लागि बनाइएको</p>
          <div className="flex gap-6 text-sm text-[#9B948E]">
            <Link href="/login" className="hover:text-[#1C1917] transition-colors">लगइन</Link>
            <Link href="/signup" className="hover:text-[#1C1917] transition-colors">दर्ता</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
