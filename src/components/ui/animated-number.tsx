import React from "react";
import { useCountUp } from "@/hooks/useCountUp";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (value: number) => string | React.ReactNode;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  format,
  className,
}: AnimatedNumberProps) {
  const { value: animatedValue } = useCountUp(value, { duration });

  return (
    <span className={className}>
      {format ? format(animatedValue) : animatedValue}
    </span>
  );
}
