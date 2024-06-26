## Atividade - JWT (JSON Web Token)

O aplicativo possui as operações para fazer o CRUD nas tabelas representadas no modelo a seguir. Essas operações estão disponíveis através de rotas que possuem controle de acesso para usuários logados com o perfil adm, perfil user e sem a necessidade de estar logado. Ao efetuar o login, os dados do usuário são empacotados em um token e retornados para o cliente, que por sua vez, terá de enviar esse token em todas as requisições que requerem o controle de acesso. O token é gerado usando o pacote JWT (JSON Web Token). O código disponível no pacote middlewares é  chamado antes da função objetivo da rota para decodificar o token e validar o perfil de acesso do usuário. Se o usuário não tiver permissão, a função middleware impede o acesso ao recurso mapeado pela rota. 

![](https://github.com/arleysouza/jwt-postgresql/blob/main/images/modelDB.png)

O front end está disponível em https://github.com/arleysouza/jwt-frontend. 

### Instruções de uso
Todos os pacotes necessários estão no `package.json`, então basta clonar o projeto e instalar as dependências.
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
DB_URI = postgres://root:@dpg-coufst21h85tsd0-a.oregon-postgres.render.com/bdatividade
```
Se optar pelo SGBD na nuvem, você precisará sustituir a variável `DB_URI` e também retirar o comentário do código a seguir no arquivo `src/database/connection.ts`, para configurar o pool de conexões.
```
const pool = new Pool({
  connectionString: process.env.DB_URI,
  ssl: {
    rejectUnauthorized: false 
  }
});
```

### SQL para criar as tabelas
No arquivo `src/database/create.ts` estão as instruções SQL para criar as tabelas e definir os triggers com as validações ao fazer insert, update e delete nas tabelas.

Execute o comando `npm run create` para submeter as instruções SQL no SGBD.

#### Triggers

Para fazer as validações nos campos das tabelas foram definidos os seguintes triggers, onde cada trigger foi definido usando uma função:
- Trigger de `before insert` e `before update` na tabela `users`, definidos usando as funções `users_insert_validade` e `users_update_validade`, respectivamente;
- Trigger de `before insert` e `before update` na tabela `expenses`, definidos usando as funções `expenses_insert_validade` e `expenses_update_validade`, respectivamente;
- Trigger de `before insert`, `before update` e `before delete` na tabela `products`, definido usando as funções `products_insert_validate`, `products_update_validate` e `products_delete_validate`, respectivamente;
- Trigger de `before insert`, `before update` e `before delete` na tabela `categories`, definido usando as funções `categories_insert_validate`, `categories_update_validate` e `categories_delete_validate`, respectivamente.

Como exemplo, o comando a seguir faz a vinculação da função `users_insert_validade` ao trigger na tabela `users`:
```
CREATE TRIGGER users_insert_trigger
BEFORE INSERT ON users
FOR EACH ROW EXECUTE PROCEDURE users_insert_validade();
```

#### Restrições dos campos
As restrições dos campos estão sendo validadas nas funções e serão lançadas exceções no caso de inconformidades.

- A tabela `categories` possui apenas o campo `name` com restrições. Será lançada uma exceção caso não seja satisfeita a condição:
```
CREATE FUNCTION categories_insert_validate() 
RETURNS trigger AS $$
BEGIN
    -- Converte para minúsculo e remove os espaços no início e fim
    new.name := lower(trim(new.name));

    IF EXISTS (SELECT 1 FROM categories WHERE new.name = name) THEN
        RAISE EXCEPTION 'O nome % já está em uso', new.name;
    ELSE
        IF length(new.name) = 0 THEN
            RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION categories_delete_validate() 
RETURNS trigger AS $$
BEGIN
    -- Verifica se existem produtos associados à categoria que está sendo excluída
    IF EXISTS (SELECT 1 FROM products WHERE idcategory = OLD.id) THEN
        RAISE EXCEPTION 'A categoria não pode ser excluída por existirem produtos';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```
- A tabela `products` possui os campos `name` e `idcategory` com restrições.
```
CREATE FUNCTION products_update_validate() 
RETURNS trigger AS $$
BEGIN
    IF new.name is null THEN
        RAISE EXCEPTION 'O nome é obrigatório';
    ELSE
        -- Converte para minúsculo e remove os espaços no início e fim
        new.name := lower(trim(new.name));
        
        IF EXISTS (SELECT 1 FROM products WHERE new.name = name AND NEW.id <> id) THEN
            RAISE EXCEPTION 'O nome % já está em uso', new.name;
        ELSE
            IF length(new.name) = 0 THEN
                RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
            ELSE
                -- Verifica se o idcategory fornecido existe na tabela categories
                IF NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.idcategory) THEN
                    RAISE EXCEPTION 'A categoria fornecida não existe no cadastro';
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION products_delete_validate() 
RETURNS trigger AS $$
BEGIN
    -- Verifica se existem gastos associados ao produto que está sendo excluído
    IF EXISTS (SELECT 1 FROM expenses WHERE idproduct = OLD.id) THEN
        RAISE EXCEPTION 'O produto não pode ser excluído por existirem gastos';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```
- A tabela `users` possui os campos `mail` e `password` com restrições.
```
CREATE FUNCTION users_insert_validade() 
RETURNS trigger AS $$
BEGIN
    -- Converte para minúsculo e remove os espaços no início e fim
    new.mail := lower(trim(new.mail));
    new.password := trim(new.password);

    IF new.mail is null THEN
        RAISE EXCEPTION 'O e-mail é obrigatório';
    ELSE
        IF new.password is null THEN
            RAISE EXCEPTION 'A senha é obrigatória';
        ELSE
            IF NOT new.mail ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
                RAISE EXCEPTION 'O e-mail % não está em um formato válido', new.mail;
            ELSE
                IF EXISTS (SELECT 1 FROM users WHERE new.mail = mail) THEN
                    RAISE EXCEPTION 'O e-mail % já está em uso', new.mail;
                ELSE
                    IF length(new.password) < 6 OR length(new.password) > 10 THEN
                        RAISE EXCEPTION 'A senha deve ter entre 6 e 10 caracterese';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN new;
