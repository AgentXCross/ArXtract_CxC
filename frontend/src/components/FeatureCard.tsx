import React, { useEffect, useRef, useState } from "react";
import "./FeatureCard.css";

interface FeatureCardProps {
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: FeatureCardProps) {

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setVisible(true);
          }, delay);
        }
      },
      {
        threshold: 0.2,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`feature-card ${visible ? "visible" : ""}`}
    >
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
  );
}
