import { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'strong' | 'subtle';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export function GlassCard({
    children,
    className,
    variant = 'default',
    padding = 'md',
    hover = false,
}: GlassCardProps) {
    return (
        <div
            className={clsx(
                'rounded-xl transition-all duration-200',
                {
                    // Variants
                    'glass': variant === 'default',
                    'glass-strong': variant === 'strong',
                    'bg-white/50 backdrop-blur-sm border border-white/20': variant === 'subtle',
                    // Padding
                    'p-0': padding === 'none',
                    'p-3': padding === 'sm',
                    'p-5': padding === 'md',
                    'p-6': padding === 'lg',
                    // Hover
                    'hover:shadow-glass-lg hover:scale-[1.01] cursor-pointer': hover,
                },
                className
            )}
        >
            {children}
        </div>
    );
}
