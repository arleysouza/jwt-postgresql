## Atividade - JWT (JSON Web Token)

O aplicativo possui as operações para fazer o CRUD nas tabelas representadas no modelo a seguir. Essas operações estão disponíveis através de rotas que possuem controle de acesso para usuários logados com o perfil adm, perfil user e sem a necessidade de estar logado. Ao efetuar o login, os dados do usuário são empacotados em um token e retornados para o cliente, que por sua vez, terá de enviar esse token em todas as requisições que requerem o controle de acesso. O token é gerado usando o pacote JWT (JSON Web Token). O código disponível no pacote middlewares é  chamado antes da função objetivo da rota para decodificar o token e validar o perfil de acesso do usuário. Se o usuário não tiver permissão, a função middleware impede o acesso ao recurso mapeado pela rota. 

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
No arquivo `src/database/create.ts` estão as instruções SQL para criar as tabelas e definir os triggers com as validações ao fazer insert e update nas tabelas.

Execute o comando `npm run create` para submeter as instruções SQL no SGBD.

#### Triggers

Para fazer as validações nos campos das tabelas foram definidos os seguintes triggers, onde cada trigger foi definido usando uma função:
- Trigger de `before insert` na tabela `users`: o comando a seguir faz a vinculação da função `users_insert_validade` ao trigger na tabela `users`:
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

#### Restrições dos campos
As restrições dos campos estão sendo validadas nas funções e serão lançadas exceções no caso de inconformidades.

- A tabela `categories` possui apenas o campo `name` com restrições. Será lançada uma exceção caso não seja satisfeita a condição:
```
CREATE FUNCTION categories_insert_validate() RETURNS trigger AS $$
BEGIN
    -- Converte para minúsculo e remove os espaços no início e fim
    new.name := lower(trim(new.name));
    -- Verifica se o nome já existe
    IF EXISTS (SELECT 1 FROM categories WHERE new.name = name) THEN
        RAISE EXCEPTION 'O nome % já está em uso', new.name;
    ELSE
        -- Verifica se o nome possui algum caractere
        IF length(new.name) = 0 THEN
            RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;
```
- A tabela `products` possui os campos `name` e `idcategory` com restrições.
```
CREATE FUNCTION products_insert_validate() RETURNS trigger AS $$
BEGIN
    -- Verifica se foi fornecido o nome
    IF new.name is null THEN
        RAISE EXCEPTION 'O nome é obrigatório';
    ELSE
        -- Converte para minúsculo e remove os espaços no início e fim
        new.name := lower(trim(new.name));
        -- Verifica se o nome já existe
        IF EXISTS (SELECT 1 FROM products WHERE new.name = name) THEN
            RAISE EXCEPTION 'O nome % já está em uso', new.name;
        ELSE
            -- Verifica se o nome possui algum caractere
            IF length(new.name) = 0 THEN
                RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
            ELSE
                -- Verifica se foi fornecido o idcategory
                IF new.idcategory is NULL THEN
                    RAISE EXCEPTION 'A categoria é obrigatória';
                ELSE
                    -- Verifica se o idcategory fornecido existe na tabela categories
                    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = NEW.idcategory) THEN
                        RAISE EXCEPTION 'A categoria fornecida não existe no cadastro';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql;
```
- A tabela `users` possui os campos `mail` e `password` com restrições.
```
CREATE FUNCTION users_insert_validade() RETURNS trigger AS $$
BEGIN
    -- Converte para minúsculo e remove os espaços no início e fim
    new.mail := lower(trim(new.mail));
    new.password := trim(new.password);
    -- Verifica se foi fornecido o mail
    IF new.mail is null THEN
        RAISE EXCEPTION 'O e-mail é obrigatório';
    ELSE
        -- Verifica se foi fornecida a senha
        IF new.password is null THEN
            RAISE EXCEPTION 'A senha é obrigatória';
        ELSE
            -- Valida o formato do e-mail usando expressão regular
            IF NOT new.mail ~* '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
                RAISE EXCEPTION 'O e-mail % não está em um formato válido', new.mail;
            ELSE
                -- Verifica se o mail já existe
                IF EXISTS (SELECT 1 FROM users WHERE new.mail = mail) THEN
                    RAISE EXCEPTION 'O e-mail % já está em uso', new.mail;
                ELSE
                    -- Verifica se a senha tem a quantidade correta de caracteres
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
- A tabela `spents` possui os campos `value` e `idproduct` com restrições.
```
CREATE FUNCTION spents_insert_validate() RETURNS trigger AS $$
BEGIN
    -- Verifica se foi fornecido o valor
    IF new.value is null THEN
        RAISE EXCEPTION 'O valor é obrigatório';
    ELSE
        -- Verifica se foi fornecido o ID do produto
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
No arquivo `src/database/load.ts` estão as instruções SQL para carregar registros nas tabelas.

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
