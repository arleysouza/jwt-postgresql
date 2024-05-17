import { Router, Request, Response } from "express";
import controller from "../controllers/UserController";
import { checkAdm, validadeAcess } from "../middlewares";

const routes = Router();

routes.get("/", validadeAcess, checkAdm, controller.list);
routes.post("/", controller.create);
routes.delete("/", validadeAcess, controller.delete);
routes.put("/mail", validadeAcess, controller.updateMail);
routes.put("/senha", validadeAcess, controller.updatePassword);
routes.put("/perfil", validadeAcess, checkAdm, controller.updateProfile);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({error:"Operação desconhecida com o usuário"}) );

export default routes;