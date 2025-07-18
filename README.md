# 📘 EduMentor – Real-Time AI Learning Assistant

EduMentor is a full-stack AI-integrated learning assistant designed to provide **instant answers**, **visual explanations**, and **real-time support** to students. Powered by Google Gemini API (with optional DeepSeek fallback), it enhances the learning experience by making doubt solving interactive and efficient.

---

## 🚀 Features

- ✅ **Ask AI Doubts**: Type any question and get an instant answer powered by **Gemini AI**
- 🖼️ **Visual Explanation**: Get code blocks, examples, and diagrams (if available)
- 🔁 **Fast AI fallback** (optional): Uses DeepSeek API when Gemini is overloaded
- 📖 **Real-time chat-like UI**
- 🧑‍🏫 **Live whiteboard** (bonus)
- 🔐 **Authentication**: Firebase email/password login
- ☁️ **Firestore integration** for user data & chat history

---

## 🛠️ Tech Stack

| Frontend    | Backend / DB       | AI Layer       | Hosting / Auth      |
|-------------|--------------------|----------------|---------------------|
| Next.js (React) | Firebase Firestore | Gemini API      | Firebase Auth        |
| Tailwind CSS | Firebase Functions | (Optional) DeepSeek API | Firebase Hosting     |

---

## 📁 Project Structure

```bash
📦 edumentor/
 ┣ 📂 components/
 ┃ ┣ 📜 ChatInput.tsx
 ┃ ┣ 📜 MessageBubble.tsx
 ┃ ┗ 📜 Whiteboard.tsx
 ┣ 📂 pages/
 ┃ ┣ 📜 index.tsx
 ┃ ┣ 📜 chat.tsx
 ┃ ┗ 📜 api/
 ┃   ┣ 📜 gemini.ts
 ┃   ┗ 📜 deepseek.ts (optional)
 ┣ 📂 lib/
 ┃ ┣ 📜 firebase.ts
 ┃ ┗ 📜 ai.ts
 ┣ 📂 styles/
 ┃ ┗ 📜 globals.css
 ┣ 📜 .env.local
 ┗ 📜 README.md
````

---

## 🔧 Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/edumentor.git
cd edumentor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GEMINI_API_KEY=your_gemini_api_key

# Optional (only if using DeepSeek)
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 4. Run the app locally

```bash
npm run dev
```

---

## 💡 AI Integration Flow

```mermaid
flowchart TD
    A[User Input] --> B[Gemini API Call]
    B -->|Success| C[Display AI Response]
    B -->|Fails or Overload| D[DeepSeek API Call (Optional)]
    D --> E[Display Fallback Response]
```

---

## 🎨 UI Highlights

* Modern dark/light mode with Tailwind CSS
* Chat-style interface with markdown rendering
* Smooth animations and responsive layout
* Interactive whiteboard (bonus using `fabric.js` or `react-whiteboard`)

---

## 🔐 Authentication

* Firebase Email/Password login
* Optional: Add Google or GitHub OAuth (easy with Firebase)

---

## ⚠️ Error Handling

* Shows a message if Gemini is overloaded
* Fallback to DeepSeek (if API key present)
* Catches and logs all server/API errors
* Alerts user gracefully on failure

---

## 🧪 Future Improvements

* ✅ GPT-4 / Claude / OpenRouter API switcher
* ✅ Voice-based input (Web Speech API)
* ✅ Add student performance tracking
* ✅ Teacher dashboard for monitoring

---

## 📦 Deployment

You can deploy the app to **Firebase Hosting**, **Vercel**, or **Netlify**:

### Firebase Hosting

```bash
npm run build
firebase deploy
```

---

## 🤝 Contribution

Pull requests and stars are always welcome! For major changes, please open an issue first.

---

## 📄 License

MIT License. Feel free to use and modify for educational or personal projects.

---

## 🙋‍♂️ Author

Built with 💙 by Virendra

```

---

Let me know if you want:
- Auto README generator linked to your actual GitHub
- Deployment-specific configuration for Vercel/Firebase
- UI preview image or live demo badge added

Would you also like a **whiteboard implementation** or Gemini+DeepSeek switcher logic documented?
```
