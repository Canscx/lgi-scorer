import { describe, expect, it } from 'vitest'
import rulesJson from '../../config/rules/rules.lgi.v1.0.0.json'
import { isPortalPassed } from '../src/portal'
import { evaluate } from '../src/scoring/engine'
import { aggregateConclusion, evaluateScoreGate } from '../src/scoring/gates'
import type { RulesDoc, ScoreGate, Totals } from '../src/scoring/types'
import { buildModel, entry, rules } from './helpers'

const scoreGate: ScoreGate = {
  id: 'GATE_9',
  name: '专精特新发展评价得分',
  type: 'scoreGate',
  passLine: 60,
  totalKey: 'official',
  unknownPolicy: 'notPass'
}

const totals = (official: number, optimistic = official): Totals => ({
  official,
  conservative: Math.min(official, optimistic),
  optimistic,
  confidence: 1
})

describe('得分门槛：60 分线', () => {
  it('60.00 通过', () => {
    expect(evaluateScoreGate(scoreGate, totals(60)).verdict).toBe('pass')
  })

  it('60.01 通过', () => {
    expect(evaluateScoreGate(scoreGate, totals(60.01)).verdict).toBe('pass')
  })

  it('59.99 且乐观口径也到不了线 → 不通过', () => {
    expect(evaluateScoreGate(scoreGate, totals(59.99)).verdict).toBe('fail')
  })

  it('59.99 但乐观口径可达 → 待定', () => {
    expect(evaluateScoreGate(scoreGate, totals(59.99, 70)).verdict).toBe('pending')
  })

  it('复核口径会在说明里标注', () => {
    const gate = evaluateScoreGate(scoreGate, totals(55, 65), { applicationType: 'review' })
    expect(gate.explain).toContain('复核')
  })
})

const gateBy = (id: string, fields: Record<string, unknown>) => {
  const result = evaluate(
    buildModel(
      Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [key, entry(value)])
      ) as Parameters<typeof buildModel>[0]
    ),
    rules
  )
  return result.gates.find((item) => item.id === id)
}

describe('GATE_5 研发投入：近两年合计 ≥1200 万', () => {
  it('只有上年度够但合计不足 → 不通过', () => {
    const gate = gateBy('GATE_5', {
      'fin.revenue': { 2025: 30000000, 2024: 30000000, 2023: 30000000 },
      'fin.rdExpense': { 2025: 6000000, 2024: 5000000, 2023: 5000000 }
    })
    expect(gate?.verdict).toBe('fail')
  })

  it('近两年合计刚好 1200 万 → 通过', () => {
    const gate = gateBy('GATE_5', {
      'fin.revenue': { 2025: 30000000, 2024: 30000000, 2023: 30000000 },
      'fin.rdExpense': { 2025: 6000000, 2024: 6000000, 2023: 1000000 }
    })
    expect(gate?.verdict).toBe('pass')
  })

  it('合计够但前年度占营收不足 3% → 不通过', () => {
    const gate = gateBy('GATE_5', {
      'fin.revenue': { 2025: 30000000, 2024: 30000000, 2023: 30000000 },
      'fin.rdExpense': { 2025: 12000000, 2024: 800000, 2023: 5000000 }
    })
    expect(gate?.verdict).toBe('fail')
  })
})

describe('GATE_6 Ⅰ类知识产权：4 项红线', () => {
  const patents = (n: number, transferred = 0) => {
    const list = Array.from({ length: n }, (_, index) => ({
      name: `专利 ${index + 1}`,
      patentNo: `ZL2023${String(index).padStart(4, '0')}`,
      grantedDate: '2024-01-01',
      applicantRank: 1,
      selfApplied: true,
      transferredIn: false
    }))
    for (let index = 0; index < transferred; index += 1) {
      list.push({
        name: `转入专利 ${index + 1}`,
        patentNo: `ZL2020${String(index).padStart(4, '0')}`,
        grantedDate: '2020-01-01',
        applicantRank: 2,
        selfApplied: false,
        transferredIn: true
      })
    }
    return list
  }

  it('3 项自主申请 → 不通过', () => {
    const gate = gateBy('GATE_6', { 'ip.inventionI': patents(3) })
    expect(gate?.effective).not.toBe('pass')
  })

  it('4 项自主申请 → 通过，走 G6a', () => {
    const gate = gateBy('GATE_6', { 'ip.inventionI': patents(4) })
    expect(gate?.effective).toBe('pass')
    expect(gate?.passedVia).toBe('G6a')
  })

  it('4 项里有转入的 → 只算 3 项，不通过', () => {
    const gate = gateBy('GATE_6', { 'ip.inventionI': patents(3, 1) })
    expect(gate?.effective).not.toBe('pass')
  })

  it('权利人排名靠后不计入', () => {
    const list = patents(3).concat([
      {
        name: '排名第四的专利',
        patentNo: 'ZL20239999',
        grantedDate: '2024-01-01',
        applicantRank: 4,
        selfApplied: true,
        transferredIn: false
      }
    ])
    const gate = gateBy('GATE_6', { 'ip.inventionI': list })
    expect(gate?.effective).not.toBe('pass')
  })

  it('国家级科技奖励可豁免', () => {
    const gate = gateBy('GATE_6', {
      'ip.inventionI': [],
      'qual.nationalScienceAward': true
    })
    expect(gate?.effective).toBe('pass')
    expect(gate?.passedVia).toBe('G6b')
  })
})

