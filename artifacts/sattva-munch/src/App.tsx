import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
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

interface GalleryItem {
  title: string;
  subtitle?: string;
  src?: string;
}

const galleryItems: GalleryItem[] = [
  { title: 'Brand Hero', src: '/assets/gallery-01-brand-hero.png' },
  { title: 'Product Hero', src: '/assets/gallery-02-product-hero.png' },
  { title: 'Signature Campaign Poster', src: '/assets/gallery-03-campaign-poster.png' },
  { title: 'Lifestyle Visual', src: '/assets/gallery-04-lifestyle.png' },
  { title: 'Product Detail', src: '/assets/gallery-05-product-detail.png' },
  { title: 'Social Advertisement', src: '/assets/gallery-06-social-ad.png' },
  { title: 'Website Hero', src: '/assets/gallery-07-website-hero.png' },
  { title: 'Investor Pitch-Deck Hero', subtitle: 'Alternate Packaging Concept', src: '/assets/gallery-08-investor-hero.png' },
  { title: '3D Product Render', src: '/assets/gallery-09-3d-render.png' },
  { title: 'Campaign Key Visual', src: '/assets/gallery-10-campaign-key-visual.png' },
];

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

const MAKHANA_MODEL_URL = '/makhana-real.glb';

function RoastedMakhanaModel() {
  const { scene } = useGLTF(MAKHANA_MODEL_URL);
  const normalizedModel = useMemo(() => {
    const model = scene.clone(true);

    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
          material.roughness = Math.max(material.roughness, 0.82);
          material.metalness = 0;
          if (material.map) {
            material.map.anisotropy = 8;
          }
        }
      });
      child.castShadow = false;
      child.receiveShadow = false;
    });

    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    // Scale to fill the dashed square marked area in the Hero section
    const scale = 1.9 / maxDim;

    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    return model;
  }, [scene]);

  return <primitive object={normalizedModel} />;
}

function ModelFallback() {
  return (
    <mesh position={[0, 0, 0]} scale={[1, 0.8, 1]}>
      <icosahedronGeometry args={[0.8, 2]} />
      <meshStandardMaterial color="#ead7b0" roughness={0.92} metalness={0} />
    </mesh>
  );
}

function HeroModelScene() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!group.current) return;
    // Continuous steady vertical (Y-axis) rotation at moderate, pleasant speed (~14s full revolution)
    group.current.rotation.y += delta * 0.45;
  });

  return (
    <group ref={group} position={[0, 0, 0]} rotation={[0.08, 0, 0]}>
      <Suspense fallback={<ModelFallback />}>
        <RoastedMakhanaModel />
      </Suspense>
    </group>
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
      <span className="hero-makhana-shadow" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0.1, 4.5], fov: 28, near: 0.1, far: 20 }}
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        fallback={<StaticMakhanaFallback />}
      >
        <ambientLight intensity={1.65} color="#fff8ea" />
        <directionalLight
          color="#fff4dc"
          intensity={2.2}
          position={[-3.5, 5, 4]}
        />
        <directionalLight color="#e8b56b" intensity={0.32} position={[4, 1.5, -2]} />
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

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        scrollToId('top');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <header
        className={`site-nav ${scrolled ? 'scrolled' : ''}`}
        onClick={(e) => {
          if (open && (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('nav-inner'))) {
            setOpen(false);
            scrollToId('top');
          }
        }}
      >
        <div className="wrap nav-inner">
          <button type="button" className="nav-logo-button" onClick={() => go('top')} aria-label="Back to top" data-testid="button-nav-home">
            <img className="nav-logo" src="/assets/logo-landscape.png" alt="SattvaMunch — ancient grain, modern palate" />
          </button>
          <nav className={`nav-links ${open ? 'mobile-open' : ''}`} id="primary-navigation" aria-label="Primary navigation">
            <button type="button" className="nav-link" onClick={() => go('story')} data-testid="link-nav-story">The Grain</button>
            <button type="button" className="nav-link" onClick={() => go('flavors')} data-testid="link-nav-flavors">Flavours</button>
            <button type="button" className="nav-link" onClick={() => go('passport')} data-testid="link-nav-passport">Passport</button>
            <button type="button" className="nav-link" onClick={() => go('documents')} data-testid="link-nav-studio">Studio</button>
          </nav>
          <button type="button" className="nav-cta" onClick={() => go('flavors')} data-testid="button-nav-explore">Explore flavors <ArrowRight size={14} /></button>
          <button
            type="button"
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close options menu' : 'Open options menu'}
            aria-expanded={open}
            aria-controls="primary-navigation"
            data-testid="button-nav-menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {open && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => {
            setOpen(false);
            scrollToId('top');
          }}
          aria-hidden="true"
        />
      )}
    </>
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

