// app/page.js
'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Shield, Globe, Users, Database, BarChart, Lock, FileText, Network, Target, AlertTriangle, CheckCircle, ArrowRight, Menu, X, Zap } from 'lucide-react';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Nigeria Customs Enforcement Network",
      subtitle: "WCO-CEN Extension",
      description: "Official national extension of the World Customs Organization's global enforcement network, enhancing border security and trade compliance across Nigeria.",
      bgColor: "from-green-900/30 via-gray-900/50 to-blue-900/30",
      image: "https://images.unsplash.com/photo-1616499370260-485b3e5ed653?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      icon: <Globe className="h-12 w-12" />
    },
    {
      title: "Real-time Intelligence Sharing",
      subtitle: "Global Network Integration",
      description: "Seamlessly connect with 184 WCO member countries for instant intelligence sharing, coordinated operations, and international enforcement collaboration.",
      bgColor: "from-blue-900/30 via-gray-900/50 to-purple-900/30",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      icon: <Network className="h-12 w-12" />
    },
    {
      title: "Real-time Intelligence Sharing",
      subtitle: "Global Network Integration",
      description: "Seamlessly connect with 184 WCO member countries for instant intelligence sharing, coordinated operations, and international enforcement collaboration.",
      bgColor: "from-blue-900/30 via-gray-900/50 to-purple-900/30",
      image: "/images/slide-bg.jpg",
      icon: <Network className="h-12 w-12" />
    },
    {
      title: "Advanced Risk Management",
      subtitle: "Predictive Analytics Platform",
      description: "Leverage AI-powered analytics to identify high-risk shipments, prevent smuggling attempts, and optimize customs clearance processes.",
      bgColor: "from-purple-900/30 via-gray-900/50 to-indigo-900/30",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      icon: <Target className="h-12 w-12" />
    }
  ];

  const features = [
    {
      name: 'Digital Seizure Reporting',
      description: 'Streamline the process of documenting and reporting seizures with our intuitive digital forms integrated with WCO standards.',
      icon: <FileText className="h-6 w-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Real-time Tracking & Analytics',
      description: 'Monitor seizure cases in real-time with comprehensive dashboards and status updates across the enforcement network.',
      icon: <BarChart className="h-6 w-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Secure Data Management',
      description: 'Ensure data security and compliance with our robust encryption and access controls following WCO protocols.',
      icon: <Lock className="h-6 w-6" />,
      color: 'from-purple-500 to-violet-500'
    },
    {
      name: 'Multi-agency Collaboration',
      description: 'Enable seamless collaboration between different enforcement agencies and international partners through unified platform.',
      icon: <Users className="h-6 w-6" />,
      color: 'from-orange-500 to-amber-500'
    },
  ];

  const stats = [
    { label: 'WCO Member Countries', value: '184' },
    { label: 'Nigerian Entry Points', value: '86' },
    { label: 'Monthly Transactions', value: '2.5M+' },
    { label: 'Response Time', value: '<1s' },
  ];

  const partners = [
    { name: 'WCO', description: 'World Customs Organization' },
    { name: 'INTERPOL', description: 'International Criminal Police Organization' },
    { name: 'EUROPEAN UNION', description: 'European Union Customs' },
    { name: 'UNODC', description: 'United Nations Office on Drugs and Crime' },
    { name: 'AFRICAN UNION', description: 'African Union Commission' },
  ];

  // Auto slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 bg-gray-500/90 backdrop-blur-md border-b border-gray-800">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <div className="flex items-center space-x-3">
              <div className="relative">
        
                <Image src="/images/logo.png" alt="nCEN Logo" width={70} height={90} className="w-10 h-10"/>
                
              </div>
              <div>
                <span className="text-xl font-bold text-white">nCEN</span>
                <span className="block text-xl text-green-400 font-large">NCS Enforcement Network</span>
              </div>
            </div>
          </div>
          
          <div className="flex lg:hidden">
            <button
              type="button"
              className="text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
          
          <div className="hidden lg:flex lg:gap-x-8">
            <a href="#overview" className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors">
              Overview
            </a>
            <a href="#features" className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors">
              Features
            </a>
            <a href="#network" className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors">
              Network
            </a>
            <a href="#contact" className="text-sm font-semibold leading-6 text-gray-300 hover:text-white transition-colors">
              Contact
            </a>
          </div>
          
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {/*   <button
              onClick={() => router.push('/login')}
              className="text-sm font-semibold leading-6 text-white px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              Officer Login
            </button> */}
            <button
              onClick={() => router.push('/login')}
              className="text-sm font-semibold leading-6 text-white bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
            >
              Login
            </button>
          </div>
        </nav>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-white">nCEN</span>
                    <span className="block text-xs text-green-400">WCO-CEN Extension</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-700">
                  <div className="space-y-2 py-6">
                    <a
                      href="#overview"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Overview
                    </a>
                    <a
                      href="#features"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </a>
                    <a
                      href="#network"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Network
                    </a>
                    <a
                      href="#contact"
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-white hover:bg-white/10"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Contact
                    </a>
                  </div>
                  <div className="py-6">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/login');
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-white/10 w-full text-left"
                    >
                      Officer Login
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/register');
                      }}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white bg-gradient-to-r from-green-600 to-green-700 w-full text-left mt-2"
                    >
                      Request Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section with Slides */}
      <div className="relative min-h-screen pt-16">
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url('${slide.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.bgColor}`}></div>
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          </div>
        ))}

        {/* Slide Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 py-32">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="text-white">
                    {slides[currentSlide].icon}
                  </div>
                </div>
                <div className="text-green-400 font-semibold tracking-wider">
                  {slides[currentSlide].subtitle}
                </div>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                {slides[currentSlide].title}
              </h1>
              
              <p className="text-xl text-gray-300 mb-10 max-w-2xl">
                {slides[currentSlide].description}
              </p>

              <div className="flex flex-col sm:flex-row gap-6">
                <button
                  onClick={() => router.push('/register')}
                  className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 shadow-2xl hover:shadow-green-500/25 transition-all duration-300 flex items-center gap-3"
                >
                  Join the Network
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 text-lg font-semibold text-white border-2 border-white/20 hover:border-white/40 rounded-xl hover:bg-white/5 transition-all duration-200"
                >
                  Officer Access
                </button>
              </div>

              {/* Slide Indicators */}
              <div className="mt-16 flex items-center gap-4">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'w-8 bg-green-500' 
                        : 'w-4 bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
                
                {/* Navigation Buttons */}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={prevSlide}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative py-16 bg-gray-900 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div id="overview" className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-6">
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">WCO Integrated</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                National Enforcement
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  Network Platform
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                The Nigeria Customs Enforcement Network (nCEN) is the official national extension 
                of the World Customs Organization's Customs Enforcement Network (WCO-CEN), providing 
                a unified platform for intelligence sharing, risk management, and coordinated 
                enforcement operations across all Nigerian borders.
              </p>
              
              <div className="space-y-4">
                {[
                  'Real-time data exchange with 184 WCO member countries',
                  'Advanced risk assessment and targeting system',
                  'Secure communication channels for enforcement agencies',
                  'Comprehensive analytics and reporting tools',
                  'Mobile access for field operations'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-1">
                <div className="bg-gray-900 rounded-xl p-8">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
                      <AlertTriangle className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Live Network Status</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white">WCO Global Network</span>
                      </div>
                      <span className="text-green-400 font-semibold">Connected</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white">Nigerian Border Points</span>
                      </div>
                      <span className="text-green-400 font-semibold">86 Online</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white">Data Synchronization</span>
                      </div>
                      <span className="text-green-400 font-semibold">Real-time</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white">Security Level</span>
                      </div>
                      <span className="text-green-400 font-semibold">Maximum</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative py-24 lg:py-32 bg-gray-900/50 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-6">
              <Database className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Core Capabilities</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Comprehensive
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Enforcement Tools
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Advanced features designed specifically for customs enforcement operations and 
              international collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="group relative bg-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`mb-6 p-4 rounded-xl bg-gradient-to-br ${feature.color} w-14 h-14 flex items-center justify-center`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.name}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                
                <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
                  <span className="text-sm font-medium">Explore feature</span>
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="absolute top-4 right-4 text-gray-700 text-6xl font-bold opacity-10">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partners Network */}
      <div id="network" className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Global
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                Enforcement Partnership
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Integrated with international organizations and enforcement networks for 
              coordinated global security operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <div
                key={partner.name}
                className="group relative bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-white">{partner.name}</div>
                  <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Network className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-400">{partner.description}</p>
                
                <div className="absolute bottom-4 right-4">
                  <div className={`w-2 h-2 rounded-full ${
                    index % 3 === 0 ? 'bg-green-500' :
                    index % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'
                  } animate-pulse`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 p-8 lg:p-12 backdrop-blur-sm">
            <div className="text-center">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
                Join the National
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
                  Enforcement Network
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
                Become part of Nigeria's premier customs intelligence network and contribute 
                to enhanced border security and trade facilitation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button
                  onClick={() => router.push('/register')}
                  className="group relative px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-2xl hover:shadow-green-500/30 hover:scale-105 transition-all duration-300"
                >
                  Request Network Access
                  <ArrowRight className="h-5 w-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => router.push('/contact')}
                  className="px-10 py-4 text-lg font-semibold text-white border-2 border-white/20 hover:border-white/40 rounded-xl hover:bg-white/5 transition-all duration-200"
                >
                  Contact nCEN Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-gray-950/50 border-t border-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white">nCEN</span>
                  <span className="block text-xs text-green-400">WCO-CEN Extension</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Nigeria Customs Enforcement Network - Official WCO Integrated Platform.
                Federal Ministry of Finance, Customs & Excise Department.
              </p>
            </div>

            {[
              {
                title: 'Platform',
                links: ['Features', 'Documentation', 'API Access', 'System Status'],
              },
              {
                title: 'Network',
                links: ['WCO Integration', 'Partner Agencies', 'Border Points', 'Training'],
              },
              {
                title: 'Support',
                links: ['Officer Support', 'Technical Help', 'Compliance', 'Contact'],
              },
            ].map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-semibold text-white mb-6">{column.title}</h4>
                <ul className="space-y-4">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Nigeria Customs Enforcement Network (nCEN). 
                All rights reserved. WCO-CEN Member Platform.
              </p>
              <div className="flex items-center gap-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Security Policy
                </a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Compliance Docs
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}