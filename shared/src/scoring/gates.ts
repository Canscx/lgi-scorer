import type { EvalContext } from './context'
import { evalTri } from './evaluate'
import { FLAG } from './flags'
import { parseExpr } from './parser'
import type { ExprGate, GateBasis, GateCheckResult, GateEffective, GateResult, GateVerdict, ScoreGate, Totals } from './types'
import { triVerdict } from './tri'

export interface GateRunOptions {
  applicationType?: 'new' | 'review'
  disabled?: string[]
}

const isDisabled = (gate: { id: string; enabled?: boolean }, options: GateRunOptions): boolean => {
  if (gate.enabled === false) return true
  return (options.disabled ?? []).includes(gate.id)
}

const isReviewExempt = (gate: { reviewExempt?: boolean }, options: GateRunOptions): boolean =>
  gate.reviewExempt === true && options.applicationType === 'review'

const combine = (gate: ExprGate, checks: GateCheckResult[]): { verdict: GateVerdict; passedVia?: string } => {
  if (gate.logic === 'all') {
    if (checks.some((check) => check.verdict === 'fail')) return { verdict: 'fail' }
    if (checks.every((check) => check.verdict === 'pass')) return { verdict: 'pass' }
    if (checks.some((check) => check.verdict === 'pending')) return { verdict: 'pending' }
    return { verdict: 'unknown' }
  }

  const passed = checks.find((check) => check.verdict === 'pass')
  if (passed) {
    const exemption = checks.find((check) => check.verdict === 'pass' && check.exemption)
    return { verdict: 'pass', passedVia: (exemption ?? passed).id }
  }
  if (checks.some((check) => check.verdict === 'pending')) return { verdict: 'pending' }
  if (checks.some((check) => check.verdict === 'unknown')) return { verdict: 'unknown' }
  return { verdict: 'fail' }
}

const resolveEffective = (
  verdict: GateVerdict,
  policy: ExprGate['unknownPolicy']
): { effective: GateEffective; basis: GateBasis; flags: string[] } => {
  if (verdict === 'pass') return { effective: 'pass', basis: 'evidence', flags: [] }
  if (verdict === 'fail') return { effective: 'fail', basis: 'evidence', flags: [] }
  if (policy === 'pending') return { effective: 'pending', basis: 'missing', flags: [] }
  if (policy === 'ignore') return { effective: 'pass', basis: 'policy', flags: [FLAG.GATE_PASSED_BY_POLICY] }
  return { effective: 'fail', basis: 'missing', flags: [] }
}

export const evaluateExprGate = (gate: ExprGate, ctx: EvalContext, options: GateRunOptions = {}): GateResult => {
  const severity = gate.severity ?? 'hard'

  if (isDisabled(gate, options)) {
    return {
      id: gate.id,
      name: gate.name,
      verdict: 'pass',
      effective: 'pass',
      basis: 'policy',
      severity,
      checks: [],
      skipped: true,
      skipReason: '按配置关闭',
      policyRef: gate.policyRef,
      explain: '该门槛已在规则包中关闭'
    }
  }

  const checks: GateCheckResult[] = gate.checks.map((check) => {
    const parsed = parseExpr(check.expr)
    const tri = evalTri(parsed.ast, { ctx })
    return {
      id: check.id,
      label: check.label,
      verdict: triVerdict(tri),
      exemption: check.exemption === true,
      missing: tri.missing,
      pending: tri.pending,
      flags: tri.flags
    }
  })

  const reviewExempt = isReviewExempt(gate, options)

  if (reviewExempt) {
    return {
      id: gate.id,
      name: gate.name,
      verdict: 'pass',
      effective: 'pass',
      basis: 'policy',
      severity,
      checks,
      skipped: true,
      skipReason: '复核企业不考查该项',
      policyRef: gate.policyRef,
      explain: '复核企业不考查该项指标'
    }
  }

  const { verdict, passedVia } = combine(gate, checks)
  const resolved = resolveEffective(verdict, gate.unknownPolicy)

  const hasMissing = checks.some((check) => check.missing.length > 0)
  const hasPending = checks.some((check) => check.pending.length > 0)
  const basis: GateBasis = resolved.effective === 'pass' || resolved.effective === 'fail'
    ? resolved.basis
    : hasMissing && hasPending
      ? 'mixed'
      : hasPending
        ? 'unconfirmed'
        : 'missing'

  const detail = checks
    .map((check) => `${check.id} ${check.verdict === 'pass' ? '满足' : check.verdict === 'fail' ? '不满足' : check.verdict === 'pending' ? '需确认' : '材料不足'}`)
    .join(' · ')

  return {
    id: gate.id,
    name: gate.name,
    verdict,
    effective: resolved.effective,
    basis,
    severity,
    checks,
    passedVia,
    policyRef: gate.policyRef,
    explain: detail
  }
}

export const evaluateScoreGate = (
  gate: ScoreGate,
  totals: Totals,
  options: GateRunOptions = {}
): GateResult => {
  const severity = gate.severity ?? 'hard'

  if (isDisabled(gate, options)) {
    return {
      id: gate.id,
      name: gate.name,
      verdict: 'pass',
      effective: 'pass',
      basis: 'policy',
      severity,
      checks: [],
      skipped: true,
      skipReason: '按配置关闭',
      policyRef: gate.policyRef,
      explain: '该门槛已在规则包中关闭'
    }
  }

  const line = gate.passLine
  const primary = totals[gate.totalKey]
  const upper = gate.totalKey === 'conservative' ? totals.official : totals.optimistic

  let verdict: GateVerdict
  if (primary >= line) verdict = 'pass'
  else if (upper >= line) verdict = 'pending'
  else verdict = 'fail'

  const reviewNote = options.applicationType === 'review' ? '·复核口径:近两年任一年度达标即可' : ''

  return {
    id: gate.id,
    name: gate.name,
    verdict,
    effective: verdict,
    basis: 'score',
    severity,
    checks: [],
    policyRef: gate.policyRef,
    explain: `${gate.totalKey} ${primary} / 线 ${line}(official ${totals.official} / conservative ${totals.conservative} / optimistic ${totals.optimistic})${reviewNote}`
  }
}

export const aggregateConclusion = (gates: GateResult[]): 'pass' | 'fail' | 'pending' => {
  const hard = gates.filter((gate) => (gate.severity ?? 'hard') === 'hard')
  if (hard.some((gate) => gate.effective === 'fail')) return 'fail'
  if (hard.some((gate) => gate.effective === 'pending')) return 'pending'
  return 'pass'
}

export const hasAdvisoryGaps = (gates: GateResult[]): boolean =>
  gates.some((gate) => gate.severity === 'advisory' && gate.effective !== 'pass')

export const advisoryGates = (gates: GateResult[]): GateResult[] =>
  gates.filter((gate) => gate.severity === 'advisory')

export const hardGates = (gates: GateResult[]): GateResult[] =>
  gates.filter((gate) => (gate.severity ?? 'hard') === 'hard')
