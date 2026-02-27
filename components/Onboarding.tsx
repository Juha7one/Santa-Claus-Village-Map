import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface OnboardingProps {
    onComplete: () => void;
    onStepChange?: (step: number) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onStepChange }) => {
    const t = useTranslations();
    const [step, setStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);

    const onboarding = t.onboarding || {};

    const steps = useMemo(() => [
        {
            title: onboarding.welcomeTitle,
            text: onboarding.welcomeText,
            icon: '🎅',
            color: 'bg-red-600',
            spotlightId: null
        },
        {
            title: onboarding.stepCategoriesTitle,
            text: onboarding.stepCategoriesText,
            icon: '🔍',
            color: 'bg-emerald-600',
            spotlightId: 'category-filter-bar'
        },
        {
            title: onboarding.step1Title,
            text: onboarding.step1Text,
            icon: '➕',
            color: 'bg-amber-600',
            spotlightId: 'user-places-button'
        },
        {
            title: onboarding.step2Title,
            text: onboarding.step2Text,
            icon: '🚗',
            color: 'bg-blue-600',
            spotlightId: 'admin-add-actions'
        },
        {
            title: onboarding.step3Title,
            text: onboarding.step3Text,
            icon: '❤️',
            color: 'bg-pink-600',
            spotlightId: null // Favourites are everywhere, just explain it
        }
    ], [onboarding]);

    const currentStep = steps[step];

    useEffect(() => {
        if (onStepChange) onStepChange(step);

        // Update spotlight position
        const updateSpotlight = () => {
            if (currentStep.spotlightId) {
                const el = document.getElementById(currentStep.spotlightId);
                if (el) {
                    setSpotlightRect(el.getBoundingClientRect());
                } else {
                    setSpotlightRect(null);
                }
            } else {
                setSpotlightRect(null);
            }
        };

        // Delay slightly for UI animations/panel openings
        const timer = setTimeout(updateSpotlight, 100);
        window.addEventListener('resize', updateSpotlight);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateSpotlight);
        };
    }, [step, currentStep.spotlightId, onStepChange]);

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const maskStyle = useMemo(() => {
        if (!spotlightRect) return { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' };

        const x = spotlightRect.left - 8;
        const y = spotlightRect.top - 8;
        const w = spotlightRect.width + 16;
        const h = spotlightRect.height + 16;

        const svgArr = [
            "<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'>",
            "<mask id='m'>",
            "<rect width='100%' height='100%' fill='white'/>",
            `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='24' fill='black'/>`,
            "</mask>",
            "<rect width='100%' height='100%' fill='white' mask='url(%23m)'/>",
            "</svg>"
        ];
        const svg = svgArr.join("");
        const maskImageUrl = `url("data:image/svg+xml,${svg.replace(/#/g, '%23')}")`;

        return {
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
            maskImage: maskImageUrl,
            WebkitMaskImage: maskImageUrl,
        };
    }, [spotlightRect]);

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 pointer-events-none overflow-hidden" style={{ isolation: 'isolate' }}>
            {/* Dark & Blurred Overlay with Rounded Hole */}
            <div
                className="absolute inset-0 transition-opacity duration-300 pointer-events-auto"
                style={maskStyle}
            />

            {/* Modal Card */}
            <div
                className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all duration-300 scale-100 opacity-100 z-[5005] pointer-events-auto ${spotlightRect ? (spotlightRect.top > window.innerHeight / 2 ? '-translate-y-20' : 'translate-y-20') : ''}`}
            >
                {/* Visual Header */}
                <div className={`${currentStep.color} h-32 flex items-center justify-center transition-colors duration-500`}>
                    <span className="text-6xl animate-bounce">{currentStep.icon}</span>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentStep.title}</h2>
                    <p className="text-gray-600 leading-relaxed mb-8">
                        {currentStep.text}
                    </p>

                    {/* Progress Dots */}
                    <div className="flex justify-center space-x-2 mb-8">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-amber-600' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <div className="flex space-x-2">
                            {step > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    {onboarding.back || 'Back'}
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className={`flex-[2] py-4 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 ${currentStep.color}`}
                            >
                                {step === steps.length - 1 ? onboarding.finish : onboarding.next}
                            </button>
                        </div>

                        <button
                            onClick={onComplete}
                            className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {onboarding.skip}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
