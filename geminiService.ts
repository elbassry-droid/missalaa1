
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Transaction } from "../types";

export const getAIInsights = async (
  students: Student[],
  transactions: Transaction[]
) => {
  // Initialize AI client inside the function to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    أنت مستشار تعليمي متخصص لـ "سنتر مس آلاء نجيب". المركز متخصص في مادة واحدة وتديره مس آلاء بنفسها.
    قم بتحليل هذه البيانات:
    - عدد الطلاب الإجمالي: ${students.length}
    - الحالات المعفية: ${students.filter(s => s.isExempted).length}
    - إجمالي الامتحانات المسجلة: ${students.reduce((acc, s) => acc + s.grades.length, 0)}
    - صافي الربح الحالي: ${transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)} ج.م

    بناءً على أن مس آلاء هي المعلمة الوحيدة، قدم:
    1. تحليل للوضع الحالي وكيفية إدارة ضغط العمل.
    2. 3 نصائح لتحسين درجات الطلاب في مادتها.
    3. 3 نصائح مالية لزيادة كفاءة السنتر.
    
    الرد يجب أن يكون بتنسيق JSON حصراً.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            currentStatus: { type: Type.STRING },
            financialTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            educationalTips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['currentStatus', 'financialTips', 'educationalTips']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
        currentStatus: "خطأ في الاتصال بالذكاء الاصطناعي.",
        financialTips: [],
        educationalTips: []
    };
  }
};
