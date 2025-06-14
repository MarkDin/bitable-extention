import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const TabNavigation = () => {
  const [location] = useLocation();

  const tabs = [
    { path: "/auto-complete", label: "字段自动补全" }
  ];

  // Default to auto-complete if on root path
  const currentPath = location === "/" ? "/auto-complete" : location;

  return (
    <div className="px-4 border-b border-[#E5E6EB]">
      <nav className="flex space-x-4">
        {tabs.map((tab) => (
          <div key={tab.path}>
            <Link href={tab.path}>
              <span className={cn(
                "py-3 text-sm font-medium cursor-pointer inline-block",
                currentPath === tab.path
                  ? "border-b-2 border-primary text-primary"
                  : "text-[#86909C]"
              )}>
                {tab.label}
              </span>
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;
