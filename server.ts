import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API endpoint for Gemini generation
  app.post("/api/generate-ad", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "کلید دسترسی Gemini در سرور یافت نشد. لطفا در پنل تنظیمات آن را وارد کنید." });
      }

      const { type, model_name, targetType, customKeywords, companyDetails } = req.body;

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = "شما یک کارشناس ارشد بازاریابی دیجیتال، نویسنده تبلیغات خلاق و متخصص فروش خودرو (به‌ویژه برندهای کرمان موتور، مدیران خودرو، بهمن موتور، فردا موتور و غیره) هستید که به بازار ایران، اصطلاحات خودرویی و نحوه نگارش جذاب مسلط است. زبان پاسخ حتما روان، جذاب و فارسی باشد.";
      
      let prompt = `یک متن جذاب و خلاقانه برای ${targetType === 'divar' ? 'آگهی سایت دیوار' : targetType === 'instagram' ? 'کپشن پست اینستاگرام' : 'پیامک تبلیغاتی (SMS)'} بنویس.
مدل خودرو: ${model_name}
${customKeywords ? `کلیدواژه‌ها یا نکات خاص: ${customKeywords}` : ''}
${companyDetails ? `اطلاعات تماس یا شرکت: ${companyDetails}` : ''}

قوانین نگارش:
۱. برای دیوار: دارای یک عنوان بسیار جذاب و مهیج در اول متن، لیست مشخصات کلیدی به همراه وضعیت سند، حواله یا تحویل، و بخش دعوت به تماس با لحن حرفه‌ای و رسمی متمایز.
۲. برای اینستاگرام: دارای یک شروع طوفانی و جذاب برای قلاب کردن مخاطب (Hook)، توضیح کوتاه امکانات و جذابیت‌های خودرو، استفاده از ایموجی‌های مرتبط و پر انرژی، و هشتگ‌های پربازدید خودرویی ایرانی در انتهای متن.
۳. برای پیامک: متنی بسیار کوتاه، تاثیرگذار، خلاصه و همراه با دعوت به اقدام صریح (مثلا تماس با شماره یا مراجعه حضوری) که در قالب یک پیامک قرار بگیرد.

تمامی پاسخ‌ها کاملا خلاقانه، حرفه‌ای، دارای فضابندی مناسب و به شکل تمیز و خوانا مرتب شده باشند.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.85,
        }
      });

      const text = response.text || "";
      res.json({ result: text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "خطایی در پردازش درخواست توسط هوش مصنوعی رخ داد." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
