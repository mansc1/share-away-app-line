
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useExpenses } from "@/hooks/useExpenses";
import { useTrip } from "@/contexts/TripContext";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import MainPage from "./pages/MainPage";
import DetailsPage from "./pages/DetailsPage";
import PaymentPage from "./pages/PaymentPage";
import ChatbotPage from "./pages/ChatbotPage";

const ExpenseApp = () => {
  const [currentPage, setCurrentPage] = useState('main');
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const { trip, loading: tripLoading, noTrip } = useTrip();
  const { 
    expenses, 
    loading, 
    addExpense, 
    updateExpense, 
    deleteExpense, 
    convertExpenseToCurrency,
    canModifyExpense 
  } = useExpenses();

  console.log('ExpenseApp - Current expenses:', expenses);
  console.log('ExpenseApp - Loading state:', loading);

  if (loading || tripLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (noTrip) {
    return <Navigate to="/trip/new" replace />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'main':
        return <MainPage expenses={expenses} onAddExpense={addExpense} addExpenseOpen={addExpenseOpen} onAddExpenseOpenChange={setAddExpenseOpen} />;
      case 'details':
        return (
          <DetailsPage 
            expenses={expenses} 
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
            onConvertExpense={convertExpenseToCurrency}
            canModifyExpense={canModifyExpense}
          />
        );
      case 'payment':
        return <PaymentPage expenses={expenses} />;
      case 'chatbot':
        return <ChatbotPage expenses={expenses} onRequestAddExpense={() => {
          setCurrentPage('main');
          setTimeout(() => setAddExpenseOpen(true), 100);
        }} />;
      default:
        return <MainPage expenses={expenses} onAddExpense={addExpense} addExpenseOpen={addExpenseOpen} onAddExpenseOpenChange={setAddExpenseOpen} />;
    }
  };

  const pages = ['หน้าแรก', 'รายละเอียด', 'หนี้สิน', 'AI ที่ปรึกษา'];
  const pageMap: { [key: string]: number } = {
    'main': 0,
    'details': 1,
    'payment': 2,
    'chatbot': 3
  };
  const reversePageMap = ['main', 'details', 'payment', 'chatbot'];

  const currentPageIndex = pageMap[currentPage] || 0;

  const handlePageChange = (pageIndex: number) => {
    const newPage = reversePageMap[pageIndex] || 'main';
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        pages={pages}
        currentPage={currentPageIndex}
        onPageChange={handlePageChange}
      />
      <main className="pt-16">
        <Routes>
          <Route 
            path="/" 
            element={renderCurrentPage()}
          />
        </Routes>
      </main>
      <BottomNavigation 
        pages={pages}
        currentPage={currentPageIndex} 
        onPageChange={handlePageChange} 
      />
      <Toaster />
    </div>
  );
};

export default ExpenseApp;
