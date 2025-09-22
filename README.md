🚀 Crypto Stock Tracker

A real-time crypto & stock tracker built with React (Next.js), Node.js, and TypeScript.
It streams live market data using APIs & WebSockets, with instant updates and clean chart visualizations 📈⚡.

⸻

✨ Features
	•	📊 Toggle between Candlestick, Line & Area charts
	•	🔄 Live price updates — no page refresh needed
	•	📉 Track 6 assets at once
	•	🔍 Hover for Open / High / Low / Close details
	•	⚡ Clean, responsive UI for desktop & mobile
	•	🛠 Fully typed with TypeScript
	•	⚡ WebSocket-based real-time streaming for instant updates

⸻

🛠 Tech Stack
	•	Frontend: React.js (Next.js), TypeScript, JavaScript (ES6+)
	•	Backend: Node.js, Express.js
	•	Styling: Global CSS / CSS Modules
	•	Data Handling: WebSockets, REST API integration
	•	Charts: Chart.js / Recharts (Candlestick, Line, Area)
	•	Other Tools: Git, JSON/YAML configs

📂 Project Structure
crypto-stock-tracker/
│
├─ frontend/
│  ├─ components/        # Reusable React components (Chart, Navbar, etc.)
│  ├─ pages/             # Next.js pages (index.tsx, assets.tsx)
│  ├─ styles/            # CSS / global styling files
│  ├─ utils/             # Helper functions (data formatting, API calls)
│  └─ tsconfig.json      # TypeScript config
│
├─ backend/
│  ├─ controllers/       # API controllers
│  ├─ routes/            # API routes
│  ├─ services/          # WebSocket & API logic
│  ├─ app.js             # Express app entry
│  └─ package.json
│
├─ .gitignore
├─ README.md
└─ package.json

⚡Getting Started

1️⃣ Clone the Repository
git clone https://github.com/yourusername/crypto-stock-tracker.git
cd crypto-stock-tracker

2️⃣ Install Dependencies
BACKEND
cd backend
npm install

FRONTEND
cd ../frontend
npm install

3️⃣ Configure Environment Variables

Create a .env file in both frontend and backend if needed:

Backend Example (backend/.env)
PORT=5000
API_KEY=your_api_key_here

Frontend Example (frontend/.env)
NEXT_PUBLIC_API_URL=http://localhost:5000

4️⃣ Run the Application

BACKEND
cd backend
npm run dev

FRONTEND
cd frontend
npm run dev
open http://localhost:3000 to see app in action.
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204133" src="https://github.com/user-attachments/assets/e4bbb2c2-a416-403c-ba6c-c6d1bf646751" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204159" src="https://github.com/user-attachments/assets/1534509f-5d93-4c7d-8d76-10bee7fff817" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204255" src="https://github.com/user-attachments/assets/a252df24-6cf3-461c-9b06-88fd21e7ae25" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204354" src="https://github.com/user-attachments/assets/0aecfb03-3b1b-4348-9e70-d73e96fd5dd6" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204317" src="https://github.com/user-attachments/assets/7cd84cad-e873-4f6b-853b-7aa713af66fb" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204255" src="https://github.com/user-attachments/assets/a252df24-6cf3-461c-9b06-88fd21e7ae25" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204159" src="https://github.com/user-attachments/assets/1534509f-5d93-4c7d-8d76-10bee7fff817" />
<img width="1920" height="1080" alt="Screenshot 2025-09-21 204133" src="https://github.com/user-attachments/assets/e4bbb2c2-a416-403c-ba6c-c6d1bf646751" />

💡 Usage
	•	Browse live prices for multiple assets
	•	Switch chart types (Candlestick / Line / Area)
	•	Hover over charts to see detailed Open/High/Low/Close info
	•	Works on both desktop and mobile

⸻

🤝 Contributing

Contributions, issues, and feature requests are welcome!
	1.	Fork the repo
	2.	Create a new branch (git checkout -b feature-name)
	3.	Make your changes
	4.	Commit (git commit -m 'Add new feature')
	5.	Push (git push origin feature-name)
	6.	Open a Pull Request

⸻

📜 License

This project is MIT licensed – see the LICENSE file for details.
