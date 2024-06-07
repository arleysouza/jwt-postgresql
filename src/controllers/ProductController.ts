import { Request, Response } from "express";
import query from "../database/connection";

class ProductController {
  public async create(req: Request, res: Response): Promise<void> {
    const { name, category } = req.body;
    if (!name) {
      res.json({ message: "Forneça o nome do produto" });
    } else if (!category) {
      res.json({ message: "Forneça a categoria do produto" });
    } else {
      const r: any = await query(
        "INSERT INTO products(name,idcategory) VALUES ($1,$2) RETURNING id::varchar, name, idcategory::varchar AS category",
        [name, category]
      );
      res.json(r);
    }
  }

  public async list(_: Request, res: Response): Promise<void> {
    const r: any = await query(
      "SELECT id::varchar,name,idcategory::varchar AS category FROM products ORDER BY name"
    );
    res.json(r);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (id) {
      const r: any = await query(
        "DELETE FROM products WHERE id = $1 RETURNING id::varchar, name, idcategory::varchar as category",
        [id]
      );
      if (r.rowcount > 0) {
        res.json(r.rows);
      } else {
        res.json({ message: "Registro inexistente" });
      }
    } else {
      res.json({ message: "Forneça o produto" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, name, category } = req.body;
    if (!id) {
      res.json({ message: "Forneça o produto a ser atualizado" });
    } else if (!name) {
      res.json({ message: "Forneça o nome do produto" });
    } else if (!category) {
      res.json({ message: "Forneça a categoria do produto" });
    } else {
      const r: any = await query(
        "UPDATE products SET name=$2, idcategory=$3 WHERE id=$1 RETURNING id::varchar, name, idcategory::varchar as category",
        [id, name, category]
      );

      if (r.rowcount > 0) {
        res.json(r.rows);
      } else if (r.rowcount === 0) {
        res.json({ message: "Registro inexistente" });
      } else {
        res.json({ message: r.message });
      }
    }
  }
}

export default new ProductController();