END;
$$ LANGUAGE plpgsql;
```
- A tabela `expenses` possui os campos `value` e `idproduct` com restrições.
```
CREATE FUNCTION expenses_insert_validate() 
RETURNS trigger AS $$
BEGIN
    IF new.value is null THEN
        RAISE EXCEPTION 'O valor é obrigatório';
    ELSE
        IF new.idproduct is null THEN
            RAISE EXCEPTION 'O produto é obrigatório';
        ELSE
            -- Verifica se o idproduct existe na tabela products
            IF NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.idproduct) THEN
                RAISE EXCEPTION 'O produto fornecido não existe no cadastro';
            END IF;
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;
```

### Carregar dados de teste
No arquivo `src/database/load.ts` estão as instruções SQL para carregar dados de teste nas tabelas.
Execute o comando `npm run load` para submeter as instruções SQL no SGBD.

### Restrições de acesso
A aplicação possui os níveis de acesso para os perfis `adm` e `user`. 

Rotas sem restrição de acesso:
- HTTP POST `/login`: efetuar login;
- HTTP POST `/usuario`: o usuário efetua o seu próprio cadastro.

Rotas para usuário logados:
- HTTP GET `/categoria`: listar as categorias;
- HTTP GET `/produto`: listar os produtos;
- HTTP GET `/gasto`: usuário lista somente os seus gastos;
- HTTP POST `/gasto`: usuário cria um gasto;
- HTTP PUT `/gasto`: usuário altera um gasto dele;
- HTTP DELETE `/gasto`: usuário exclui um gasto dele;
- HTTP DELETE `/usuario`: usuário exclui o próprio cadastro;
- HTTP PUT `/usuario/mail`: usuário altera o próprio e-mail;
- HTTP PUT `/usuario/senha`: usuário altera a própria senha.

Rotas para usuário logados com o perfil `adm`:
- HTTP POST `/categoria`: cria uma categoria;
- HTTP PUT `/categoria`: altera uma categoria;
- HTTP DELETE `/categoria`: exclui uma categoria;
- HTTP POST `/produto`: cria um produto;
- HTTP PUT `/produto`: altera um produto;
- HTTP DELETE `/produto`: exclui um produto;
- HTTP GET `/usuario`: listar os usuários;
- HTTP PUT `/usuario/perfil`: altera o perfil de algum usuário.
