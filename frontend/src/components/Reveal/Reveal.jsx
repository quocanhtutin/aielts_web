import { useEffect, useRef, useState } from "react";
import './Reveal.css';

function Reveal({ children }) {
    const ref = useRef();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;

        const handleScroll = () => {
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Ngưỡng 30px ở gần bottom
            const bottomThreshold = windowHeight - 80;

            // Điều kiện hiển thị:
            // Nếu phần trên của element nằm TRÊN ngưỡng bottom (=> đã trồi lên)
            // và phần dưới của element vẫn còn trong viewport hoặc nằm trên đó.
            if (rect.top < bottomThreshold && rect.bottom > 0) {
                setVisible(true);
            }
            // Khi toàn bộ element bị đẩy xuống dưới ngưỡng 30px cuối màn hình → ẩn
            else if (rect.top >= bottomThreshold) {
                setVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        handleScroll(); // chạy 1 lần để set trạng thái ban đầu

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div
            ref={ref}
            className={`reveal ${visible ? "active" : ""}`}
        >
            {children}
        </div>
    );
}

export default Reveal;
