import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metromindRouter from "./metromind";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metromindRouter);

export default router;
