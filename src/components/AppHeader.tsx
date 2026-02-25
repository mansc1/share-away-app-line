import { LogOut } from "lucide-react";
import { useLineAuth } from "@/contexts/LineAuthContext";

interface AppHeaderProps {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

const AppHeader = ({ 
  pages, 
  currentPage, 
  onPageChange 
}: AppHeaderProps) => {
  const { user, isAuthenticated, logout } = useLineAuth();

  return (
    <div className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            แชร์ค่าใช้จ่าย
          </h1>
          {isAuthenticated && (
            <div className="flex items-center gap-2">
              {user?.avatar_url && (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              )}
              <span className="text-sm text-gray-600 hidden sm:inline">{user?.display_name}</span>
              <button onClick={logout} className="p-1.5 text-gray-400 hover:text-gray-600" title="ออกจากระบบ">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex justify-center mt-4">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => onPageChange(index)}
              className={`mx-1 w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentPage 
                  ? "bg-blue-500 w-6" 
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
