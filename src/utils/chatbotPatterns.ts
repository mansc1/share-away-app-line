
import { Expense } from '@/types/expense';
import { ExpenseStats, formatCurrency, getCategoryLabel } from './expenseAnalyzer';

export interface ChatResponse {
  message: string;
  data?: any;
  type: 'text' | 'chart' | 'table';
}

export const processUserQuestion = (question: string, stats: ExpenseStats, expenses: Expense[]): ChatResponse => {
  const q = question.toLowerCase().trim();

  // รวมทั้งหมด / ยอดรวม
  if (q.includes('รวม') && (q.includes('ทั้งหมด') || q.includes('เท่าไหร่'))) {
    return {
      message: `ยอดรวมรายจ่ายทั้งหมด: ${formatCurrency(stats.totalAmount)} จากทั้งหมด ${expenses.length} รายการ`,
      type: 'text'
    };
  }

  // ใครจ่ายมากที่สุด
  if (q.includes('ใคร') && (q.includes('จ่าย') || q.includes('ใช้')) && q.includes('มาก')) {
    // Check if asking about specific category
    const categories = [
      { keyword: 'อาหาร', key: 'food', label: 'ค่าอาหาร' },
      { keyword: 'เดินทาง', key: 'travel', label: 'ค่าเดินทาง' },
      { keyword: 'ตั๋ว', key: 'ticket', label: 'ค่าตั๋ว' },
      { keyword: 'อื่น', key: 'other', label: 'อื่นๆ' }
    ];

    const foundCategory = categories.find(cat => q.includes(cat.keyword));
    
    if (foundCategory) {
      // Find who paid most in this category
      const categoryExpenses = expenses.filter(e => e.category === foundCategory.key);
      const categoryPersonTotals: Record<string, number> = {};
      
      categoryExpenses.forEach(expense => {
        categoryPersonTotals[expense.paidBy] = (categoryPersonTotals[expense.paidBy] || 0) + expense.amount;
      });

      if (Object.keys(categoryPersonTotals).length > 0) {
        const topPayer = Object.entries(categoryPersonTotals)
          .sort(([,a], [,b]) => b - a)[0];
        
        return {
          message: `${foundCategory.label}: ${topPayer[0]} จ่ายมากที่สุด ${formatCurrency(topPayer[1])} จากทั้งหมด ${categoryExpenses.length} รายการ`,
          data: categoryPersonTotals,
          type: 'chart'
        };
      } else {
        return {
          message: `ไม่มีรายจ่าย${foundCategory.label}`,
          type: 'text'
        };
      }
    } else {
      // General question about who paid most overall
      const topPayer = Object.entries(stats.personTotals)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topPayer) {
        return {
          message: `${topPayer[0]} จ่ายมากที่สุด: ${formatCurrency(topPayer[1])}`,
          data: stats.personTotals,
          type: 'chart'
        };
      }
    }
  }

  // รายจ่ายของคนใดคนหนึ่ง
  const personNames = ['แมน', 'น้องหนู', 'ยุ้ย', 'แอน', 'ปลา', 'ลิโอ', 'มด', 'ภัท'];
  const foundPerson = personNames.find(name => q.includes(name.toLowerCase()));
  
  if (foundPerson && q.includes('จ่าย')) {
    const amount = stats.personTotals[foundPerson] || 0;
    const personExpenses = expenses.filter(e => e.paidBy === foundPerson);
    return {
      message: `${foundPerson} จ่ายทั้งหมด: ${formatCurrency(amount)} จาก ${personExpenses.length} รายการ`,
      type: 'text'
    };
  }

  // ใครหนี้ใคร / ต้องคืนเงิน
  if ((q.includes('หนี้') || q.includes('คืน')) && q.includes('ใคร')) {
    if (stats.payments.length > 0) {
      const paymentList = stats.payments
        .map(p => `${p.from} ต้องจ่าย ${p.to}: ${formatCurrency(p.amount)}`)
        .join('\n');
      
      return {
        message: `การจ่ายเงินที่ต้องทำ:\n${paymentList}`,
        data: stats.payments,
        type: 'table'
      };
    } else {
      return {
        message: 'ไม่มีหนี้สินระหว่างกัน ทุกคนจ่ายครบแล้ว! 🎉',
        type: 'text'
      };
    }
  }

  // ค่าเฉลี่ย
  if (q.includes('เฉลี่ย')) {
    if (q.includes('คน')) {
      return {
        message: `ค่าเฉลี่ยต่อคน: ${formatCurrency(stats.averagePerPerson)}`,
        type: 'text'
      };
    }
    if (q.includes('วัน')) {
      return {
        message: `ค่าเฉลี่ยต่อวัน: ${formatCurrency(stats.averagePerDay)}`,
        type: 'text'
      };
    }
  }

  // หมวดหมู่
  const categories = ['เดินทาง', 'อาหาร', 'ตั๋ว', 'อื่น'];
  const foundCategory = categories.find(cat => q.includes(cat));
  
  if (foundCategory) {
    const categoryKey = {
      'เดินทาง': 'travel',
      'อาหาร': 'food', 
      'ตั๋ว': 'ticket',
      'อื่น': 'other'
    }[foundCategory];
    
    const amount = stats.categoryTotals[categoryKey!] || 0;
    return {
      message: `ค่า${foundCategory}รวม: ${formatCurrency(amount)}`,
      type: 'text'
    };
  }

  // วันที่ใช้เงินมากที่สุด
  if (q.includes('วัน') && q.includes('มาก')) {
    const topDay = Object.entries(stats.dailyTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topDay) {
      return {
        message: `วัน${topDay[0]} ใช้เงินมากที่สุด: ${formatCurrency(topDay[1])}`,
        type: 'text'
      };
    }
  }

  // รายจ่ายแพงที่สุด
  if (q.includes('แพง') && q.includes('สุด')) {
    if (stats.mostExpensiveExpense) {
      const exp = stats.mostExpensiveExpense;
      return {
        message: `รายจ่ายแพงที่สุด: ${exp.name} (${formatCurrency(exp.amount)}) จ่ายโดย${exp.paidBy} วัน${exp.date}`,
        type: 'text'
      };
    }
  }

  // รายจ่ายถูกที่สุด
  if (q.includes('ถูก') && q.includes('สุด')) {
    if (stats.cheapestExpense) {
      const exp = stats.cheapestExpense;
      return {
        message: `รายจ่ายถูกที่สุด: ${exp.name} (${formatCurrency(exp.amount)}) จ่ายโดย${exp.paidBy} วัน${exp.date}`,
        type: 'text'
      };
    }
  }

  // หมวดหมู่ไหนใช้มากที่สุด
  if (q.includes('หมวด') && q.includes('มาก')) {
    const topCategory = Object.entries(stats.categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      return {
        message: `หมวดหมู่ที่ใช้เงินมากที่สุด: ${getCategoryLabel(topCategory[0])} (${formatCurrency(topCategory[1])})`,
        data: stats.categoryTotals,
        type: 'chart'
      };
    }
  }

  // Default response with suggestions
  return {
    message: `ขอโทษครับ ผมไม่เข้าใจคำถาม "${question}"\n\nลองถามแบบนี้ดูครับ:\n• "รวมทั้งหมดเท่าไหร่?"\n• "ใครจ่ายมากที่สุด?"\n• "ใครจ่ายค่าอาหารมากที่สุด?"\n• "ใครจ่ายค่าเดินทางมากที่สุด?"\n• "ใครหนี้ใครบ้าง?"\n• "แมนจ่ายเท่าไหร่?"\n• "ค่าอาหารรวมเท่าไหร่?"\n• "วันไหนใช้เงินมากที่สุด?"`,
    type: 'text'
  };
};

export const getSuggestedQuestions = (): string[] => {
  return [
    "รวมทั้งหมดเท่าไหร่?",
    "ใครจ่ายมากที่สุด?", 
    "ใครจ่ายค่าอาหารมากที่สุด?",
    
    "ใครหนี้ใครบ้าง?",
    "ค่าเฉลี่ยต่อคนเท่าไหร่?",
    "ค่าอาหารรวมเท่าไหร่?",
    "วันไหนใช้เงินมากที่สุด?"
  ];
};
