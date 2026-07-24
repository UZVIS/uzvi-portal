import { ReactNode } from "react";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className= "flex h-screen bg-[#F4F6F8] font-sans overflow-hidden" >

        {/* 🌟 1. DARK SIDEBAR (Matches Image) */ }
        < aside className = "w-[280px] bg-[#1A1614] flex flex-col justify-between shrink-0 transition-all" >

            {/* Top Logo & Title */ }
            < div className = "p-5 flex items-center justify-between border-b border-white/5" >
                <div className="flex items-center space-x-3" >
                    <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-black text-xl shadow-lg" >
                        U
                        </div>
                        < div >
                        <h1 className="font-extrabold text-white text-[15px] tracking-wide leading-tight" > UZVI PORTAL </h1>
                            < p className = "text-[11px] text-[#F37021] font-bold tracking-wide" > Asset Management </p>
                                </div>
                                </div>
                                < button className = "w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition" >
                        & lt;
    </button>
        </div>

    {/* Sidebar Menu Items */ }
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2" >
        <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer transition" >
            <span className="text-lg" >⊞</span>
                < span className = "font-semibold text-[15px]" > Dashboard </span>
                    </div>

    {/* Active Menu with Orange Accent */ }
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#F37021] text-white shadow-md cursor-pointer" >
        <div className="flex items-center space-x-3" >
            <span className="text-lg" >📦</span>
                < span className = "font-semibold text-[15px]" > Assets </span>
                    </div>
                    < span > v </span>
                    </div>

                    < div className = "pl-6 space-y-1" >
                        <div className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm font-semibold cursor-pointer" >
                            Pending Returns
                                </div>
                                </div>
                                </div>

    {/* Bottom User Profile */ }
    <div className="p-4 border-t border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition" >
        <div className="flex items-center space-x-3" >
            <div className="w-10 h-10 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md" >
                AU
                </div>
                < div >
                <p className="text-sm font-bold text-white leading-tight" > Admin User </p>
                    < p className = "text-[11px] text-[#F37021] font-semibold" > Administrator </p>
                        </div>
                        </div>
                        < span className = "text-gray-500 font-bold" > v </span>
                            </div>
                            </aside>

    {/* 🌟 2. MAIN CONTENT AREA */ }
    <main className="flex-1 flex flex-col h-screen overflow-hidden" >

        {/* 🌟 3. DARK HEADER */ }
        < header className = "h-[72px] bg-[#1A1614] border-b border-white/5 flex items-center justify-between px-6 shrink-0" >
            <div className="flex items-center space-x-4" >
                <button className="text-gray-400 hover:text-white transition" >
                    <svg className="w-6 h-6" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" > <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = "2" d = "M4 6h16M4 12h16M4 18h16" > </path></svg >
                        </button>
                        < h2 className = "text-lg font-bold text-white tracking-wide" > Dashboard </h2>
                            </div>

                            < div className = "flex items-center space-x-5" >
                                {/* Date Widget */ }
                                < div className = "hidden md:flex items-center space-x-2 border border-white/10 bg-[#2A2421] rounded-xl px-4 py-2 text-sm font-semibold text-gray-300" >
                                    <span>📅</span>
                                        < span > 22 Jul 2026 </span>
                                            < span className = "text-gray-500 text-xs ml-2" > v </span>
                                                </div>

    {/* User Profile & Sign Out */ }
    <div className="flex items-center space-x-4 border-l border-white/10 pl-5" >
        <div className="flex items-center space-x-3" >
            <div className="w-9 h-9 bg-[#F37021] text-white rounded-full flex items-center justify-center font-bold text-sm" >
                AU
                </div>
                < div className = "hidden lg:block text-right" >
                    <p className="text-sm font-bold text-white leading-tight" > Admin User </p>
                        < p className = "text-[10px] text-gray-400" > Administrator </p>
                            </div>
                            </div>

                            < button className = "border border-white/10 text-gray-300 hover:text-white rounded-xl px-4 py-2 flex items-center space-x-2 text-sm font-semibold hover:bg-white/5 transition" >
                                <svg className="w-4 h-4" fill = "none" stroke = "currentColor" viewBox = "0 0 24 24" > <path strokeLinecap="round" strokeLinejoin = "round" strokeWidth = "2" d = "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" > </path></svg >
                                    <span className="hidden sm:inline" > Sign out </span>
                                        </button>
                                        </div>
                                        </div>
                                        </header>

    {/* 🌟 4. DYNAMIC PAGE CONTENT (నీ ఒరిజినల్ పేజీలు ఇక్కడ లోడ్ అవుతాయి) */ }
    <div className="flex-1 overflow-y-auto p-6 md:p-8" >
        { children }
        </div>
        </main>
        </div>
    );
}