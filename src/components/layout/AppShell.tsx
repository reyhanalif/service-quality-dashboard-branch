import { ReactNode } from 'react';
import { BarChart3, Users, TrendingUp, BookOpen } from 'lucide-react';
import clsx from 'clsx';

interface AppShellProps {
    children: ReactNode;
    activePage: 'executive' | 'obo' | 'metrics';
    onPageChange: (page: 'executive' | 'obo' | 'metrics') => void;
}

export function AppShell({ children, activePage, onPageChange }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 glass-strong border-b border-white/20">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo/Brand */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-slate-800">Service Quality Dashboard</h1>
                                <p className="text-xs text-slate-500">Transformation Program Monitor</p>
                            </div>
                        </div>

                        {/* Page Tabs */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg">
                            <button
                                onClick={() => onPageChange('executive')}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                                    activePage === 'executive'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                )}
                            >
                                <TrendingUp className="w-4 h-4" />
                                Strategic
                            </button>
                            <button
                                onClick={() => onPageChange('obo')}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                                    activePage === 'obo'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                )}
                            >
                                <Users className="w-4 h-4" />
                                Tactical (OBO)
                            </button>
                            <button
                                onClick={() => onPageChange('metrics')}
                                className={clsx(
                                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                                    activePage === 'metrics'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                                )}
                            >
                                <BookOpen className="w-4 h-4" />
                                Definitions
                            </button>
                        </div>

                        {/* Right side - date info */}
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-700">Data as of Dec 2025</p>
                            <p className="text-xs text-slate-500">Last updated: Today</p>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto px-6 py-6">
                {children}
            </main>
        </div>
    );
}
