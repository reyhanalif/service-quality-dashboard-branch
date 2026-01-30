import clsx from 'clsx';

type Status = 'Improving' | 'Stagnant' | 'Declining';

interface StatusBadgeProps {
    status: Status;
    size?: 'sm' | 'md';
}

const statusConfig = {
    Improving: { class: 'status-improving', label: 'Improving' },
    Stagnant: { class: 'status-stagnant', label: 'Stagnant' },
    Declining: { class: 'status-declining', label: 'Declining' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <span
            className={clsx(
                'inline-flex items-center rounded-full font-medium',
                config.class,
                {
                    'px-2 py-0.5 text-xs': size === 'sm',
                    'px-3 py-1 text-sm': size === 'md',
                }
            )}
        >
            {config.label}
        </span>
    );
}
