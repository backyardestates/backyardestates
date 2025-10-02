// hooks/useActiveSection.js
import { useState, useEffect } from 'react';

export function useActiveSection() {
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return; // Ensure this runs only on the client side

        const sections = document.querySelectorAll('section[id]');

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -70% 0px',
            threshold: [0, 0.25, 0.5, 0.75, 1],
        };

        const observerCallback = (entries) => {
            const visibleSections = entries.filter((entry) => entry.isIntersecting);
            if (visibleSections.length > 0) {
                const mostVisibleSection = visibleSections.reduce((prev, current) =>
                    prev.intersectionRatio > current.intersectionRatio ? prev : current
                );
                setActiveSection(mostVisibleSection.target.id);
            }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        sections.forEach((section) => observer.observe(section));

        return () => observer.disconnect();
    }, []);

    return activeSection;
}