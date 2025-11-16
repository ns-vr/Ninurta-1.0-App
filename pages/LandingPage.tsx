
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Zap, BarChart2, Star, Shield, HelpCircle } from 'lucide-react';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 text-center transform hover:scale-105 transition-transform duration-300">
        <div className="flex justify-center mb-4 text-gold">{icon}</div>
        <h3 className="text-xl font-bold text-soft-white mb-2">{title}</h3>
        <p className="text-gray-400">{text}</p>
    </div>
);

const TestimonialCard: React.FC<{ name: string; school: string; quote: string; image: string }> = ({ name, school, quote, image }) => (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex items-center mb-4">
            <img src={image} alt={name} className="w-12 h-12 rounded-full mr-4" />
            <div>
                <p className="font-bold text-soft-white">{name}</p>
                <p className="text-sm text-gray-400">{school}</p>
            </div>
        </div>
        <p className="text-gray-300 italic">"{quote}"</p>
    </div>
);

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    return (
        <div className="border-b border-slate-700 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left flex justify-between items-center text-soft-white font-semibold">
                <span>{question}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && <p className="mt-2 text-gray-400">{answer}</p>}
        </div>
    );
};

const LandingPage: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (heroRef.current) {
                const { clientX: x, clientY: y } = e;
                const { offsetWidth: width, offsetHeight: height } = heroRef.current;
                const mouseX = (x / width) * 100;
                const mouseY = (y / height) * 100;
                heroRef.current.style.setProperty('--mouse-x', `${mouseX}%`);
                heroRef.current.style.setProperty('--mouse-y', `${mouseY}%`);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="bg-midnight-blue text-soft-white">
            <style>{`
                .hero-animated-bg {
                    --mouse-x: 50%;
                    --mouse-y: 50%;
                    background-image: radial-gradient(
                        circle at var(--mouse-x) var(--mouse-y),
                        rgba(107, 70, 193, 0.5),
                        rgba(26, 32, 44, 0.9) 60%
                    ),
                    url(https://picsum.photos/1600/900);
                    transition: --mouse-x 0.3s ease, --mouse-y 0.3s ease;
                }
            `}</style>

            {/* Hero Section */}
            <section ref={heroRef} className="hero-animated-bg min-h-screen flex items-center justify-center text-center bg-cover bg-center">
                <div className="max-w-4xl px-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gold tracking-tight mb-4">Transform How You Learn</h1>
                    <p className="text-xl md:text-2xl text-gray-300 mb-8">Unleash Your Potential, Crush Every Challenge, and Own Your Success!</p>
                    <Link to="/assessment" className="bg-gold text-midnight-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition-colors duration-300 shadow-lg shadow-gold/30">
                        Start Your Journey
                    </Link>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-20 bg-slate-900">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-4">Why Learning Feels Like a Battle</h2>
                    <p className="max-w-3xl mx-auto text-gray-400 mb-12">One-size-fits-all education, boring study sessions, and the fear of falling behind drain your confidence and motivation. It's time for a change.</p>
                </div>
            </section>

            {/* Solution Section */}
            <section className="py-20">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold mb-4 text-gold">Meet Ninurta: Your Personal AI Tutor</h2>
                        <p className="text-gray-300 mb-4">As the founder, I struggled in a rigid system that didn't value my strengths. I built Ninurta to be the guide I never had—a platform that understands you, adapts to you, and makes learning an epic adventure. We're here to help you find your unique path to success.</p>
                    </div>
                    <div>
                        <img src="https://picsum.photos/600/400?grayscale" alt="Founder's Mission" className="rounded-lg shadow-2xl" />
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-slate-900">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-12">Your New Superpowers</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={<Zap size={40} />} title="Learn Faster" text="Ninurta pinpoints what you need to learn, cutting study time and maximizing results with tailored content." />
                        <FeatureCard icon={<BarChart2 size={40} />} title="Boost Confidence" text="Turn 'I can't' into 'I can' with gamified quizzes and progress tracking that celebrates every win." />
                        <FeatureCard icon={<BookOpen size={40} />} title="Stay Motivated" text="Engaging content like videos, audiobooks, and interactive mind maps make learning genuinely fun." />
                    </div>
                </div>
            </section>

             {/* Social Proof Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-12">Heroes of Learning</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard name="Prabhod" school="PES University - CS Major" quote="Ninurta completely changed my study habits. I'm finally understanding concepts that used to confuse me for hours." image="https://picsum.photos/seed/prabhod/100/100" />
                        <TestimonialCard name="Nahush" school="PES University - CS Major" quote="The gamification makes it addictive. I actually look forward to my study sessions now. The leaderboard is my favorite part!" image="https://picsum.photos/seed/nahush/100/100" />
                        <TestimonialCard name="Arayman" school="PES University - AI/ML Major" quote="As an AI major, I'm blown away by the personalization. It feels like it knows exactly what I need to focus on. A true game-changer." image="https://picsum.photos/seed/arayman/100/100" />
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-slate-900">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-4xl font-bold text-center mb-12">Your Questions, Answered</h2>
                    <FaqItem question="How much does Ninurta cost?" answer="Ninurta offers a free tier with core features. Our premium subscription unlocks advanced AI tools, unlimited content generation, and in-depth analytics." />
                    <FaqItem question="How does Ninurta protect my data?" answer="We prioritize your privacy. All data is encrypted, and we never share your personal information with third parties. Your learning journey is yours alone." />
                    <FaqItem question="What if I need help?" answer="Our support team is available 24/7. You can reach out through the in-app chat or email, and we'll be happy to assist you." />
                </div>
            </section>
            
            {/* CTA Block */}
            <section className="py-20 text-center">
                 <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-4">Ready to Conquer Your Goals?</h2>
                    <p className="text-lg text-gray-400 mb-8">Stop struggling and start succeeding. Your personalized learning path awaits.</p>
                     <Link to="/assessment" className="bg-gold text-midnight-blue font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-300 transition-colors duration-300 shadow-lg shadow-gold/30">
                        Get Your Free Assessment
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
