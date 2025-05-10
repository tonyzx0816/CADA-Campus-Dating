Got it! Here's the updated README to reflect that you're using Next.js for both the frontend and backend:

---

# Cada App

## Project Setup

This project uses **Next.js** for both the **frontend** and **backend**. The goal is to make it easy for the team to set up and run the project using Docker, without requiring local installations of tools like npm or PostgreSQL.

### Prerequisites

- **Docker**: Ensure Docker is installed and running on your machine. You can download it [here](https://docs.docker.com/get-docker/).

### Running the Project with Docker

To spin up both the backend and the PostgreSQL database using Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/cada-app.git
   ```

2. Navigate to the project directory:
   ```bash
   cd cada-app
   ```

3. Run Docker Compose to build and start both services (Next.js and PostgreSQL):
   ```bash
   docker-compose up --build -d
   ```

This command will:
- Start a PostgreSQL database on port `5432`.
- Start the Next.js app (acting as both frontend and backend) on port `3000`, connected to the PostgreSQL database.

### Next.js Setup (Frontend and Backend)

If you need to work with the frontend and backend in the same project, follow these steps:
1. **Install [brew](https://brew.sh/)** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js** (if not already installed):
   ```bash
   brew update
   brew install node
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Run the Next.js development server**:
   ```bash
   npm run dev
   ```

   This will start the Next.js app on `http://localhost:3000`.

### Database Setup with Prisma

To set up Prisma with your PostgreSQL database:

1. **Install Prisma CLI**:
   If you haven't already installed Prisma, you can do so with the following command:
   ```bash
   npm install prisma --save-dev
   ```

2. **Reserve the Schema**:
   Run the following Prisma command to generate the initial migration and reserve the database schema:
   ```bash
   npx prisma migrate dev --name init
   ```

   This will create the necessary tables and schema in your PostgreSQL database and apply any defined migrations.

### Configuration

- **Database**: PostgreSQL is used for the database and is managed through Docker Compose.
- **Prisma**: The Prisma client connects to PostgreSQL to manage database operations.

The following environment variables are defined in the `docker-compose.yml` for the backend to connect to PostgreSQL:

- `DB_URL`: `jdbc:postgresql://postgres:5432/cadadb`
- `DB_USER`: `cadauser`
- `DB_PASSWORD`: `cadapassword`

### Stopping the Services

To stop the services, run the following command:

```bash
docker-compose down
```

### Important Notes

- After editing the database schema, run the following command to apply the latest migration:
  ```bash
  npx prisma migrate dev --name init
  ```
  
- Useful prisma commands:

```bash
   npx prisma generate    # Generates Prisma Client from your schema
   
   npx prisma db push    # Pushes your schema to the database (non-destructive, no migrations)
   
   npx prisma migrate dev    # Runs migrations in dev environment (interactive, creates SQL files)
   
   npx prisma migrate reset    # Resets database and re-applies all migrations
   
   npx prisma studio      # See database
   
   npx prisma db seed  # seed fake data into db
````

- Check Before commit/push:
  ```bash
  
  npm run lint
  pnpm install
  pnpm run build
  ```

-  List of useful Prisma CLI commands for working with your database, schema, and migrations:

Setup & Initialization
Command	Description

  ```bash
   npx prisma init	# Initializes Prisma in your project (prisma/ folder, .env file)
   npx prisma generate	# Generates Prisma Client from your schema
   npx prisma format	# Formats your schema.prisma file
   npx prisma validate	# Validates your Prisma schema file
  ```

🧪 Development & Database Tools
Command	Description

  ```bash
  npx prisma db push	# Pushes your schema to the database (non-destructive, no migrations)
  npx prisma migrate dev	# Runs migrations in dev environment (interactive, creates SQL files)
  npx prisma migrate reset	# Resets database and re-applies all migrations
  npx prisma migrate status	# Shows migration status and history
  npx prisma migrate deploy	# Applies all pending migrations in production
  npx prisma migrate resolve	# Manually marks migrations as applied or rolled back
  
  npx prisma db seed  # seed fake data into db


  ```


