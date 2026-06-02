import { useEffect, useRef } from "react";
import './AutoResizeTextarea.css'

const AutoResizeTextarea = ({ value, onChange, className = '' }) => {
    const textareaRef = useRef(null);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
        }
    }, [value]);

    const cls = ['auto-textarea', className].filter(Boolean).join(' ')

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            className={cls}
        ></textarea>
    );
};

export default AutoResizeTextarea;
