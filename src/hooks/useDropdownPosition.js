"use client";
import { useState } from "react";

export default function useDropdownPosition() {
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const updateDropdownPosition = (element) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  return { dropdownPos, updateDropdownPosition };
}
