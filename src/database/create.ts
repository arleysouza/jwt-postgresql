import query from "./connection";

async function init() {
  return query(`
        BEGIN;
                
        DROP TRIGGER IF EXISTS users_insert_trigger ON users;
        DROP TRIGGER IF EXISTS users_update_trigger ON users;
        DROP TRIGGER IF EXISTS products_insert_trigger ON products;
        DROP TRIGGER IF EXISTS products_update_trigger ON products;
        DROP TRIGGER IF EXISTS categories_insert_trigger ON categories;
        DROP TRIGGER IF EXISTS categories_update_trigger ON categories;
        DROP TRIGGER IF EXISTS spents_insert_trigger ON spents;
        DROP TRIGGER IF EXISTS spents_update_trigger ON spents;

        DROP FUNCTION IF EXISTS users_insert_validade, users_update_validade, 
                                products_insert_validate, products_update_validate,
                                categories_insert_validate, categories_update_validate,
                                spents_insert_validate, spents_update_validate;
        
        DROP TABLE IF EXISTS spents, products, users, categories;
        
        DROP TYPE IF EXISTS enum_profile CASCADE;

        CREATE TYPE enum_profile AS ENUM ('user', 'adm');

        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL,
            name VARCHAR(50) NOT NULL,
            CONSTRAINT categories_pk PRIMARY KEY (id),
            CONSTRAINT categories_name_unique UNIQUE (name)
        );

        CREATE TABLE IF NOT EXISTS users (
            id SERIAL,
            mail VARCHAR(50) NOT NULL,
            password VARCHAR(100) NOT NULL,
            profile enum_profile NOT NULL DEFAULT 'user',
            CONSTRAINT users_pk PRIMARY KEY (id),
            CONSTRAINT users_mail_unique UNIQUE (mail)
        );

        CREATE TABLE IF NOT EXISTS products (
            id SERIAL NOT NULL,
            idcategory integer not null,
            name VARCHAR(50) NOT NULL,
            CONSTRAINT products_pk PRIMARY KEY (id),
            CONSTRAINT products_name_unique UNIQUE (name),
            CONSTRAINT products_idcategory_fk
                FOREIGN KEY (idcategory)
                references categories (id)
                ON DELETE cascade
                on UPDATE cascade
        );

        CREATE TABLE IF NOT EXISTS spents (
            id SERIAL,
            iduser integer not null,
            idproduct integer not null,
            value decimal(10,2) NOT NULL,
            datetime TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            CONSTRAINT spents_pk PRIMARY KEY (id),
            CONSTRAINT spents_iduser_fk
                FOREIGN KEY (iduser)
                references users (id)
                ON DELETE cascade
                on UPDATE cascade,
            CONSTRAINT spents_idproduct_fk
            FOREIGN KEY(idproduct)
                references products (id)
                ON DELETE cascade
                ON UPDATE cascade
        );

        -- Função para verificar mail repetido, mail inválido e senha na tabela users ao inserir
        CREATE FUNCTION users_insert_validade() RETURNS trigger AS $$
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

        -- Função para verificar mail repetido, mail inválido e senha na tabela users ao atualizar
        CREATE FUNCTION users_update_validade() RETURNS trigger AS $$
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
                        IF EXISTS (SELECT 1 FROM users WHERE new.mail = mail AND NEW.id <> id) THEN
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

        -- Função para verificar name repetido na tabela products ao inserir
        CREATE FUNCTION products_insert_validate() RETURNS trigger AS $$
        BEGIN
            IF new.name is null THEN
                RAISE EXCEPTION 'O nome é obrigatório';
            ELSE
                -- Converte para minúsculo e remove os espaços no início e fim
                new.name := lower(trim(new.name));

                IF EXISTS (SELECT 1 FROM products WHERE new.name = name) THEN
                    RAISE EXCEPTION 'O nome % já está em uso', new.name;
                ELSE
                    IF length(new.name) = 0 THEN
                        RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
                    ELSE
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

        -- Função para verificar name repetido na tabela products ao atualizar
        CREATE FUNCTION products_update_validate() RETURNS trigger AS $$
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

        -- Função para verificar name repetido na tabela categories ao inserir
        CREATE FUNCTION categories_insert_validate() RETURNS trigger AS $$
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

        -- Função para verificar name repetido na tabela categories ao inserir
        CREATE FUNCTION categories_update_validate() RETURNS trigger AS $$
        BEGIN
            -- Converte para minúsculo e remove os espaços no início e fim
            new.name := lower(trim(new.name));

            IF EXISTS (SELECT 1 FROM categories WHERE new.name = name AND NEW.id <> id) THEN
                RAISE EXCEPTION 'O nome % já está em uso', new.name;
            ELSE
                IF length(new.name) = 0 THEN
                    RAISE EXCEPTION 'O nome precisa ter pelo menos uma letra';
                END IF;
            END IF;
            RETURN new;
        END;
        $$ LANGUAGE plpgsql;

        CREATE FUNCTION spents_insert_validate() RETURNS trigger AS $$
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
		
        CREATE FUNCTION spents_update_validate() RETURNS trigger AS $$
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

        -- Associa a função users_insert_validade ao trigger de insert na tabela users
        CREATE TRIGGER users_insert_trigger
        BEFORE INSERT ON users
        FOR EACH ROW EXECUTE PROCEDURE users_insert_validade();

        -- Associa a função users_update_validade ao trigger de update na tabela users
        CREATE TRIGGER users_update_trigger
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE PROCEDURE users_update_validade();

        -- Associa a função products_validate ao trigger de insert na tabela produtcs
        CREATE TRIGGER products_insert_trigger
        BEFORE INSERT ON products
        FOR EACH ROW EXECUTE PROCEDURE products_insert_validate();

        -- Associa a função products_validate ao trigger de insert na tabela produtcs
        CREATE TRIGGER products_update_trigger
        BEFORE UPDATE ON products
        FOR EACH ROW EXECUTE PROCEDURE products_update_validate();

        -- Associa a função categories_insert_validate ao trigger de insert na tabela categories
        CREATE TRIGGER categories_insert_trigger
        BEFORE INSERT ON categories
        FOR EACH ROW EXECUTE PROCEDURE categories_insert_validate();

        -- Associa a função categories_update_validate ao trigger de insert na tabela categories
        CREATE TRIGGER categories_update_trigger
        BEFORE UPDATE ON categories
        FOR EACH ROW EXECUTE PROCEDURE categories_update_validate();

        -- Associa a função ao trigger
        CREATE TRIGGER spents_insert_trigger
        BEFORE INSERT ON spents
        FOR EACH ROW EXECUTE PROCEDURE spents_insert_validate();

        -- Associa a função ao trigger
        CREATE TRIGGER spents_update_trigger
        BEFORE UPDATE ON spents
        FOR EACH ROW EXECUTE PROCEDURE spents_update_validate();

        COMMIT;
    `);
}

init()
  .then((r) => console.log("Comandos SQL submetidos ao SGBD"))
  .catch((e) => console.log(e))
  .finally(() => console.log("Finalizado"));
