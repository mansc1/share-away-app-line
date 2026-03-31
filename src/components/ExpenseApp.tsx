
import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useExpenses } from "@/hooks/useExpenses";
import { useTrip } from "@/contexts/TripContext";
import AppHeader from "./AppHeader";
import BottomNavigation from "./BottomNavigation";
import MainPage from "./pages/MainPage";
import DetailsPage from "./pages/DetailsPage";
import PaymentPage from "./pages/PaymentPage";
import ChatbotPage from "./pages/ChatbotPage";

const isSupportedTab = (value: string | null): value is "main" | "details" | "payment" | "chatbot" => {
  return value === "main" || value === "details" || value === "payment" || value === "chatbot";
};

const ExpenseApp = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedOpen = searchParams.get("open");
  const initialPage = useMemo(() => {
    return isSupportedTab(requestedTab) ? requestedTab : "main";
  }, [requestedTab]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [addExpenseOpen, setAddExpenseOpen] = useState(requestedOpen === "add-expense");
  const { trip, loading: tripLoading, noTrip, isTripSwitching } = useTrip();
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

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setAddExpenseOpen(requestedOpen === "add-expense");
  }, [requestedOpen]);

  const updateQueryState = (nextPage: string, nextOpen: boolean) => {
    const params = new URLSearchParams(searchParams);

    if (nextPage === "main") {
      params.delete("tab");
    } else {
      params.set("tab", nextPage);
    }

    if (nextOpen) {
      params.set("open", "add-expense");
    } else {
      params.delete("open");
    }

    setSearchParams(params, { replace: true });
  };

  const handleAddExpenseOpenChange = (open: boolean) => {
    setAddExpenseOpen(open);
    updateQueryState(currentPage, open);
  };

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
        return <MainPage expenses={expenses} onAddExpense={addExpense} addExpenseOpen={addExpenseOpen} onAddExpenseOpenChange={handleAddExpenseOpenChange} actionsDisabled={isTripSwitching} />;
      case 'details':
        return (
          <DetailsPage 
            expenses={expenses} 
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
            onConvertExpense={convertExpenseToCurrency}
            canModifyExpense={canModifyExpense}
            actionsDisabled={isTripSwitching}
          />
        );
      case 'payment':
        return <PaymentPage expenses={expenses} actionsDisabled={isTripSwitching} />;
      case 'chatbot':
        return <ChatbotPage expenses={expenses} onRequestAddExpense={() => {
          setCurrentPage('main');
          updateQueryState('main', false);
          setTimeout(() => handleAddExpenseOpenChange(true), 100);
        }} />;
      default:
        return <MainPage expenses={expenses} onAddExpense={addExpense} addExpenseOpen={addExpenseOpen} onAddExpenseOpenChange={handleAddExpenseOpenChange} actionsDisabled={isTripSwitching} />;
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
    updateQueryState(newPage, addExpenseOpen);
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
      {isTripSwitching && (
        <div className="fixed inset-0 z-40 bg-white/65 backdrop-blur-[1px]">
          <div className="mx-auto flex h-full max-w-md items-center justify-center px-6">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-center shadow-xl">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-b-transparent" />
              <p className="mt-3 text-sm font-medium text-slate-900">กำลังสลับทริป</p>
              <p className="mt-1 text-xs text-slate-500">ล็อกการแก้ไขชั่วคราวเพื่อให้ข้อมูลทุกส่วนตรงกัน</p>
            </div>
          </div>
        </div>
      )}
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
