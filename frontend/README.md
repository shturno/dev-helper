# TDAH Dev Helper

Uma aplicação web para ajudar desenvolvedores com TDAH a aumentar sua produtividade.

## Visão Geral

O TDAH Dev Helper é uma plataforma completa projetada especificamente para desenvolvedores com TDAH. A aplicação oferece ferramentas para gerenciamento de tarefas, modo hiperfoco, gamificação e análise de produtividade, tudo com foco em acessibilidade e experiência do usuário.

## Tecnologias Utilizadas

- **Next.js 14** com App Router
- **TypeScript** para tipagem estática
- **Tailwind CSS** para estilização
- **Framer Motion** para animações
- **React Query** para gerenciamento de estado e cache
- **NextAuth.js** para autenticação
- **Zod** para validação de formulários
- **React Hook Form** para formulários
- **shadcn/ui** para componentes base
- **Axios** para requisições HTTP

## Funcionalidades Principais

### Sistema de Microtarefas
- Visualização estilo RPG com barra de HP
- Lista de subtarefas de 15 minutos
- Progresso visual
- Integração com Jira
- Decomposição automática de tarefas

### Modo Hiperfoco
- Dashboard de contexto atual
- Configurações de bloqueio de distrações
- Estatísticas de tempo em hiperfoco
- Histórico de sessões
- Integração com VS Code

### Sistema de Gamificação
- Perfil do usuário com XP e nível
- Barra de progresso de nível
- Lista de recompensas desbloqueadas
- Histórico de conquistas
- Multiplicadores de XP

### Priorização de Tasks
- Cronograma visual interativo
- Drag-and-drop de tarefas
- Indicadores de confiança (Monte Carlo)
- Integração com Git e Jira
- Análise de horários produtivos

## Acessibilidade

- Suporte a temas de alto contraste (claro e escuro)
- Tema especial "Matrix" (recompensa de nível 1)
- Suporte a dislexia (fonte OpenDyslexic)
- Navegação por teclado
- ARIA labels
- Contraste adequado
- Textos alternativos

## Instalação

\`\`\`bash
# Clone o repositório
git clone https://github.com/seu-usuario/tdah-dev-helper-frontend.git
cd tdah-dev-helper-frontend

# Instale as dependências
npm install

# Execute o servidor de desenvolvimento
npm run dev
\`\`\`

## Estrutura do Projeto

\`\`\`
src/
├── app/                # App Router
├── components/         # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn)
│   ├── tasks/          # Componentes de tarefas
│   ├── hyperfocus/     # Componentes de hiperfoco
│   ├── gamification/   # Componentes de gamificação
│   └── layout/         # Componentes de layout
├── lib/                # Utilitários e configurações
├── hooks/              # Custom hooks
├── services/           # Serviços e APIs
├── styles/             # Estilos globais
├── types/              # TypeScript types
└── utils/              # Funções utilitárias
\`\`\`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contato

Para mais informações, entre em contato pelo email: exemplo@email.com
\`\`\`
