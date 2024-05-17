import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Configura o pool de conexão, passando um objeto de configuração 
// para se conectar ao BD do PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "")
});

// Configura o pool de conexão, passando um objeto de configuração 
// para se conectar a URI do BD na nuvem
/*
const pool = new Pool({
  connectionString: process.env.DB_URI,
  ssl: {
    // Ajuste necessário caso esteja utilizando SSL e seu ambiente requeira essa configuração
    rejectUnauthorized: false 
  }
});
*/

async function query (sql: string, params?: any[]) {
  try{
    const res = await pool.query(sql, params);
    if( res.command == 'INSERT' ){
      return res.rows[0];
    }
    else if( res.command == 'SELECT' ){
      return res.rows;
    }
    else if( res.command == 'DELETE' || res.command == 'UPDATE'){
      return {rowcount:res.rowCount, rows:res.rows[0]};
    }
    else{
      return {sql};
    }
  }
  catch(e:any){
    return {message:e.message};
  }
};

export default query;
