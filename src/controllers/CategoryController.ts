import { Request, Response } from "express";
import query from "../database/connection";

class CategoryController {
  public async create(req: Request, res: Response): Promise<void> {
    const { name } = req.body;
    const r:any = await query(
      "INSERT INTO categories(name) VALUES ($1) RETURNING id, name",
      [name]
    );
    res.json(r);
  }

  public async list(_: Request, res: Response): Promise<void> {
    const r:any = await query(
      "SELECT id,name FROM categories ORDER BY name"
    );
    res.json(r);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.body; 
    const r:any = await query(
      "DELETE FROM categories WHERE id = $1 RETURNING id, name", 
      [id]
    );
    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else{
      res.json({ message: "Registro inexistente" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, name } = req.body;
    const r:any = await query(
      "UPDATE categories SET name=$2 WHERE id=$1 RETURNING id, name", 
      [id,name]
    );
    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else{
      res.json({ message: "Registro inexistente" });
    }
  }
}

export default new CategoryController();
