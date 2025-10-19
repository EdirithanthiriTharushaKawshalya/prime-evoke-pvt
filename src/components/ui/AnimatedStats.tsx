"use client";

import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { Stat } from "@/lib/types";

export function AnimatedStats({ stats }: { stats: Stat[] }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const parseValue = (value: string): number => {
    let num = parseFloat(value.replace(/k/i, ''));
    if (value.toLowerCase().includes('k')) {
      num *= 1000;
    }
    return isNaN(num) ? 0 : num;
  };

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-8">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-4xl font-bold">
            {inView ? (
              <CountUp
                start={0}
                end={parseValue(stat.value)}
                duration={2.5}
                separator=","
                decimals={stat.value.includes('.') ? 1 : 0}
                suffix={stat.value.includes('+') ? '+' : ''}
                // Determine prefix based on 'K' presence for formatting like 10K
                formattingFn={(value) => {
                  if (stat.value.toLowerCase().includes('k')) {
                    // Format as 10K, 11K etc.
                    return `${(value / 1000).toFixed(0)}K`;
                  }
                  // Otherwise, format normally with separator
                  return value.toLocaleString();
                }}
              />
            ) : (
              '0'
            )}
             {/* REMOVE this part: {stat.value.toLowerCase().includes('k') && 'K+'} */}
          </p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}