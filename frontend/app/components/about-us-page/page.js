export default function LandingPage() {
  return (
    <main className="w-full">
      {/* Apple-Style Hero Section */}
      <section className="relative bg-black min-h-screen flex items-center">
        {/* Apple-style gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-green-50 to-blue-100"></div>
        
        {/* Subtle geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-400/5 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <div className="space-y-12">
            {/* Apple-style headline */}
            <div className="space-y-6">
              <h1 className="text-7xl md:text-8xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-green-600 to-teal-600 bg-clip-text text-transparent animate-pulse">KU WHY</span>
              </h1>
              <p className="text-2xl md:text-3xl font-light text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Connect, ask, share at Kasetsart University
              </p>
            </div>
            
            {/* Apple-style description */}
            <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Write notes, post thoughts, and spark meaningful conversations across campus. 
              Built by students, for students.
            </p>
            
            {/* Apple-style buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#share-ways" className="inline-flex items-center justify-center rounded-full bg-white text-black px-8 py-4 text-lg font-medium hover:bg-gray-100 transition-all duration-300">
                Get Started
              </a>
              <a href="/about" className="inline-flex items-center justify-center rounded-full border border-gray-600 text-black px-8 py-4 text-lg font-medium hover:bg-white/5 transition-all duration-300">
                Learn More
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Apple-style stats */}
            <div className="pt-8 border-t border-gray-800">
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl font-light text-gray-600">50+</div>
                  <div className="text-sm">Active Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-gray-600">120+</div>
                  <div className="text-sm">Notes Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-light text-gray-600">8+</div>
                  <div className="text-sm">Faculties</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Apple-style scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-600 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Apple-Style Two Ways to Share */}
      <section id="share-ways" className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-thin text-gray-900 mb-6">
              Two ways to share
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Choose how you want to express yourself—quick notes or longer blog posts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Apple-style Notes Card */}
            <div className="group bg-gray-50 rounded-3xl p-12 hover:bg-gray-100 transition-all duration-500">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-blue-300 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">N</span>
                </div>
                <div>
                  <h3 className="text-3xl font-light text-gray-900 mb-4">Notes</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Share short thoughts, questions, or updates in real time. Perfect for
                    quick ideas and casual conversations.
                  </p>
                </div>
                <a href="/note" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                  Start a note
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Apple-style Blog Card */}
            <div className="group bg-gray-50 rounded-3xl p-12 hover:bg-gray-100 transition-all duration-500">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-blue-300 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">B</span>
                </div>
                <div>
                  <h3 className="text-3xl font-light text-gray-900 mb-4">Blog posts</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Write longer articles with structure and media. Ideal for guides,
                    reflections, and community highlights.
                  </p>
                </div>
                <a href="/note" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                  Write a post
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-Style About Us Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Image */}
            <div className="flex justify-center lg:justify-start">
              <img 
                src="/images/feature3d.png" 
                alt="KU WHY Features" 
                className="w-full max-w-md h-auto object-contain"
              />
            </div>

            {/* Right side - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-5xl font-thin text-gray-900">
                  Built for KU
                </h2>
                <p className="text-xl text-gray-600 font-light leading-relaxed">
                  KU WHY is a hub for Kasetsart University students to connect and share. 
                  Post quick notes or polls that vanish in 24h, join study groups, ask lasting questions, 
                  share files, stay updated, and help keep the community safe.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Student-driven platform</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Community-focused features</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Innovation-first approach</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-Style Statistics Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-thin text-gray-900 mb-6">
              Join the KU community
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Students are connecting and sharing on KU WHY
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-light text-blue-400 mb-2">50+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-blue-400 mb-2">120+</div>
              <div className="text-gray-600">Notes Shared</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-blue-400 mb-2">25+</div>
              <div className="text-gray-600">Blog Posts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-blue-400 mb-2">8+</div>
              <div className="text-gray-600">Faculties</div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-Style Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-thin text-gray-900 mb-6">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Powerful features designed specifically for the KU community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Notes & Polls */}
            <div className="bg-white rounded-3xl p-8 hover:bg-gray-50 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <img src="/images/chat.png" alt="Notes & Polls" className="w-15 h-15" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Notes & Polls</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Share quick posts or polls that disappear in 24 hours (anonymous option available).
              </p>
              <a href="/note" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                Try Notes
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Blogs & Q&A */}
            <div className="bg-white rounded-3xl p-8 hover:bg-gray-50 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <img src="/images/qa.png" alt="Blogs & Q&A" className="w-15 h-15" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Blogs & Q&A</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Ask questions, share experiences, get lasting replies.
              </p>
              <a href="/blog" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                Start Writing
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-3xl p-8 hover:bg-gray-50 transition-all duration-500">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                <img src="/images/notification.png" alt="Notifications" className="w-15 h-15" />
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-4">Smart Notifications</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Stay updated when someone replies, comments, or invites you to a group.
              </p>
              <span className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200">
                Always Connected
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-Style CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-green-50 to-blue-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h3 className="text-5xl font-thin text-gray-900 mb-6">Ready to connect?</h3>
            <p className="text-xl text-gray-700 font-light max-w-3xl mx-auto mb-12 leading-relaxed">
              Join Kasetsart University students who are sharing, learning, and growing together on KU WHY.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/note"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-8 py-4 text-lg font-medium hover:bg-blue-700 transition-all duration-300">
                Get Started
              </a>
              <a href="/about"
                className="inline-flex items-center justify-center rounded-full border border-blue-400 text-blue-700 px-8 py-4 text-lg font-medium hover:bg-blue-100/50 transition-all duration-300">
                Learn More
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}