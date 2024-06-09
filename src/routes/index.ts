import { Router, Request, Response } from "express";
import user from "./user";
import product from "./product";
import {UserController} from "../controllers/";
import spent from "./expense";
import category from "./category";
import { validadeAcess } from "../middlewares";

const routes = Router();

routes.post("/login", UserController.login);
routes.use("/usuario", user);
routes.use("/categoria", validadeAcess, category);
routes.use("/produto", validadeAcess, product);
routes.use("/gasto", validadeAcess, spent);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({message:"Requisição desconhecida"}) );

export default routes;
