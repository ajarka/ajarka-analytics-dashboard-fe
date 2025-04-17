import { Component, JSX, createSignal } from 'solid-js';
import { Navbar } from './Navbar';
import { useLocation, A } from '@solidjs/router'; 
import { 
    FaSolidChartLine, 
    FaSolidUsers, 
    FaSolidChartBar,
    FaSolidCalendar,
    FaSolidChevronRight,
    FaSolidChevronLeft,
    FaSolidNetworkWired,
    FaSolidTableList,
    FaSolidBusinessTime
} from 'solid-icons/fa';

interface MainLayoutProps {
    children: JSX.Element;
    onRefresh: () => void;
    lastUpdate: () => string;
}

export const MainLayout: Component<MainLayoutProps> = (props) => {
    const location = useLocation();
    const currentPath = () => location.pathname;
    const isActive = (path: string) => currentPath() === path;
    const [isCollapsed, setIsCollapsed] = createSignal(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false);

    return (
        <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
            <Navbar
                onRefresh={props.onRefresh}
                lastUpdate={props.lastUpdate}
                onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen())}
                isMobileMenuOpen={isMobileMenuOpen()}
            />

            <div class="flex pt-16">
                {/* Desktop Sidebar */}
                <aside class={`
                    ${isCollapsed() ? 'w-20' : 'w-64'}
                    h-[calc(100vh-4rem)]
                    fixed top-16 left-0
                    bg-gradient-to-b from-white/90 via-blue-50/80 to-purple-50/80
                    dark:from-gray-900/90 dark:via-blue-900/20 dark:to-purple-900/20
                    backdrop-blur-xl
                    border-r border-blue-900/10 dark:border-blue-300/10
                    transition-all duration-300 ease-in-out
                    overflow-x-hidden
                    overflow-y-auto
                    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-900/20
                    hidden lg:block
                    z-30
                `}>
                    {/* Collapse/Expand Button - Repositioned to top */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed())}
                        class="
                            absolute top-6 -right-2.5
                            w-9 h-10
                            flex items-center justify-center
                            rounded-l-full rounded-r-none
                            bg-gradient-to-r from-blue-600 to-blue-600
                            dark:from-blue-500 dark:to-blue-500
                            text-white
                            shadow-lg shadow-blue-900/20
                            hover:scale-110
                            transition-all duration-200
                            border border-white/20
                            overflow-hidden
                            before:content-['']
                            before:absolute
                            before:w-full
                            before:h-full
                            before:rounded-r-full
                            before:bg-gradient-to-r
                            before:from-blue-600
                            before:to-blue-600
                            before:dark:from-blue-500
                            before:dark:to-blue-500
                            before:-translate-x-1/2
                        "
                    >
                        {isCollapsed() ? 
                            <FaSolidChevronRight style={{'font-size' : '10px'}} class=" relative z-10" /> : 
                            <FaSolidChevronLeft style={{'font-size' : '10px'}} class=" relative z-10" />
                        }
                    </button>

                    {/* Navigation Menu - Spacing diperbaiki */}
                    <nav class="space-y-1 p-3">
                        <A 
                            href="/dashboard"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-100
                                group
                                ${isActive('/dashboard') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-blue-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/dashboard') ? 'bg-white/20' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidChartLine class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Progress Overview</span>}
                        </A>

                        <A 
                            href="/utilization"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/utilization') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-purple-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/utilization') ? 'bg-white/20' : 'bg-purple-500/10 group-hover:bg-purple-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidUsers class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Resource Utilization</span>}
                        </A>

                        <A 
                            href="/analysis"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/analysis') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-pink-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-red-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/analysis') ? 'bg-white/20' : 'bg-pink-500/10 group-hover:bg-pink-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidChartBar class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Comparative Analysis</span>}
                        </A>

                        <A 
                            href="/calendar"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/calendar') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-yellow-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/calendar') ? 'bg-white/20' : 'bg-orange-500/10 group-hover:bg-orange-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidCalendar class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Team Calendar</span>}
                        </A>
                        <A 
                            href="/mapping-resource"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/mapping-resource') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-green-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/mapping-resource') ? 'bg-white/20' : 'bg-green-500/10 group-hover:bg-green-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidNetworkWired class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Mapping Resource</span>}
                        </A>
                        <A 
                            href="/resource-load"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/resource-load') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-red-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/resource-load') ? 'bg-white/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidTableList class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Activity Overview</span>}
                        </A>

                        <A 
                            href="/project-time"
                            class={`
                                flex items-center ${isCollapsed() ? 'justify-center' : 'space-x-3 px-4'} 
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/project-time') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-gray-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                        >
                            <div class={`
                                ${isCollapsed() ? 'w-10 h-10' : 'w-8 h-8'}
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/project-time') ? 'bg-white/20' : 'bg-gray-500/10 group-hover:bg-gray-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidBusinessTime class="w-4 h-4" />
                            </div>
                            {!isCollapsed() && <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Project Timelines</span>}
                        </A>
                        
                    </nav>
                </aside>

                {/* Mobile Sidebar */}
                <aside class={`
                    w-64
                    h-[calc(100vh-4rem)]
                    fixed top-16 left-0
                    bg-gradient-to-b from-white/90 via-blue-50/80 to-purple-50/80
                    dark:from-gray-900/90 dark:via-blue-900/20 dark:to-purple-900/20
                    backdrop-blur-xl
                    border-r border-blue-900/10 dark:border-blue-300/10
                    transition-all duration-300 ease-in-out
                    overflow-x-hidden
                    overflow-y-auto
                    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-900/20
                    lg:hidden
                    z-40
                    ${isMobileMenuOpen() ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    {/* Mobile Navigation Menu */}
                    <nav class="space-y-1 p-3">
                        <A 
                            href="/dashboard"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-100
                                group
                                ${isActive('/dashboard') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-blue-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/dashboard') ? 'bg-white/20' : 'bg-blue-500/10 group-hover:bg-blue-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidChartLine class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Progress Overview</span>
                        </A>

                        <A 
                            href="/utilization"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/utilization') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-purple-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/utilization') ? 'bg-white/20' : 'bg-purple-500/10 group-hover:bg-purple-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidUsers class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Resource Utilization</span>
                        </A>

                        <A 
                            href="/analysis"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/analysis') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-pink-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-red-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/analysis') ? 'bg-white/20' : 'bg-pink-500/10 group-hover:bg-pink-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidChartBar class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Comparative Analysis</span>
                        </A>

                        <A 
                            href="/calendar"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/calendar') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-yellow-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/calendar') ? 'bg-white/20' : 'bg-orange-500/10 group-hover:bg-orange-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidCalendar class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Team Calendar</span>
                        </A>
                        <A 
                            href="/mapping-resource"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/mapping-resource') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-green-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/mapping-resource') ? 'bg-white/20' : 'bg-green-500/10 group-hover:bg-green-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidNetworkWired class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Mapping Resource</span>
                        </A>
                        <A 
                            href="/resource-load"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/resource-load') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-red-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/resource-load') ? 'bg-white/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidTableList class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Activity Overview</span>
                        </A>

                        <A 
                            href="/project-time"
                            class={`
                                flex items-center space-x-3 px-4
                                py-3 rounded-xl
                                transition-all duration-200
                                group
                                ${isActive('/project-time') ? 
                                    'bg-gradient-to-r from-[#2066ff] to-[#103cb8] text-white shadow-lg shadow-orange-900/20' : 
                                    'hover:bg-gradient-to-r hover:from-gray-500/10 hover:to-white-500/10 text-gray-700 dark:text-gray-300'}
                            `}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <div class={`
                                w-8 h-8
                                flex items-center justify-center
                                rounded-lg
                                ${isActive('/project-time') ? 'bg-white/20' : 'bg-gray-500/10 group-hover:bg-gray-500/20'}
                                transition-all duration-300
                                group-hover:scale-110
                            `}>
                                <FaSolidBusinessTime class="w-4 h-4" />
                            </div>
                            <span class="font-bold" style={{'font-size': '0.9rem','font-family': 'Figtree'}}>Project Timelines</span>
                        </A>
                    </nav>
                </aside>

                {/* Overlay untuk mobile */}
                <div 
                    class={`
                        fixed inset-0 bg-black/50 backdrop-blur-sm z-30
                        lg:hidden
                        transition-opacity duration-300
                        ${isMobileMenuOpen() ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Main Content Area */}
                <main class={`
                    w-full 
                    ${isCollapsed() ? 'lg:ml-20' : 'lg:ml-64'}
                    p-4 lg:p-4
                    transition-all duration-300
                `}>
                    <div class="
                        max-w-9xl mx-auto
                        bg-gradient-to-br from-white/80 via-white/70 to-white/80
                        dark:from-gray-800/80 dark:via-gray-800/70 dark:to-gray-800/80
                        backdrop-blur-xl
                        rounded-2xl
                        shadow-xl shadow-blue-900/5 dark:shadow-black/20
                        border border-blue-900/10 dark:border-blue-300/10
                        p-4 lg:p-6
                        transition-all duration-300
                    ">
                        {props.children}
                    </div>
                </main>
            </div>
        </div>
    );
};