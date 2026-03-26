Feature: Exams API
  As a teacher
  I want to create and generate exams
  So that I can distribute multiple versions with answer keys

  Scenario: Create a valid exam and generate downloadable files
    Given a question exists as "q1" with text "Capital of France" and alternatives:
      | id | text   | correct |
      | a  | Paris  | true    |
      | b  | Berlin | false   |
      | c  | Madrid | false   |
    And a question exists as "q2" with text "2 + 3" and alternatives:
      | id | text | correct |
      | a  | 4    | false   |
      | b  | 5    | true    |
      | c  | 6    | false   |

    When I send a "POST" request to "/exams" with JSON body:
      """
      {
        "title": "Midterm A",
        "subject": "Math",
        "teacher": "Dr. Silva",
        "date": "2026-03-25",
        "instructions": "Read all questions carefully.",
        "alternativeLabelType": "LETTERS",
        "questionIds": ["{{q1}}", "{{q2}}", "{{q1}}"]
      }
      """
    Then the response status should be 201
    And I save response field "id" as "examId"
    And the response field "questionIds" should be an array with length 2

    When I send a "POST" request to "/exams/{{examId}}/generate" with JSON body:
      """
      {
        "numberOfExams": 2
      }
      """
    Then the response status should be 200
    And the response header "content-type" should contain "application/zip"
    And the generated zip should contain files:
      | exams.pdf      |
      | answer-key.csv |
    And zip file "answer-key.csv" should contain "examNumber,labelType,q1,q2"

  Scenario: Reject exam when a selected question has no correct alternative
    Given a question exists as "invalidQuestion" with text "Select all prime numbers" and alternatives:
      | id | text | correct |
      | a  | 4    | false   |
      | b  | 6    | false   |

    When I send a "POST" request to "/exams" with JSON body:
      """
      {
        "title": "Invalid exam",
        "subject": "Math",
        "teacher": "Dr. Silva",
        "date": "2026-03-25",
        "instructions": "",
        "alternativeLabelType": "LETTERS",
        "questionIds": ["{{invalidQuestion}}"]
      }
      """
    Then the response status should be 400
    And the response field "message" should equal "All selected questions must have at least one correct alternative"
