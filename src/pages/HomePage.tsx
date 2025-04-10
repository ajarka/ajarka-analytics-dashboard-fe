import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Motion, Presence } from '@motionone/solid';
import { For } from 'solid-js';

// Tambahkan helper function untuk background
const generateStars = (count: number) => {
  return Array.from({ length: count }).map((_, ) => ({
    size: Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 5 + Math.random() * 10,
    delay: Math.random() * 5
  }));
};

const HomePage: Component = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = createSignal(0);
  const [isNavigating, setIsNavigating] = createSignal(false);
  const [touchStart, setTouchStart] = createSignal(0);
  const [touchEnd, setTouchEnd] = createSignal(0);
  const [isSwiping, setIsSwiping] = createSignal(false);

  // Minimum distance for swipe
  const minSwipeDistance = 50;

  // Menu items data
  const menuItems = [
    {
      id: 1,
      title: "Dashboard Monitoring",
      subtitle: "Track and manage in real-time",
      description: "Interactive Dashboard monitoring system for management and infrastructure tracking",
      icon: "M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z",
      route: "/dashboard",
      bgColor: "from-blue-600 to-indigo-600",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"
    },
    {
      id: 2,
      title: "Analytics & Reports",
      subtitle: "Comprehensive project performance insights",
      description: "Advanced analytics dashboard for tracking project metrics, timelines, and resource allocation",
      icon: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
      route: "/analytics",
      bgColor: "from-purple-600 to-pink-600",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    },
    {
      id: 3,
      title: "Resource Management",
      subtitle: "Optimize resource allocation",
      description: "Efficient management of workforce, equipment, and materials across projects",
      icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
      route: "/resources",
      bgColor: "from-emerald-600 to-teal-600",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2068&q=80"
    },
    {
      id: 4,
      title: "Performance Metrics",
      subtitle: "Performance metrics and reports management",
      description: "Performance metrics and management system for project documentation",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
      route: "/documents",
      bgColor: "from-amber-600 to-orange-600",
      image: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2032&q=80"
    },
    {
      id: 5,
      title: "Team Collaboration",
      subtitle: "Enhanced team communication",
      description: "Real-time collaboration tools for team coordination and project updates",
      icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
      route: "/map-wo",
      bgColor: "from-red-600 to-rose-600",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
    }
  ];

  const handleNavigate = (route: string) => {
    setIsNavigating(true);
    setTimeout(() => {
      navigate(route);
    }, 500);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % menuItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + menuItems.length) % menuItems.length);
  };

  // Modifikasi getSlideStyle
  const getSlideStyle = (index: number) => {
    const isMobile = window.innerWidth < 768;
    const diff = (index - currentSlide() + menuItems.length) % menuItems.length;
    const isActive = diff === 0;
    const isNext = diff === 1;
    const isPrev = diff === menuItems.length - 1;
    
    // Mobile styles
    if (isMobile) {
      let transform = 'translate(-50%, -50%) scale(0.4) translateZ(-500px)';
      let opacity = '0';
      let zIndex = 0;
      let filter = 'blur(8px)';
      let pointerEvents = 'none';
      
      if (isActive) {
        transform = 'translate(-50%, -50%) scale(1) translateZ(0)';
        opacity = '1';
        zIndex = 30;
        filter = 'blur(0)';
        pointerEvents = 'auto';
      }

      return {
        transform,
        opacity,
        'z-index': zIndex,
        filter,
        'pointer-events': pointerEvents,
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '90vw', // Smaller width for mobile
        height: '70vh', // Adjusted height for mobile
        transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)',
        'transform-style': 'preserve-3d',
        'transform-origin': 'center center',
        'box-shadow': isActive ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 15px 30px -5px rgba(0, 0, 0, 0.3)'
      } as any;
    }

    // Desktop styles
    let transform = 'translate(-50%, -50%) scale(0.4) translateZ(-1500px) rotateY(45deg)';
    let opacity = '0';
    let zIndex = 0;
    let filter = 'blur(8px)';
    let pointerEvents = 'none';
    
    if (isActive) {
      transform = 'translate(-50%, -50%) scale(1) translateZ(0) rotateY(0deg)';
      opacity = '1';
      zIndex = 30;
      filter = 'blur(0)';
      pointerEvents = 'auto';
    } else if (isNext) {
      transform = 'translate(38%, -50%) scale(0.85) translateZ(-150px) rotateY(-35deg)';
      opacity = '0.8';
      zIndex = 20;
      filter = 'blur(1px)';
      pointerEvents = 'auto';
    } else if (isPrev) {
      transform = 'translate(-138%, -50%) scale(0.85) translateZ(-150px) rotateY(35deg)';
      opacity = '0.8';
      zIndex = 20;
      filter = 'blur(1px)';
      pointerEvents = 'auto';
    }

    return {
      transform,
      opacity,
      'z-index': zIndex,
      filter,
      'pointer-events': pointerEvents,
      position: 'absolute',
      left: '50%',
      top: '50%',
      transition: 'all 0.7s cubic-bezier(0.23, 1, 0.32, 1)',
      'transform-style': 'preserve-3d',
      'transform-origin': 'center center',
      'box-shadow': isActive ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 15px 30px -5px rgba(0, 0, 0, 0.3)'
    } as any;
  };

  const stars = generateStars(100);

  const handleTouchStart = (e: TouchEvent) => {
    // Tambahkan initial touch position untuk menentukan apakah user melakukan slide atau tap
    const touch = e.targetTouches[0];
    setTouchStart(touch.clientX);
    setTouchEnd(touch.clientX); // Set touchEnd sama dengan touchStart di awal
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isSwiping()) {
      setTouchEnd(e.targetTouches[0].clientX);
      // Prevent default untuk mencegah scrolling
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStart() - touchEnd();
    
    // Hanya proses sebagai swipe jika jaraknya lebih dari minSwipeDistance
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    setIsSwiping(false);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Tambahkan handler untuk click
  const handleItemClick = (index: number, route: string) => {
    // Jika tidak sedang dalam proses swipe, proses sebagai click
    if (!isSwiping() || Math.abs(touchStart() - touchEnd()) <= minSwipeDistance) {
      if (index !== currentSlide()) {
        setCurrentSlide(index);
      } else {
        handleNavigate(route);
      }
    }
  };

  onMount(() => {
    const element : any = document.querySelector('.slides-container');
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }

    onCleanup(() => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    });
  });

  return (
    <div class="relative min-h-screen bg-[#0B1026] overflow-hidden">
      {/* Enhanced Animated Background */}
      <div class="fixed inset-0 z-0">
        {/* Deep Space Gradient */}
        <div 
          class="absolute inset-0 bg-gradient-radial from-blue-900/20 via-[#0B1026] to-[#0B1026]"
        />
        
        {/* Animated Stars */}
        <div class="absolute inset-0">
          {stars.map((star,) => (
            <div
              class="absolute rounded-full bg-white animate-twinkle"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.y}%`,
                left: `${star.x}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                'animation-delay': `${star.delay}s`
              }}
            />
          ))}
        </div>

        {/* Nebula Effect */}
        <div class="absolute inset-0 opacity-30">
          <div class="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 animate-aurora" />
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-aurora-vertical" />
        </div>

        {/* Enhanced Grid Pattern */}
        <div 
          class="absolute inset-0 opacity-[0.07]"
          style={{
            'background-image': `
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            'background-size': '100px 100px',
            'mask-image': 'radial-gradient(circle at 50% 50%, black 0%, transparent 70%)'
          }}
        />

        {/* Dynamic Glow Effects */}
        <div class="absolute inset-0">
          <div 
            class="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/20 blur-[150px] animate-pulse-slow"
          />
          <div 
            class="absolute top-1/3 left-1/3 w-1/3 h-1/3 bg-purple-500/20 blur-[150px] animate-pulse-slower"
          />
        </div>

        {/* Interactive Particles */}
        <div class="absolute inset-0">
          <div class="particles-container">
            {Array.from({ length: 30 }).map((_) => (
              <div
                class="particle absolute"
                style={{
                  width: `${Math.random() * 2 + 1}px`,
                  height: `${Math.random() * 2 + 1}px`,
                  background: `rgba(255,255,255,${Math.random() * 0.3 + 0.2})`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animation: `float-particle ${10 + Math.random() * 20}s linear infinite`,
                  'animation-delay': `-${Math.random() * 20}s`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows - Hide on mobile */}
      <div class="fixed inset-x-0 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-between px-12 z-50 pointer-events-none">
        <button 
          onClick={prevSlide}
          class="p-4 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all transform hover:scale-110 hover:shadow-lg pointer-events-auto"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button 
          onClick={nextSlide}
          class="p-4 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all transform hover:scale-110 hover:shadow-lg pointer-events-auto"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div class="fixed inset-0 z-10">
        <div class="relative w-full h-full" style="perspective: 1800px; perspective-origin: 50% 50%;">
          <div class="relative w-full h-full top-[50vh] slides-container">
            <For each={menuItems}>
              {(item, index) => (
                <Motion 
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }} 
                  transition={{ duration: 0.7 }}
                >
                  <div 
                    class="w-[65vw] md:w-[65vw] h-[75vh] rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform-gpu hover:scale-[1.02] transition-transform duration-300"
                    style={{
                      ...getSlideStyle(index()),
                      transform: isSwiping() ? `
                        ${getSlideStyle(index()).transform} 
                        translateX(${touchEnd() - touchStart()}px)
                      ` : getSlideStyle(index()).transform
                    }}
                    onClick={() => handleItemClick(index(), item.route)}
                  >
                    {/* Background Image with better overlay */}
                    <div 
                      class="absolute inset-0 transition-transform duration-1000 ease-out transform hover:scale-110"
                      style={{
                        'background-image': `url(${item.image})`,
                        'background-size': 'cover',
                        'background-position': 'center',
                      }}
                    />

                    {/* Content Overlay with stronger gradient */}
                    <div 
                      class="absolute inset-0 transition-all duration-500"
                      style={{
                        'background': `linear-gradient(to bottom right, 
                          ${item.bgColor.includes('blue') ? 'rgb(4 40 118 / 75%)' : 
                          item.bgColor.includes('purple') ? 'rgb(147 51 234 / 95%)' : 
                          item.bgColor.includes('emerald') ? 'rgb(5 150 105 / 66%)' : 
                          item.bgColor.includes('amber') ? ' rgb(217 119 6 / 83%)' : 
                          'rgb(239 68 68 / 59%)'},
                          ${item.bgColor.includes('indigo') ? 'rgb(26 20 124 / 79%)' : 
                          item.bgColor.includes('pink') ? 'rgb(219 39 119 / 84%)' : 
                          item.bgColor.includes('teal') ? 'rgba(13, 148, 136, 0.95)' : 
                          item.bgColor.includes('orange') ? 'rgb(234 88 12 / 76%)' : 
                          'rgb(185 28 28 / 74%)'})`
                      }}
                    />

                    {/* Content with responsive spacing */}
                    <div class="relative h-full flex flex-col justify-center px-6 md:px-16 text-white">
                      <Motion 
                        animate={{ 
                          opacity: index() === currentSlide() ? 1 : 0, 
                          y: index() === currentSlide() ? 0 : 20 
                        }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                      >
                        <div class="mb-4 md:mb-6 transform transition-transform hover:scale-110">
                          <svg class="w-12 h-12 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={item.icon} />
                          </svg>
                        </div>
                        <h1 class="text-3xl md:text-5xl font-bold mb-2 md:mb-4 tracking-tight">{item.title}</h1>
                        <p class="text-lg md:text-xl text-white/90 mb-2 md:mb-3 font-medium">{item.subtitle}</p>
                        <p class="text-sm md:text-base text-white/80 mb-6 md:mb-8 max-w-2xl leading-relaxed">{item.description}</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(item.route);
                          }}
                          class="group inline-flex items-center px-6 md:px-8 py-2 md:py-3 rounded-xl bg-white/95 text-gray-900 font-bold text-base md:text-lg transform transition-all hover:scale-105 hover:shadow-2xl hover:bg-white"
                        >
                          Launch Application
                          <svg class="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3 transform transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </Motion>
                    </div>
                  </div>
                </Motion>
              )}
            </For>
          </div>
        </div>

        {/* Slide Indicators - Adjusted for mobile */}
        <div class="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3 z-50">
          <For each={menuItems}>
            {(_, index) => (
              <button
                onClick={() => setCurrentSlide(index())}
                class={`transition-all duration-300 rounded-full ${
                  index() === currentSlide() 
                    ? 'w-8 md:w-12 h-2 md:h-3 bg-white shadow-lg' 
                    : 'w-2 md:w-3 h-2 md:h-3 bg-white/40 hover:bg-white/60'
                }`}
              />
            )}
          </For>
        </div>
      </div>

      {/* Navigation Overlay */}
      <Presence>
        {isNavigating() && (
          <Motion 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <div class="fixed inset-0 bg-black z-50" />
          </Motion>
        )}
      </Presence>
    </div>
  );
};

export default HomePage; 