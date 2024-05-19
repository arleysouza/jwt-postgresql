import { Router, Request, Response } from "express";
import controller from "../controllers/CategoryController";
import { checkAdm } from "../middlewares";

const routes = Router();

routes.get("/", controller.list);
routes.post("/", checkAdm, controller.create);
routes.delete("/", checkAdm, controller.delete);
routes.put("/", checkAdm, controller.update);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({error:"Operação desconhecida com a categoria"}) );

export default routes;