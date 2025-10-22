export default function AboutUsPage() {
  return (
    <main className="w-full">
      {/* Hero Section - Different Design */}
      <section className="relative bg-gradient-to-br from-slate-50 to-blue-50 py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-green-500 mb-8">
              <span className="text-3xl font-bold text-white">KU</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">KU WHY</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're a team of Kasetsart University students who believe in the power of 
              connection, collaboration, and community. KU WHY is our way of bringing 
              the campus together.
            </p>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-green-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-8 h-8 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </section>

      {/* Our Story */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-4">
              <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Story</div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Born from student needs</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                KU WHY started when we noticed students struggling to connect and share information 
                across campus. We built this platform to bridge the gap between different faculties, 
                making it easier for everyone to learn, ask questions, and build meaningful connections 
                within the Kasetsart University community.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <img src="/images/feature3d.png" alt="KU WHY story" className="w-full max-w-md h-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Meet the Team</h2>
            <p className="mt-3 text-gray-600">Students building for students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Developer</h3>
              <p className="mt-2 text-gray-600">Computer Science Student</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Designer</h3>
              <p className="mt-2 text-gray-600">Engineering Student</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">D</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Product Manager</h3>
              <p className="mt-2 text-gray-600">Business Student</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why KU WHY */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl text-center mb-8">Why KU WHY?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">The Problem We Saw</h4>
                <p className="text-gray-600">
                  Students were scattered across different platforms, struggling to find study groups, 
                  ask questions, or share resources. Information was fragmented and hard to discover.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Our Solution</h4>
                <p className="text-gray-600">
                  A unified platform where every KU student can connect, learn, and grow together. 
                  Simple, fast, and designed specifically for our campus community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl p-8 sm:p-12 shadow-lg relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,201,255,0.12), rgba(146,254,157,0.12))' }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 691" className="h-full w-full" preserveAspectRatio="none">
                <rect width="1440" height="1440" fill="url(#cta_linear)" fillOpacity="0.18" />
                <defs>
                  <linearGradient id="cta_linear" x1="365.5" y1="-138.5" x2="1092" y2="981.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00C9FF" />
                    <stop offset="1" stopColor="#92FE9D" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Join the KU WHY Community</h3>
              <p className="mt-2 text-gray-700 max-w-2xl mx-auto">
                Be part of building a stronger, more connected Kasetsart University. 
                Your voice matters in shaping our campus community.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/note" className="inline-flex items-center justify-center rounded-full bg-black/90 px-6 py-3 text-white hover:bg-black transition">Get Started</a>
                <a href="/" className="inline-flex items-center justify-center rounded-full border border-black/80 px-6 py-3 text-black hover:bg-black/5 transition">Back to Home</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


