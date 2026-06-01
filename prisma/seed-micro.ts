import "dotenv/config";
import { db } from "../src/lib/db";

const CONTENT = [
  // Math tricks
  {
    type: "TRICK",
    subject: "MATHEMATICS",
    title: "Multiply by 11 instantly",
    body: "To multiply any 2-digit number by 11, split the digits and put their sum in the middle.\n\n**Example:** 36 × 11\nSplit: 3 _ 6\nSum: 3 + 6 = 9\nAnswer: **396**\n\nIf the sum is > 9, carry the 1.\n72 × 11 → 7_(7+2)_2 → 7_9_2 → **792**",
    tags: ["multiplication", "speed-math", "mental-math"],
    difficulty: "EASY",
  },
  {
    type: "TRICK",
    subject: "MATHEMATICS",
    title: "Percentage shortcut",
    body: "**x% of y = y% of x**\n\nSo 8% of 50 = 50% of 8 = **4**\n\n16% of 25 = 25% of 16 = **4**\n\nAlways flip to whichever is easier to calculate mentally. This saves 20+ seconds on JAMB.",
    tags: ["percentage", "speed-math"],
    difficulty: "EASY",
  },
  {
    type: "FORMULA",
    subject: "MATHEMATICS",
    title: "Quadratic formula — never forget it",
    body: "**x = (-b ± √(b²-4ac)) / 2a**\n\nSing it to the tune of \"Pop Goes The Weasel\":\n\n🎵 *x equals negative b*\n*plus or minus the square root*\n*of b squared minus four a c*\n*all over two a* 🎵\n\nThe discriminant (b²-4ac) tells you everything:\n• Positive → 2 real roots\n• Zero → 1 repeated root\n• Negative → no real roots",
    tags: ["quadratic", "algebra", "formula"],
    difficulty: "MEDIUM",
  },
  {
    type: "HACK",
    subject: "MATHEMATICS",
    title: "Substitution > Solving",
    body: "In JAMB, you don't need to solve equations — you need to find the right answer.\n\n**Plug in the options.**\n\nExample: Solve x² - 5x + 6 = 0\n\nInstead of factoring, test each option:\n• A) x=1: 1-5+6 = 2 ≠ 0 ❌\n• B) x=2: 4-10+6 = 0 ✅\n\nOption B works. Move on. You just saved 30 seconds.",
    tags: ["exam-strategy", "time-saving"],
    difficulty: "EASY",
  },
  {
    type: "MISTAKE",
    subject: "MATHEMATICS",
    title: "The log trap that catches 70% of students",
    body: "**log(a + b) ≠ log(a) + log(b)**\n\n❌ WRONG: log(3 + 4) = log 3 + log 4\n✅ RIGHT: log 3 + log 4 = log(3 × 4) = log 12\n\nThe rule is:\n• log(a × b) = log a + log b\n• log(a / b) = log a - log b\n• log(aⁿ) = n × log a\n\nJAMB loves testing this. Don't fall for it.",
    tags: ["logarithm", "common-mistake", "algebra"],
    difficulty: "MEDIUM",
  },

  // Physics
  {
    type: "MNEMONIC",
    subject: "PHYSICS",
    title: "Remember the electromagnetic spectrum",
    body: "From longest to shortest wavelength:\n\n**R**adio → **M**icro → **I**nfrared → **V**isible → **U**ltraviolet → **X**-ray → **G**amma\n\n🧠 **\"Real Men In Vegas Use X-ray Glasses\"**\n\nOR from shortest to longest:\n\n**\"Get X-tra Unique Vibrant Ideas My Radio\"**\n\nJAMB asks this almost every year.",
    tags: ["waves", "em-spectrum", "mnemonic"],
    difficulty: "EASY",
  },
  {
    type: "TRICK",
    subject: "PHYSICS",
    title: "SUVAT — pick the right equation instantly",
    body: "Each SUVAT equation is missing ONE variable:\n\n• **v = u + at** → no s\n• **s = ut + ½at²** → no v\n• **v² = u² + 2as** → no t\n• **s = ½(u+v)t** → no a\n\n**Trick:** Look at what's NOT given in the question. That tells you which equation to use.\n\nNo time given? Use v² = u² + 2as.\nNo final velocity? Use s = ut + ½at².",
    tags: ["mechanics", "kinematics", "equations"],
    difficulty: "MEDIUM",
  },
  {
    type: "TRAP",
    subject: "PHYSICS",
    title: "Mass vs Weight — JAMB's favorite confusion",
    body: "**Mass ≠ Weight**\n\n• Mass = amount of matter (kg) — same everywhere\n• Weight = gravitational force (N) — changes with location\n\n**Weight = mass × g**\n\nA 60kg person:\n• On Earth: W = 60 × 10 = 600N\n• On Moon: W = 60 × 1.6 = 96N\n• Mass is still 60kg in both places\n\nJAMB trick: they give weight and ask for mass, or vice versa. Always check the unit — kg or N?",
    tags: ["mechanics", "forces", "common-trap"],
    difficulty: "EASY",
  },
  {
    type: "FORMULA",
    subject: "PHYSICS",
    title: "Ohm's Law triangle — solve any circuit question",
    body: "**V = I × R**\n\nDraw a triangle:\n```\n    V\n  ─────\n  I × R\n```\n\nCover what you want:\n• Cover V → I × R (multiply)\n• Cover I → V/R (divide)\n• Cover R → V/I (divide)\n\n**Series:** R_total = R₁ + R₂ + R₃\n**Parallel:** 1/R_total = 1/R₁ + 1/R₂ + 1/R₃\n\nJAMB always has 1-2 Ohm's Law questions. Free marks.",
    tags: ["electricity", "circuits", "formula"],
    difficulty: "EASY",
  },

  // Chemistry
  {
    type: "MNEMONIC",
    subject: "CHEMISTRY",
    title: "Activity series of metals",
    body: "Most reactive to least reactive:\n\n**K Na Ca Mg Al Zn Fe Pb H Cu Hg Ag Au**\n\n🧠 **\"King Nathan Came Mighty And Zapped Five Lazy Horses, Causing Horrible Serious Agony\"**\n\nWhy it matters:\n• Metals above hydrogen react with dilute acids\n• A more reactive metal displaces a less reactive one\n• Gold (Au) at the bottom = most unreactive = doesn't corrode\n\nJAMB tests displacement reactions using this series every year.",
    tags: ["electrochemistry", "metals", "reactivity"],
    difficulty: "MEDIUM",
  },
  {
    type: "TRICK",
    subject: "CHEMISTRY",
    title: "Balancing equations in 30 seconds",
    body: "**Balance in this order: metals → non-metals → hydrogen → oxygen**\n\nExample: Fe + O₂ → Fe₂O₃\n\n1. Balance Fe: 2Fe + O₂ → Fe₂O₃ ✓\n2. Balance O: need 3 on right, have 2 on left\n   Multiply: 4Fe + 3O₂ → 2Fe₂O₃\n\n**Shortcut for combustion:**\nAnything + O₂ → CO₂ + H₂O\n\nBalance C first, then H, then O last.",
    tags: ["equations", "balancing", "stoichiometry"],
    difficulty: "MEDIUM",
  },
  {
    type: "FACT",
    subject: "CHEMISTRY",
    title: "The mole number you must memorize",
    body: "**Avogadro's number: 6.022 × 10²³**\n\n1 mole of ANYTHING contains 6.022 × 10²³ particles.\n\n• 1 mole of water = 6.022 × 10²³ molecules = 18g\n• 1 mole of carbon = 6.022 × 10²³ atoms = 12g\n• 1 mole of NaCl = 6.022 × 10²³ formula units = 58.5g\n\n**At STP:**\n• 1 mole of any gas = 22.4 dm³\n\nThese three numbers (6.022×10²³, molar mass, 22.4dm³) solve 80% of JAMB stoichiometry questions.",
    tags: ["mole-concept", "stoichiometry", "constant"],
    difficulty: "EASY",
  },
  {
    type: "MISTAKE",
    subject: "CHEMISTRY",
    title: "Ionic vs Covalent — the test that tricks you",
    body: "**Metal + Non-metal = IONIC (electron transfer)**\n**Non-metal + Non-metal = COVALENT (electron sharing)**\n\nBut JAMB loves exceptions:\n\n❌ NH₄Cl looks covalent but has ionic bonding\n❌ AlCl₃ looks ionic but is actually covalent\n\n**Rule of thumb:**\nElectronegativity difference > 1.7 → Ionic\nElectronegativity difference < 1.7 → Covalent\n\nWhen in doubt, check if it conducts electricity when dissolved. If yes → ionic.",
    tags: ["bonding", "common-mistake"],
    difficulty: "HARD",
  },

  // English
  {
    type: "HACK",
    subject: "USE_OF_ENGLISH",
    title: "Comprehension: read questions FIRST",
    body: "Most students read the passage first, then the questions. **Flip it.**\n\n1. Read ALL questions first (30 seconds)\n2. Now read the passage — your brain automatically highlights relevant parts\n3. Answer as you find each answer\n\nThis technique cuts comprehension time by 40%.\n\n**For \"tone\" questions:**\n• Look for emotional words (argues, laments, celebrates)\n• The answer is usually: persuasive, critical, nostalgic, or objective\n• It's almost never: aggressive, indifferent, or sarcastic",
    tags: ["comprehension", "exam-strategy", "reading"],
    difficulty: "EASY",
  },
  {
    type: "TRAP",
    subject: "USE_OF_ENGLISH",
    title: "Nearest in meaning ≠ Synonym",
    body: "JAMB's \"nearest in meaning\" questions aren't asking for dictionary synonyms. They want the word that works **in that specific sentence.**\n\n**Example:**\n\"The man was **charged** for the offence.\"\n\nA) accused ✅\nB) electrified\nC) attacked\nD) billed\n\nAll are meanings of \"charged\" — but in this context, only \"accused\" fits.\n\n**Always re-read the sentence with your chosen word plugged in.** If it sounds weird, it's wrong.",
    tags: ["vocabulary", "nearest-meaning", "trap"],
    difficulty: "MEDIUM",
  },
  {
    type: "MNEMONIC",
    subject: "USE_OF_ENGLISH",
    title: "Affect vs Effect — settled forever",
    body: "**A**ffect = **A**ction (verb)\n**E**ffect = **E**nd result (noun)\n\n🧠 **RAVEN:**\n**R**emember\n**A**ffect is a\n**V**erb and\n**E**ffect is a\n**N**oun\n\n• The rain **affected** the match. (verb)\n• The **effect** of the rain was cancellation. (noun)\n\nException: \"effect\" can be a verb meaning \"to bring about\" — \"The president effected change.\" But JAMB rarely tests this edge case.",
    tags: ["grammar", "vocabulary", "mnemonic"],
    difficulty: "EASY",
  },
  {
    type: "TRICK",
    subject: "USE_OF_ENGLISH",
    title: "Stress pattern hack for JAMB",
    body: "**2-syllable words:**\n• Nouns → stress on 1st syllable (RE-cord, PRE-sent)\n• Verbs → stress on 2nd syllable (re-CORD, pre-SENT)\n\n**3+ syllable words ending in:**\n• -tion/-sion → stress the syllable BEFORE (edu-CA-tion)\n• -ic → stress the syllable BEFORE (pho-to-GRA-phic)\n• -ity → stress the syllable BEFORE (e-LEC-tri-ci-ty)\n• -ous → stress TWO syllables before (a-DVAN-ta-geous)\n\nThis pattern answers 80% of JAMB oral English questions.",
    tags: ["oral-english", "stress", "pronunciation"],
    difficulty: "MEDIUM",
  },

  // Biology
  {
    type: "MNEMONIC",
    subject: "BIOLOGY",
    title: "Kingdom classification — never forget it",
    body: "**K**ingdom → **P**hylum → **C**lass → **O**rder → **F**amily → **G**enus → **S**pecies\n\n🧠 **\"Kings Play Chess On Fine Green Silk\"**\n\nOR the Nigerian version:\n\n🧠 **\"Kofi Please Come Over For Groundnut Soup\"**\n\nExample for humans:\n• Kingdom: Animalia\n• Phylum: Chordata\n• Class: Mammalia\n• Order: Primates\n• Family: Hominidae\n• Genus: Homo\n• Species: sapiens",
    tags: ["classification", "taxonomy", "mnemonic"],
    difficulty: "EASY",
  },
  {
    type: "TRAP",
    subject: "BIOLOGY",
    title: "Mitosis vs Meiosis — the table that saves you",
    body: "**Mitosis:**\n• 2 daughter cells\n• Same chromosome number (diploid)\n• For growth and repair\n• Happens everywhere in the body\n\n**Meiosis:**\n• 4 daughter cells\n• Half chromosome number (haploid)\n• For reproduction (gametes)\n• Only in reproductive organs\n\n**JAMB trap:** They ask where meiosis occurs.\n\nAnswer: Ovaries and testes ONLY.\nNever in the liver, skin, or bone marrow — that's mitosis.",
    tags: ["cell-division", "genetics", "trap"],
    difficulty: "MEDIUM",
  },
  {
    type: "FACT",
    subject: "BIOLOGY",
    title: "Blood group compatibility — exam gold",
    body: "**Universal donor:** O (gives to everyone)\n**Universal recipient:** AB (receives from everyone)\n\nDonation chart:\n• O → O, A, B, AB\n• A → A, AB\n• B → B, AB\n• AB → AB only\n\n**Rhesus factor:**\n• Rh+ can receive from Rh+ and Rh-\n• Rh- can ONLY receive from Rh-\n\n**JAMB favorite:** \"What blood group can receive from all donors?\" → AB\n\nThis appears in JAMB Biology almost every single year.",
    tags: ["blood", "genetics", "human-biology"],
    difficulty: "EASY",
  },

  // Economics
  {
    type: "TRICK",
    subject: "ECONOMICS",
    title: "Demand vs Quantity demanded — the trick",
    body: "**Change in QUANTITY demanded:**\n• Caused by price change ONLY\n• Movement ALONG the curve\n• \"Quantity demanded fell\" ← price went up\n\n**Change in DEMAND:**\n• Caused by everything ELSE (income, taste, population)\n• SHIFT of the entire curve\n• \"Demand increased\" ← the whole curve moved right\n\nJAMB tests this distinction constantly. If the question mentions price → it's quantity demanded. If it mentions income, taste, or fashion → it's demand.",
    tags: ["demand", "supply", "microeconomics"],
    difficulty: "MEDIUM",
  },
  {
    type: "FORMULA",
    subject: "ECONOMICS",
    title: "Elasticity — the only formula you need",
    body: "**Price Elasticity of Demand (PED):**\n\nPED = (% change in Qty demanded) / (% change in Price)\n\n**Interpretation:**\n• PED > 1 → Elastic (luxury goods)\n• PED < 1 → Inelastic (necessities)\n• PED = 1 → Unitary\n• PED = 0 → Perfectly inelastic\n• PED = ∞ → Perfectly elastic\n\n**Quick rule:** If people MUST buy it regardless of price (petrol, salt, medicine) → inelastic.\n\nIf they can easily switch or do without (designer clothes, cinema) → elastic.",
    tags: ["elasticity", "microeconomics", "formula"],
    difficulty: "MEDIUM",
  },
];

async function main() {
  for (const item of CONTENT) {
    await db.microContent.create({
      data: item as any,
    });
  }
  console.log(`Seeded ${CONTENT.length} micro-content cards`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());