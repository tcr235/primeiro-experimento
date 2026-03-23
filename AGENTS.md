# AGENTS.md

## Visão Geral do Projeto

Sistema web simples voltado para a criação, gerenciamento e correção de provas. O sistema gerencia questões fechadas, cria provas a partir da seleção de questões, gera versões individuais em PDF com questões embaralhadas e automatiza a correção de notas via relatórios em CSV.

## Stack Tecnológico

- **Frontend:** Aplicação web com cliente React em TypeScript.
- **Backend:** Servidor Node.js em TypeScript.
- **Testes de Aceitação:** BDD utilizando Cucumber e a linguagem Gherkin.

## Regras de Negócio e Domínio

- **Modelagem de Alternativas:** As alternativas das provas devem ser identificadas de duas formas pelo usuário: por letras tradicionais ou por potências de 2 (1, 2, 4, 8, 16, 32...). O espaço para resposta varia de acordo com esse tipo (letras marcadas ou somatório das potências).
- **Geração de Documentos (PDF/CSV):** - A ordem das questões e alternativas precisa ser obrigatoriamente variada em cada prova gerada.
  - O PDF requer formatação estrita: cabeçalho da prova, número da prova individual no rodapé de cada página e espaço para nome e CPF no final do documento.
  - Em paralelo ao PDF, deve ser gerado um arquivo CSV de gabarito, contendo o número da prova seguido da resposta correta (letras selecionadas ou o somatório) para cada questão.
- **Lógica de Correção:** A funcionalidade de correção processa o CSV de gabarito e um CSV com as respostas dos alunos. Deve suportar dois critérios configuráveis de correção: rigorosa (qualquer divergência na marcação zera a questão) e menos rigorosa (nota calculada proporcionalmente aos acertos e erros na questão).

## Arquitetura, Design Patterns e Boas Práticas

- **Modularidade:** Mantenha as responsabilidades separadas. Isole a lógica de domínio (ex: embaralhamento de questões e cálculo de notas) das rotas HTTP no Node e dos componentes de UI no React.
- **Padrões de Projeto (Design Patterns):** Utilize padrões para lidar com variações nas regras de negócio. Sugestões:
  - Utilize o padrão _Strategy_ para implementar as lógicas divergentes de correção da prova (rigorosa vs. proporcional) e as formas de identificação (letras vs. potências de 2).
  - Utilize o padrão _Factory_ ou _Builder_ para organizar a geração massiva e variada de arquivos PDF e planilhas CSV.
- **Refatoração:** Ao propor códigos novos, priorize a legibilidade e a reusabilidade, garantindo que o sistema acomode futuras extensões facilmente.
- **Tipagem Estrita:** Aproveite o TypeScript criando `interfaces` e `types` bem definidos para as entidades `Questao`, `Alternativa`, `Prova` e `Gabarito`.

## Diretrizes de Teste

- Para todo novo cenário criado, use exclusivamente a sintaxe Gherkin para escrever os testes de aceitação no Cucumber.

## Estrutura de Diretórios

O repositório deve ser organizado separando claramente o cliente e o servidor na raiz do projeto:

- `/frontend`: Contém exclusivamente a aplicação web cliente (React). Deve possuir seu próprio `package.json` e configurações.
- `/backend`: Contém exclusivamente o servidor (Node.js). Deve possuir seu próprio `package.json` e configurações.
- **Regra de Isolamento:** O código da pasta `/frontend` nunca deve importar arquivos diretamente da pasta `/backend` (e vice-versa). A comunicação entre eles deve ocorrer estritamente via requisições à API.
