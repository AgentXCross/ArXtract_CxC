import React, { useEffect, useRef, useState } from "react";
import "./FeatureCard.css";

interface FeatureCardProps {
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  delay?: number;
  index?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
  index = 1,
}: FeatureCardProps) {

  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"initial" | "visible" | "exited">("initial");
  const hasEntered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasEntered.current) {
            setTimeout(() => {
              hasEntered.current = true;
              setState("visible");
            }, delay);
          } else {
            setState("visible");
          }
        } else if (hasEntered.current) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 80) {
            setState("exited");
          }
        }
      },
      { threshold: 0.5, rootMargin: "-40% 0px -15% 0px" }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`feature-card ${state}`}
    >
      {/* Terminal title bar */}
      <div className="feature-terminal-bar">
        <div className="feature-terminal-dots">
          <div className="feature-terminal-dot" />
          <div className="feature-terminal-dot" />
          <div className="feature-terminal-dot" />
        </div>
        <div className="feature-terminal-label">
          key_feature_#{index}
        </div>
      </div>

      {/* Card body */}
      <div className="feature-body">
        <div className="feature-icon">
          {icon}
        </div>

        <h3 className="feature-title">
          {title}
        </h3>

        <p className="feature-description">
          {description}
        </p>
      </div>
    </div>
  );
}
