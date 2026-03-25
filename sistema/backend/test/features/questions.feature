Feature: Question management and test generation
  As an instructor
  I want to create questions and generate tests
  So that I can produce PDFs and gabaritos

  Scenario: create a question and generate a test zip
    Given the server is running
    When I create a question with description "Q1" and alternatives "A|B|C" and correct "A"
    And I request 1 copy for all questions with metadata
    Then I receive a zip containing tests.pdf and gabarito.csv
