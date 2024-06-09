import { Router, Request, Response } from "express";
import {ProductController as controller} from "../controllers";
import { checkAdm } from "../middlewares";

const routes = Router();

routes.get("/", controller.list);
routes.post("/", checkAdm, controller.create);
routes.delete("/:id", checkAdm, controller.delete);
routes.put("/", checkAdm, controller.update);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({message:"Operação desconhecida com o produto"}) );

export default routes;