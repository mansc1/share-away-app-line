
import { Home, FileText, CreditCard, Bot } from 'lucide-react';

interface BottomNavigationProps {
  pages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

const BottomNavigation = ({ pages, currentPage, onPageChange }: BottomNavigationProps) => {
  const icons = [
    <Home size={20} />,
    <FileText size={20} />,
    <CreditCard size={20} />,
    <Bot size={20} />
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999]">
      <div className="max-w-md mx-auto flex">
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => onPageChange(index)}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              index === currentPage
                ? "text-blue-500 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className={`transition-colors ${
              index === currentPage ? "text-blue-500" : "text-gray-600"
            }`}>
              {icons[index]}
            </div>
            <span className="leading-tight">{page}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
