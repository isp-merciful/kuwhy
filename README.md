# 🌐 KUWHY – Group 13 “Merciful"

> **KUWHY** is a web platform for Kasetsart University students to connect across faculties, collaborate on projects, share ideas, and organize events — all in one central hub.

---

## 📌 Table of Contents
> Click any topic to jump to the section

- [Features at a Glance](#-features-at-a-glance)
- [Project Objective](#-project-objective)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Team – Merciful Group](#-team--merciful-group)
- [Documentation & Presentations](#-documentation--presentations)
- [Getting Started](#-getting-started)
- [Contribution Guidelines](#-contribution-guidelines)
- [License & Acknowledgements](#-license--acknowledgements)

---

## 🚀 Features at a Glance

### ✏️ Casual Notes & Polls
- Share quick updates or polls  
- Supports anonymous posting

### 👥 Groups & Events
- Create, join, and manage study groups  
- Organize campus events seamlessly

### 📚 Blogs & Q&A
- Write articles or ask questions  
- Interact with peers via comments

### 📰 Smart Feed
- Personalized content  
- Infinite scroll and filters

### 📂 File Sharing
- Upload and download project files  
- Simplify team collaboration

### 🔔 Notifications
- Receive updates for replies, comments, and group activity

### 🔑 Authentication
- Email login, Google OAuth  
- Optional guest access

### ⚙️ Profile and Settings
- View and edit personal information  
- Change profile picture and password  
- Manage preferences and account settings
  
### 🛠️ Admin Panel
- Moderate content  
- Manage users and review reports

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

**Frontend:** React, Next.js  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Authentication:** OAuth (Google) & Email Login

---

## 📂 Repository Structure


```
kuwhy/
├── frontend/      # Next.js UI components and pages
├── backend/       # Express API server
├── public/        # Static assets (images, icons)
├── docs/          # Project documentation & diagrams
└── README.md
```

---

## 👥 Team – Merciful Group

| Name                   | Role               | Student ID |
| ---------------------- | ------------------ | ---------- |
| Danita Frikaow         | UI/UX Designer     | 6410545461 |
| Thanabordee Bundisakul | Frontend Developer | 6510545489 |
| Chitiwat Phajan        | Project Manager    | 6710545539 |
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

1. **Configure environment file**  
   Copy the example configuration file and then update the values as needed.

   - **macOS / Linux**
     ```bash
     cp .env.example .env
     ```
   - **Windows**
     ```bash
     copy .env.example .env
     ```

2. **Create Gmail App Password**  
   This is required for sending email (e.g. forgot-password).

   - Open your **Google Account**.
   - Go to **Security**.
   - Under **“Signing in to Google”**, turn on **2-Step Verification** (if it isn’t already).
   - After 2FA is enabled, go back to **Security** and click **App passwords**.
   - Choose **Mail** as the app and **Other (Custom name)** as the device (e.g. `KUWHY`).
   - Click **Generate** and copy the 16-character password.
   - Use this value as `SMTP_PASS` in your `.env` file.

3. ⚠️ **Note**  
   Make sure your database settings in `.env` (especially `DATABASE_URL`) match the configuration used in `docker-compose.yml` / `compose.yml` And all the .env must be the same in every layer
root(kuwhy),backend/.env,frontend/.env

---

#### Required keys in `.env`

| **Section**       | **Variable**           | **Example / Notes**                                                                                                      |
|-------------------|------------------------|--------------------------------------------------------------------------------------------------------------------------|
| **Google OAuth**  | `GOOGLE_CLIENT_ID`     | `your-google-oauth-client-id` – from **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**.   |
|                   | `GOOGLE_CLIENT_SECRET` | `your-google-oauth-client-secret` – from the same OAuth client detail page.                                             |
| **NextAuth**      | `NEXTAUTH_SECRET`      | `random-long-secret-string` – generate with `openssl rand -hex 32` or a Node `crypto` snippet (see below).              |
|                   | `NEXTAUTH_URL`         | `http://localhost:3000/` for local dev. In production, set to your deployed URL, e.g. `https://your-domain.com/`.       |
| **Mailer (Gmail)**| `SMTP_HOST`            | `smtp.gmail.com` – Gmail SMTP host.                                                                                      |
|                   | `SMTP_PORT`            | `587` – SMTP port for STARTTLS.                                                                                          |
|                   | `SMTP_USER`            | `your-email@gmail.com` – Gmail account used to send emails (must match the account that created the App Password).      |
|                   | `SMTP_PASS`            | `your-16-char-gmail-app-password` – value generated in step 2 above.                                                    |
| **Database**      | `DATABASE_URL`         | `mysql://root:root@db:3306/ispgraveyard` – follows `mysql://USER:PASSWORD@HOST:PORT/DB_NAME`, must match Docker config. |

---

### How to obtain each value

#### 1. Google OAuth — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

1. Go to **Google Cloud Console**.
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services → Credentials**.
4. Click **Create Credentials → OAuth client ID**.
5. Choose **Web application**.
6. Add an **Authorized redirect URI** such as:
   ```text
   http://localhost:3000/api/auth/callback/google
### Start the program
```bash
# 1. Clone the repository
git clone https://github.com/isp-merciful/kuwhy.git cd kuwhy
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

