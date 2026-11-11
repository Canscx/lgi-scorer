import type { EvidenceDoc, ProjectMeta } from '@lgi/shared'
import type { AppStore } from '../store'

export interface DeclaredInput {
  inventionCount?: number
  layoutDesignCount?: number
  softCopyrightCount?: number
  utilityModelCount?: number
  designPatentCount?: number
  selfDevelopedI?: boolean
  highValueI?: boolean
  marketShare?: number
  chainSixBase?: boolean
  chainKeySegment?: boolean
  applicationType?: 'new' | 'review'
}

export interface DeclaredOutcome {
  applied: boolean
  reason?: string
  classI: number
  classII: number
  selfDeveloped: boolean
  highValue: boolean
  marketShare: number | null
  chainSixBase: boolean | null
  chainKeySegment: boolean | null
}

const positiveInt = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0

const ratio = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null

const isConfirmed = (doc: EvidenceDoc, key: string) => doc.fields[key]?.status === 'confirmed'

const formatPercent = (value: number) => (value * 100).toFixed(1) + '%'

const hasIntellectualInput = (input: DeclaredInput) =>
  [
    input.inventionCount,
    input.layoutDesignCount,
    input.softCopyrightCount,
    input.utilityModelCount,
    input.designPatentCount,
    input.selfDevelopedI,
    input.highValueI
  ].some((value) => value !== undefined)

export const applyDeclaredIntellectual = async (
  store: AppStore,
  project: ProjectMeta,
  input: DeclaredInput
): Promise<DeclaredOutcome> => {
  const classI = positiveInt(input.inventionCount) + positiveInt(input.layoutDesignCount)
  const classII =
    positiveInt(input.softCopyrightCount) +
    positiveInt(input.utilityModelCount) +
    positiveInt(input.designPatentCount)
  const selfDeveloped = classI > 0 && input.selfDevelopedI === true
  const highValue = classI > 0 && input.highValueI === true
  const marketShare = ratio(input.marketShare)
  const chainSixBase = typeof input.chainSixBase === 'boolean' ? input.chainSixBase : null
  const chainKeySegment =
    typeof input.chainKeySegment === 'boolean' ? input.chainKeySegment : null

  const base: DeclaredOutcome = {
    applied: false,
    classI,
    classII,
    selfDeveloped,
    highValue,
    marketShare,
    chainSixBase,
    chainKeySegment
  }

  const doc = await store.evidence.get(project)
  let applied = false

  if (hasIntellectualInput(input) && !isConfirmed(doc, 'ip.classICount')) {
    const tags = [selfDeveloped ? '（含自主研发）' : '', highValue ? '（含高价值）' : ''].join('')
    const note = '客户自述：Ⅰ类 ' + classI + ' 件' + tags + '，Ⅱ类 ' + classII + ' 件'
    await store.evidence.declareValue(project, 'ip.classICount', { value: classI, note })
    await store.evidence.declareValue(project, 'ip.classIICount', { value: classII, note })
    await store.evidence.declareValue(project, 'ip.selfDevelopedI', { value: selfDeveloped, note })
    await store.evidence.declareValue(project, 'ip.highValueI', { value: highValue, note })
    applied = true
  }

  if (marketShare !== null && !isConfirmed(doc, 'qual.marketShare')) {
    await store.evidence.declareValue(project, 'qual.marketShare', {
      value: marketShare,
      note: '客户自述：细分市场占有率 ' + formatPercent(marketShare) + '（官方口径为企业如实说明即可）'
    })
    applied = true
  }

  if (chainSixBase !== null && !isConfirmed(doc, 'qual.chainSixBase')) {
    const which = chainSixBase ? '属于' : '不属于'
    await store.evidence.declareValue(project, 'qual.chainSixBase', {
      value: chainSixBase,
      note: '客户自述：主导产品' + which + '六基领域'
    })
    applied = true
  }

  if (chainKeySegment !== null && !isConfirmed(doc, 'qual.chainKeySegment')) {
    const which = chainKeySegment ? '位于' : '不位于'
    await store.evidence.declareValue(project, 'qual.chainKeySegment', {
      value: chainKeySegment,
      note: '客户自述：主导产品' + which + '产业链关键环节'
    })
    applied = true
  }

  if (input.applicationType && !isConfirmed(doc, 'company.applicationType')) {
    const note = input.applicationType === 'review' ? '客户选择：到期复核' : '客户选择：本年度新申请'
    await store.evidence.declareValue(project, 'company.applicationType', {
      value: input.applicationType,
      note
    })
    applied = true
  }

  if (!applied) {
    return { ...base, reason: hasIntellectualInput(input) ? 'documented' : 'nothing_declared' }
  }

  return { ...base, applied: true }
}
