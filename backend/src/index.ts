import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth";
import farmsRouter from "./routes/farms";
import coopsRouter from "./routes/coops";
import lotsRouter from "./routes/lots";
import { taskTemplatesRouter, tasksRouter } from "./routes/tasks.routes";
import alertsRouter from "./routes/alerts.routes";
import reportsRouter from "./routes/reports.routes";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT ?? "3000", 10);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/farms", farmsRouter);
// /coops for standalone access (e.g. GET /coops/:coopId)
app.use("/coops", coopsRouter);
// /lots for standalone access (e.g. GET /lots/:lotId)
app.use("/lots", lotsRouter);
// task templates
app.use("/task-templates", taskTemplatesRouter);
// standalone task routes (calendar, status update, edit, delete)
app.use("/tasks", tasksRouter);
// alerts
app.use("/alerts", alertsRouter);
// reports
app.use("/reports", reportsRouter);

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
