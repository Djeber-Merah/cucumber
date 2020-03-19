import assert from 'assert'
import AstWalker from '../../src/search/AstWalker'
import pretty from '../../src/pretty-formatter/pretty'
import parse from './parse'

describe('AstWalker', () => {
  let walker: AstWalker

  beforeEach(() => {
    walker = new AstWalker()
  })

  function assertCopy(copy: any, source: any) {
    assert.deepEqual(copy, source)
    assert.notEqual(copy, source)
  }

  it('returns a deep copy', () => {
    const gherkinDocument = parse(`Feature: hello
  Background: Base Background
    Given a passed step

  Scenario: salut

  Rule: roule
    Background: poupidou
    Scenario: pouet
`)
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)

    assertCopy(newGherkinDocument, gherkinDocument)
    assertCopy(newGherkinDocument.feature, gherkinDocument.feature)
    assertCopy(
      newGherkinDocument.feature.children[0].background,
      gherkinDocument.feature.children[0].background
    )
    assertCopy(
      newGherkinDocument.feature.children[1].scenario,
      gherkinDocument.feature.children[1].scenario
    )
    assertCopy(
      newGherkinDocument.feature.children[2].rule,
      gherkinDocument.feature.children[2].rule
    )
    assertCopy(
      newGherkinDocument.feature.children[2].rule.children[1],
      gherkinDocument.feature.children[2].rule.children[1]
    )
    assertCopy(
      newGherkinDocument.feature.children[0].background.steps,
      gherkinDocument.feature.children[0].background.steps
    )
  })

  it('filters one scenario', () => {
    const gherkinDocument = parse(`Feature: Solar System

  Scenario: Saturn
    Given is the sixth planet from the Sun

  Scenario: Earth
    Given is a planet with liquid water
`)

    const walker = new AstWalker({
      acceptStep: step => false,
      acceptScenario: scenario => scenario.name === 'Earth',
    })
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)
    const newSource = pretty(newGherkinDocument)
    const expectedNewSource = `Feature: Solar System

  Scenario: Earth
    Given is a planet with liquid water
`
    assert.strictEqual(newSource, expectedNewSource)
  })

  it('keeps scenario with search hit in step', () => {
    const gherkinDocument = parse(`Feature: Solar System

  Scenario: Saturn
    Given is the sixth planet from the Sun

  Scenario: Earth
    Given is a planet with liquid water
`)

    const walker = new AstWalker({
      acceptStep: step => step.text.includes('liquid'),
      acceptScenario: scenario => false,
    })
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)
    const newSource = pretty(newGherkinDocument)
    const expectedNewSource = `Feature: Solar System

  Scenario: Earth
    Given is a planet with liquid water
`
    assert.strictEqual(newSource, expectedNewSource)
  })

  it('keeps a hit scenario even when no steps match', () => {
    const gherkinDocument = parse(`Feature: Solar System

  Scenario: Saturn
    Given is the sixth planet from the Sun

  Scenario: Earth
    Given is a planet with liquid water
`)

    const walker = new AstWalker({
      acceptStep: step => false,
      acceptScenario: scenario => scenario.name === 'Saturn'
    })
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)
    const newSource = pretty(newGherkinDocument)
    const expectedNewSource = `Feature: Solar System

  Scenario: Saturn
    Given is the sixth planet from the Sun
`
    assert.strictEqual(newSource, expectedNewSource)
  })

  it('keeps a hit background', () => {
    const gherkinDocument = parse(`Feature: Solar System

  Background: Space
    Given space is real

  Rule: Galaxy
    Background: Milky Way
      Given it contains our system

  Rule: Black Hole
    Background: TON 618
      Given it exists
`)

    const walker = new AstWalker({
      acceptStep: step => false,
      acceptScenario: scenario => false,
      acceptBackground: background => background.name === 'Milky Way'
    })
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)
    const newSource = pretty(newGherkinDocument)
    const expectedNewSource = `Feature: Solar System

  Background: Space
    Given space is real

  Rule: Galaxy

    Background: Milky Way
      Given it contains our system
`
    assert.strictEqual(newSource, expectedNewSource)
  })

  it('keeps scenario in rule', () => {
    const gherkinDocument = parse(`Feature: Solar System

  Rule: Galaxy
    Scenario: Milky Way
      Given it contains our system

    Scenario: Andromeda
      Given it exists
`)

    const walker = new AstWalker({
      acceptStep: step => false,
      acceptScenario: scenario => scenario.name === 'Andromeda',
    })
    const newGherkinDocument = walker.walkGherkinDocument(gherkinDocument)
    const newSource = pretty(newGherkinDocument)
    const expectedNewSource = `Feature: Solar System

  Rule: Galaxy

    Scenario: Andromeda
      Given it exists
`
    assert.strictEqual(newSource, expectedNewSource)
  })
})