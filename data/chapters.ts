import type { Chapter } from '../src/types'

/**
 * The guided tour. Eight moments where the mosaic explains something a
 * list of dates cannot: collapse, simultaneity, succession, reach.
 * Narration is authored in both languages; nothing here is generated.
 */
export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'bronze-age-collapse',
    title: 'The Bronze Age Collapse',
    titleZh: '青铜时代大崩溃',
    narration:
      'Around 1200 BCE the eastern Mediterranean fell apart. Within roughly two generations the Hittite empire vanished, Mycenaean Greece burned, Egypt lost its Levantine holdings, and Babylonia went quiet. Cities that had traded with each other for centuries stopped writing, and in Greece the script itself was forgotten for four hundred years. Historians still argue about the cause: drought, migration, iron weapons, the fragility of palace economies, or all of them at once. Watch the mosaic here rather than reading it. Several tall blocks end at almost the same height, and the space beneath them stays thin for a long time. That thinning is the collapse.',
    narrationZh:
      '公元前 1200 年前后，东地中海世界土崩瓦解。在大约两代人的时间里，赫梯帝国消失，迈锡尼希腊陷入火海，埃及丢掉了黎凡特的属地，巴比伦尼亚也归于沉寂。彼此贸易了数百年的城市不再书写文字，希腊甚至遗忘了自己的文字长达四百年。史家至今仍在争论原因：干旱、民族迁徙、铁制兵器、宫廷经济的脆弱，或者以上皆是。此处不必细读，只需看图：几个高块几乎在同一高度戛然而止，其下的区域长久地变得稀薄。那片稀薄，就是崩溃本身。',
    camera: { yearCenter: -1200, yearSpan: 700, regions: ['mediterranean', 'near-east', 'north-africa', 'iran-mesopotamia'] },
    highlight: ['hittite', 'mycenaean', 'new-kingdom-egypt', 'kassite-babylonia', 'canaan-phoenicia'],
  },
  {
    id: 'axial-age',
    title: 'The Axial Age',
    titleZh: '轴心时代',
    narration:
      'Between roughly 800 and 300 BCE, thinkers in four separate places asked the same kind of question and got no help from each other. Confucius and Laozi taught in a fragmenting Zhou China. The Buddha and Mahavira taught on the Ganges plain. Hebrew prophets wrote in the shadow of Assyria and Babylon. Socrates argued in Athens. None of them met, and none knew the others existed. The mosaic shows why this is startling: run your eye across a single horizontal band here and you cross China, India, Persia and Greece at once. Ideas that still organise billions of lives were formed inside that one narrow strip of time.',
    narrationZh:
      '大约在公元前 800 年到前 300 年之间，四个彼此隔绝的地方，思想家们提出了同一类问题，却没有从对方那里得到任何帮助。孔子与老子在分崩离析的周代中国讲学；佛陀与大雄在恒河平原传道；希伯来先知在亚述与巴比伦的阴影下写作；苏格拉底在雅典与人争辩。他们从未相遇，甚至不知道彼此存在。这幅图让人吃惊之处正在于此：沿着同一条横带扫视一遍，你会同时穿过中国、印度、波斯与希腊。至今仍在组织数十亿人生活的思想，都诞生在这条狭窄的时间带里。',
    camera: { yearCenter: -500, yearSpan: 600, regions: ['mediterranean', 'iran-mesopotamia', 'south-asia', 'east-asia'] },
    highlight: ['eastern-zhou', 'mahajanapadas', 'greek-city-states', 'achaemenid-empire', 'israel-judah'],
  },
  {
    id: 'rome-and-han',
    title: 'Rome and Han, at the Same Time',
    titleZh: '罗马与汉，同时存在',
    narration:
      'In 100 CE two empires each held roughly a quarter of the human race, and neither could reach the other. Rome ringed the Mediterranean; Han China ran from the Gobi to the South China Sea. Between them sat Parthia and the Kushans, who profited enormously from keeping them apart. Roman writers knew of a silk-producing people called the Seres. Han envoys reached the Persian Gulf and turned back. This is the single hardest fact to hold in your head from a textbook, because textbooks separate them into different chapters. Here they sit side by side on one sheet, roughly the same size, alive at the same moment.',
    narrationZh:
      '公元 100 年，两个帝国各自统治着大约四分之一的人类，却谁也无法抵达对方。罗马环抱地中海，汉朝的疆域从戈壁一直伸展到南海。夹在中间的帕提亚与贵霜，正靠着让两者彼此隔绝而获利丰厚。罗马作家知道东方有个产丝的「赛里斯」民族；汉朝使节曾抵达波斯湾，随后折返。这是教科书最难让人记住的一个事实，因为教科书把它们分在不同的章节里。而在这张图上，它们并排而立，体量相仿，活在同一个瞬间。',
    camera: { yearCenter: 100, yearSpan: 450, regions: ['mediterranean', 'iran-mesopotamia', 'central-asia-steppe', 'east-asia'] },
    highlight: ['roman-empire', 'han-dynasty', 'parthian-empire', 'kushan'],
  },
  {
    id: 'fall-of-the-west',
    title: 'The Half That Fell',
    titleZh: '倒下的那一半',
    narration:
      'In 395 the Roman empire was administratively divided, and the two halves had utterly different fates. The west lasted eighty-one more years and then dissolved into Frankish, Gothic and Vandal kingdoms. The east, governed from Constantinople, lasted another thousand. Look at the shape of it here: one block stops abruptly and fragments into many thin columns, while directly beside it a single column continues down almost the entire remaining height of the sheet. Rome did not fall in 476. Half of Rome fell in 476, and the other half kept calling itself Roman until 1453.',
    narrationZh:
      '395 年，罗马帝国在行政上一分为二，而这两半的命运截然不同。西部又维持了八十一年，随后瓦解为法兰克、哥特与汪达尔诸王国；以君士坦丁堡为都的东部，则又延续了一千年。请看这里的形状：一个色块戛然而止，碎裂成许多细长的窄条；紧挨着它，另一根柱子几乎贯穿了整张图余下的高度。476 年倒下的并不是罗马，而是罗马的一半；另一半一直自称罗马人，直到 1453 年。',
    camera: { yearCenter: 500, yearSpan: 500, regions: ['europe-west', 'europe-central', 'mediterranean', 'near-east'] },
    highlight: ['western-roman-empire', 'byzantine-empire', 'franks', 'roman-empire'],
  },
  {
    id: 'arab-expansion',
    title: 'A Generation of Conquest',
    titleZh: '一代人的征服',
    narration:
      'Muhammad died in 632. Within twenty-nine years, armies from the Arabian peninsula had taken Syria, Egypt, Mesopotamia and the whole of Sasanian Persia. Within a century they held territory from the Atlantic coast of Morocco to the Indus. The Sasanian empire, four centuries old, ceased to exist entirely. Byzantium lost more than half its land and survived only by retreating into Anatolia. Almost nothing else on this chart moves that fast. Most empires here take two or three centuries to reach their extent. This one changes the colour of a quarter of the sheet inside a single human lifetime.',
    narrationZh:
      '穆罕默德于 632 年去世。此后二十九年之内，来自阿拉伯半岛的军队已经拿下叙利亚、埃及、美索不达米亚，以及整个萨珊波斯。不到一个世纪，他们的疆域从摩洛哥的大西洋岸一直延伸到印度河。立国四百年的萨珊帝国彻底消失；拜占庭丢掉了一半以上的国土，靠退守安纳托利亚才得以存续。这张图上几乎没有别的事物移动得如此之快。这里的大多数帝国都需要两三个世纪才能扩张到它们的极限，而这一个，在一个人的一生之内就改变了整张图四分之一的颜色。',
    camera: { yearCenter: 700, yearSpan: 400, regions: ['north-africa', 'near-east', 'iran-mesopotamia', 'mediterranean'] },
    highlight: ['rashidun', 'umayyad', 'sasanian-empire', 'byzantine-empire', 'abbasid'],
  },
  {
    id: 'mongol-century',
    title: 'The Mongol Century',
    titleZh: '蒙古的世纪',
    narration:
      'Genghis Khan united the Mongol tribes in 1206. By 1279 his descendants ruled from Korea to Hungary, the largest contiguous empire that has ever existed. It is easier to see here than to describe: look how many separate lanes carry Mongol or Mongol-successor blocks at the same time. China as the Yuan, Persia as the Ilkhanate, the Russian principalities under the Golden Horde, Central Asia in between. For about a century a merchant could travel that entire distance under one authority, and ideas, plague and gunpowder all travelled with them. Then it fragmented almost as quickly as it had formed.',
    narrationZh:
      '1206 年，成吉思汗统一蒙古诸部。到 1279 年，他的子孙已从朝鲜统治到匈牙利，建立起史上疆域最大的陆上连续帝国。这一点看图比读文字更清楚：请注意同一时刻有多少条不同的地带里同时出现蒙古或蒙古继承政权的色块。中国是元朝，波斯是伊利汗国，罗斯诸公国臣属金帐汗国，中亚横亘其间。大约一个世纪里，商人可以在同一个权威之下走完这整段路程，思想、瘟疫与火药也随之传播。此后，它瓦解的速度几乎与形成时一样快。',
    camera: { yearCenter: 1270, yearSpan: 320, regions: ['europe-central', 'iran-mesopotamia', 'central-asia-steppe', 'east-asia', 'south-asia'] },
    highlight: ['mongol-empire', 'yuan', 'ilkhanate', 'golden-horde', 'delhi-sultanate'],
  },
  {
    id: 'age-of-sail',
    title: 'Two Worlds Meet',
    titleZh: '两个世界相遇',
    narration:
      'For fifteen thousand years the Americas developed with no contact with Eurasia. The right side of this chart and the left side are, until 1492, two separate experiments in being human. Then in the space of forty years both American empires ended. The Aztec Triple Alliance fell in 1521, the Inca in 1533, neither primarily to European weapons but to smallpox that arrived ahead of the armies. Notice what happens to the American lane here: long independent columns stop, and colonial blocks begin. This is the only place on the whole sheet where an entire hemisphere changes hands inside two generations.',
    narrationZh:
      '在长达一万五千年的时间里，美洲的发展与欧亚大陆没有任何接触。直到 1492 年之前，这张图的右侧与左侧，是两场彼此独立的、关于「如何为人」的实验。随后在四十年之内，两个美洲帝国先后终结：阿兹特克三方同盟亡于 1521 年，印加亡于 1533 年。真正击垮它们的主要不是欧洲人的武器，而是先于军队抵达的天花。请注意此处美洲地带发生了什么：长长的独立柱子中断，殖民地色块开始出现。在整张图上，这是唯一一处在两代人之内、整个半球易主的地方。',
    camera: { yearCenter: 1520, yearSpan: 300, regions: ['europe-west', 'americas', 'southeast-asia', 'east-asia'] },
    highlight: ['aztec', 'inca', 'new-spain', 'spain', 'portugal', 'ming'],
  },
  {
    id: 'nineteen-fourteen',
    title: 'The Last Year of the Old Order',
    titleZh: '旧秩序的最后一年',
    narration:
      'Look at the bottom of the chart, just before it ends. In 1914 most of the world was governed by a handful of monarchies that had existed for centuries: the Ottomans since 1299, the Qing until two years earlier, the Romanovs since 1613, the Habsburgs longer still. Within eight years all of them were gone. The Ottoman empire, the Russian empire, Austria-Hungary and imperial Germany end within a few millimetres of each other here, and the modern states that replace them are the thin blocks at the very bottom edge. Almost every country alive today begins inside that narrow band.',
    narrationZh:
      '请看这张图接近末尾的地方。1914 年，世界上大部分地区仍由少数存续了数百年的君主国统治：奥斯曼始于 1299 年，清朝直到两年前才终结，罗曼诺夫王朝始于 1613 年，哈布斯堡家族则更为久远。而在此后八年之内，它们全部消失。奥斯曼帝国、俄罗斯帝国、奥匈帝国与德意志帝国在这里几毫米之内相继结束，取代它们的现代国家，就是最下缘那一排细窄的色块。今天存在的几乎每一个国家，都始于那条狭窄的地带。',
    camera: { yearCenter: 1930, yearSpan: 220, regions: ['europe-west', 'europe-central', 'near-east', 'east-asia', 'americas'] },
    highlight: ['ottoman-empire', 'russian-empire', 'germany', 'qing', 'great-britain', 'usa', 'japan-modern'],
  },
]
