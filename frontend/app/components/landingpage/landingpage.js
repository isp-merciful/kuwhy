export default function LandingPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
        <section className="relative isolate pt-[36px] min-h-[450px]">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
            {/* Straight rectangle background */}
            <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 691"
            className="h-full w-full"
            preserveAspectRatio="none"
            >
            <rect width="1440" height="1440" fill="url(#paint0_linear_276_801)" fillOpacity="0.5" />
            <defs>
                <linearGradient id="paint0_linear_276_801" x1="365.5" y1="-138.5" x2="1092" y2="981.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C9FF" />
                <stop offset="1" stopColor="#92FE9D" />
                </linearGradient>
            </defs>
            </svg>
        
        <div className="absolute bottom-0 w-full h-40">
            
            {/* Blur overlay at bottom */}
            {/* <div className="absolute bottom-0 w-full h-40 bg-gradient-to-t from-white via-white/80 to-transparent backdrop-blur-none"></div> */}
            
            {/* Glass image*/}
            <img 
                src="/images/glass.png" 
                alt="grass effect" 
                className="w-full h-auto object-cover"
            />
        </div>

          {/* Gradient blob below the rectangle */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 1405" className="absolute left-[-39px] top-[389px] w-[1515px] h-[931px] shrink-0 rotate-180" preserveAspectRatio="none">
            <g filter="url(#filter0_f_282_482)">
              <path d="M480.835 354.629C960.227 593.014 748.353 -142.005 1476 679.925C1463.16 908.377 741.932 1437.29 536.479 1000.25C331.026 563.216 172.655 1112 20.7056 679.925C-131.244 247.853 1.44421 116.245 480.835 354.629Z" fill="url(#paint0_linear_282_482)" fillOpacity="0.35"/>
            </g>
            <defs>
              <filter id="filter0_f_282_482" x="-275.839" y="0.161133" width="1988.68" height="1404.68" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                <feGaussianBlur stdDeviation="118.419" result="effect1_foregroundBlur_282_482"/>
              </filter>
              <linearGradient id="paint0_linear_282_482" x1="1476" y1="703.836" x2="-49.1315" y2="492.188" gradientUnits="userSpaceOnUse">
                <stop stopColor="#92FE9D"/>
                <stop offset="1" stopColor="#00C9FF"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Image on Hero Section */}
        <div className="absolute bottom-0 right-0 w-full h-full flex justify-end items-end">
        <img
            src="/images/students.png"
            alt="Graduates celebrating"
            className="h-auto w-[60%] object-contain object-right-bottom"
        />
        </div>



        <div className="relative z-20 mx-auto w-full pl-6 pr-0">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div className="-mt-1">
              <h1 className="text-[40px] font-extrabold tracking-[6px] text-white" style={{ textShadow: '0 4px 4px rgba(0,0,0,0.25)' }}>
                Connect, Ask, Share at Kasetsart University
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/90">
                KU WHY makes it effortless to write notes, post thoughts, and spark
                meaningful conversations across campus.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#share-ways" className="inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-3 text-black hover:bg-white transition">
                  Get Started
                </a>
                <a href="/login" className="inline-flex items-center justify-center rounded-full border border-white/70 px-6 py-3 text-white hover:bg-white/10 transition">
                  Log in
                </a>
              </div>
            </div>
            
            {/* <div className="flex justify-end">
              <div className="w-full max-w-none lg:w-[55%] h-[360px] sm:h-[420px] lg:h-[500px] lg:translate-y-[6px]">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"> */}
                  {/* <defs>
                    <clipPath id="heroClip" clipPathUnits="objectBoundingBox">
                      <rect x="0" y="0" width="1" height="1" rx="0" ry="0" />
                    </clipPath>
                  </defs> */}
                  {/* <image
                    href="/images/herouni.png"
                    x="-10%" y="0" width="110%" height="100%"
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#heroClip)"
                  /> */}
                {/* </svg>
              </div>
            </div> */}
          </div>
        </div>
        {/* Foreground bottom wave overlay to match design */}
        {/* <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden="true">
          <svg viewBox="0 0 1440 220" className="h-[180px] w-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0C301 100 1038 -100 1440 0V220H0V0Z" fill="white"/>
          </svg>
        </div> */}
      </section>

      {/* Two Ways to Share */}
      <section id="share-ways" className="relative isolate overflow-hidden py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Two ways to share
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              Choose how you want to express yourself—quick notes or longer blog posts.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-6 shadow-sm transition hover:shadow-md bg-white">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-black/90 text-white flex items-center justify-center text-lg font-bold">N</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <p className="mt-1 text-gray-600">
                    Share short thoughts, questions, or updates in real time. Perfect for
                    quick ideas and casual conversations.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <a href="/note" className="text-sm font-medium text-black hover:underline">Start a note →</a>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6 shadow-sm transition hover:shadow-md bg-white">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-black/90 text-white flex items-center justify-center text-lg font-bold">B</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Blog posts</h3>
                  <p className="mt-1 text-gray-600">
                    Write longer articles with structure and media. Ideal for guides,
                    reflections, and community highlights.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <a href="#" className="text-sm font-medium text-black hover:underline">Write a post →</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


