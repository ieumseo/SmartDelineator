import { LayoutDashboard, AlertTriangle, Radio, FileText, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'delineators', label: 'Delineators', icon: Radio },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-6 gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        
        return (
          <motion.button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className="relative w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 group transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-blue-50 rounded-xl border border-blue-200"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            <Icon 
              className={`h-5 w-5 relative z-10 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-400 group-hover:text-blue-500'
              }`}
            />
            <span className={`text-[10px] relative z-10 transition-colors ${
              isActive 
                ? 'text-blue-600' 
                : 'text-gray-500 group-hover:text-blue-500'
            }`}>
              {item.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
