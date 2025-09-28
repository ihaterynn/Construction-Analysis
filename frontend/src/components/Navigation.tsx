"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  CloudArrowUpIcon, 
  EyeIcon, 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon 
} from "@heroicons/react/24/outline";

const Navigation = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: HomeIcon },
    { href: "/upload", label: "Upload", icon: CloudArrowUpIcon },
    { href: "/review", label: "Review", icon: EyeIcon },
    { href: "/chat", label: "AI Chat", icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 axium-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Axium Industries
              </h1>
              <p className="text-sm text-gray-500">Construction Site Analysis</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link flex items-center space-x-2 ${
                      isActive ? "active" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div className="flex items-center">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Cog6ToothIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex items-center space-x-2 block ${
                    isActive ? "active" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;