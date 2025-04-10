import { Component, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { useRateLimit } from '../../context/RateLimitContext';
import { getProjectCacheStatus } from '../../services/github';
import { HStack } from '@hope-ui/solid';
import { CacheStatus } from '../UI/CacheStatus';
import { FaSolidBars } from 'solid-icons/fa';

interface NavbarProps {
    onRefresh: () => void;
    lastUpdate: () => string;
    onMobileMenuToggle?: () => void;
    isMobileMenuOpen?: boolean;
}

export const Navbar: Component<NavbarProps> = (props) => {
    const { rateLimitData } = useRateLimit();
    const cacheStatus = getProjectCacheStatus();

    createEffect(() => {
        console.log('Rate Limit Changed:', rateLimitData());
        console.log('Cache Status Changed:', cacheStatus);
    });

    return (
        <nav class="fixed top-0 left-0 right-0 z-50">
            <div class="
                absolute inset-0 
                bg-gradient-to-r from-[#003ec8] to-[#103cb8] text-white shadow-lg shadow-blue-900/20
                dark:from-blue-900/95 dark:via-blue-800/95 dark:to-purple-800/95
                backdrop-blur-xl
                border-b border-blue-700/20 dark:border-blue-300/10
                shadow-lg shadow-blue-900/10
            "></div>

            <div class="container mx-auto px-4 relative">
                <div class="flex justify-between items-center h-16">
                    <button
                        onClick={() => props.onMobileMenuToggle?.()}
                        class="
                            lg:hidden
                            w-10 h-10
                            flex items-center justify-center
                            rounded-lg
                            text-white
                            hover:bg-white/10
                            transition-all duration-200
                        "
                    >
                        <FaSolidBars class="w-5 h-5" />
                    </button>

                    <div class="flex items-center space-x-4">
                        <A 
                            href="/" 
                            class="flex items-center space-x-3 group"
                        >
                            <div class="
                                w-10 h-10 
                                rounded-xl
                                bg-gradient-to-br from-cyan-400 to-blue-600
                                p-0.5
                                transition-all duration-300
                                group-hover:scale-105
                                group-hover:shadow-lg group-hover:shadow-cyan-400/25
                            ">
                                <div class="
                                    w-full h-full 
                                    rounded-lg
                                    bg-white dark:bg-gray-900
                                    flex items-center justify-center
                                    overflow-hidden
                                ">
                                    <img 
                                        src="https://avatars.githubusercontent.com/u/189189758?s=400&u=bc2486799b62f31fa84c1dcf4d6fdeee4b46abf4&v=4" 
                                        alt="Logo"
                                        class="w-8 h-8 object-cover transform group-hover:scale-110 transition-transform"
                                    />
                                </div>
                            </div>
                            <span class="
                                text-xl font-bold text-white
                                lg:text-xl
                                md:text-lg
                                sm:text-base
                                xs:text-sm
                            " style={{ 'font-family': 'Figtree' }}>
                                <span class="hidden lg:inline">Smartelco Progress</span>
                                <span class="lg:hidden">Smartelco</span>
                            </span>
                        </A>

                        <a 
                            href="https://github.com/Smartelco"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="
                                flex items-center space-x-2 px-4 py-2
                                text-sm font-medium
                                text-blue-100 dark:text-blue-200
                                hover:text-white
                                rounded-lg
                                transition-all duration-200
                                hover:bg-white/10
                            "
                        >
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                            </svg>
                            <span class="hidden lg:inline" style={{ 'font-family': 'Figtree' }}>View Organization</span>
                        </a>
                    </div>

                    <HStack spacing="$4" alignItems="center">
                        {cacheStatus && rateLimitData() && (
                            <div class="
                                hidden lg:block
                                px-4 py-2
                                bg-white/10 dark:bg-white/5
                                backdrop-blur-lg
                                rounded-lg
                                border border-white/20
                                text-white
                            ">
                                <CacheStatus
                                    lastUpdate={cacheStatus.timestamp}
                                    expiresAt={cacheStatus.expiresAt}
                                    rateLimit={rateLimitData()}
                                    onRefresh={props.onRefresh}
                                    compact={true}
                                />
                            </div>
                        )}
                    </HStack>
                </div>
            </div>
        </nav>
    );
};