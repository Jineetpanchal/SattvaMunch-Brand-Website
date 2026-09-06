import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { ArrowDown, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import * as THREE from 'three';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();

const docs = [
  { label: 'Brand strategy', href: 'https://drive.google.com/file/d/1dbJJXmg-xaGjjqgFF3ps1UIgVtJJdyvT/view?usp=sharing', type: 'Read PDF' },
  { label: 'Marketing campaign', href: 'https://drive.google.com/file/d/10mqR9b1_ReuTWpES3CR0QO_0VI7eujOJ/view?usp=sharing', type: 'Read PDF' },
  { label: 'Visual identity deck', href: 'https://docs.google.com/presentation/d/1CSgW7fO6mgjr5dXkSHlkvLTVAri0di_W/edit?usp=sharing&ouid=102832170138504550695&rtpof=true&sd=true', type: 'Open deck' },
];

const flavors = [
  { name: 'Smoke & Pepper', origin: 'India-inspired', color: '#4a4a48', copy: 'Smoked paprika, black pepper and amchur. A warm, familiar crackle with a little more edge.', note: 'For the snackers who like a little smoke with their story.' },
  { name: 'Golden Sesame', origin: 'Japan-inspired', color: '#c8a84b', copy: 'Toasted sesame, kinako and a hint of jaggery. Nutty, golden and quietly addictive.', note: 'A softer landing. Still unmistakably crunchy.' },
  { name: 'Pom Rose', origin: 'Middle East-inspired', color: '#c0445a', copy: 'Pomegranate, sumac and dried rose petals. Floral brightness with a tart little wink.', note: 'The one that makes a table feel like a celebration.' },
  { name: 'Truffle Rosemary', origin: 'Italy-inspired', color: '#5c6b4e', copy: 'Truffle, roasted garlic and rosemary. Earthy, savoury and made for long evenings.', note: 'Quiet luxury, one crisp bite at a time.' },
];

const galleryAssets = [
  'carousel-1.png', 'carousel-2.png', 'carousel-3.png', 'carousel-4.png', 'carousel-5.png',
  'carousel-6.png', 'carousel-7.png', 'logo-mark.png', 'carousel-5.png', 'carousel-4.png',
];

const galleryCaptions = ['The passport', 'Not boring', 'Rooted in India', 'One seed, four worlds', 'Nourishing, never boring', 'Healthy, with feeling', 'Four flavors', 'The mark', 'Clean ingredients', 'The full journey'];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let frame = 0;
    let raf = 0;
    const particles = Array.from({ length: 32 }, (_, index) => ({
      x: (index * 83) % 600,
      y: (index * 47) % 460,
      r: (index % 3) + 1,
      speed: 0.15 + (index % 4) * 0.06,
    }));
    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.scale(ratio, ratio);
      }
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(Math.sin(frame / 1500) * 0.015);
      context.strokeStyle = 'rgba(200,168,75,.36)';
      context.setLineDash([2, 7]);
      for (let orbit = 0; orbit < 3; orbit += 1) {
        context.beginPath();
        context.ellipse(0, 0, width * (.29 + orbit * .09), height * (.11 + orbit * .08), orbit * .65, 0, Math.PI * 2);
        context.stroke();
      }
      context.restore();
      particles.forEach((particle, index) => {
        const x = (particle.x + frame * particle.speed) % width;
        const y = particle.y + Math.sin(frame / 800 + index) * 8;
        context.fillStyle = index % 5 === 0 ? 'rgba(59,35,20,.55)' : 'rgba(232,146,42,.66)';
        context.beginPath();
        context.arc(x, y, particle.r, 0, Math.PI * 2);
        context.fill();
      });
      frame += 1;
      raf = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(raf);
  }, []);
  return <canvas className="hero-canvas" ref={ref} aria-label="A gently orbiting seed and particle field" />;
}

const MAKHANA_MODEL_URL = '/models/sample.glb';

function RoastedMakhanaModel() {
  const { scene } = useGLTF(MAKHANA_MODEL_URL);
  const normalizedModel = useMemo(() => {
    const model = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 2.55 / Math.max(size.x, size.y, size.z);

    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughness = Math.max(material.roughness, 0.78);
          material.metalness = 0;
          material.envMapIntensity = 0.25;
        }
      });
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return model;
  }, [scene]);

  return <primitive object={normalizedModel} />;
}

