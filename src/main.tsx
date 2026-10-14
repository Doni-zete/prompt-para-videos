import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Root from "./Root";
import "./styles/app.css";
import { bootstrapUserData } from "./lib/userData";
import { installGlobalHandlers } from "./lib/diagnostics";

installGlobalHandlers();
bootstrapUserData();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
