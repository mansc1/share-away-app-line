
import { useState, useRef } from 'react';

interface UseSwipeNavigationProps {
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const useSwipeNavigation = ({ totalPages, onPageChange }: UseSwipeNavigationProps) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const changePage = (newPage: number) => {
    if (isTransitioning) return;
    
    let targetPage = newPage;
    if (newPage >= totalPages) {
      targetPage = 0;
    } else if (newPage < 0) {
      targetPage = totalPages - 1;
    }
    
    setIsTransitioning(true);
    onPageChange(targetPage);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const touch = e.touches[0];
    const diffX = Math.abs(startX - touch.clientX);
    const diffY = Math.abs(startY - touch.clientY);
    
    // Only prevent default for horizontal swipes
    if (diffX > diffY) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const diffX = startX - endX;
    const diffY = Math.abs(startY - endY);
    const threshold = 50;
    
    // Only change pages for horizontal swipes (ignore vertical swipes)
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        changePage(getCurrentPage() + 1);
      } else {
        changePage(getCurrentPage() - 1);
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setStartY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    setStartX(e.clientX);
    setStartY(e.clientY);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const diffX = Math.abs(startX - e.clientX);
    const diffY = Math.abs(startY - e.clientY);
    
    // Only prevent default for horizontal movements
    if (diffX > diffY) {
      e.preventDefault();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || isTransitioning) return;
    
    const endX = e.clientX;
    const diffX = startX - endX;
    const diffY = Math.abs(startY - e.clientY);
    const threshold = 100;
    
    // Only change pages for horizontal movements
    if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        changePage(getCurrentPage() + 1);
      } else {
        changePage(getCurrentPage() - 1);
      }
    }
    
    setIsDragging(false);
    setStartX(0);
    setStartY(0);
  };

  // This will be set externally
  let getCurrentPage = () => 0;

  const setCurrentPageGetter = (getter: () => number) => {
    getCurrentPage = getter;
  };

  return {
    containerRef,
    isDragging,
    isTransitioning,
    changePage,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setCurrentPageGetter
  };
};