function ModelFallback() {
  return (
    <mesh position={[0, 0.62, 0]} scale={[1.18, 0.84, 1]}>
      <icosahedronGeometry args={[0.9, 2]} />
      <meshStandardMaterial color="#ead7b0" roughness={0.92} metalness={0} />
    </mesh>
  );
}

function HeroModelScene() {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined;
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  useFrame(({ camera, clock }) => {
    const elapsed = clock.getElapsedTime();
    const entrance = Math.min(elapsed / 1.35, 1);
    const easedEntrance = 1 - Math.pow(1 - entrance, 3);
    camera.position.z = THREE.MathUtils.lerp(5.8, 4.25, easedEntrance);
    camera.position.y = THREE.MathUtils.lerp(0.35, 0.16, easedEntrance);
    camera.lookAt(0, 0.72, 0);

    if (!group.current) return;
    group.current.rotation.y = elapsed * 0.28;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      Math.sin(elapsed * 0.55) * 0.035 - pointer.current.y * 0.045,
      0.06,
    );
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, pointer.current.x * 0.04, 0.06);
    group.current.position.y = Math.sin(elapsed * 0.8) * 0.06;
  });

  return (
    <>
      <group ref={group}>
        <Suspense fallback={<ModelFallback />}>
          <RoastedMakhanaModel />
        </Suspense>
      </group>
      <ContactShadows
        position={[0, -0.015, 0]}
        scale={[1.65, 0.9]}
        opacity={0.18}
        blur={2.8}
        far={0.55}
        color="#3b2314"
        depthWrite={false}
      />
    </>
  );
}

useGLTF.preload(MAKHANA_MODEL_URL);

function canUseWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function StaticMakhanaFallback() {
  return (
    <div className="hero-static-model" aria-label="A softly animated roasted makhana model fallback">
      <span className="static-makhana-shadow" />
      <span className="static-makhana-object">
        <span className="static-lobe static-lobe-a" />
        <span className="static-lobe static-lobe-b" />
        <span className="static-lobe static-lobe-c" />
        <span className="static-lobe static-lobe-d" />
        <span className="static-lobe static-lobe-e" />
        <span className="static-lobe static-lobe-f" />
        <span className="static-lobe static-lobe-g" />
        <span className="static-speck static-speck-a" />
        <span className="static-speck static-speck-b" />
        <span className="static-speck static-speck-c" />
        <span className="static-speck static-speck-d" />
        <span className="static-speck static-speck-e" />
      </span>
    </div>
  );
}

