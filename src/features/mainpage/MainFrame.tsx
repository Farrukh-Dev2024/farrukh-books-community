"use client";

import { useEffect, useState } from "react";

const lightFrame = "/border1.png";
const darkFrame = "/border2.png";

function MainFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [frameSrc, setFrameSrc] = useState(lightFrame);

  useEffect(() => {
    const html = document.documentElement;

    // Function to update the frame based on dark mode
    const updateFrame = () => {
      setFrameSrc(html.classList.contains("dark") ? darkFrame : lightFrame);
    };

    // Initial check
    updateFrame();

    // Observe changes to the class attribute of <html>
    const observer = new MutationObserver(updateFrame);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={[
        "inline-block box-border",
        "border-10 border-solid",
        "sm:border-48 border-solid",
        "[border-image-slice:111_134_136_111]",
        "[border-image-repeat:round]",
        "print:border-0 print:[border-image:none]",
        className,
      ].join(" ")}
      style={{ borderImageSource: `url(${frameSrc})` }}
    >
      <div>{children}</div>
    </div>
  );
}

export default MainFrame;
