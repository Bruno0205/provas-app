# Revisão - (https://github.com/rmls2-dotcom/id_cod) (Robert Miller)
## A revisão do sistema do seu colega deve responder às seguintes perguntas:

1. O sistema está funcionando com as funcionalidades solicitadas?

 - Sim, o sistema funciona corretamente e contêm todas as funcionalidades solicitadas. Pelo estado atual, já é possível pensar em um deploy.

2. Quais os problemas de qualidade do código e dos testes?

 - A qualidade do código me surpreendeu, mostrou uma boa organização e divisão na implementação. Entretanto encontrei poucos testes automatizados no projeto.

3. Como a funcionalidade e a qualidade desse sistema podem ser comparadas com as do seu sistema?

 - O sistema apresenta uma qualidade considerável, está organizado e trás bem a proposta da atividade. Como melhoria, seria interessante adicionar mais testes automatizados e também avaliar um deploy.

## A revisão do histórico de desenvolvimento do seu colega deve resumir:

1. Estratégias de interação utilizadas

 - Foram usados prompts incrementais e orientados por etapas, começando pela definição dos cenários em Gherkin e depois pedindo a implementação por fatias específicas da .feature. Também funcionou bem usar prompts com restrições claras (TypeScript, React + Node, sem alucinar, foco em legibilidade) e referenciar explicitamente o arquivo docs/acceptance/exam-system.feature.

2. Situações em que o agente funcionou melhor ou pior

 - O agente funcionou melhor quando recebeu tarefas pequenas, bem delimitadas e baseadas em regras/scenarios específicos do arquivo Gherkin. Funcionou pior quando a solicitação foi muito ampla e abrangente logo no início, tentando implementar várias funcionalidades de uma vez, o que levou a entregas incompletas e parcialmente incorretas.

3. Tipos de problemas observados (por exemplo, código incorreto ou inconsistências)

 - Os principais problemas observados foram implementação incompleta, estrutura incorreta de dados (especialmente nas alternativas das questões) e funcionalidades parcialmente implementadas quando o escopo era muito grande. Houve também casos de inconsistência entre requisitos e código gerado, exigindo refinamento posterior com prompts mais específicos.

4. Avaliação geral da utilidade do agente no desenvolvimento

 - De forma geral, o agente foi bastante útil no desenvolvimento. Ele se mostrou eficiente para acelerar a implementação quando guiado por cenários de aceitação claros e prompts bem segmentados. Apesar de falhar em tarefas muito amplas, teve bom desempenho em evolução incremental, sendo útil como apoio prático para construir funcionalidades e ajustar a UI com rapidez.

5. Comparação com a sua experiência de uso do agente

 - Em contrapartida, percebi que juntar os prompts e tentar dar uma entrada mais robusta me trouxe melhores resultados junto ao agente, isso foi importante pois ele trazia uma grande mudança e um grande avanço todo de uma vez o que me possibilitava ter um aspecto no sentido de testar o fluxo muito mais fluido e proveitoso que ficar testando micro partes que não fariam sentido individualizadas. Isso acabou tornando o código mais limpo, intuitivo e consistente durante o desenvolvimento.