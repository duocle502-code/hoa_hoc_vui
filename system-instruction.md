# 🚀 YÊU CẦU TẠO ỨNG DỤNG WEB

## 📝 MÔ TẢ Ý TƯỞNG
Ứng dụng AR cho phép người dùng tương tác trực tiếp với các dụng cụ và hóa chất ảo trong môi trường 3D để thực hiện thí nghiệm hóa học và quan sát phản ứng tức thì. Giải pháp này giúp học sinh nắm vững kiến thức lý thuyết thông qua thực hành trực quan, đảm bảo an toàn tuyệt đối và tiết kiệm chi phí vật tư phòng thí nghiệm.

---
## ⚡ CHỨC NĂNG YÊU CẦU
- ✅ Mô phỏng đặt dụng cụ thí nghiệm như ống nghiệm, đèn cồn, cốc thủy tinh vào không gian thực qua AR
- ✅ Thư viện hóa chất ảo đa dạng với đầy đủ thông tin về tính chất, nồng độ và nhãn cảnh báo an toàn
- ✅ Thực hiện các thao tác tương tác như đổ, trộn, khuấy và đun nóng hóa chất bằng cử chỉ tay
- ✅ Hiển thị hiệu ứng phản ứng hóa học thời gian thực như đổi màu, kết tủa, sủi bọt khí hoặc cháy nổ
- ✅ Hệ thống bài giảng và kịch bản thí nghiệm bám sát chương trình sách giáo khoa của Bộ Giáo dục
- ✅ Hiển thị thông số chi tiết về nhiệt độ, áp suất và phương trình hóa học tương ứng khi phản ứng xảy ra
- ✅ Tính năng kiểm tra kiến thức và ghi chép báo cáo kết quả sau mỗi bài thí nghiệm

---
## 👥 ĐỐI TƯỢNG SỬ DỤNG
- 👤 Học sinh bậc Trung học cơ sở và Trung học phổ thông
- 👤 Giáo viên bộ môn Hóa học tại các trường phổ thông và trung tâm giáo dục
- 👤 Phụ huynh học sinh muốn hỗ trợ con em tự học và thực hành tại nhà

---
## 🎯 MỤC TIÊU ỨNG DỤNG
- 🎯 Xây dựng môi trường thực hành hóa học an toàn tuyệt đối, loại bỏ rủi ro cháy nổ và độc hại
- 🎯 Giảm thiểu tối đa chi phí mua sắm vật tư, hóa chất và bảo trì phòng thí nghiệm vật lý
- 🎯 Nâng cao hứng thú học tập và khả năng ghi nhớ kiến thức thông qua trải nghiệm trực quan sinh động
- 🎯 Hỗ trợ giáo viên trong việc minh họa các phản ứng phức tạp hoặc nguy hiểm khó thực hiện thực tế

---
## 🏆 KẾT QUẢ MONG MUỐN
- 🏆 Học sinh nắm vững lý thuyết và kỹ năng thực hành hóa học nhanh chóng và hiệu quả hơn
- 🏆 Gia tăng tỷ lệ học sinh yêu thích các môn học STEM tại Việt Nam
- 🏆 Tạo ra giải pháp học tập linh hoạt, cho phép thực hành mọi lúc mọi nơi chỉ với thiết bị di động

---
## 🛠️ YÊU CẦU KỸ THUẬT

### Công nghệ bắt buộc:
- **HTML5/CSS3/JavaScript ES6+** (Single Page Application)
- **Gemini AI API:** Tích hợp Gemini cho các tính năng AI thông minh
- **Responsive Design:** Mobile-first, hiển thị tốt trên mọi thiết bị
- **LocalStorage:** Lưu trữ dữ liệu, settings và API Key
- **Font tiếng Việt:** 'Be Vietnam Pro' (Google Fonts)
- **Icons:** FontAwesome 6

### Thư viện CDN phù hợp:
- **Marked.js:** Parse markdown response từ AI
- **SweetAlert2:** Thông báo popup đẹp mắt

### Mô hình dữ liệu (Data Schema):

```javascript
const AppData = {
  subjects: [{ id, name, icon, questionsCount }],
  questions: [{ id, subjectId, content, type, options, correctAnswer, explanation, difficulty }],
  sessions: [{ id, subjectId, score, totalQuestions, correctAnswers, timeSpent, date }],
  progress: { totalAttempts, averageScore, streakDays, weakTopics: [] },
  settings: { theme, soundEnabled, autoSave }
};
```

