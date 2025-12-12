import { useEffect, useState } from "react";

export function useCountUp(target: number, start: boolean, duration = 800) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!start) return; // Do not animate until triggered

        let startValue = 0;
        const end = target;
        const totalMs = duration;
        const increment = 16; // ~60fps
        const step = (end - startValue) / (totalMs / increment);

        let current = startValue;

        const timer = setInterval(() => {
            current += step;

            if (current >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, increment);

        return () => clearInterval(timer);
    }, [start, target, duration]);

    return count;
}