function HeroModelCanvas() {
  const [webglAvailable] = useState(canUseWebGL);
  if (!webglAvailable) return <StaticMakhanaFallback />;

  return (
    <div className="hero-model-canvas" aria-label="A slowly rotating roasted makhana 3D model">
      <Canvas
        camera={{ position: [0, 0.35, 5.8], fov: 28, near: 0.1, far: 20 }}
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        shadows
        fallback={<StaticMakhanaFallback />}
      >
        <ambientLight intensity={1.5} color="#fff8ea" />
        <directionalLight
          castShadow
          color="#fff4dc"
          intensity={2.1}
          position={[-3.5, 5, 4]}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight color="#e8b56b" intensity={0.28} position={[4, 1.5, -2]} />
        <HeroModelScene />
      </Canvas>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };
  return (
    <header className={`site-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <button type="button" className="nav-logo-button" onClick={() => go('top')} aria-label="Back to top" data-testid="button-nav-home">
          <img className="nav-logo" src="/assets/logo-landscape.png" alt="SattvaMunch — ancient grain, modern palate" />
        </button>
        <nav className={`nav-links ${open ? 'mobile-open' : ''}`} aria-label="Primary navigation">
          <button type="button" className="nav-link" onClick={() => go('story')} data-testid="link-nav-story">The grain</button>
          <button type="button" className="nav-link" onClick={() => go('flavors')} data-testid="link-nav-flavors">Flavors</button>
          <button type="button" className="nav-link" onClick={() => go('passport')} data-testid="link-nav-passport">Passport</button>
          <button type="button" className="nav-link" onClick={() => go('documents')} data-testid="link-nav-studio">Studio</button>
        </nav>
        <button type="button" className="nav-cta" onClick={() => go('flavors')} data-testid="button-nav-explore">Explore flavors <ArrowRight size={14} /></button>
        <button type="button" className="menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle navigation" data-testid="button-nav-menu">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">100% certified organic · India</span>
          <h1 className="display hero-title" id="hero-title">Ancient grain.<br /><em>Modern palate.</em></h1>
          <p className="hero-sub">Makhana, roasted into a snack with a passport. Four bright, unexpected flavors — rooted in India, ready for everywhere.</p>
          <div className="hero-actions">
            <button type="button" className="button-dark" onClick={() => scrollToId('flavors')} data-testid="button-hero-flavors">Find your flavor <ArrowRight size={14} /></button>
            <button type="button" className="outline-button" onClick={() => scrollToId('story')} data-testid="button-hero-story">Meet the seed</button>
          </div>
        </div>
        <div className="hero-aside">
          <HeroCanvas />
          <HeroModelCanvas />
          <div className="hero-orbit" aria-hidden="true">
            <span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" />
          </div>
          <div className="hero-stamp">100%<br />certified<br />organic</div>
          <p className="hero-note">One Indian seed.<br />A world of appetite.</p>
        </div>
      </div>
      <div className="wrap hero-scroll"><span /> Scroll to wander <ArrowDown size={13} /></div>
    </section>
  );
}

function Ticker() {
  const items = ['Roasted, never fried', 'No preservatives', 'Plant-based goodness', 'Rooted in India', 'Real ingredients', 'Four flavors, one honest promise'];
  return <div className="ticker" aria-label="SattvaMunch principles"><div className="ticker-track">{[...items, ...items].map((item, index) => <span className="ticker-item" key={`${item}-${index}`}><i>✦</i>{item}</span>)}</div></div>;
}

function Story() {
  return (
    <section className="story" id="story" aria-labelledby="story-title">
      <div className="wrap story-grid">
        <div>
          <span className="section-label">The quiet superfood</span>
          <h2 className="display story-title" id="story-title">Meet India&apos;s <span>quiet</span> superfood.</h2>
          <p className="story-lede">Makhana is a lotus seed rooted in India&apos;s wetlands and Ayurvedic food traditions — roasted for generations long before “superfood” became a category.</p>
        </div>
        <div className="story-aside">
          <p>We kept the seed honest.<br /><em>We just gave it somewhere to go.</em></p>
        </div>
      </div>
      <div className="wrap seed-diagram" aria-label="A makhana seed sits at the center of four flavor worlds">
        <div className="seed-orbit" /><div className="seed-orbit orbit-two" /><div className="seed-core" />
        <p className="seed-caption">from wetland<br />to world table<br /><span className="eyebrow">the full chain</span></p>
      </div>
    </section>
  );
}

function Chain() {
  const steps = [
    ['01', 'The wetlands', 'Grown in India’s rich, slow-moving wetlands — where patience is part of the crop.', '○'],
    ['02', 'The harvest', 'Hand-gathered, sun-dried, and selected for that unmistakable lightness.', '◌'],
    ['03', 'The roast', 'Low and slow. Never fried. Every batch gets the time it deserves.', '◒'],
    ['04', 'The journey', 'Finished with real spices and sent out into a much bigger world.', '↗'],
  ];
  return (
    <section className="chain" aria-labelledby="chain-title">
      <div className="wrap">
        <div className="chain-head">
          <div><span className="eyebrow">From soil to story</span><h2 className="display chain-title" id="chain-title">Good snacks have a <em>longer</em> story.</h2></div>
          <p className="chain-intro">Our full-chain difference starts with respect for the seed — and ends with a crunch you can feel good about.</p>
        </div>
        <div className="chain-row">
          {steps.map(([number, title, copy, glyph]) => <article className="chain-step" key={number}><span className="chain-number">{number}</span><span className="chain-glyph">{glyph}</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </div>
    </section>
  );
}

function FlavorExplorer() {
  const [selected, setSelected] = useState(0);
  const flavor = flavors[selected];
  return (
    <section className="flavors" id="flavors" aria-labelledby="flavor-title">
      <div className="wrap">
        <div className="flavor-top">
          <div><span className="section-label">Four ways to wander</span><h2 className="display flavor-title" id="flavor-title">Same seed.<br /><em>More possibility.</em></h2></div>
          <p className="flavor-copy">One ancient Indian seed. Four very different places to take your palate. Select a flavor to start your journey.</p>
        </div>
        <div className="flavor-explorer">
          <div className="flavor-visual" style={{ background: `radial-gradient(circle at 53% 46%, ${flavor.color}18, #e9d8bd 70%)` }}>
            <div className="flavor-seed" style={{ boxShadow: `14px 23px 22px ${flavor.color}30` }} />
            <span className="flavor-label" style={{ color: flavor.color }}>Flavor {String(selected + 1).padStart(2, '0')} / India to everywhere</span>
          </div>
          <div className="flavor-info">
            <div className="flavor-tabs" role="tablist" aria-label="Explore four flavors">
              {flavors.map((item, index) => <button type="button" role="tab" aria-selected={selected === index} className={`flavor-tab ${selected === index ? 'active' : ''}`} style={selected === index ? { borderColor: item.color } : undefined} onClick={() => setSelected(index)} key={item.name} data-testid={`button-flavor-${index}`}>{item.name}</button>)}
            </div>
            <span className="flavor-origin" style={{ color: flavor.color }}>{flavor.origin}</span>
            <h3 className="display">{flavor.name.split(' & ')[0]}{flavor.name.includes(' & ') && <><br /><em>& {flavor.name.split(' & ')[1]}</em></>}</h3>
            <p>{flavor.copy}</p>
            <p className="flavor-note">{flavor.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Passport() {
  return (
    <section className="passport" id="passport" aria-labelledby="passport-title">
      <div className="wrap passport-grid">
        <div>
          <span className="eyebrow">The Seed&apos;s Passport</span>
          <h2 className="display passport-title" id="passport-title">One seed.<br /><em>Four worlds.</em></h2>
          <p className="passport-copy">What if your next snack had a passport? We kept the makhana rooted in India — and let the flavor travel. A campaign for curious eaters and small, joyful departures.</p>
          <div className="passport-links">
            <a className="passport-link" href={docs[1].href} target="_blank" rel="noreferrer" data-testid="link-passport-campaign">See campaign <ArrowUpRight size={13} /></a>
            <button type="button" className="passport-link" onClick={() => scrollToId('carousel')} data-testid="button-passport-slides">Browse the slides <ArrowRight size={13} /></button>
          </div>
        </div>
        <div className="passport-art" aria-hidden="true">
          <div className="passport-card"><span className="display">The seed<br /><em>has places<br />to be.</em></span><div className="passport-card-bottom"><span>SV / 001</span><span>India → everywhere</span></div></div>
          <div className="passport-orbit" />
        </div>
      </div>
    </section>
  );
}

function CampaignCarousel() {
  const [slide, setSlide] = useState(0);
  const visible = 3;
  const max = galleryAssets.length - visible;
  return (
    <section className="campaign" id="carousel" aria-labelledby="campaign-title">
      <div className="wrap">
        <div className="campaign-head">
          <div><span className="section-label">Campaign field notes</span><h2 className="display campaign-title" id="campaign-title">A snack with a <em>point of view.</em></h2></div>
          <div className="campaign-control">
            <button type="button" className="carousel-button" aria-label="Previous slide" onClick={() => setSlide(Math.max(0, slide - 1))} data-testid="button-carousel-prev"><ChevronLeft size={18} /></button>
            <button type="button" className="carousel-button" aria-label="Next slide" onClick={() => setSlide(Math.min(max, slide + 1))} data-testid="button-carousel-next"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="carousel-window">
          <div className="carousel-track" style={{ transform: `translateX(calc(-${slide} * (min(320px, 72vw) + 18px)))` }}>
            {Array.from({ length: 7 }, (_, index) => <figure className="carousel-slide" key={index}><img src={`/assets/carousel-${index + 1}.png`} alt={`SattvaMunch campaign slide ${index + 1}`} /><figcaption className="campaign-meta"><span>Slide {String(index + 1).padStart(2, '0')}</span><span>The seed&apos;s passport</span></figcaption></figure>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Documents() {
  return (
    <section className="documents" id="documents" aria-labelledby="documents-title">
      <div className="wrap documents-grid">
        <div><span className="eyebrow">Open studio</span><h2 className="display" id="documents-title">The thinking<br />behind the crunch.</h2></div>
        <div className="document-list">
          {docs.map((doc) => <a className="document-item" href={doc.href} target="_blank" rel="noreferrer" key={doc.label} data-testid={`link-document-${doc.label.toLowerCase().replaceAll(' ', '-')}`}><p>{doc.label}</p><span>{doc.type} <ArrowUpRight size={13} /></span></a>)}
        </div>
      </div>
    </section>
  );
}

function VisualGallery() {
  return (
    <section className="showcase" aria-labelledby="gallery-title">
      <div className="wrap">
        <span className="section-label">Visual gallery</span>
        <h2 className="display" id="gallery-title" style={{ fontSize: 'clamp(44px, 5vw, 70px)', lineHeight: '.92', margin: '18px 0 0' }}>A little texture<br /><em>goes a long way.</em></h2>
        <div className="showcase-grid">
          {galleryAssets.map((asset, index) => <figure className="gallery-cell" key={`${asset}-${index}`}><img src={`/assets/${asset}`} alt={galleryCaptions[index]} loading="lazy" /><figcaption>{galleryCaptions[index]}</figcaption></figure>)}
        </div>
      </div>
    </section>
  );
}

function BrandFilm() {
  return (
    <section className="film" aria-labelledby="film-title">
      <div className="wrap film-card">
        <div className="film-card-content">
          <span className="eyebrow">Coming soon · 01:24</span>
          <h2 className="display" id="film-title">The sound of<br /><em>a good crunch.</em></h2>
          <p>A quiet film about wetlands, spice, and the small moment when a snack changes the direction of an afternoon.</p>
          <button type="button" className="disabled-button" disabled data-testid="button-brand-film">Brand film in edit</button>
        </div>
      </div>
    </section>
  );
}

function Deck() {
  const investorDeck = 'https://docs.google.com/presentation/d/1CSgW7fO6mgjr5dXkSHlkvLTVAri0di_W/edit?usp=sharing&ouid=102832170138504550695&rtpof=true&sd=true';
  return (
    <section className="deck" aria-labelledby="deck-title">
      <div className="wrap deck-box">
        <div><span className="eyebrow">For good people with good questions</span><h2 className="display" id="deck-title">Building the next<br /><em>honest snack.</em></h2></div>
        <div><p>Our investor story is taking shape. Until then, come taste the point of view.</p><a className="button-dark" href={investorDeck} target="_blank" rel="noreferrer" data-testid="link-investor-deck">Open investor deck <ArrowUpRight size={14} /></a></div>
      </div>
    </section>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus('A valid email, please.');
      return;
    }
    setStatus('You are on the list. Welcome to the journey.');
    setEmail('');
  };
  return (
    <footer className="footer" id="contact">
      <div className="wrap footer-grid">
        <div><img className="footer-logo" src="/assets/logo-landscape.png" alt="SattvaMunch" /><p className="footer-tagline">Ancient grain, modern palate.<br />A little more wonder in every handful.</p></div>
        <div><h3>Explore</h3><nav className="footer-links" aria-label="Footer navigation"><button type="button" onClick={() => scrollToId('story')} data-testid="link-footer-grain">The grain</button><button type="button" onClick={() => scrollToId('flavors')} data-testid="link-footer-flavors">Flavors</button><button type="button" onClick={() => scrollToId('passport')} data-testid="link-footer-passport">The Seed&apos;s Passport</button><button type="button" onClick={() => scrollToId('documents')} data-testid="link-footer-studio">Open studio</button></nav></div>
        <div><h3>Stay curious</h3><p style={{ color: 'rgba(245,239,224,.67)', fontSize: 14, margin: '0 0 12px', maxWidth: 260 }}>Occasional notes from the road. No noise, just good things to crunch on.</p><form className="newsletter" onSubmit={submit}><input aria-label="Email address" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-newsletter-email" /><button aria-label="Join the list" type="submit" data-testid="button-newsletter-submit"><ArrowRight size={17} /></button></form><div className="newsletter-status" aria-live="polite">{status}</div></div>
      </div>
      <div className="wrap footer-bottom"><span>© 2025 SattvaMunch Foods</span><span>100% certified organic · Made in India · Made for everywhere</span></div>
    </footer>
  );
}

function Home() {
  return <div className="site-shell"><Nav /><main><Hero /><Ticker /><Story /><Chain /><FlavorExplorer /><Passport /><CampaignCarousel /><Documents /><VisualGallery /><BrandFilm /><Deck /></main><Footer /></div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><ErrorBoundary><Home /></ErrorBoundary><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;