import { Router, Request, Response } from "express";
import {ExpenseController as controller} from "../controllers";

const routes = Router();

routes.get("/", controller.list);
routes.post("/", controller.create);
routes.delete("/", controller.delete);
routes.put("/", controller.update);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({message:"Operação desconhecida com o gasto"}) );

export default routes;