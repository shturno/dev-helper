# TDAH Dev Helper

Um sistema completo projetado para ajudar desenvolvedores com TDAH a aumentar sua produtividade e foco, combinando microtarefas contextuais, modo hiperfoco inteligente e gamificação com recompensas tangíveis.

## Componentes do Sistema

- **Backend API (Laravel/PHP)**: Gerencia dados, integrações e lógica de negócios
- **Frontend Web (React/Next.js)**: Interface para visualização e configuração
- **Extensão VS Code (TypeScript)**: Integração direta com o ambiente de desenvolvimento
- **Banco de Dados (MySQL)**: Armazenamento persistente de dados

## Requisitos do Sistema

- PHP 8.3+
- Node.js 18+
- MySQL 8.0+
- Composer
- npm/yarn
- VS Code (para desenvolvimento da extensão)

## Estrutura do Projeto

```
tdah-dev-helper/
├── backend/                 # API Laravel
├── frontend/               # Aplicação Next.js
├── vscode-extension/       # Extensão VS Code
├── docs/                   # Documentação
└── docker/                 # Configurações Docker
```

## Configuração do Ambiente de Desenvolvimento

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

### 3. Extensão VS Code

```bash
cd vscode-extension
npm install
npm run compile
```

### 4. Banco de Dados

```bash
# Usando Docker
docker-compose up -d mysql

# Ou instalando localmente
mysql -u root -p
CREATE DATABASE tdah_dev_helper;
```

## Funcionalidades Principais

- **Sistema de Microtarefas**: Quebra tickets do Jira em passos de 15 minutos
- **Modo Hiperfoco**: Ativação automática baseada em contexto
- **Gamificação**: Sistema de XP, níveis e recompensas tangíveis
- **Priorização Inteligente**: Análise de Git, Jira e horários produtivos

## Documentação

A documentação detalhada está disponível na pasta `docs/`:

- [Análise de Requisitos](docs/analise_requisitos.md)
- [Arquitetura do Sistema](docs/arquitetura_sistema.md)
- [Banco de Dados](docs/modelagem_banco_dados.md)
- [API REST](docs/endpoints_api.md)
- [Extensão VS Code](docs/extensao_vscode.md)
- [Gamificação e Recompensas](docs/gamificacao_recompensas.md)
- [Priorização de Tasks](docs/priorizacao_tasks.md)
- [Validação de Critérios](docs/validacao_criterios.md)

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes. 