import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
    placeholder?: string;
}

export function Select({
    label,
    value,
    onChange,
    options,
    className,
    placeholder = 'Select...',
}: SelectProps) {
    return (
        <div className={clsx('flex flex-col gap-1', className)}>
            {label && (
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={clsx(
                        'appearance-none w-full px-3 py-2 pr-8',
                        'bg-white/70 backdrop-blur-sm',
                        'border border-slate-200/60 rounded-lg',
                        'text-sm text-slate-700',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50',
                        'transition-all duration-200',
                        'cursor-pointer'
                    )}
                >
                    <option value="">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
        </div>
    );
}
