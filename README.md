# vocabulary-web# 🧠 DSA Dictionary Backend (FastAPI)
Backend từ điển ứng dụng các cấu trúc dữ liệu & thuật toán:
- Trie → Search, prefix suggestion, autocomplete  
- Circular Linked List → Flashcard (learn / remember / forget)  
- Stack → Search history  
- Levenshtein Distance → Auto-correct  
- External Dictionary API Loader → không cần tạo database  

---

## 🚀 1. Yêu cầu môi trường

- Python 3.10+  
- pip (package manager)

---

## 📦 2. Cài đặt dependencies

Chạy lệnh:

```bash
pip install -r requirements.txt

3. Chạy server FastAPI
```
Đảm bảo bạn đang đứng trong thư mục chứa main.py.

uvicorn main:app --reload


Nếu chạy thành công, bạn sẽ thấy:

Uvicorn running on http://127.0.0.1:8000