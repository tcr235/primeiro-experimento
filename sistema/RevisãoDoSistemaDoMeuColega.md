##Revisão de código

1. O sistema está funcionando com as funcionalidades solicitadas?
 - Parcialmente. Não há a geração de pdf da prova. Além disso, não existem as correções de prova da maneira solicitada (usando csv de gabarito e de resposta,
 selecionando o rigor da correção).

2. Quais os problemas de qualidade do código e dos testes?
 - Há um único arquivo no backend com diversas responsabilidades (server.ts);
 - Muitas funções recebendo e retornando "any";
 - Leitura/escrita de arquivos sendo repetidas em diversas rotas;
 - IDs com Date.now().

3. Como a funcionalidade e a qualidade desse sistema pode ser comparada com as do seu sistema?
 - Acredito que as funcionalidades do meu sistema se aproxima melhor do que foi pedido. Porém, quanto ao código, 
 existem erros parecidos (como a questão do arquivo com diversas responsabilidades, por exemplo), mas tentei me preocupar um pouco mais 
 com a tipagem e com reuso de código (apesar de que também tenho códigos repetidos). Por isso, acabo considerando o sistema feito "por mim" 
 ligeiramente melhor tratando-se de qualidade.

 ##Revisão do histórido de desenvolvimento
 
1. Estratégias de interação utilizada
 - Foi preterido usar prompts menores e menos complexos, facilitando o contexto para o agente e evitando extrapolar os tokens;
 - Utilização do arquivo AGENTS.md;
 - Adotou desenvolvimento incremental.

2. Situações em que o agente funcionou melhor ou pior
 - O agente foi excelente para levantar a estrutura inicial, tanto do front quanto do back;
 - O agente foi mal no ambiente remoto (codespaces), tendo até problemas de sincronização.

3. Tipos de problemas observados (por exemplo, código incorreto ou inconsistências)
 - O agente teve dificuldade em preservar a tipagem, gerando inconsistências no código e na compilação;
 - Houve complicação desnecessária com o arquivo CSV, fugindo um pouco do escopo solicitado;

4. Avaliação geral da utilidade do agente no desenvolvimento
 - É possível obter bons resultados, principalmente quando tratamos de criação de boilerplates e construção do MVP. Além disso, 
 o agente não se mostrou confiável como "autoridade final", o que acabou exigindo algumas intervenções e testes manuais.

5. Comparação com a sua experiência de uso do agente
 - Enquanto ela lidou muito com erros de compilação de tipagem e métodos HTTP (POST/PUT), o meu maior desafio com a IA envolveu erros de 
 lógica matemática e processamento de dados. O agente que utilizei cometeu um erro de deslocamento de índice (index offset) ao ler o CSV 
 de respostas dos alunos, comparando a resposta da questão com o ID da prova, o que exigiu um prompt extremamente específico para consertar 
 o loop de correção. Além disso, precisei intervir na infraestrutura de deploy (configuração de CORS e variáveis de ambiente na Vercel/Railway).
 - Por fim, a estratégia dela de usar o AGENTS.md e validar 'micro-passos' foi bem parecida com a minha necessidade de passar arquivos de contexto 
 mais específicos para impedir que o Copilot quebrasse a modularidade do frontend e do backend. Ambos também sofremos com travamentos das ferramentas: 
 ela com o ambiente do Codespaces, e eu com timeouts do Cucumber que congelaram a interface do terminal e mantiveram o agente em loop.
