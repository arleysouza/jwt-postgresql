## Atividade - JWT (JSON Web Token)

Esse aplicativo é usado para estabelecer uma conexão com o SGBD PostgreSQL para persistir dados nas seguintes tabelas. 

![](https://github.com/arleysouza/jwt-postgresql/blob/main/images/modelDB.png)


### Instruções de uso
Todos os pacotes necessários estão no `package.json`.
```
git clone https://github.com/arleysouza/jwt-postgresql.git server
cd server
npm i
```
Você precisa substituir as variáveis de ambiente do arquivo `.env` pelos parâmetros de conexão do SBGD PostgreSQL que você criou.
```
PORT = 3010
JWT_SECRET = @tokenJWT

DB_USER = postgres
DB_HOST = localhost
DB_NAME = bdatividade
DB_PASSWORD = 123
DB_PORT = 5432
DB_URI = postgres://root:@dpg-coufst21hbls7385tsd0-a.oregon-postgres.render.com/bdatividade
```
Se optar pelo SGBD na nuvem, você precisará sustituir a variável `DB_URI` e também retirar o comentário do código a seguir no arquivo `src/database/connection.ts`, para configurar o pool de conexão.
```
const pool = new Pool({
  connectionString: process.env.DB_URI,
  ssl: {
    rejectUnauthorized: false 
  }
});
```

### SQL para criar as tabelas
No arquivo `src/database/create.ts` estão as instruções SQL para criar as tabelas e definir os triggers com validações ao fazer insert e update nas tabelas.
Execute o comando `npm run create` para submeter as instruções SQL no SGBD.
Para fazer as validações nos campos das tabelas foram definidos os seguintes triggers. Cada trigger foi definido usando uma função:
- Trigger de `before insert` na tabela `users`: o comando a seguir faz a vinculação da função `users_insert_validade` ao trigger de insert na tabela `users`:
```
CREATE TRIGGER users_insert_trigger
BEFORE INSERT ON users
 FOR EACH ROW EXECUTE PROCEDURE users_insert_validade();
```
- Trigger de `before update` na tabela `users`: definido usando a função  `users_update_validade`;
- Trigger de `before insert` na tabela `products`: definido usando a função  `products_insert_validate`;
- Trigger de `before update` na tabela `products`: definido usando a função  `products_update_validate`;
- Trigger de `before insert` na tabela `categories`: definido usando a função  `categories_insert_validate`;
- Trigger de `before update` na tabela `categories`: definido usando a função  `categories_update_validate`;
- Trigger de `before insert` na tabela `spents`: definido usando a função  `spents_insert_validate`;
- Trigger de `before update` na tabela `spents`: definido usando a função  `spents_update_validate`.

### Modificações realizadas no projeto

1. Foi necessário instalar os pacotes 'react-router' e 'react-router-dom' para podermos gerenciar rotas no aplicativo. Vale lembrar que criaremos rotas para componentes;
2. `/src/index.css`: foram adicionados os estilos para remover a formatação padrão de hiperlinks e hiperlinks visitados:
```
/* Remove a formatação padrão de hiperlinks */
a {
  text-decoration: none; /* Remove sublinhado */
  color: inherit; /* Mantém a cor padrão do texto */
}
/* Remove a formatação de hiperlinks visitados */
a:visited {
  color: inherit; /* Mantém a cor padrão do texto */
}
```
3. Criou-se o componente `Logo` na pasta `components`. Esse componente possui a imagem do logo bem como a formatação CSS que foi aplicada usando styled-components. O componente `Logo` será criado na barra de menu;
4. Criou-se o componente `ItemMenu` na pasta `components`. Cada componente será um hiperlink para uma rota. Os componentes `ItemMenu` serão criados na barra de menu;
5. Criou-se a pasta `routes` nela você vai definir as rotas;

### Modificações necessárias no projeto
1. Será necessário criar as rotas `/rgb`,`/hsla` e `/cmyk`, no pacote `routes`, usando a estrutura de marcações `<BrowserRouter>`,`<Routes>` e `<Route>`;
2. A localização do provider - por exemplo, `<RGBProvider>` - determina o seu alcance. Para manter os valores dos campos de entrada quando o usuário navegar de uma rota para outra será necessário colocar `<RGBProvider>` numa posição que envolva as rotas;
3. Será necessário chamar o componente `<Rotas>` no componente `App`. Visto que toda a interface da aplicação estará no componente `Rotas`.
