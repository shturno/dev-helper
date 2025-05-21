# Dev Helper

A complete system designed to help developers increase productivity and focus, combining contextual microtasks, smart hyperfocus mode, and gamification with tangible rewards.

## System Components

- **Backend API (Laravel/PHP)**: Manages data, integrations, and business logic
- **Frontend Web (React/Next.js)**: Interface for visualization and configuration
- **VS Code Extension (TypeScript)**: Direct integration with the development environment
- **Database (MySQL)**: Persistent data storage

## System Requirements

- PHP 8.3+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm/yarn
- VS Code (for extension development)

## Project Structure

```
dev-helper/
├── backend/                 # Laravel API
├── frontend/                # Next.js Application
├── vscode-extension/        # VS Code Extension
├── docs/                    # Documentation
└── docker/                  # Docker Configurations
```

## Development Environment Setup

### 1. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3. VS Code Extension

```bash
cd vscode-extension
npm install
npm run compile
```

### 4. Database

```bash
# Using Docker
docker-compose up -d mysql

# Or installing locally
mysql -u root -p
CREATE DATABASE dev_helper;
```

## Main Features

- **Microtasks System**: Breaks down Jira tickets into 15-minute steps
- **Hyperfocus Mode**: Automatic activation based on context
- **Gamification**: XP system, levels, and tangible rewards
- **Smart Prioritization**: Analysis of Git, Jira, and productive hours

## Documentation

Detailed documentation is available in the `docs/` folder:

- [Requirements Analysis](docs/analise_requisitos.md)
- [System Architecture](docs/arquitetura_sistema.md)
- [Database Modeling](docs/modelagem_banco_dados.md)
- [REST API](docs/endpoints_api.md)
- [VS Code Extension](docs/extensao_vscode.md)
- [Gamification and Rewards](docs/gamificacao_recompensas.md)
- [Task Prioritization](docs/priorizacao_tasks.md)
- [Criteria Validation](docs/validacao_criterios.md)

## Contributing

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 