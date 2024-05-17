import { Request, Response } from "express";
import query from "../database/connection";

class ProductController {
  public async create(req: Request, res: Response): Promise<void> {
    const { name, category } = req.body;
    const r:any = await query(
      "INSERT INTO products(name,idcategory) VALUES ($1,$2) RETURNING id, name, idcategory",
      [name,category]
    );
    res.json(r);
  }

  public async list(_: Request, res: Response): Promise<void> {
    const r:any = await query(
      "SELECT a.id,a.name,b.name AS category FROM products AS a LEFT JOIN categories AS b ON a.idcategory=b.id ORDER BY a.name"
    );
    res.json(r);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.body; 
    const r:any = await query(
      "DELETE FROM products WHERE id = $1 RETURNING id, name, idcategory", 
      [id]
    );
    res.json(r);
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, name, category } = req.body;
    const r:any = await query(
      "UPDATE products SET name=$2, idcategory=$3 WHERE id=$1 RETURNING id, name, idcategory", 
      [id,name,category]
    );
    res.json(r);
  }
}

export default new ProductController();
