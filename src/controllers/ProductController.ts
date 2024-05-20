import { Request, Response } from "express";
import query from "../database/connection";

class ProductController {
  public async create(req: Request, res: Response): Promise<void> {
    const { name, category } = req.body;
    const r:any = await query(
      "INSERT INTO products(name,idcategory) VALUES ($1,$2) RETURNING id, name, idcategory AS category",
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
      "DELETE FROM products WHERE id = $1 RETURNING id, name, idcategory as category", 
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
    const { id, name, category } = req.body;
    const r:any = await query(
      "UPDATE products SET name=$2, idcategory=$3 WHERE id=$1 RETURNING id, name, idcategory as category", 
      [id,name,category]
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

export default new ProductController();