function StoryStaticModelScene() {
  return (
    <group rotation={[0.2, -0.55, 0.08]} position={[0, 0, 0]}>
      <Suspense fallback={null}>
        <RoastedMakhanaModel />
      </Suspense>
    </group>
  );
}

function StoryStaticMakhana() {
  const [webglAvailable] = useState(canUseWebGL);
  if (!webglAvailable) return <div className="seed-core" />;

  return (
    <div className="seed-model-stage" aria-label="A roasted makhana seed at the center of the grain diagram">
      <span className="story-makhana-shadow" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 28, near: 0.1, far: 20 }}
        dpr={[1, 1.6]}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        frameloop="demand"
      >
        <ambientLight intensity={1.7} color="#fff8ea" />
        <directionalLight color="#fff4dc" intensity={2.2} position={[-3, 4, 3]} />
        <directionalLight color="#e8b56b" intensity={0.35} position={[3, 1, -2]} />
        <StoryStaticModelScene />
      </Canvas>
    </div>
  );
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
        <div className="seed-orbit" /><div className="seed-orbit orbit-two" />
        <StoryStaticMakhana />
        <p className="seed-caption">from wetland<br />to world table<br /><span className="eyebrow">the full chain</span></p>
      </div>
    </section>
  );
}

function Chain() {
  const steps = [
    { title: 'The wetlands', copy: 'Grown in India’s rich, slow-moving wetlands — where patience is part of the crop.' },
    { title: 'The harvest', copy: 'Hand-gathered, sun-dried, and selected for that unmistakable lightness.' },
    { title: 'The roast', copy: 'Low and slow. Never fried. Every batch gets the time it deserves.' },
    { title: 'The journey', copy: 'Finished with real spices and sent out into a much bigger world.' },
  ];
  return (
    <section className="chain" aria-labelledby="chain-title">
      <div className="chain-layout">
        <div className="chain-strip" aria-hidden="true">
          <img
            src="/assets/gallery-02-product-hero.png"
            alt=""
            className="chain-strip-img"
            loading="lazy"
          />
        </div>
        <div className="chain-content">
          <div className="chain-head">
            <div>
              <span className="eyebrow">From soil to story</span>
              <h2 className="display chain-title" id="chain-title">Good snacks have a <em>longer</em> story.</h2>
            </div>
            <p className="chain-intro">Our full-chain difference starts with respect for the seed — and ends with a crunch you can feel good about.</p>
          </div>
          <div className="chain-row">
            {steps.map((step) => (
              <article className="chain-step" key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FlavorExplorer() {
  const [selected, setSelected] = useState(0);
  const flavor = flavors[selected];
  const isSmokeAndPepper = flavor.name === 'Smoke & Pepper';
  const isGoldenSesame = flavor.name === 'Golden Sesame';
  const isPomRose = flavor.name === 'Pom Rose';
  const isTruffleRosemary = flavor.name === 'Truffle Rosemary';
  const hasProductImage = isSmokeAndPepper || isGoldenSesame || isPomRose || isTruffleRosemary;

  return (
    <section className="flavors" id="flavors" aria-labelledby="flavor-title">
      <div className="wrap">
        <div className="flavor-top">
          <div><span className="section-label">Four ways to wander</span><h2 className="display flavor-title" id="flavor-title">Same seed.<br /><em>More possibility.</em></h2></div>
          <p className="flavor-copy">One ancient Indian seed. Four very different places to take your palate. Select a flavor to start your journey.</p>
        </div>
        <div className="flavor-explorer">
          <div
            className={`flavor-visual ${hasProductImage ? 'has-product-image' : ''}`}
            style={hasProductImage ? undefined : { background: `radial-gradient(circle at 53% 46%, ${flavor.color}18, #e9d8bd 70%)` }}
          >
            {isSmokeAndPepper && (
              <img
                id="flavor-product-smoke-pepper"
                className="flavor-product-image"
                src="/assets/F-1.png"
                alt="SattvaMunch Smoke & Pepper roasted makhana 25g jar, 50g pouch, and 100g pouch"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbacks = [
                    '/F-1.png',
                    '/assets/F-1.png',
                    '/attached_assets/F-1.png',
                  ];
                  const currentSrc = decodeURIComponent(new URL(target.src, window.location.origin).pathname);
                  const nextSrc = fallbacks.find((s) => s !== currentSrc);
                  if (nextSrc && target.dataset.tried !== nextSrc) {
                    target.dataset.tried = nextSrc;
                    target.src = nextSrc;
                  }
                }}
              />
            )}
            {isGoldenSesame && (
              <img
                id="flavor-product-golden-sesame"
                className="flavor-product-image"
                src="/assets/F-2.png"
                alt="SattvaMunch Golden Sesame roasted makhana 25g jar, 50g pouch, and 100g pouch"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbacks = [
                    '/F-2.png',
                    '/assets/F-2.png',
                    '/attached_assets/F-2.png',
                  ];
                  const currentSrc = decodeURIComponent(new URL(target.src, window.location.origin).pathname);
                  const nextSrc = fallbacks.find((s) => s !== currentSrc);
                  if (nextSrc && target.dataset.tried !== nextSrc) {
                    target.dataset.tried = nextSrc;
                    target.src = nextSrc;
                  }
                }}
              />
            )}
            {isPomRose && (
              <img
                id="flavor-product-pom-rose"
                className="flavor-product-image"
                src="/assets/F-3.png"
                alt="SattvaMunch Pom Rose roasted makhana 25g jar, 50g pouch, and 100g pouch"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbacks = [
                    '/F-3.png',
                    '/assets/F-3.png',
                    '/attached_assets/F-3.png',
                  ];
                  const currentSrc = decodeURIComponent(new URL(target.src, window.location.origin).pathname);
                  const nextSrc = fallbacks.find((s) => s !== currentSrc);
                  if (nextSrc && target.dataset.tried !== nextSrc) {
                    target.dataset.tried = nextSrc;
                    target.src = nextSrc;
                  }
                }}
              />
            )}
            {isTruffleRosemary && (
              <img
                id="flavor-product-truffle-rosemary"
                className="flavor-product-image"
                src="/assets/F-4.png"
                alt="SattvaMunch Truffle Rosemary roasted makhana 25g jar, 50g pouch, and 100g pouch"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallbacks = [
                    '/F-4.png',
                    '/assets/F-4.png',
                    '/attached_assets/F-4.png',
                  ];
                  const currentSrc = decodeURIComponent(new URL(target.src, window.location.origin).pathname);
                  const nextSrc = fallbacks.find((s) => s !== currentSrc);
                  if (nextSrc && target.dataset.tried !== nextSrc) {
                    target.dataset.tried = nextSrc;
                    target.src = nextSrc;
                  }
                }}
              />
            )}
            {!hasProductImage && (
              <div className="flavor-seed" style={{ boxShadow: `14px 23px 22px ${flavor.color}30` }} />
            )}
            <span className="flavor-label" style={{ color: hasProductImage ? 'var(--warm-ivory)' : flavor.color }}>
              {isSmokeAndPepper
                ? '01 / Old Delhi heat, one honest crunch'
                : isGoldenSesame
                ? '02 / Kyoto calm, one toasted crunch'
                : isPomRose
                ? '03 / Beirut bright, one tangy crunch'
                : isTruffleRosemary
                ? '04 / Umbria quiet, one earthy crunch'
                : `Flavor ${String(selected + 1).padStart(2, '0')} / India to everywhere`}
            </span>
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
      <div className="passport-layout">
        <div className="passport-strip" aria-hidden="true">
          <img
            src="/assets/gallery-05-product-detail.png"
            alt=""
            className="passport-strip-img"
            loading="lazy"
          />
        </div>
        <div className="passport-content">
          <div className="passport-grid">
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
        </div>
      </div>
    </section>
  );
}

