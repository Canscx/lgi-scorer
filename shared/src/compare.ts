export interface CompareRow {
  dimension: string
  srdi: string
  littleGiant: string
  note?: string
}

export interface CompareSection {
  id: string
  title: string
  intro: string
  rows: CompareRow[]
}

export const COMPARE_SECTIONS: CompareSection[] = [
  {
    id: 'position',
    title: '一、基础定位与申报前提',
    intro: '小巨人是梯度培育的最高一级，必须先取得专精特新中小企业称号才能申报。',
    rows: [
      {
        dimension: '梯度层级',
        srdi: '优质中小企业第二梯度（骨干力量）',
        littleGiant: '优质中小企业最高梯度（中坚力量）',
      },
      {
        dimension: '认定主体',
        srdi: '省级工信部门认定，工信部备案',
        littleGiant: '工信部直接组织认定',
      },
      {
        dimension: '前置资质',
        srdi: '必须先取得科技和创新型中小企业称号',
        littleGiant: '必须先取得专精特新中小企业称号',
      },
      {
        dimension: '有效期',
        srdi: '3 年，到期需复核',
        littleGiant: '3 年，到期需复核；复核通过延长 3 年',
      }
    ]
  },
  {
    id: 'gates',
    title: '二、硬性准入门槛（必须全部满足，缺一不可）',
    intro: '门槛项是申报的必要前提，不满足则直接无法进入评分环节。以下为官方原文口径。',
    rows: [
      {
        dimension: '细分市场年限',
        srdi: '截至上年末从事特定细分市场 ≥3 年',
        littleGiant: '与专精特新中小企业持平，同样是 ≥3 年',
        note: '不额外加码',
      },
      {
        dimension: '营业收入门槛',
        srdi: '上年度 ≥1,500 万元，或近两年新增股权投资 ≥2,000 万元（替代路径）',
        littleGiant: '上年度 ≥5,000 万元',
        note: '小巨人无股权融资替代路径，必须达到营收硬线',
      },
      {
        dimension: '主营业务收入占比',
        srdi: '≥80%',
        littleGiant: '≥90%',
        note: '主业聚焦度要求显著更高',
      },
      {
        dimension: '资产负债率',
        srdi: '≤80%',
        littleGiant: '≤75%',
        note: '财务稳健性要求更严',
      },
      {
        dimension: '营收复合增长率',
        srdi: '无明确的复合增长率硬性要求',
        littleGiant: '近两年营业收入复合增长率 ≥5%',
        note: '复核企业不考查该项指标',
      },
      {
        dimension: '研发费用（金额）',
        srdi: '近两年每年均 ≥100 万元',
        littleGiant: '近两年合计 ≥1,200 万元',
        note: '金额门槛大幅抬升',
      },
      {
        dimension: '研发费用（占比）',
        srdi: '近两年每年占营收比重均 ≥3%',
        littleGiant: '近两年每年占营收比重均 ≥3%',
        note: '占比底线相同，但金额门槛不同',
      },
      {
        dimension: 'Ⅰ类知识产权数量',
        srdi: '≥1 项（与主导产品相关，已实际应用）',
        littleGiant: '≥4 项（与主导产品相关，已实际应用）',
        note: '须为企业自主申请且权利人排名前三，不含转入',
      },
      {
        dimension: '知识产权豁免条件',
        srdi: '近三年获省部级以上科技奖励（排名前三），或拥有经认定的省部级以上研发机构',
        littleGiant: '近三年获国家级科技奖励（排名前三）',
        note: '小巨人只认国家级，省部级奖励不构成豁免',
      },
      {
        dimension: '市场地位要求',
        srdi: '细分市场占有率较为靠前，具备一定知名度（定性要求，无量化下限）',
        littleGiant: '主导产品细分市场占有率 ≥10%，或国内排名前三',
        note: '官方口径为企业如实说明即可，免交第三方证明',
      },
      {
        dimension: '产业链/战略价值',
        srdi: '未作为独立门槛考察',
        littleGiant: '必须属于产业链关键环节（六基领域或传统产业升级/新兴产业/未来产业）',
        note: '对供应链韧性有实质贡献',
      },
      {
        dimension: '评价得分门槛',
        srdi: '专精特新发展质量评价得分 ≥50 分',
        littleGiant: '专精特新发展质量评价得分 ≥60 分',
        note: '复核企业近两年任意一年达标即可',
      }
    ]
  },
  {
    id: 'scoring',
    title: '三、评价机制',
    intro: '两者共用同一套《中小企业专精特新发展评价指标体系》，仅合格分数线不同。2026 新版办法取消了旧版各省自主设定的 15 分特色化指标，改为全国统一评价体系。',
    rows: [
      {
        dimension: '评价体系',
        srdi: '全国统一定量指标，覆盖专业化、精细化、特色化、创新能力、成长性五大维度',
        littleGiant: '与专精特新中小企业完全一致',
      },
      {
        dimension: '一级指标',
        srdi: '5 项一级 / 16 项二级 / 23 项三级',
        littleGiant: '与专精特新中小企业完全一致',
      },
      {
        dimension: '合格分数线',
        srdi: '年度评价得分 ≥50 分',
        littleGiant: '年度评价得分 ≥60 分',
        note: '复核企业近两年任意一年达标即可',
      },
      {
        dimension: '计分方式',
        srdi: '由优质中小企业梯度培育平台自动测算，考虑行业差异与经营波动',
        littleGiant: '与专精特新中小企业完全一致',
      },
      {
        dimension: '地方自主加分',
        srdi: '无，全国统一标准',
        littleGiant: '无，全国统一标准',
      },
      {
        dimension: '复核标准',
        srdi: '按新办法认定标准执行',
        littleGiant: '复核可沿用专、精、特、新、链、品六方面框架，部分指标（如复合增长率、知识产权数量）对复核企业有适度放宽',
      }
    ]
  }
]

export const COMPARE_HIGHLIGHTS: CompareRow[] = [
  { dimension: '上年度营业收入', srdi: '≥1,500 万', littleGiant: '≥5,000 万' },
  { dimension: '主营业务收入占比', srdi: '≥80%', littleGiant: '≥90%' },
  { dimension: '资产负债率', srdi: '≤80%', littleGiant: '≤75%' },
  { dimension: '研发费用', srdi: '每年 ≥100 万', littleGiant: '近两年合计 ≥1,200 万' },
  { dimension: 'Ⅰ类知识产权', srdi: '≥1 项', littleGiant: '≥4 项' },
  { dimension: '科技奖励豁免', srdi: '省部级以上', littleGiant: '仅国家级' },
  { dimension: '市场占有率', srdi: '定性，较靠前', littleGiant: '≥10% 或国内前三' },
  { dimension: '评价合格线', srdi: '50 分', littleGiant: '60 分' }
];