### Tích hợp Gemini AI:
```javascript
// Gọi Gemini API với fallback models
const MODELS = ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash'];

async function callGeminiAI(prompt, modelIndex = 0) {
  const API_KEY = localStorage.getItem('gemini_api_key');
  if (!API_KEY) { showToast('Vui lòng nhập API Key!', 'error'); return null; }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS[modelIndex]}:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
        })
      }
    );
    
    if (response.status === 429 && modelIndex < MODELS.length - 1) {
      return callGeminiAI(prompt, modelIndex + 1); // Fallback sang model tiếp theo
    }
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    if (modelIndex < MODELS.length - 1) return callGeminiAI(prompt, modelIndex + 1);
    showToast('Lỗi API: ' + error.message, 'error');
    return null;
  }
}
```

---

## 🎨 YÊU CẦU GIAO DIỆN CHI TIẾT

### Phong cách thiết kế:
- **Style:** Modern, Clean, tối giản nhưng cuốn hút
- **Màu sắc chủ đạo:** Gradient (#4A90E2 → #FF9500)
- **Background:** #f8fafc (Light) / #0f172a (Dark mode nếu có)
- **Text:** #1e293b (Primary) / #64748b (Secondary)
- **Success:** #10b981 | **Warning:** #f59e0b | **Error:** #ef4444
- **Bo góc:** Border-radius 12px-16px
- **Shadow:** `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`
- **Animation:** Smooth transitions (0.3s ease), micro-interactions

### Components cụ thể cho ứng dụng này:

- **Subject Cards:** Grid thẻ môn học/chủ đề với icon, progress
- **Question Card:** Thẻ hiển thị câu hỏi + lựa chọn đáp án
- **Score Board:** Bảng điểm với animation và badge
- **Progress Dashboard:** Dashboard tiến độ học tập tổng quan
- **AI Tutor Panel:** Khu vực chat với AI để giải đáp thắc mắc
- **Timer Widget:** Đồng hồ đếm ngược cho bài kiểm tra

### Responsive Breakpoints:
- **Mobile** (< 640px): Single column, bottom navigation
- **Tablet** (640-1024px): 2 columns, collapsible sidebar
- **Desktop** (> 1024px): Full layout với sidebar

---

## 🔄 USER FLOW (Luồng sử dụng)

1. Mở app → Nhập API Key → Chọn môn học/chủ đề
2. Bắt đầu học: Xem nội dung → Làm bài tập → Nhận phản hồi AI
3. Kiểm tra: Chọn đề → Làm bài có giới hạn thời gian → Xem kết quả chi tiết
4. Theo dõi tiến độ: Xem Dashboard → Biểu đồ tiến bộ → Gợi ý ôn tập từ AI

---

## 📋 OUTPUT BẮT BUỘC

Tạo ra **ứng dụng web hoàn chỉnh tích hợp Gemini AI** với:

### A. Cấu trúc:
- [ ] File `index.html` duy nhất chứa HTML + CSS + JS
- [ ] Code sạch, comment đầy đủ bằng tiếng Việt

### B. Tích hợp AI:
- [ ] Form nhập/lưu API Key (LocalStorage, type="password", toggle hiển thị)
- [ ] Danh sách chọn Model AI (gemini-3-flash, gemini-3-pro, gemini-2.5-flash)
- [ ] Cơ chế fallback tự động khi model gặp lỗi
- [ ] Xử lý lỗi API (Rate limit 429, Invalid key, Network error) với thông báo tiếng Việt
- [ ] Loading states (spinner/skeleton) khi đang gọi AI

### C. Dữ liệu & UX:
- [ ] Dữ liệu mẫu (Demo data) đủ để demo ngay tất cả tính năng
- [ ] Backup/Restore dữ liệu (Export JSON, Import file)
- [ ] Responsive hoàn toàn trên mobile/tablet/desktop
- [ ] Empty states thân thiện khi chưa có dữ liệu
- [ ] Validation form đầy đủ

### D. Triển khai:
- [ ] Chạy được ngay khi mở file HTML trong trình duyệt
- [ ] Tương thích Vercel deployment
- [ ] Nút Settings API Key kèm hướng dẫn luôn hiển thị trên Header

---

## 🚀 BẮT ĐẦU TẠO APP!

Hãy tạo app "🎓 App Ứng dụng AR cho phép người dùng tương tác trực tiế..." với tất cả các tính năng và yêu cầu trên.

**Lưu ý quan trọng:**
1. App phải tích hợp Gemini AI và chạy được ngay khi mở file HTML
2. Dữ liệu mẫu phải đủ để demo tất cả tính năng chính
3. Giao diện phải WOW người dùng ngay từ lần đầu mở app
4. Code phải có comment tiếng Việt và dễ maintain
5. Xử lý edge cases: API lỗi, dữ liệu rỗng, mất mạng
