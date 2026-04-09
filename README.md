# Carona — App de Caronas de Rota Fixa

Plataforma de caronas intermunicipais com rotas fixas, focada em logística de assentos e bagagens. PWA-First com React Native (Expo).

## Tech Stack

- **Framework:** React Native + Expo (SDK 52)
- **Web:** PWA via Expo Web + deploy na Vercel
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
- **Estilização:** NativeWind (Tailwind CSS para React Native)
- **Roteamento:** Expo Router (file-based, App Directory)
- **Tipos:** TypeScript estrito

## Estrutura do Projeto

```
carona/
├── .devcontainer/                    # Ambiente de desenvolvimento isolado (Docker)
│   ├── devcontainer.json             # Imagem Node 20 + Docker-in-Docker
│   └── post-create.sh               # Script de pós-criação (instala deps + Supabase CLI)
├── app/                              # Expo Router (file-based routing)
│   ├── _layout.tsx                   # Root layout + AuthProvider
│   ├── index.tsx                     # Redirect automático: login ou app
│   ├── (auth)/                       # Grupo de telas de autenticação
│   │   ├── _layout.tsx               # Stack navigation (sem header)
│   │   ├── login.tsx                 # Tela de login (email + senha)
│   │   └── register.tsx              # Tela de cadastro
│   └── (app)/                        # Grupo de telas autenticadas (tabs)
│       ├── _layout.tsx               # Tab navigation (Viagens, Reservas, Perfil)
│       ├── index.tsx                 # Feed de viagens ativas
│       ├── trip/
│       │   ├── [id].tsx              # Detalhes da viagem + botão de reserva
│       │   └── create.tsx            # Formulário para criar viagem (motorista)
│       ├── bookings.tsx              # Lista de reservas do passageiro
│       └── profile.tsx               # Edição de perfil + logout
├── components/
│   └── TripCard.tsx                  # Card reutilizável para exibir viagem
├── lib/
│   ├── supabase.ts                   # Cliente Supabase (AsyncStorage + RLS)
│   ├── supabase/
│   │   └── database.types.ts         # Tipos TypeScript gerados do banco
│   └── providers/
│       └── AuthProvider.tsx           # Context de autenticação (session, user, signOut)
├── supabase/
│   ├── config.toml                   # Configuração do Supabase local
│   └── migrations/
│       └── 00001_initial_schema.sql  # Schema completo (tabelas, triggers, RLS)
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── global.css
├── nativewind-env.d.ts
├── app.json                          # Configuração do Expo
└── .env.example                      # Variáveis de ambiente (template)
```

## Schema do Banco de Dados

| Tabela           | Descrição                                                                               |
| ---------------- | --------------------------------------------------------------------------------------- |
| `profiles`       | Perfis vinculados ao Auth (username, bio, role: driver/passenger/both)                  |
| `trips`          | Viagens com origem, destino, coordenadas, horário, preço, assentos, bagagem             |
| `bookings`       | Reservas (N:M entre passengers e trips). Status: pending → confirmed/rejected/cancelled |
| `reviews`        | Avaliações bidirecionais (1-5 estrelas + comentário)                                    |
| `v_driver_stats` | View com média de estrelas e total de viagens por motorista                             |

**Triggers automáticos:**

- Criação de perfil no signup
- Atualização de `updated_at` em todas as tabelas
- Controle de `available_seats` ao confirmar/cancelar reserva
- Validação de bagagem compatível antes de permitir reserva

**Row Level Security (RLS):** Todas as tabelas têm RLS ativado — usuários só acessam/modificam dados permitidos.

## Próximos Passos

### 1. Instalar Docker

O Dev Container precisa de Docker para funcionar. Se você ainda não tem instalado:

```bash
# Verificar se já tem Docker
docker --version
```

**Se não tiver**, instale seguindo o guia oficial para sua distro:

```bash
# Ubuntu / Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

> Após adicionar seu usuário ao grupo `docker`, **faça logout e login novamente** (ou reinicie) para o grupo entrar em efeito.

Verifique que está funcionando:

```bash
docker run hello-world
```

### 2. Abrir o projeto no Dev Container

O Dev Container cria um ambiente isolado com Node 20, Supabase CLI e todas as dependências — nada é instalado na sua máquina local.

**Pré-requisito:** Instalar a extensão **Dev Containers** no VS Code:

- `Ctrl+Shift+X` → pesquisar "Dev Containers" → instalar a extensão da Microsoft (`ms-vscode-remote.remote-containers`)

**Para abrir:**

1. Abra o VS Code nesta pasta do projeto
2. `Ctrl+Shift+P` → digitar **"Dev Containers: Reopen in Container"** → Enter
3. Aguarde o build do container (primeira vez leva ~2–5 minutos, depois é instantâneo)
4. O script `post-create.sh` roda automaticamente e instala:
   - Supabase CLI (globalmente)
   - Dependências do projeto (`npm install`)
   - Fix de versões do Expo (`npx expo install --fix`)
5. Quando o terminal mostrar `✅ Dev environment ready!`, está pronto

O VS Code reabre **dentro do container** — terminal, extensões e IntelliSense rodam lá. Seu código permanece na máquina local (montado como volume).

### 3. Configurar e rodar o Supabase local

Dentro do Dev Container, no terminal integrado:

```bash
# 1. Copiar template de variáveis de ambiente
cp .env.example .env

# 2. Iniciar o Supabase local (Postgres, Auth, Storage, Studio)
npm run supabase:start
```

O comando `supabase start` imprime as credenciais no terminal. Exemplo de output:

```
API URL: http://localhost:54321
anon key: eyJhbGciOi...
service_role key: eyJhbGciOi...
Studio URL: http://localhost:54323
```

```bash
# 3. Copiar as keys para o .env
#    Edite o arquivo .env e cole os valores impressos acima:
#
#    EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
#    EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key do output>
#    SUPABASE_SERVICE_ROLE_KEY=<service_role key do output>
```

A migration `00001_initial_schema.sql` é aplicada automaticamente pelo `supabase start`, criando todas as tabelas, triggers e políticas RLS.

**Supabase Studio** (interface visual do banco) fica acessível em: `http://localhost:54323`

### 4. Rodar o app (PWA)

```bash
npm run web
```

Abre em `http://localhost:8081`. O hot reload funciona automaticamente — edite um arquivo e o browser atualiza.

### 5. Parar tudo

```bash
# Parar Supabase local
npm run supabase:stop

# Para sair do Dev Container: fechar o VS Code ou
# Ctrl+Shift+P → "Dev Containers: Reopen Folder Locally"
```
