# 📁 បណ្តុំឯកសារវិភាគ និងផែនការកែលម្អប្រព័ន្ធ Database (Database Documentation Hub)

ថតឯកសារ `database-config/` នេះត្រូវបានបង្កើតឡើងសម្រាប់ផ្ទុកនូវរាល់ឯកសារវិភាគស៊ីជម្រៅ (Deep Analysis), ដ្យាក្រាមទិន្នន័យ (Re-designed ERD), និងផែនការដោះស្រាយកែលម្អ (Implementation Plans) ទាំងអស់ដែលត្រូវបានបង្កើតឡើងនៅលើ git branch `database-config`។

---

## 📑 បញ្ជីឯកសារទាំងអស់ក្នុងថតនេះ (Document Index)

| ឈ្មោះឯកសារ (File Name) | ប្រធានបទ / គោលបំណង (Topic & Purpose) | ស្ថានភាព (Status) |
| :--- | :--- | :--- |
| **[database-analysis.md](file:///d:/Desktop/Restaurant-Ordering-System/database-config/database-analysis.md)** | **ឯកសារមេប្រព័ន្ធទិន្នន័យទូលំទូលាយ (Master Single Source of Truth):**<br>• ទិដ្ឋភាពទូទៅនៃ Database Engine (`node:sqlite`, WAL mode, Foreign keys)<br>• ដ្យាក្រាមទំនាក់ទំនងទិន្នន័យពិត (Re-designed Mermaid ERD: ឈ្មោះនៅឆ្វេង ➔ ប្រភេទនៅស្តាំ)<br>• រចនាសម្ព័ន្ធតារាងទាំង ៧ តាមស្តង់ដារ SQL អន្តរជាតិ [ឈ្មោះនៅមុខ ឆ្វេង ➔ ប្រភេទនៅក្រោយ ស្តាំ]<br>• គោលដៅទិន្នន័យ និងចំនួនជួរជាក់ស្តែង (Live Rows & Counts: 154 rows)<br>• ដែនកំណត់ និងលក្ខខណ្ឌសុពលភាពទិន្នន័យ (Data Constraints & Engine Limitations)<br>• វដ្តជីវិត Order & Table State Transitions<br>• ការផ្សារភ្ជាប់រវាងកូដ និងទិន្នន័យ (Feature & Code Mapping)<br>• ប្រវត្តិនៃការដោះស្រាយបញ្ហាទាំង ១១ ចំណុច + ការកែលម្អ ៥ ដំណាក់កាល (v3.0) | 🌟 ឯកសារមេផ្លូវការ (Single Source of Truth) |
| **[api-documentation.md](file:///d:/Desktop/Restaurant-Ordering-System/database-config/api-documentation.md)** | **មគ្គុទ្ទេសក៍ API ពេញលេញ v2.0 (Complete RESTful API Reference):**<br>• បញ្ជីរាយនាម API Endpoints ទាំង ៣៦ ពេញលេញ<br>• ដ្យាក្រាមស្ថាបត្យកម្ម Mermaid API Request Lifecycle Flowchart<br>• ការពារ Brute-force ដោយ In-Memory Rate Limiter (Login & Voucher)<br>• ប្រព័ន្ធ Real-time Server-Sent Events (SSE) Live Stream សម្រាប់ផ្ទះបាយ KDS (`/api/orders/stream`)<br>• មុខងារ Pagination & Date Filtering (`?page=1&limit=20&date=`)<br>• API បង្កើតទិន្នន័យព្រីនវិក្កយបត្រកម្ដៅ 80mm/58mm (`/api/orders/:id/receipt`)<br>• គំរូកូដ cURL Testing Snippets សម្រាប់ Run លើ Terminal ភ្លាមៗ | 🌐 ឯកសារយោង API ផ្លូវការ |
| **[plan-database-fix.md](file:///d:/Desktop/Restaurant-Ordering-System/database-config/plan-database-fix.md)** | **ផែនការដោះស្រាយបញ្ហាទាំង ១១ ចំណុច (Initial 11 Issues Fix Plan v2.0):**<br>• ដំណាក់កាលទី ១: Schema & Auto-Migration (`orders` breakdown columns, `isFeatured`)<br>• ដំណាក់កាលទី ២: Seeding Engine (`restaurant_tables`, `vouchers`)<br>• ដំណាក់កាលទី ៣: Backend Logic (Voucher discount flow, Realized revenue, 409 Conflict, Admin guard)<br>• ដំណាក់កាលទី ៤: Frontend Flow (`saveOrder` payload)<br>• ដំណាក់កាលទី ៥: Automated Testing (48 Tests) | ✅ អនុវត្តរួចរាល់ ១០០% |
| **[plan-advanced-improvements.md](file:///d:/Desktop/Restaurant-Ordering-System/database-config/plan-advanced-improvements.md)** | **ផែនការកែលម្អប្រព័ន្ធកម្រិតខ្ពស់ (Advanced System Improvements Plan v3.0):**<br>• ដំណាក់កាលទី ១: Table Status Automation (Dine-in `occupied` -> Served `available`)<br>• ដំណាក់កាលទី ២: Category Dish Count Synchronization (SQLite Triggers)<br>• ដំណាក់កាលទី ៣: Bakong Server-Side Payment Settlement (`/settle` & `/webhook`)<br>• ដំណាក់កាលទី ៤: Frontend Dynamic Tables Fetching (`TableSelector.jsx` & `AdminMenu.jsx`)<br>• ដំណាក់កាលទី ៥: JWT 401 Auto-Logout Response Interceptor<br>• ដំណាក់កាលទី ៦: Complete Verification Suite (51/51 Tests Passing) | ✅ អនុវត្តរួចរាល់ ១០០% |

---

## 🚀 សង្ខេបលទ្ធផលតេស្តបច្ចុប្បន្ន (Current Test Status)

រាល់កូដ និងទិន្នន័យទាំងអស់ដែលត្រូវបានកែសម្រួលតាមរយៈផែនការក្នុងឯកសារទាំងនេះ បានឆ្លងកាត់ការធ្វើតេស្តស្វ័យប្រវត្តិចំនួន **៥១ តេស្ត** ដោយជោគជ័យ ១០០% (Zero Errors) តាមរយៈការដំណើរការ៖

```bash
node tests/run-all-tests.js
```

---
*ថតឯកសារនេះត្រូវបានរៀបចំ និងធ្វើបច្ចុប្បន្នភាពលើ branch `database-config`។*
