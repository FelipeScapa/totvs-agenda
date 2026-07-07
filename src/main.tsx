import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { migrateLocalStorageToCloud } from "@/lib/migrate-to-cloud";

// Roda em paralelo com o boot da UI — não bloqueia a renderização.
migrateLocalStorageToCloud();

createRoot(document.getElementById("root")!).render(<App />);
