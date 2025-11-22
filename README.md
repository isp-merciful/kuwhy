# 🌐 KUWHY – Group 13 “Merciful"

> KUWHY is a full-stack web platform designed for **Kasetsart University (KU)** students to communicate, collaborate, and share information. It provides features such as short posts (Notes), long-form content (Blogs), real-time group chats (Parties), user profiles, and instant notifications.
all in one central hub.

---

## 📌 Table of Contents
> Click any topic to jump to the section

- [Features](#-features)
- [Project Objective](#-project-objective)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Team – Merciful Group](#-team--merciful-group)
- [Documentation & Presentations](#-documentation--presentations)
- [Getting Started](#-getting-started)
- [Contribution Guidelines](#-contribution-guidelines)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🚀 Features

### 📝 Notes (Short Posts)
- Create short posts that disappear after **24 hours**
- Guests can write and read Notes
- Logged-in users can comment, edit, and delete Notes
- Users can create a Party from a Note
- Anonymous users can only comment on Notes they posted

### ✍️ Blogs (Long Articles)
- Write detailed posts with text, tags, and files uploads
- Search Blogs by keywords or tags
- Like or dislike a post
- Comment on Blogs
- Edit or delete your own Blog posts
- Guests can only view Blogs

### 👥 Parties (Student Groups)
- Groups of 2–20 members created through Notes
- Real-time chat
- Party auto-deletes after **24 hours**
- Join/leave notifications

### 💬 Real-Time Chat
- Instant messaging within Parties
- Notifications for new messages and new participants

### 🔔 Notifications
Users receive notifications for:
- Comments and replies
- Blog interactions
- Party events (chat and join)
- Note replies (including anonymous notes)

### 👤 User Profiles
- Public profile pages
- Update your name, bio, picture, and contact information
- Click user photos/names to view their profile

### 🔐 Authentication
- Login with Google
- Username + password login
- Credential-based login with JWT
- Guest mode available
- Forgot Password feature allows users to reset their account password  


### 🛠 Admin Panel
- Report and punishment system
- Anti-spam protection
- Admin controls for content and user management


---

## 🎯 Project Objective

**KUWHY** aims to provide a **central hub for KU students** to:

1. Connect and collaborate across faculties  
2. Share casual and academic content  
3. Organize and participate in campus activities  
4. Access important announcements and resources

> **Mission:** Make campus life **interactive, inclusive, and collaborative**.

---

## 🧰 Tech Stack

**Frontend:** Next.js (React), Tailwind CSS  
**Backend:** Node.js, Express.js, Prisma ORM  
**Database:** MySQL  
**Authentication:** NextAuth (Google OAuth & Email/Password)  
**Testing:** Jest  
**DevOps & Deployment:** Docker, Docker Compose, GitHub Actions (CI/CD), Self-hosted

---

## 📂 Repository Structure


```
kuwhy/
├── frontend/          # Next.js app (UI pages & components)
├── backend/           # Express API server
├── prisma/            # Prisma schema & migrations
├── .github/           # GitHub Actions (CI/CD) workflows
├── docker-compose.yml # Docker services (db, backend, frontend)
├── .env.example       # Example environment variables
├── .gitignore         # Git ignore rules
├── .dockerignore      # Docker ignore rules
└── README.md
```

---

## 👥 Team – Merciful Group

| Name                   | Role               | Student ID |
| ---------------------- | ------------------ | ---------- |
| Danita Frikaow         | UI/UX Designer & Frontend Developer     | 6410545461 |
| Thanabordee Bundisakul | Frontend Developer | 6510545489 |
| Chitiwat Phajan        | Fullstack Developer    | 6710545539 |
| Piyawat Wiriyayothin   | Backend Developer  | 6710545717 |

---

## 📖 Documentation & Presentations

* [Project Document](https://docs.google.com/document/d/131_PXGYz7tKTbDQGwVTPiXUC1EjhQ9EdugwcNyNUobY/edit?usp=sharing)
* [Iteration 1 Presentation](https://www.youtube.com/watch?v=-kIwVKTTAkA)
* [Iteration 2 Presentation](https://youtu.be/FUl6rNU6EiE?si=ku89KkIwvy0TvFfR)
* [Iteration 3 Presentation](https://youtu.be/1fFkATymeag?si=36GwJlWetsgoUnSg)
* [Iteration 4 Presentation](https://youtu.be/PTpsgiO_zYg?si=j5RhgKzcmZZ5wcGa)
* [Iteration 5 Presentation](https://youtu.be/oZNtN2JFQoU?si=msE1ztLNJFdoCxTS)
---

## 💻 Getting Started

**Install dependencies**
### 🧩 Prerequisites
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

### Environment variables

1. **Configure environment file(s)**  
   Copy the example configuration file and then update the values as needed.

   - **macOS / Linux**
     ```bash
     cp .env.example .env
     cp .env backend/.env
     cp .env frontend/.env
     ```
   - **Windows (CMD)**
     ```cmd
     copy .env.example .env
     copy .env backend\.env
     copy .env frontend\.env
     ```

2. **Create Gmail App Password**  
   This is required for sending email (e.g. forgot-password).

   - Open your **Google Account** (the Gmail account you want to send from).
   - Go to **Security**.
   - Under **“Signing in to Google”**, turn on **2-Step Verification** (if it isn’t already).
   - After 2FA is enabled, go back to **Security** and click **App passwords**.
   - Choose **Mail** as the app and **Other (Custom name)** as the device (e.g. `KUWHY`).
   - Click **Generate** and copy the 16-character password.
   - Use this value as `SMTP_PASS` in your `.env` file.

3. **How to obtain each value**

   #### Google OAuth — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

   1. Go to **Google Cloud Console**: <https://console.cloud.google.com>  
   2. Create a new **Project** (or select your existing one).  
   3. In the left sidebar, go to **APIs & Services → OAuth consent screen**:
      - Choose **External** (for typical web apps).
      - Fill in **App name**, **User support email**, etc.
      - Add scopes (at minimum, `email`, `profile`, `openid` are enough for NextAuth).
      - Add your test users (for dev) and **Save**.
   4. Go to **APIs & Services → Credentials**.  
   5. Click **Create Credentials → OAuth client ID**.  
   6. Choose **Web application**.  
   7. Under **Authorized JavaScript origins**, add:
      - For development: `http://localhost:3000`
      - For production: `https://{YOUR_DOMAIN}`
   8. Under **Authorized redirect URIs**, add:
      - For development:  
        `http://localhost:3000/api/auth/callback/google`
      - For production:  
        `https://{YOUR_DOMAIN}/api/auth/callback/google`
   9. Click **Create**.  
   10. Copy the generated **Client ID** and **Client secret**:
       - Paste them into your `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

4. ⚠️ **Important note about `.env` and Docker**  

   - Make sure your database settings in `.env` (especially `DATABASE_URL`) **match** the configuration used in `docker-compose.yml` / `compose.yml`.  
   - In this project we usually have:
     - `./.env`
     - `backend/.env`
     - `frontend/.env`
   - The following **core variables should be identical** across those files:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - Mailer settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
   - If these get out of sync, you may see:
     - Docker using a different DB than Prisma.
     - NextAuth JWTs not matching the backend (`401 Unauthorized` everywhere).
     - Frontend calling the wrong backend URL.

---

#### Required keys in `.env`

| **Section**         | **Variable**             | **Example / Notes**                                                                                                                        |
|---------------------|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| **Google OAuth**    | `GOOGLE_CLIENT_ID`       | `your-google-oauth-client-id` – from **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**.                     |
|                     | `GOOGLE_CLIENT_SECRET`   | `your-google-oauth-client-secret` – from the same OAuth client detail page.                                                               |
| **NextAuth**        | `NEXTAUTH_SECRET`        | `random-long-secret-string` – must be the **same** everywhere (Next.js + backend). Generate with `openssl rand -hex 32` or Node snippet. |
|                     | `NEXTAUTH_URL`           | `http://localhost:3000/` for local dev. In production, set to your deployed URL, e.g. `https://your-domain.com/`.                         |
| **Frontend → API**  | `NEXT_PUBLIC_BACKEND_URL`| `http://localhost:8000` in dev, or your backend URL in production, e.g. `https://api.your-domain.com`.                                    |
| **Mailer (Gmail)**  | `SMTP_HOST`              | `smtp.gmail.com` – Gmail SMTP host.                                                                                                       |
|                     | `SMTP_PORT`              | `587` – SMTP port for STARTTLS.                                                                                                           |
|                     | `SMTP_USER`              | `your-email@gmail.com` – Gmail account used to send emails (**same account that created the App Password**).                             |
|                     | `SMTP_PASS`              | `your-16-char-gmail-app-password` – value generated in step 2 above.                                                                     |
| **Database**        | `DATABASE_URL`           | `mysql://root:root@db:3306/ispgraveyard` – format: `mysql://USER:PASSWORD@HOST:PORT/DB_NAME`, must match your Docker MySQL config.       |


### Start the program
```bash
# 1. Clone the repository
git clone https://github.com/isp-merciful/kuwhy.git
cd kuwhy
# setup all .env in kuwhy(root),frontend,backend

# 2. Start all services with Docker
docker-compose up --build -d

# 3. Access the application
Frontend: http://localhost:3000
Backend: http://localhost:8000(configure in backend.env port)
```
---

## 📝 Contribution Guidelines

We follow a structured Git workflow:

* **Branch naming:** `type/scope/short-description` (e.g., `feat/frontend/login-page`)
* **Commit messages:** `type(scope): subject` (e.g., `feat(frontend): implement login page`)
* Pull Requests should include descriptions, checklists, and reference related issues.

---

## 🎉 License & Acknowledgements

This project is part of course work at Kasetsart University.
Thanks to our instructors and advisors for guidance and support.

> *“Building a stronger KU community — one connection at a time.”*

---

