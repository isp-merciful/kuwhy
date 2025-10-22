# 🌐 KUWHY? – Group 13: Merciful  

KUWHY? is a **web platform for Kasetsart University students** to connect across faculties, share ideas, ask questions, and organize events.  
Our goal is to make campus life more **interactive, engaging, and inclusive**.  

---

## 🚀 Features  

- **Casual Notes & Polls** – Share quick posts or polls that vanish in 24h. Anonymous posting supported.
- **Groups & Events** – Create or join study groups and activities *(login required)*.  
- **Blogs & Q&A** – Write blogs, ask questions, and engage through comments.  
- **Smart Feed** – Browse posts with filters and infinite scroll.  
- **File Sharing** – Upload and download project files for collaboration.  
- **Notifications** – Stay updated on replies, comments, and group requests.  
- **Authentication** – Sign in via email or OAuth; guests get limited access.  
- **Admin Panel** – Moderate reports, remove content, and manage users.  

---

## 🎯 Project Objective  

The platform provides KU students with a **central hub** to:  
- Connect with peers outside their faculty  
- Share both casual and academic ideas  
- Organize and join activities or events  
- Access important university announcements  

---

## 🧑‍💻 Tech Stack  

**Frontend**
- React
- Next.js
  
**Backend**
- Node.js
- Express
  
**Database**
- MySQL
  
**Authentication**
- OAuth (Google) & Email login  

---

## 📂 Documentation and Presentations

## Getstarted
### 🧩 Prerequisites
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js v18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### ⚙️ Get Started in 3 Steps
```bash
# 1. Clone the repository
git clone https://github.com/ISPBANANA/FLEARN.git
cd FLEARN

# 2. Start all services with Docker
docker compose up -d

# 3. Access the application
# Frontend: http://localhost:[FRONTEND_PORT]
# Backend: http://localhost:[API_PORT]
```

💡 Tip:
Replace [FRONTEND_PORT] and [API_PORT] with your actual port numbers from .env file.

## Environment Configuration
Before running the app, create a .env file in the project root
# Backend server port
PORT=3000

# Database connection
DATABASE_URL="mysql://root:yourpassword@localhost:yourport/yourdatabase"

# Frontend settings (optional)
FRONTEND_PORT=5173

# JWT or API secrets (if needed)
JWT_SECRET="your-secret-key"

## Docker Compose Example
- db container port and .env database_url must same
- backend container port must same as .envport

**📖 Documentation**
-  [Project Document (Google Docs)](https://docs.google.com/document/d/131_PXGYz7tKTbDQGwVTPiXUC1EjhQ9EdugwcNyNUobY/edit?usp=sharing)  

**Iteration 1**
-  [Iteration 1 Presentation](https://www.youtube.com/watch?v=-kIwVKTTAkA)

**Iteration 2**
-  [Iteration 2 Presentation](https://youtu.be/FUl6rNU6EiE?si=ku89KkIwvy0TvFfR)  

**Iteration 3**
-  [Iteration 3 Presentation](https://youtu.be/1fFkATymeag?si=36GwJlWetsgoUnSg)
---



## 👥 Team – Merciful Group  

| Name  | Student ID  |
|------|------|
| Danita Frikaow | 6410545461 |
| Thanabordee Bundisakul | 6510545489 |
| Chitiwat Phajan | 6710545539 |
| Piyawat Wiriyayothin | 6710545717 |
