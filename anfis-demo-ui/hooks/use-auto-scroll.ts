import { useEffect, useRef } from 'react';

/**
 * Automatically scrolls the Radix UI ScrollArea to the bottom 
 * when the dependencies (data) change.
 */
export function useAutoScroll(dependencies: any[]) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                // Should we smooth scroll? Maybe just instant for logger effect
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, dependencies);

    return scrollRef;
}
