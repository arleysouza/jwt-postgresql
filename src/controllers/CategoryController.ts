import { Request, Response } from "express";
import query from "../database/connection";

class CategoryController {
  public async create(req: Request, res: Response): Promise<void> {
    const { name } = req.body;
    if (name) {
      const r: any = await query(
        "INSERT INTO categories(name) VALUES ($1) RETURNING id::varchar, name",
        [name]
      );
      res.json(r);
    } else {
      res.json({ message: "Forneça o nome da categoria" });
    }
  }

  public async list(_: Request, res: Response): Promise<void> {
    const r: any = await query("SELECT id::varchar,name FROM categories ORDER BY name");
    res.json(r);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (id) {
      const r: any = await query(
        "DELETE FROM categories WHERE id = $1 RETURNING id::varchar, name",
        [id]
      );
      if (r.rowcount > 0) {
        res.json(r.rows);
      } else if (r.rowcount == 0) {
        res.json({ message: "Categoria inexistente" });
      } else {
        res.json(r);
      }
    } else {
      res.json({ message: "Forneça a categoria" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, name } = req.body;
    if (id && name) {
      const r: any = await query(
        "UPDATE categories SET name=$2 WHERE id=$1 RETURNING id::varchar, name",
        [id, name]
      );
      if (r.rowcount > 0) {
        res.json(r.rows);
      } else if (r.rowcount == 0) {
        res.json({ message: "Categoria inexistente" });
      } else {
        res.json(r);
      }
    }
    else if( !id ){
      res.json({ message: "Forneça a categoria" });
    }
    else {
      res.json({ message: "Forneça o nome da categoria" });
    }
  }
}

export default new CategoryController();
