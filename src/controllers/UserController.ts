import { Request, Response } from "express";
import query from "../database/connection";
import { tokenize } from "../middlewares";

class UserController {
  public async login(req: Request, res: Response): Promise<void> {
    const { mail, password } = req.body;

    if (!mail && !password) {
      res.status(401).json({ erro: "Forneça o e-mail e senha" });
    } else {
      const response: any = await query(
        `SELECT id, mail, profile 
          FROM users 
          WHERE mail=$1 AND password=$2`,
        [mail, password]
      );

      if (response.length > 0) {
        const [object] = response;
        res.json({ ...object, token: tokenize(object) });
      } else {
        res.json({ erro: "Dados de login não conferem" });
      }
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    const { mail, password } = req.body;

    const response: any = await query(
      "INSERT INTO users(mail,password) VALUES ($1,$2) RETURNING id, mail, profile",
      [mail, password]
    );

    if (response && response.id) {
      const object = {
        id: response.id,
        mail: response.mail,
        profile: response.profile,
      };
      res.json({ ...object, token: tokenize(object) });
    } else {
      res.json({ erro: response.message });
    }
  }

  public async list(_: Request, res: Response): Promise<void> {
    const response: any = await query(
      "SELECT id,mail,profile FROM users ORDER BY mail"
    );
    res.json(response);
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = res.locals;
    const response: any = await query(
      "DELETE FROM users WHERE id = $1 RETURNING id, mail, profile",
      [id]
    );

    if (response && response.rowcount && response.rowcount > 0) {
      res.json(response.rows);
    } else {
      res.json({ erro: `Usuário não localizado` });
    }
  }

  public async updateMail(req: Request, res: Response): Promise<void> {
    const { mail } = req.body;
    const { id } = res.locals;
    const r: any = await query(
      "UPDATE users SET mail=$2 WHERE id=$1", 
      [id, mail]);
    res.json(r);
  }

  public async updatePassword(req: Request, res: Response): Promise<void> {
    const { password } = req.body;
    const { id } = res.locals;
    const r: any = await query("UPDATE users SET password=$2 WHERE id=$1", [
      id,
      password,
    ]);
    res.json(r);
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    const { id, profile } = req.body;
    if (profile === "adm" || profile === "user") {
      const r: any = await query(
        "UPDATE users SET profile=$2 WHERE id=$1", 
        [id,profile]);
      res.json(r);
    } else {
      res.json({ erro: `Perfil inexistente` });
    }
  }
}

export default new UserController();
