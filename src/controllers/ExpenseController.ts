import { Request, Response } from "express";
import query from "../database/connection";

class ExpenseController {
  public async create(req: Request, res: Response): Promise<void> {
    const { idproduct, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "INSERT INTO expenses(iduser,idproduct,value) VALUES ($1,$2,$3) RETURNING id::varchar,idproduct::varchar as product,datetime,value::FLOAT",
      [iduser, idproduct, value]
    );
    res.json(r);
  }

  public async list(_: Request, res: Response): Promise<void> {
    const { id:iduser } = res.locals;
    const r:any = await query(
      `SELECT a.id::varchar, b.id::varchar as product, b.name, a.value::FLOAT, a.datetime
       FROM expenses AS a LEFT JOIN products AS b
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
      "DELETE FROM expenses WHERE id = $1 AND iduser=$2 RETURNING id::varchar,idproduct::varchar as product,value::float,datetime", 
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
      "UPDATE expenses SET idproduct=$3, value=$4 WHERE id=$1 AND iduser=$2 RETURNING id::varchar,idproduct::varchar as product,value::float,datetime", 
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

export default new ExpenseController();
