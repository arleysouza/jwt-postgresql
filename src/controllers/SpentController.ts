import { Request, Response } from "express";
import query from "../database/connection";

class SpentController {
  public async create(req: Request, res: Response): Promise<void> {
    const { idproduct, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "INSERT INTO spents(iduser,idproduct,value) VALUES ($1,$2,$3) RETURNING id,datetime,value",
      [iduser, idproduct, value]
    );
    res.json(r);
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { id:iduser } = res.locals;
    const r:any = await query(
      `SELECT a.id, b.name, a.value::FLOAT, a.datetime
       FROM spents AS a LEFT JOIN products AS b
       ON a.idproduct = b.id
       WHERE iduser = $1
       ORDER BY a.datetime DESC`,
       [iduser]
    );
    res.json(r);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.body; 
    const { id:iduser } = res.locals;
    console.log("aqui" );
    const r:any = await query(
      "DELETE FROM spents WHERE id = $1 AND iduser=$2 RETURNING id,idproduct,value", 
      [id, iduser]
    );
    res.json(r);
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, idproduct, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "UPDATE spents SET idproduct=$3, value=$4 WHERE id=$1 AND iduser=$2 RETURNING id,idproduct,value", 
      [id,iduser,idproduct,value]
    );
    res.json(r);
  }
}

export default new SpentController();
