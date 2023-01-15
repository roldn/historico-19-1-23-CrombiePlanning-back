import { Router } from "express";
import issuesRouter from "./issues";

const appRouter = Router();

appRouter.use("/", issuesRouter);

export default appRouter;