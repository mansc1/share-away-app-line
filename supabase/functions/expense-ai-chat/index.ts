import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Expense AI Chat function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, expenses, stats, currencyInfo, conversationContext } = await req.json();
    
    console.log('Received request:', { 
      question, 
      expensesCount: expenses?.length, 
      currencyInfo,
      hasContext: !!conversationContext 
    });

    if (!question) {
      throw new Error('Question is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Format expense data for AI context
    const expensesSummary = expenses?.map((expense: any) => {
      const baseInfo = `${expense.name} - ${expense.amount} หยวน - จ่ายโดย: ${expense.paidBy} - แบ่งกัน: ${expense.sharedBy.join(', ')} - หมวด: ${expense.category} - วันที่: ${expense.date}`;
      if (expense.hasThbConversion && expense.thbAmount) {
        return `${baseInfo} (แปลงเป็น ${expense.thbAmount} บาทแล้ว)`;
      }
      return baseInfo;
    }).join('\n') || 'ไม่มีข้อมูลรายจ่าย';

    const totalAmount = stats?.totalAmount || 0;
    const totalExpenses = expenses?.length || 0;
    const convertedCount = currencyInfo?.convertedCount || 0;
    const totalThb = currencyInfo?.totalThb || 0;

    const systemPrompt = `คุณเป็น AI ที่ปรึกษาด้านรายจ่าย มีความจำและสามารถตอบแบบต่อเนื่องได้

ข้อมูลรายจ่าย:
- จำนวนรายการทั้งหมด: ${totalExpenses} รายการ
- ยอดรวมเป็นหยวน: ${totalAmount} หยวน
- รายการที่แปลงเป็นบาทแล้ว: ${convertedCount} รายการ
${totalThb > 0 ? `- ยอดรวมเป็นบาท: ${totalThb} บาท` : ''}
- อัตราแลกเปลี่ยน: 1 หยวน = 4.7 บาท

รายละเอียด:
${expensesSummary}

${conversationContext ? `\n${conversationContext}` : ''}

หลักการตอบ:
1. ตอบเป็นภาษาไทย กระชับ ตรงประเด็น
2. ใช้บริบทการสนทนาก่อนหน้าในการตอบ
3. เข้าใจคำถามที่อ้างอิงถึงคำถามก่อนหน้า เช่น "แล้วคนอื่นล่ะ?" "หมวดอื่นล่ะ?"
4. ระบุสกุลเงินให้ชัด (หยวน/บาท)
5. ตอบคำถามต่อเนื่องได้โดยใช้บริบทที่มี
6. หากไม่เข้าใจบริบท ให้ถามกลับแบบกระชับ`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'เครดิต AI หมด กรุณาเติมเครดิต' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response generated successfully');

    return new Response(JSON.stringify({ 
      message: aiResponse,
      type: 'text'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in expense-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
