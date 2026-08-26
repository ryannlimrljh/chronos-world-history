import type { EraId, PolityCategory, RegionId } from './types-helper'

/**
 * Chinese translations. Polity names follow standard Chinese
 * historiography (the reference poster's own vocabulary where visible).
 */

export const POLITY_ZH: Record<string, string> = {
  // Iran & Mesopotamia
  sumer: '苏美尔', 'akkadian-empire': '阿卡德帝国', 'ur-iii': '乌尔第三王朝',
  'old-babylonian': '古巴比伦王国', 'kassite-babylonia': '加喜特巴比伦',
  'neo-assyrian': '新亚述帝国', 'neo-babylonian': '新巴比伦王国',
  'achaemenid-empire': '阿契美尼德帝国', 'seleucid-empire': '塞琉古帝国',
  'parthian-empire': '帕提亚帝国', 'sasanian-empire': '萨珊波斯帝国',
  abbasid: '阿拔斯王朝', ilkhanate: '伊利汗国', safavid: '萨法维王朝',
  qajar: '恺加王朝', 'iran-modern': '伊朗',
  // Central Asian steppe
  andronovo: '安德罗诺沃文化', scythians: '斯基泰人', xiongnu: '匈奴帝国',
  kushan: '贵霜帝国', gokturk: '突厥汗国', 'uyghur-khaganate': '回鹘汗国',
  khwarazmian: '花剌子模', 'mongol-empire': '蒙古帝国',
  'golden-horde': '金帐汗国', timurid: '帖木儿帝国',
  'kazakh-khanate': '哈萨克汗国', kazakhstan: '哈萨克斯坦',
  // South Asia
  'indus-valley': '印度河流域文明', 'vedic-period': '吠陀时期',
  mahajanapadas: '十六雄国', 'maurya-empire': '孔雀王朝',
  satavahana: '百乘王朝', gupta: '笈多王朝', chola: '朱罗王朝',
  'delhi-sultanate': '德里苏丹国', vijayanagara: '毗奢耶那伽罗',
  mughal: '莫卧儿帝国', maratha: '马拉塔联盟', 'british-india': '英属印度',
  india: '印度',
  // Mediterranean
  minoan: '米诺斯文明', mycenaean: '迈锡尼文明',
  'greek-city-states': '古希腊城邦', macedon: '马其顿王国',
  carthage: '迦太基', 'roman-republic': '罗马共和国',
  'roman-empire': '罗马帝国', 'western-roman-empire': '西罗马帝国',
  'byzantine-empire': '拜占庭帝国', 'papal-states': '教皇国',
  venice: '威尼斯共和国', italy: '意大利', 'greece-modern': '希腊',
  // North Africa
  'old-kingdom-egypt': '古王国时期', 'middle-kingdom-egypt': '中王国时期',
  'new-kingdom-egypt': '新王国时期', 'third-intermediate-egypt': '第三中间期',
  'late-period-egypt': '古埃及晚期', ptolemaic: '托勒密王朝',
  'roman-egypt': '罗马埃及', fatimid: '法蒂玛王朝', mamluk: '马穆鲁克苏丹国',
  'ottoman-egypt': '奥斯曼埃及', 'alaouite-morocco': '摩洛哥',
  'egypt-modern': '埃及',
  // Sub-Saharan Africa
  kerma: '克尔玛王国', 'egyptian-nubia': '埃及属努比亚', kush: '库施王国',
  aksum: '阿克苏姆王国', 'ghana-empire': '加纳帝国',
  'kanem-bornu': '卡内姆-博尔努帝国', 'mali-empire': '马里帝国',
  songhai: '桑海帝国', 'great-zimbabwe': '大津巴布韦',
  'benin-kingdom': '贝宁王国', 'ethiopian-empire': '埃塞俄比亚帝国',
  ashanti: '阿散蒂帝国', 'south-africa': '南非',
  // Near East
  'canaan-phoenicia': '迦南与腓尼基城邦', hittite: '赫梯帝国',
  mitanni: '米坦尼王国', 'israel-judah': '以色列与犹大王国',
  lydia: '吕底亚王国', 'armenia-ancient': '亚美尼亚王国',
  rashidun: '正统哈里发时期', umayyad: '倭马亚王朝',
  'bagratid-armenia': '巴格拉提德亚美尼亚', 'rum-seljuks': '罗姆苏丹国',
  'crusader-states': '十字军国家', 'ottoman-empire': '奥斯曼帝国',
  turkey: '土耳其',
  // Western Europe
  'celtic-tribes': '凯尔特部落', 'roman-gaul': '罗马属高卢与不列颠',
  franks: '法兰克王国', wessex: '威塞克斯王国', england: '英格兰王国',
  'kingdom-of-france': '法兰西王国', 'france-modern': '法国',
  'al-andalus': '安达卢斯', spain: '西班牙', portugal: '葡萄牙',
  netherlands: '荷兰', 'great-britain': '英国',
  // Central & Northern Europe
  'germanic-tribes': '日耳曼部落', avars: '阿瓦尔汗国',
  'east-francia': '东法兰克王国', 'holy-roman-empire': '神圣罗马帝国',
  'kievan-rus': '基辅罗斯', 'kingdom-hungary': '匈牙利王国',
  'poland-lithuania': '波兰-立陶宛联邦', 'muscovy-russia': '沙皇俄国',
  'russian-empire': '俄罗斯帝国', ussr: '苏联', 'russia-modern': '俄罗斯',
  germany: '德国',
  // Southeast Asia
  'dong-son': '东山文化', funan: '扶南', srivijaya: '三佛齐',
  khmer: '高棉帝国', pagan: '蒲甘王朝', 'dai-viet': '大越',
  majapahit: '满者伯夷', ayutthaya: '阿瑜陀耶王国', malacca: '马六甲苏丹国',
  'dutch-east-indies': '荷属东印度', 'siam-thailand': '暹罗 / 泰国',
  indonesia: '印度尼西亚',
  // East Asia
  'xia-erlitou': '夏朝', shang: '商朝', 'western-zhou': '西周',
  'eastern-zhou': '东周', qin: '秦朝', 'han-dynasty': '汉朝',
  'jin-dynasty': '晋朝', sui: '隋朝', 'tang-dynasty': '唐朝', song: '宋朝',
  yuan: '元朝', ming: '明朝', qing: '清朝', 'china-modern': '中国',
  // Korea & Japan
  gojoseon: '古朝鲜', 'three-kingdoms-korea': '朝鲜三国时代',
  'unified-silla': '统一新罗', goryeo: '高丽王朝', joseon: '朝鲜王朝',
  'korea-modern': '韩国', 'kofun-yamato': '古坟与大和时代',
  heian: '平安时代', kamakura: '镰仓幕府', muromachi: '室町幕府',
  edo: '江户幕府', 'japan-modern': '日本',
  // Americas
  caral: '卡拉尔文明', 'poverty-point': '波弗蒂角文化', olmec: '奥尔梅克文明',
  chavin: '查文文化', maya: '玛雅文明', teotihuacan: '特奥蒂瓦坎',
  tiwanaku: '蒂瓦纳库', mississippian: '密西西比文化', aztec: '阿兹特克帝国',
  inca: '印加帝国', 'new-spain': '新西班牙', usa: '美国',
  // Oceania
  lapita: '拉皮塔文化', 'polynesian-expansion': '波利尼西亚扩张',
  'tui-tonga': '图伊汤加帝国', 'maori-iwi': '毛利部落', hawaii: '夏威夷王国',
  australia: '澳大利亚',
}

