import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ListTodo, Settings, Menu, LogOut, Bell, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function AdminLayout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const menuItems = [
        { name: "대시보드", path: "/admin", icon: LayoutDashboard },
        { name: "요청 관리", path: "/admin/requests", icon: ListTodo },
        { name: "마스터 관리", path: "/admin/master", icon: Database },
        { name: "설정", path: "/admin/settings", icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className={cn(
                "bg-white shadow-md transition-all duration-300 flex flex-col z-20",
                isSidebarOpen ? "w-64" : "w-20"
            )}>
                <div className="p-4 flex items-center justify-between border-b">
                    <div className={cn("font-bold text-xl text-blue-600 flex items-center gap-2", !isSidebarOpen && "justify-center w-full")}>
                        {isSidebarOpen ? "Smart Maint." : "SM"}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-600 hover:bg-gray-50",
                                !isSidebarOpen && "justify-center px-0"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {isSidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t">
                    <button className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg",
                        !isSidebarOpen && "justify-center px-0"
                    )}>
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span>로그아웃</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 z-10">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="flex items-center gap-4">
                        <button className="relative p-2 hover:bg-gray-100 rounded-full">
                            <Bell className="w-5 h-5 text-gray-600" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                AD
                            </div>
                            <span className="text-sm font-medium text-gray-700">관리자(김정비)</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
