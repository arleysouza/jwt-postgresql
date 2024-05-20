import { Request, Response } from "express";
import query from "../database/connection";

class SpentController {
  public async create(req: Request, res: Response): Promise<void> {
    const { idproduct, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "INSERT INTO spents(iduser,idproduct,value) VALUES ($1,$2,$3) RETURNING id,idproduct as product,datetime,value",
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

    const r:any = await query(
      "DELETE FROM spents WHERE id = $1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime", 
      [id, iduser]
    );
    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else{
      res.json({ message: "Registro inexistente" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, product, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "UPDATE spents SET idproduct=$3, value=$4 WHERE id=$1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime", 
      [id,iduser,product,value]
    );

    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else if ( r.rowcount === 0 ){
      res.json({ message: "Registro inexistente" });
    }
    else{
      res.json({ message: r.message });
    }
  }
}

export default new SpentController();
