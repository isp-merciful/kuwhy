export default function LandingPage() {
  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative isolate pt-28 sm:pt-32 min-h-[500px]">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          {/* Rectangle background (original) */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 691" className="h-full w-full" preserveAspectRatio="none">
            <path d="M0 -6H1440V645C1440 645 1038 746.399 669.5 645C301 543.601 0 645 0 645V-6Z" fill="url(#paint0_linear_276_801)" fillOpacity="0.5" />
            <defs>
              <linearGradient id="paint0_linear_276_801" x1="365.5" y1="-138.5" x2="1092" y2="981.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00C9FF" />
                <stop offset="1" stopColor="#92FE9D" />
              </linearGradient>
            </defs>
          </svg>

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
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Connect, Ask, Share at Kasetsart University
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                KU WHY makes it effortless to write notes, post thoughts, and spark
                meaningful conversations across campus.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#share-ways" className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-white hover:bg-gray-800 transition">
                  Get Started
                </a>
                <a href="/login" className="inline-flex items-center justify-center rounded-full border border-black px-6 py-3 text-black hover:bg-gray-100 transition">
                  Log in
                </a>
              </div>
            </div>
            <div className="relative lg:justify-self-end">
              <div className="aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 shadow-sm">

                <img
                src="/images/unihero.png"
                alt="Kasetsart University Hero"
                className="h-full w-full object-cover"
                />

              </div>
            </div>
          </div>
        </div>
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
                <a href="#" className="text-sm font-medium text-black hover:underline">Start a note →</a>
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