export const REGION_ZH: Record<RegionId, string> = {
  'europe-west': '西欧', 'europe-central': '中北欧', mediterranean: '地中海',
  'north-africa': '北非', 'sub-saharan-africa': '撒哈拉以南非洲',
  'near-east': '近东与安纳托利亚', 'iran-mesopotamia': '伊朗与美索不达米亚',
  'central-asia-steppe': '中亚草原', 'south-asia': '南亚',
  'southeast-asia': '东南亚', 'east-asia': '东亚', 'korea-japan': '朝鲜与日本',
  americas: '美洲', oceania: '大洋洲',
}

export const ERA_ZH: Record<EraId, string> = {
  neolithic: '新石器时代', 'bronze-age': '青铜时代', 'axial-age': '轴心时代',
  classical: '古典时代', 'late-antiquity': '古典晚期', medieval: '中世纪',
  'age-of-sail': '大航海与殖民时代', industrial: '工业时代', modern: '现代',
}

export const CATEGORY_ZH: Record<PolityCategory, string> = {
  empire: '帝国', kingdom: '王国', dynasty: '王朝', republic: '共和国',
  caliphate: '哈里发国', khanate: '汗国', confederation: '联盟',
  'city-state': '城邦', colonial: '殖民地', 'modern-state': '现代国家',
}

