# Simulador do Algoritmo de Berkeley

Este projeto é um site para simular a sincronização de relógios distribuídos com o algoritmo de Berkeley. A aplicação permite informar um relógio de referência, cadastrar clientes, opcionalmente registrar o horário de envio de cada um e visualizar o resultado da sincronização, incluindo ajustes aplicados e rankings antes e depois do processamento.

O trabalho foi desenvolvido para a disciplina de **Sistemas Distribuídos (SD)**. O projeto foi desenvolvido em estilo *vibecoded*, com refinamentos posteriores de interface, testes e organização do código.

## O que o site faz

- Permite definir o horário de referência do servidor.
- Permite adicionar múltiplos clientes com horário local.
- Aceita, de forma opcional, o horário de envio de cada cliente.
- Calcula a sincronização com base no algoritmo de Berkeley.
- Exibe:
  - o novo clock lógico global;
  - o ajuste aplicado em cada cliente;
  - a ordem original dos envios;
  - a ordem após a sincronização.

## Requisitos

- Node.js 22 ou superior
- npm

## Como executar

1. Instale as dependências:

```bash
npm install
```

2. Rode o projeto em modo de desenvolvimento:

```bash
npm run dev
```

3. Acesse no navegador:

```text
http://localhost:3000
```

## Como gerar a versão de produção

1. Compile o projeto:

```bash
npm run build
```

2. Inicie o servidor compilado:

```bash
npm start
```

Observação: `dist/` é um artefato gerado pelo build, não faz parte do código-fonte e não deve ser versionado.

## Como executar os testes

```bash
npm test
```

Atualmente, a suíte cobre:

- regras de validação do domínio;
- serviço de sincronização;
- caso de uso da aplicação;
- rota HTTP principal;
- helpers e tratamento de erros do frontend.
