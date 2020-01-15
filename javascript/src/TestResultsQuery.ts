import { StrictArrayMultimap, StrictMap } from '@cucumber/gherkin'
import { messages } from '@cucumber/messages'

export default class TestResultsQuery {
  private testResultByPickleId = new StrictArrayMultimap<
    string,
    messages.ITestResult
  >()
  private testStepResultsByPickleStepId = new StrictArrayMultimap<
    string,
    messages.ITestResult
  >()
  private testStepById = new StrictMap<string, messages.TestCase.ITestStep>()
  private pickleIdByTestStepId = new StrictMap<string, string>()

  public update(envelope: messages.IEnvelope) {
    if (envelope.testCase) {
      for (const testStep of envelope.testCase.testSteps) {
        this.testStepById.set(testStep.id, testStep)
        this.pickleIdByTestStepId.set(testStep.id, envelope.testCase.pickleId)
      }
    }

    if (envelope.testStepFinished) {
      const pickleId = this.pickleIdByTestStepId.get(
        envelope.testStepFinished.testStepId
      )
      this.testResultByPickleId.put(
        pickleId,
        envelope.testStepFinished.testResult
      )

      const testStep = this.testStepById.get(
        envelope.testStepFinished.testStepId
      )
      this.testStepResultsByPickleStepId.put(
        testStep.pickleStepId,
        envelope.testStepFinished.testResult
      )
    }
  }

  public getPickleStepResults(pickleStepId: string): messages.ITestResult[] {
    return this.testStepResultsByPickleStepId.get(pickleStepId)
  }

  public getPickleResults(pickleId: string): messages.ITestResult[] {
    return this.testResultByPickleId.get(pickleId)
  }

  /**
   * Gets all the results for multiple pickles
   * @param pickleIds
   */
  public getAllPickleResults(pickleIds: string[]): messages.ITestResult[] {
    return pickleIds.reduce((testResults: messages.ITestResult[], pickleId) => {
      return testResults.concat(this.getPickleResults(pickleId))
    }, [])
  }

  /**
   * Gets the worst result
   * @param testResults
   */
  public getWorstResult(
    testResults: messages.ITestResult[]
  ): messages.ITestResult {
    return testResults.sort()[0]
  }
}