export const EVENT_ZH: Record<string, string> = {
  wheel: '车轮的发明', writing: '文字的出现', pyramids: '吉萨大金字塔',
  bronze: '青铜冶炼技术', hammurabi: '汉谟拉比法典', alphabet: '腓尼基字母',
  iron: '铁器时代开始', upanishads: '奥义书', buddha: '佛陀传道',
  confucius: '孔子讲学', 'athens-democracy': '雅典民主制',
  'great-wall': '长城始建', 'silk-road': '丝绸之路开通',
  christianity: '基督教的起源', paper: '造纸术', hijra: '希吉拉',
  gunpowder: '火药的发明', bologna: '第一所大学',
  'compass-nav': '指南针航海', 'magna-carta': '大宪章',
  'black-death': '黑死病', gutenberg: '古腾堡印刷机',
  columbus: '哥伦布横渡大西洋', copernicus: '日心说发表',
  newton: '牛顿《原理》', steam: '瓦特蒸汽机',
  'french-revolution': '法国大革命', darwin: '《物种起源》',
  flight: '首次动力飞行', moon: '阿波罗登月', www: '万维网',
}

export const UI_ZH: Record<string, string> = {
  filters: '筛选', regions: '地区', categories: '类型', eras: '时代',
  minSignificance: '最低重要度', clearAll: '清除全部',
  searchPlaceholder: '搜索政权、都城…',
  precededBy: '前承', succeededBy: '后继', aliveIn: '同时代政权',
  source: '资料来源', close: '关闭', years: '年', present: '至今',
  polities: '个政权', compare: '对比 · Shift+点击添加', clear: '清除',
  datingConfidence: '断代可信度', capital: '都城',
  howToExplore: '如何探索 · 点击关闭',
  tipPan: '滚动 / 拖拽', tipPanWhat: '平移海报',
  tipZoom: '⌘ 或 Ctrl + 滚动 · 双指缩放', tipZoomWhat: '以光标为中心缩放',
  tipDbl: '双击色块', tipDblWhat: '缩放至该政权',
  tipClick: '点击色块', tipClickWhat: '查看简介、承继与同时代政权',
  tipShift: '⇧ Shift + 点击', tipShiftWhat: '固定最多 4 个政权对比国祚',
  tipSearch: '⌘K / Ctrl+K', tipSearchWhat: '搜索任意政权或都城',
  tipCursor: 'T', tipCursorWhat: '放下时间光标：查看某一年的全部政权',
  tipKeys: '← → ↑ ↓ · + −', tipKeysWhat: '键盘平移与缩放',
  tipFit: '0', tipFitWhat: '整幅海报适配屏幕',
  subtitle: '五千年互动年表',
  footnote:
    '矩形高度为存续时间，宽度反映相对同时代的重要程度。时间轴为非线性：上古纪元被压缩，近现代被展开。年代在多种学术体系并存时取其一；约略年代以 c. 标注。 · © 2026 Chronos',
}
