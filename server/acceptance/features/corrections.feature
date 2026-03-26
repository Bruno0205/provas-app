Feature: Corrections API
  As a teacher
  I want to preview and export correction results
  So that I can grade classes consistently

  Scenario Outline: Preview grading using strict and lenient modes
    Given the API is running
    When I upload correction files to "/corrections/preview" with grading mode "<gradingMode>":
      """
      examNumber,labelType,q1
      1001,LETTERS,AC
      ---
      studentName,cpf,studentId,examNumber,q1
      Ana Costa,12345678900,STU-1,1001,A
      """
    Then the response status should be 200
    And the response field "summary.processedRows" should equal number 1
    And the response field "summary.validSubmissions" should equal number 1
    And the response field "results[0].gradingMode" should equal "<gradingMode>"
    And the response field "results[0].totalScore" should equal number <expectedScore>

    Examples:
      | gradingMode | expectedScore |
      | STRICT      | 0             |
      | LENIENT     | 0.6667        |

  Scenario: Return an error when upload is missing a required file
    Given the API is running
    When I upload only answer key file to "/corrections/preview" with grading mode "STRICT":
      """
      examNumber,labelType,q1
      1001,LETTERS,AC
      """
    Then the response status should be 400
    And the response field "message" should equal "Both answerKeyFile and responsesFile are required"

  Scenario: Export correction report as CSV
    Given the API is running
    When I upload correction files to "/corrections/report" with grading mode "STRICT":
      """
      examNumber,labelType,q1,q2
      1001,LETTERS,A,B
      ---
      studentName,cpf,studentId,examNumber,q1,q2
      Joao,11122233344,S-1,1001,A,B
      """
    Then the response status should be 200
    And the response header "content-type" should contain "text/csv"
    And the response text should contain "studentName,cpf,studentId,examNumber,gradingMode,totalScore"
