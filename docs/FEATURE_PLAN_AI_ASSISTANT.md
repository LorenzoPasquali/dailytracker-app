# Plano de Implementação: Assistente de IA (Gemini Tool Use)

Este documento descreve a implementação da funcionalidade de IA para resumos de tarefas, utilizando **Function Calling** direto no backend Express, eliminando a complexidade do MCP e focando em segurança e simplicidade.

## 1. Visão Geral
O assistente de IA ajudará o usuário a organizar sua Daily Scrum e resumir sua semana. Ele terá acesso de "somente leitura" aos dados do usuário através de funções pré-definidas e validadas.

## 2. Arquitetura Simplificada

### Componentes:
1.  **AI Controller (`service/ai/controller.js`)**: Gerencia a comunicação com o SDK `@google/generative-ai`.
2.  **Tool Registry (`service/ai/tools.js`)**: Define as funções que a IA pode chamar (ex: `getTasksByDate`) e usa **Zod** para validar os argumentos.
3.  **Frontend Chat**: Interface simples de mensagens no dashboard.

### Fluxo de Execução:
1. O usuário envia uma mensagem.
2. O servidor recupera a `GEMINI_API_KEY` do usuário no banco.
3. O servidor inicia um chat com o Gemini, enviando a definição das `tools`.
4. O Gemini solicita uma chamada de função (ex: `get_tasks(status: "DONE")`).
5. **Validação**: O servidor valida os parâmetros com Zod.
6. **Execução**: O Prisma busca os dados filtrados obrigatoriamente pelo `userId` da sessão.
7. O Gemini processa o JSON retornado e responde ao usuário.

## 3. Detalhamento de Segurança e Robustez

### 3.1. Proteção contra Injeção e Abusos
-   **Zod Schemas**: Cada ferramenta terá um schema rígido. Ex: Status deve ser um `enum` do Prisma; datas devem ser strings ISO válidas.
-   **Filtro Forçado**: O `userId` nunca é passado pela IA; ele é injetado pelo backend a partir do token JWT antes da query ao Prisma.
-   **Loop Protection**: Limite máximo de 3 chamadas de ferramentas por interação para evitar loops infinitos e consumo excessivo de tokens.

### 3.2. Tratamento de Erros
-   **Timeout**: Chamadas à API do Gemini terão timeout de 10s.
-   **Fallback**: Se a IA falhar ou a chave for inválida, o sistema retorna uma mensagem amigável instruindo o usuário a verificar suas configurações.

## 4. Cronograma Atualizado

### Fase 1: Base e Segurança (Backend)
- Adicionar `geminiKey` ao modelo `User` (criptografado).
- Criar a estrutura `service/ai/` com o registro de ferramentas.
- Implementar a rota `POST /api/ai/chat` com autenticação JWT.

### Fase 2: Refinamento de Prompts (Core)
- Definir o `System Instruction` focado em metodologias ágeis (Scrum).
- Testar a capacidade da IA de lidar com contextos vazios (dias sem tarefas).

### Fase 3: Interface (Frontend)
- Aba de chat no Dashboard.
- Tela de configuração da API Key com feedback de validação.

## 5. Exemplo de Definição de Ferramenta (Tool)
```javascript
const GetTasksSchema = z.object({
  status: z.enum(["PLANNED", "IN_PROGRESS", "DONE"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
```

---
Este plano substitui a proposta anterior de Servidor MCP, priorizando a manutenção do código e a segurança do sistema.
