Feature: Questions API
  As a teacher
  I want to manage questions
  So that I can compose exams with valid question banks

  Scenario: Create and retrieve a question
    Given the API is running
    When I send a "POST" request to "/questions" with JSON body:
      """
      {
        "text": "What is 2 + 2?",
        "alternatives": [
          { "id": "a", "text": "3", "correct": false },
          { "id": "b", "text": "4", "correct": true },
          { "id": "c", "text": "5", "correct": false }
        ]
      }
      """
    Then the response status should be 201
    And the response field "text" should equal "What is 2 + 2?"
    And the response field "id" should be a non-empty string
    And I save response field "id" as "questionId"

    When I send a "GET" request to "/questions/{{questionId}}"
    Then the response status should be 200
    And the response field "id" should equal saved value "questionId"

  Scenario: Update and delete an existing question
    Given a question exists as "q1" with text "Original statement" and alternatives:
      | id | text      | correct |
      | a  | Option A  | false   |
      | b  | Option B  | true    |

    When I send a "PUT" request to "/questions/{{q1}}" with JSON body:
      """
      {
        "text": "Updated statement",
        "alternatives": [
          { "id": "a", "text": "New option A", "correct": true },
          { "id": "b", "text": "New option B", "correct": false }
        ]
      }
      """
    Then the response status should be 200
    And the response field "text" should equal "Updated statement"

    When I send a "DELETE" request to "/questions/{{q1}}"
    Then the response status should be 204

    When I send a "GET" request to "/questions/{{q1}}"
    Then the response status should be 404
