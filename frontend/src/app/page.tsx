export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <div className="max-w-4xl w-full text-center">
          <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-8">
            AI CAT DIGITAL TWIN
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-[82px] leading-none tracking-[-2.05px] mb-8">
            Every cat deserves
            <br />a digital identity
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Create a profile for your cat. Track their health and milestones.
            Share their story with friends. Build a living digital twin.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/register"
              className="px-6 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="px-6 py-3 bg-secondary text-secondary-foreground text-sm uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-24 bg-card">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-[2.52px] text-brand-orange mb-4">
            FEATURES
          </p>
          <h2 className="text-4xl md:text-[56px] leading-[0.95] tracking-tight mb-16">
            Three pillars of CatHub
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-background shadow-golden">
              <div className="w-10 h-10 bg-sunshine-300 mb-6 flex items-center justify-center text-xl">
                🐱
              </div>
              <h3 className="text-2xl mb-3">Digital Identity</h3>
              <p className="text-muted-foreground">
                Create a unique profile for your cat with photos, breed info,
                and personality traits. The foundation for their virtual twin.
              </p>
            </div>
            <div className="p-8 bg-background shadow-golden">
              <div className="w-10 h-10 bg-sunshine-300 mb-6 flex items-center justify-center text-xl">
                💊
              </div>
              <h3 className="text-2xl mb-3">Health Tracking</h3>
              <p className="text-muted-foreground">
                Record vaccinations, vet visits, weight changes, and
                medications. Keep a complete health timeline for your cat.
              </p>
            </div>
            <div className="p-8 bg-background shadow-golden">
              <div className="w-10 h-10 bg-sunshine-300 mb-6 flex items-center justify-center text-xl">
                📱
              </div>
              <h3 className="text-2xl mb-3">Social Timeline</h3>
              <p className="text-muted-foreground">
                Share your cat&apos;s stories and milestones with friends. A
                timeline of memories, powered by your community.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
