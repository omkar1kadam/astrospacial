# AstroSpacial — Full-stack Space Situational Awareness Platform

Frontend: original AstroSpacial UI served by Vite. Backend: Express REST API. Database: MySQL. Authentication: email/password signup and login, bcrypt password hashing, signed JWT in an HTTP-only cookie, and MySQL-backed sessions.

## Requirements
- Node.js 20+ and npm
- MySQL 8+ running locally
- VS Code (recommended)

## 1. Configure MySQL
1. Open a terminal in the project root and run `npm install`.
2. Run `npm run install:all` to install backend and frontend dependencies.
3. Copy `backend/.env.example` to `backend/.env`.
4. Edit `backend/.env` and set `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`, and a long random `JWT_SECRET` (at least 32 characters).
5. Create the database with `npm run setup:db`. This uses your MySQL credentials and creates the configured database.

Example `backend/.env`:
```env
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=astrospacial
JWT_SECRET=replace_with_a_random_secret_of_32_or_more_characters
JWT_EXPIRES_IN=7d
```
Do not commit `.env` or share the JWT secret.

## 2. Start the app
From the project root run:
```bash
npm run dev
```
Open **http://localhost:5173**. The frontend proxies `/api` to the backend on port 4000. API health check: http://localhost:4000/api/v1/health. A healthy response includes `"database":"connected"`.

## 3. Signup and sign in
- Click **Sign In** on the app, then **Create an account**.
- Enter a name, email, password (minimum 8 characters), and confirm password.
- Signup inserts a user in MySQL, hashes the password with bcrypt, creates a session row, and sets an HTTP-only session cookie.
- Sign out and sign back in to verify account persistence. Duplicate email addresses are rejected.
- Profile edits are persisted to MySQL.

## API endpoints
All endpoints are under `/api/v1`.
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API + database health check |
| GET | `/modules` | Demo module metadata |
| POST | `/auth/signup` | Create account and sign in |
| POST | `/auth/login` | Authenticate existing account |
| GET | `/auth/me` | Current session/account |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/logout` | Revoke session and clear cookie |

Signup JSON example:
```json
{ "name": "Mission Specialist", "email": "user@example.com", "password": "a-strong-password", "timezone": "Asia/Kolkata" }
```

## Folder structure
```text
astrospacial-fullstack/
├── frontend/                 # Vite app and original UI
│   ├── index.html
│   ├── public/assets/
│   ├── src/main.js
│   └── src/styles.css
├── backend/
│   ├── .env.example
│   └── src/
│       ├── db.js             # MySQL pool + schema initialization
│       ├── middleware/auth.js
│       ├── routes/api.js      # API and auth routes
│       ├── data/modules.js
│       ├── setup-db.js
│       └── server.js
├── .vscode/
├── package.json
└── README.md
```

## Security notes / scope
- Passwords are bcrypt-hashed; SQL uses parameterized queries.
- Session JWTs are in HTTP-only cookies, and session IDs are checked against MySQL on protected requests. Authentication routes are rate-limited.
- Google and Clerk buttons are intentionally not presented as working OAuth; configure real provider credentials and callback flows before enabling them.
- Space tracking modules remain simulated/demo data. This update adds persistent accounts and profile management, not a live NASA/Space-Track data feed.
- For production, use HTTPS, a strong secret manager, database backups, verified email/password reset flows, CSRF protections appropriate to your deployment, and monitoring.

## Troubleshooting
- **Database unavailable / API won't start:** check MySQL service, credentials, database name, and that `npm run setup:db` completed.
- **JWT_SECRET error:** set a random value of at least 32 characters in `backend/.env`.
- **Port already in use:** stop the process using 4000 or 5173, or change the port and update the Vite proxy/CORS origin.
- **Signup doesn't work:** check browser devtools Network tab and backend terminal. The API returns validation errors to the signup form.