function CampaignCarousel() {
  const [slide, setSlide] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isLightboxOpenRef = useRef(false);
  const isManualInteractingRef = useRef(false);
  const manualTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const totalSlides = 7;
  const visible = 3;
  const max = totalSlides - visible;

  const isLightboxOpen = lightboxIndex !== null;

  // Listen for reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Sync lightbox open state to ref for animation loop
  useEffect(() => {
    isLightboxOpenRef.current = isLightboxOpen;
  }, [isLightboxOpen]);

  // Measure slide step and single set width dynamically
  const getMetrics = () => {
    if (!trackRef.current) return { slideStep: 338, singleSetWidth: 338 * totalSlides };
    const firstSlide = trackRef.current.querySelector('.carousel-slide') as HTMLElement;
    const slideWidth = firstSlide ? firstSlide.getBoundingClientRect().width : 320;
    const style = window.getComputedStyle(trackRef.current);
    const gap = parseFloat(style.gap) || 18;
    const slideStep = slideWidth + gap;
    return { slideStep, singleSetWidth: slideStep * totalSlides };
  };

  // Initialize offset at set 1 (middle duplicate set) for seamless infinite scrolling in both directions
  useEffect(() => {
    if (reducedMotion || !trackRef.current) return;
    const { singleSetWidth } = getMetrics();
    if (singleSetWidth > 0) {
      offsetRef.current = singleSetWidth;
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
    }
  }, [reducedMotion]);

  // Handle window resize gracefully
  useEffect(() => {
    const handleResize = () => {
      if (reducedMotion || !trackRef.current) return;
      const { singleSetWidth } = getMetrics();
      if (singleSetWidth > 0) {
        while (offsetRef.current < singleSetWidth) {
          offsetRef.current += singleSetWidth;
        }
        while (offsetRef.current >= 2 * singleSetWidth) {
          offsetRef.current -= singleSetWidth;
        }
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [reducedMotion]);

  // Continuous passive auto-scroll marquee loop
  useEffect(() => {
    if (reducedMotion) return;

    const animate = (time: number) => {
      if (lastTimeRef.current !== null) {
        const delta = Math.min(time - lastTimeRef.current, 100);
        const pixelsPerMs = 0.04; // ~40px per second - gentle, calm passive drift

        if (
          !isHoveredRef.current &&
          !isLightboxOpenRef.current &&
          !isManualInteractingRef.current &&
          trackRef.current
        ) {
          const { singleSetWidth } = getMetrics();
          if (singleSetWidth > 0) {
            if (offsetRef.current === 0) {
              offsetRef.current = singleSetWidth;
            }
            offsetRef.current += pixelsPerMs * delta;

            // Seamless infinite loop: wrap cleanly back to set 1
            if (offsetRef.current >= 2 * singleSetWidth) {
              offsetRef.current -= singleSetWidth;
            }

            trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
          }
        }
      }

      lastTimeRef.current = time;
      rafIdRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = null;
    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    };
  }, [reducedMotion]);

  // Hover handlers for stopping motion immediately
  const handleMouseEnter = () => {
    isHoveredRef.current = true;
  };
  const handleMouseLeave = () => {
    isHoveredRef.current = false;
  };
  const handleTouchStart = () => {
    isHoveredRef.current = true;
  };
  const handleTouchEnd = () => {
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);
    manualTimerRef.current = setTimeout(() => {
      isHoveredRef.current = false;
    }, 2000);
  };

  // Manual next button: snaps forward by 1 slide and temporarily pauses auto-drift for 4 seconds
  const handleNext = () => {
    if (reducedMotion) {
      setSlide((prev) => Math.min(max, prev + 1));
      return;
    }
    isManualInteractingRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);

    const { slideStep, singleSetWidth } = getMetrics();
    if (!trackRef.current || slideStep === 0) return;

    const currentSlideIndex = Math.floor(offsetRef.current / slideStep);
    const targetOffset = (currentSlideIndex + 1) * slideStep;

    trackRef.current.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    trackRef.current.style.transform = `translate3d(-${targetOffset}px, 0, 0)`;
    offsetRef.current = targetOffset;

    setTimeout(() => {
      if (!trackRef.current) return;
      trackRef.current.style.transition = 'none';
      if (offsetRef.current >= 2 * singleSetWidth) {
        offsetRef.current -= singleSetWidth;
        trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
    }, 500);

    manualTimerRef.current = setTimeout(() => {
      isManualInteractingRef.current = false;
    }, 4000);
  };

  // Manual prev button: snaps backward by 1 slide and temporarily pauses auto-drift for 4 seconds
  const handlePrev = () => {
    if (reducedMotion) {
      setSlide((prev) => Math.max(0, prev - 1));
      return;
    }
    isManualInteractingRef.current = true;
    if (manualTimerRef.current) clearTimeout(manualTimerRef.current);

    const { slideStep, singleSetWidth } = getMetrics();
    if (!trackRef.current || slideStep === 0) return;

    if (offsetRef.current < singleSetWidth) {
      offsetRef.current += singleSetWidth;
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      void trackRef.current.offsetWidth;
    }

    const currentSlideIndex = Math.ceil(offsetRef.current / slideStep);
    const targetOffset = (currentSlideIndex - 1) * slideStep;

    trackRef.current.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
    trackRef.current.style.transform = `translate3d(-${targetOffset}px, 0, 0)`;
    offsetRef.current = targetOffset;

    setTimeout(() => {
      if (!trackRef.current) return;
      trackRef.current.style.transition = 'none';
    }, 500);

    manualTimerRef.current = setTimeout(() => {
      isManualInteractingRef.current = false;
    }, 4000);
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null && prev < totalSlides - 1 ? prev + 1 : prev));
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, totalSlides]);

  const slideCount = reducedMotion ? totalSlides : totalSlides * 3;

  return (
    <section className="campaign" id="carousel" aria-labelledby="campaign-title">
      <div className="wrap">
        <div className="campaign-head">
          <div>
            <span className="section-label">Passport Pages</span>
            <h2 className="display campaign-title" id="campaign-title">A snack with a <em>point of view.</em></h2>
          </div>
          <div
            className="campaign-control"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className="carousel-button"
              aria-label="Previous slide"
              disabled={reducedMotion ? slide === 0 : false}
              onClick={handlePrev}
              data-testid="button-carousel-prev"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="carousel-button"
              aria-label="Next slide"
              disabled={reducedMotion ? slide >= max : false}
              onClick={handleNext}
              data-testid="button-carousel-next"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div
          className="carousel-window"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            className={`carousel-track ${!reducedMotion ? 'marquee-active' : ''}`}
            style={reducedMotion ? { transform: `translateX(calc(-${slide} * (min(320px, 72vw) + 18px)))` } : undefined}
          >
            {Array.from({ length: slideCount }, (_, index) => {
              const realIndex = index % totalSlides;
              return (
                <figure
                  className="carousel-slide clickable"
                  key={index}
                  onClick={() => setLightboxIndex(realIndex)}
                  onFocus={handleMouseEnter}
                  onBlur={handleMouseLeave}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open campaign slide ${realIndex + 1} in fullscreen lightbox`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setLightboxIndex(realIndex);
                    }
                  }}
                >
                  <img
                    src={`/assets/carousel-${realIndex + 1}.png`}
                    alt={`SattvaMunch campaign slide ${realIndex + 1}`}
                    loading="lazy"
                  />
                  <figcaption className="campaign-meta">
                    <span>Slide {String(realIndex + 1).padStart(2, '0')}</span>
                    <span>The seed&apos;s passport</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          id="carousel-lightbox"
          className="carousel-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Campaign slide ${lightboxIndex + 1} enlarged view`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxIndex(null);
            }
          }}
        >
          <button
            type="button"
            id="carousel-lightbox-close"
            className="carousel-lightbox-close"
            aria-label="Close fullscreen view"
            onClick={() => setLightboxIndex(null)}
            data-testid="button-lightbox-close"
          >
            <X size={24} />
          </button>

          <div className="carousel-lightbox-stage" onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxIndex(null);
            }
          }}>
            <div className="carousel-lightbox-content">
              <img
                src={`/assets/carousel-${lightboxIndex + 1}.png`}
                alt={`SattvaMunch campaign slide ${lightboxIndex + 1} - fullscreen`}
                className="carousel-lightbox-image"
              />
              <div className="carousel-lightbox-caption">
                <span className="carousel-lightbox-counter">
                  Slide {String(lightboxIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
                </span>
                <span className="carousel-lightbox-subtitle">The seed&apos;s passport</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="carousel-lightbox-prev"
            className={`carousel-lightbox-nav prev ${lightboxIndex === 0 ? 'disabled' : ''}`}
            aria-label="Previous slide"
            disabled={lightboxIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
            }}
            data-testid="button-lightbox-prev"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            id="carousel-lightbox-next"
            className={`carousel-lightbox-nav next ${lightboxIndex >= totalSlides - 1 ? 'disabled' : ''}`}
            aria-label="Next slide"
            disabled={lightboxIndex >= totalSlides - 1}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null && prev < totalSlides - 1 ? prev + 1 : prev));
            }}
            data-testid="button-lightbox-next"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isLightboxOpen = lightboxIndex !== null;
  const totalItems = galleryItems.length;

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + totalItems) % totalItems : 0));
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % totalItems : 0));
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, totalItems]);

  const currentItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

  return (
    <section className="showcase" aria-labelledby="gallery-title">
      <div className="wrap">
        <span className="section-label">Visual gallery</span>
        <h2 className="display" id="gallery-title" style={{ fontSize: 'clamp(44px, 5vw, 70px)', lineHeight: '.92', margin: '18px 0 0' }}>A little texture<br /><em>goes a long way.</em></h2>
        <div className="showcase-grid">
          {galleryItems.map((item, index) => (
            <figure
              className={`gallery-cell clickable ${!item.src ? 'gallery-cell-placeholder' : ''}`}
              key={`${item.title}-${index}`}
              onClick={() => setLightboxIndex(index)}
              role="button"
              tabIndex={0}
              aria-label={`Open ${item.title} in fullscreen lightbox`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setLightboxIndex(index);
                }
              }}
              data-testid={`gallery-cell-${index}`}
            >
              {item.src ? (
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                />
              ) : (
                <div className="gallery-placeholder-inner" aria-hidden="true">
                  <span className="gallery-placeholder-tag">In Production</span>
                </div>
              )}
              <figcaption>
                <span className="gallery-caption-title">{item.title}</span>
                {item.subtitle && <span className="gallery-cell-sub">{item.subtitle}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && currentItem && (
        <div
          id="gallery-lightbox"
          className="carousel-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${currentItem.title} fullscreen view`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxIndex(null);
            }
          }}
          data-testid="gallery-lightbox-overlay"
        >
          <button
            type="button"
            id="gallery-lightbox-close"
            className="carousel-lightbox-close"
            aria-label="Close fullscreen view"
            onClick={() => setLightboxIndex(null)}
            data-testid="button-gallery-lightbox-close"
          >
            <X size={24} />
          </button>

          <div
            className="carousel-lightbox-stage gallery-lightbox-stage"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setLightboxIndex(null);
              }
            }}
          >
            <div className="gallery-lightbox-content">
              {currentItem.src ? (
                <img
                  src={currentItem.src}
                  alt={currentItem.title}
                  className="gallery-lightbox-image"
                />
              ) : (
                <div className="gallery-lightbox-placeholder">
                  <span className="gallery-lightbox-placeholder-tag">Asset In Production</span>
                  <p className="gallery-lightbox-placeholder-hint">Visual asset is currently being prepared for the brand archive.</p>
                </div>
              )}
              <div className="gallery-lightbox-caption">
                <div className="gallery-lightbox-info">
                  <span className="gallery-lightbox-title">{currentItem.title}</span>
                  {currentItem.subtitle && (
                    <span className="gallery-lightbox-subtitle">{currentItem.subtitle}</span>
                  )}
                </div>
                <span className="gallery-lightbox-counter">
                  {String(lightboxIndex + 1).padStart(2, '0')} / {String(totalItems).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            id="gallery-lightbox-prev"
            className="carousel-lightbox-nav prev"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev - 1 + totalItems) % totalItems : 0));
            }}
            data-testid="button-gallery-lightbox-prev"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            type="button"
            id="gallery-lightbox-next"
            className="carousel-lightbox-nav next"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((prev) => (prev !== null ? (prev + 1) % totalItems : 0));
            }}
            data-testid="button-gallery-lightbox-next"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </section>
  );
}

function BrandFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
    }
  }, []);

  return (
    <section className="film" aria-labelledby="film-title">
      <div className="wrap film-card">
        <div className="film-card-content">
          <span className="eyebrow">Now playing · 0:32</span>
          <h2 className="display" id="film-title">The sound of<br /><em>a good crunch.</em></h2>
          <p>A quiet film about wetlands, spice, and the small moment when a snack changes the direction of an afternoon.</p>
          <div className="film-player-wrapper">
            <video
              ref={videoRef}
              id="brand-commercial-player"
              className="film-video-player"
              controls
              playsInline
              preload="metadata"
              poster="/assets/commercial-poster.jpg"
              aria-label="SattvaMunch Brand Commercial Film"
            >
              <source src="/assets/commercial.mp4" type="video/mp4" />
              <source src="/assets/SattvaMunch-Commercial (1).mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}

function Deck() {
  const investorDeck = 'https://docs.google.com/presentation/d/1FJTmlE3JSV77hYbKxYTjpqqWvq1YjyoP/edit?usp=sharing&ouid=102832170138504550695&rtpof=true&sd=true';
  const deckStats = [
    { value: '$2.3B', label: "India's organic food market" },
    { value: '19.3%', label: 'category CAGR through 2034' },
    { value: '4', label: 'flavors, one certified-organic promise' },
  ];

  return (
    <section className="deck" id="investors" aria-labelledby="deck-title">
      <div className="wrap deck-box">
        <div className="deck-main">
          <span className="eyebrow">For good people with good questions</span>
          <h2 className="display" id="deck-title">Building the next<br /><em>honest snack.</em></h2>
          <p className="deck-lede">
            Fifteen slides on the market, the model, and why now — the same honesty we put in the pack.
          </p>

          <div className="deck-stats" role="list" aria-label="Key market and brand metrics">
            {deckStats.map((stat) => (
              <div className="deck-stat-item" key={stat.value} role="listitem">
                <span className="deck-stat-num">{stat.value}</span>
                <span className="deck-stat-text">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="deck-showcase">
          <a
            className="deck-slide-card"
            href={investorDeck}
            target="_blank"
            rel="noreferrer"
            aria-label="Open SattvaMunch Investor Deck presentation in a new tab"
          >
            <div className="deck-card-sheet deck-card-back-2" aria-hidden="true" />
            <div className="deck-card-sheet deck-card-back-1" aria-hidden="true" />
            <div className="deck-card-sheet deck-card-front">
              <div className="deck-slide-header">
                <span className="deck-slide-badge">15 Slides</span>
                <span className="deck-slide-confidential">Series Seed · Confidential</span>
              </div>
              <div className="deck-slide-content">
                <span className="deck-slide-brand">SattvaMunch</span>
                <h3 className="deck-slide-title">Building the Next<br /><em>Honest Snack.</em></h3>
                <span className="deck-slide-sub">Market · Model · Category Growth</span>
              </div>
              <div className="deck-slide-footer">
                <span>View Google Slides</span>
                <ArrowUpRight size={13} />
              </div>
            </div>
          </a>

          <a
            className="button-dark deck-cta"
            href={investorDeck}
            target="_blank"
            rel="noreferrer"
            data-testid="link-investor-deck"
          >
            Open investor deck <ArrowUpRight size={14} />
          </a>
        </div>
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
        <div>
          <h3>Stay curious</h3>
          <p style={{ color: 'rgba(245,239,224,.67)', fontSize: 14, margin: '0 0 12px', maxWidth: 260 }}>Occasional notes from the road. No noise, just good things to crunch on.</p>
          <form className="newsletter" onSubmit={submit}>
            <input aria-label="Email address" type="email" placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="input-newsletter-email" />
            <button aria-label="Join the list" type="submit" data-testid="button-newsletter-submit"><ArrowRight size={17} /></button>
          </form>
          <div className="newsletter-status" aria-live="polite">{status}</div>
          <button
            type="button"
            className="footer-back-to-top"
            onClick={() => {
              scrollToId('top');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="Back to home"
            data-testid="button-footer-back-to-top"
          >
            <span>Back to home</span>
            <ArrowUp size={14} />
          </button>
        </div>
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