describe('门槛强度：提示项不影响结论', () => {
  it('只有提示项不通过时，结论不受影响', () => {
    const gates = [
      { id: 'A', name: 'a', verdict: 'pass' as const, effective: 'pass' as const, basis: 'evidence' as const, severity: 'advisory' as const, checks: [], explain: '' },
      { id: 'B', name: 'b', verdict: 'fail' as const, effective: 'fail' as const, basis: 'evidence' as const, severity: 'advisory' as const, checks: [], explain: '' },
      { id: 'C', name: 'c', verdict: 'pass' as const, effective: 'pass' as const, basis: 'evidence' as const, severity: 'hard' as const, checks: [], explain: '' }
    ]
    expect(aggregateConclusion(gates)).toBe('pass')
  })

  it('硬门槛不通过时结论为不通过', () => {
    const gates = [
      { id: 'A', name: 'a', verdict: 'fail' as const, effective: 'fail' as const, basis: 'evidence' as const, severity: 'hard' as const, checks: [], explain: '' }
    ]
    expect(aggregateConclusion(gates)).toBe('fail')
  })
})

describe('政策口径哨兵', () => {
  it('规则包与小巨人得分门槛都是 60', () => {
    const doc = rulesJson as unknown as RulesDoc
    expect(doc.passLine).toBe(60)
    const gate = doc.gates.find((item) => item.id === 'GATE_9')
    expect(gate?.type).toBe('scoreGate')
    if (gate?.type === 'scoreGate') expect(gate.passLine).toBe(60)
  })

  it('规则包等级是 LITTLE_GIANT', () => {
    const doc = rulesJson as unknown as RulesDoc
    expect(doc.level).toBe('LITTLE_GIANT')
  })

  it('提示项固定是 GATE_7 与 GATE_8', () => {
    const doc = rulesJson as unknown as RulesDoc
    const advisory = doc.gates.filter((item) => item.severity === 'advisory').map((item) => item.id)
    expect(advisory).toEqual(['GATE_7', 'GATE_8'])
  })

  it('复核豁免只挂在复合增长率门槛上', () => {
    const doc = rulesJson as unknown as RulesDoc
    const exempt = doc.gates.filter((item) => item.reviewExempt === true).map((item) => item.id)
    expect(exempt).toEqual(['GATE_4'])
  })

  it('GATE_5 不再引用 y2', () => {
    const gate = rules.gates.find((item) => item.id === 'GATE_5')
    expect(gate?.type).toBe('expr')
    if (gate?.type === 'expr') {
      const exprs = gate.checks.map((check) => check.expr)
      expect(exprs.some((expr) => expr.includes('[y2]'))).toBe(false)
    }
  })

  it('科技奖励豁免只认国家级', () => {
    const gate = rules.gates.find((item) => item.id === 'GATE_6')
    expect(gate?.type).toBe('expr')
    if (gate?.type === 'expr') {
      const exprs = gate.checks.map((check) => check.expr).join(' ')
      expect(exprs).toContain('nationalScienceAward')
    }
  })
})

describe('客户版达标：分数 + 证据覆盖', () => {
  it('证据不足时不给达标', () => {
    expect(isPortalPassed(60, 60, 0.49)).toBe(false)
    expect(isPortalPassed(70, 60, 0)).toBe(false)
  })

  it('分数达线且覆盖过半才达标', () => {
    expect(isPortalPassed(60, 60, 0.5)).toBe(true)
    expect(isPortalPassed(68.2, 60, 0.7832)).toBe(true)
  })

  it('分数不够，覆盖再高也不算', () => {
    expect(isPortalPassed(59.99, 60, 1)).toBe(false)
  })
})