import { useEffect, useRef } from "react";
import "./Reveal.css";

export default function SmartReveal({ children }) {
    const ref = useRef(null);
    const ticking = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            ticking.current = false;
            const rect = el.getBoundingClientRect();
            const viewportH = window.innerHeight;
            const cutoff = viewportH - 30; // vùng 30px cuối sẽ không hiện

            /*
              Mục tiêu: tính phần của element nằm "trên" đường cutoff (tức phần có thể hiện).
              Nếu rect.top >= cutoff -> phần tử còn hoàn toàn dưới vùng hiển thị (ẩn).
              Nếu rect.bottom <= 0 -> phần tử đã qua trên viewport (có thể vẫn hiển thị hoàn toàn).
              Tính visiblePixels = amount of element within [0, cutoff]
            */
            const visibleTop = Math.max(rect.top, 0);
            const visibleBottom = Math.min(rect.bottom, cutoff);
            const visiblePixels = Math.max(visibleBottom - visibleTop, 0);
            const totalHeight = rect.height || 1;

            // tỉ lệ phần tử hiển thị so với tổng chiều cao element (0..1)
            let ratio = visiblePixels / totalHeight;
            ratio = Math.min(Math.max(ratio, 0), 1);

            // map ratio -> percent (0% -> 100%)
            const percent = Math.round(ratio * 10000) / 100; // 2 decimal places

            // gán CSS variable --reveal (dùng percent)
            el.style.setProperty("--reveal", `${percent}%`);
        };

        const onScrollOrResize = () => {
            if (!ticking.current) {
                ticking.current = true;
                requestAnimationFrame(update);
            }
        };

        // initial calc
        update();

        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        window.addEventListener("resize", onScrollOrResize);

        return () => {
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
        };
    }, []);

    return (
        <div ref={ref} className="smart-reveal">
            {children}
        </div>
    );
}
