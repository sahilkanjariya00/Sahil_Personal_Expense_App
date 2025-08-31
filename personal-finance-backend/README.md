# Backend — Personal Finance Assistant

## Overview
Backend is built with **FastAPI** and **SQLModel** (on top of SQLAlchemy) with a SQLite database.  
It provides REST APIs for transactions, categories, summaries, and OCR-based receipt extraction.

---

- Server: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

---
## Tables & Schema
### categories

| Column      | Type         | Notes                                                       |
| ----------- | ------------ | ----------------------------------------------------------- |
| id          | INTEGER (PK) | Autoincrement                                               |
| user\_id    | INTEGER (FK) | Nullable. `NULL` = **global** category visible to all users |
| name        | TEXT         | Category name (e.g., Food, Transport)                       |
| created\_at | DATETIME     | Default now (UTC)                                           |
| updated\_at | DATETIME     | Updated on change                                           |

### transactions
| Column        | Type         | Notes                                                               |
| ------------- | ------------ | ------------------------------------------------------------------- |
| id            | INTEGER (PK) | Autoincrement                                                       |
| user\_id      | INTEGER (FK) | Required                                                            |
| type          | TEXT (ENUM)  | `expense` \| `income`                                               |
| date          | DATE         | Transaction date (YYYY-MM-DD)                                       |
| category\_id  | INTEGER (FK) | **Nullable**. Required for `expense`, **must be NULL** for `income` |
| description   | TEXT         | Optional                                                            |
| amount\_minor | INTEGER      | Amount in paise (e.g., ₹235.10 → 23510). Always **positive**        |
| created\_at   | DATETIME     | Default now (UTC)                                                   |
| updated\_at   | DATETIME     | Updated on change                                                   |

### 

