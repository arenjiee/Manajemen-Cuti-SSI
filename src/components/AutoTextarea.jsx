"use client";
import { useEffect, useRef } from "react";

export default function AutoTextarea({
  className = "",
  rows = 2,
  value,
  defaultValue,
  onChange,
  ...props
}) {
  const textareaRef = useRef(null);

  const sesuaikanTinggi = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    sesuaikanTinggi();
  }, [value, defaultValue]);

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      value={value}
      defaultValue={defaultValue}
      onInput={sesuaikanTinggi}
      onChange={(e) => {
        sesuaikanTinggi();
        onChange?.(e);
      }}
      className={`resize-none overflow-hidden transition-[height] duration-75 ${className}`}
      {...props}
    />
  );
}
