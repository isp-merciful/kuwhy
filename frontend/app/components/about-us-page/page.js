export default function AboutUsPage() {
  return (
    <main className="w-full">
      {/* Hero Section - Enhanced Design */}
      <section className="relative bg-gradient-to-br from-slate-50 via-green-50 to-blue-100 py-24 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 animate-pulse" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Enhanced Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-20 animate-bounce" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full opacity-20 animate-bounce" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full opacity-20 animate-bounce" style={{animationDelay: '3s'}}></div>

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="text-center">
            {/* Enhanced Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-teal-500 mb-8 shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <span className="text-4xl font-bold text-white">KU</span>
            </div>
            
            {/* Enhanced Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              About <span className="bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-pulse">KU WHY</span>
            </h1>
            
            {/* Enhanced Description */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
              We're a passionate team of Kasetsart University students who believe in the power of 
              <span className="font-semibold text-blue-600"> connection</span>, 
              <span className="font-semibold text-green-600"> collaboration</span>, and 
              <span className="font-semibold text-teal-600"> community</span>. 
              KU WHY is our way of bringing the entire campus together.
            </p>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <a href="/note" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg">
                Start Connecting
              </a>
              <a href="#team" className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-600 text-gray-700 font-semibold rounded-full hover:border-blue-500 hover:text-blue-600 transition-all duration-300">
                Meet Our Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-100">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Making an Impact</h2>
            <p className="text-lg text-gray-600">Connecting students across Kasetsart University</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">120+</div>
              <div className="text-gray-600">Notes Shared</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">25+</div>
              <div className="text-gray-600">Blog Posts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">8+</div>
              <div className="text-gray-600">Faculties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bg-gradient-to-r from-white to-green-50 rounded-3xl shadow-xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center transform hover:scale-105 transition-transform duration-300">
            <div className="space-y-6">
              <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Our Story</div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Born from student needs</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                KU WHY started when we noticed students struggling to connect and share information 
                across campus. We built this platform to bridge the gap between different faculties, 
                making it easier for everyone to learn, ask questions, and build meaningful connections 
                within the Kasetsart University community.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Student-driven</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Community-focused</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Innovation-first</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <img src="/images/feature3d.png" alt="KU WHY story" className="w-full max-w-md h-auto object-contain transform hover:scale-110 transition-transform duration-300" />
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Meet the Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Passionate students building the future of campus connectivity</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">DF</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Danita Frikaow</h3>
              <p className="text-gray-600 mb-4 text-sm">UI/UX Designer & Frontend Developer</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-blue-400 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">TB</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Thanabordee Bundisakul</h3>
              <p className="text-gray-600 mb-4">Frontend Developer</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">CP</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chitiwat Phajan</h3>
              <p className="text-gray-600 mb-4">Fullstack Developer</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-100">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">PW</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Piyawat Wiriyayothin</h3>
              <p className="text-gray-600 mb-4">Backend Developer</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
            <p className="text-lg text-gray-600">What drives us every day</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community First</h3>
              <p className="text-gray-600">Building connections that matter and fostering a supportive campus environment.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Innovation</h3>
              <p className="text-gray-600">Continuously improving and adapting to meet the evolving needs of students.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-lg transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Student-Centric</h3>
              <p className="text-gray-600">Every feature and decision is made with students' best interests in mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why KU WHY */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-3xl shadow-xl p-8 sm:p-12 border border-gray-100">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why KU WHY?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold">!</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">The Problem We Saw</h4>
                    <p className="text-gray-600">
                      Students were scattered across different platforms, struggling to find study groups, 
                      ask questions, or share resources. Information was fragmented and hard to discover.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Our Solution</h4>
                    <p className="text-gray-600">
                      A unified platform where every KU student can connect, learn, and grow together. 
                      Simple, fast, and designed specifically for our campus community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl p-12 sm:p-16 shadow-2xl relative overflow-hidden bg-white/10 backdrop-blur-sm">
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 691" className="h-full w-full" preserveAspectRatio="none">
                <rect width="1440" height="1440" fill="url(#cta_linear)" fillOpacity="0.1" />
                <defs>
                  <linearGradient id="cta_linear" x1="365.5" y1="-138.5" x2="1092" y2="981.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00C9FF" />
                    <stop offset="1" stopColor="#92FE9D" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="relative z-10 text-center">
              <h3 className="text-3xl sm:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent">Join the KU WHY Community</h3>
              <p className="text-xl text-gray-700/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                Be part of building a stronger, more connected Kasetsart University. 
                Your voice matters in shaping our campus community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/note" className="inline-flex items-center justify-center rounded-full bg-white text-blue-600 font-semibold px-8 py-4 hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-lg">
                  Get Started Now
                </a>
                <a href="/" className="inline-flex items-center justify-center rounded-full border-1 border-gray-400 text-gray-700 font-semibold px-8 py-4 hover:bg-white hover:text-blue-600 transition-all duration-300">
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}