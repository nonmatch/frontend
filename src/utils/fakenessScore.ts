import { FakenessLine } from "../types";

interface Rule {
    id?: number;
    code: string;
    score: number;
    description: string;
}

const fakenessScoringRules: Rule[] = [
    {
        'code': 'asm(',
        'score': 5,
        'description': 'Direct asm() call'
    },
    {
        'code': 'FORCE_REGISTER',
        'score': 5,
        'description': 'FORCE_REGISTER to force register allocation'
    },
    {
        'code': 'MEMORY_BARRIER',
        'score': 3,
        'description': 'MEMORY_BARRIER to change register allocation'
    },
    {
        'code': 'NON_MATCHING',
        'score': 2,
        'description': 'Check for NON_MATCHING define'
    },
    {
        'code': 'goto',
        'score': 1,
        'description': 'goto'
    }
]

let firstChars: { [id: string]: Rule } = {}

fakenessScoringRules.forEach((rule, id) => {
    firstChars[rule.code.charAt(0)] = rule;
    rule.id = id;
});

export const calculateFakenessScore = (code: string) => {
    const scorer = new FakenessScorer(code);
    const { score, ruleBreaks } = scorer.calculateFakenessScore();
    
    let fakenessLines: FakenessLine[] = [];
    let breaks = Array(fakenessScoringRules.length).fill(0);
    for (const ruleBreak of ruleBreaks) {
        breaks[ruleBreak.ruleId]++;
        fakenessLines.push({
            text: fakenessScoringRules[ruleBreak.ruleId].description,
            line: ruleBreak.line
        });
    }

    let descriptions: string[] = [];
    for (let i = 0; i < fakenessScoringRules.length; i++) {
        const amount = breaks[i];
        if (amount > 0) {
            const rule = fakenessScoringRules[i];
            descriptions.push(amount + 'x ' + rule.description + ' [' + rule.score.toString() + ']');
        }
    }

    return {
        score: score,
        descriptions: descriptions,
        fakenessLines: fakenessLines
    };
}

interface RuleBreak {
    ruleId: number;
    line: number;
}

class FakenessScorer {
    code: string;
    cursor: number;
    line: number;
    fakenessScore: number;
    ruleBreaks: RuleBreak[];

    constructor(code: string) {
        this.code = code;
        this.cursor = 0;
        this.line = 1
        this.fakenessScore = 0;
        this.ruleBreaks = [];
    }

    calculateFakenessScore() {
        this.parseCode();
        return {
            score: this.fakenessScore,
            ruleBreaks: this.ruleBreaks
        }
    }

    parseCode() {
        while (this.cursor < this.code.length) {
            const char = this.code.charAt(this.cursor);

            if (char === '/') {
                const nextChar = this.code.charAt(this.cursor + 1);
                switch (nextChar) {
                    case '*':
                        this.cursor += 2;
                        this.parseBlockComment();
                        break;
                    case '/':
                        this.cursor += 2;
                        this.parseLineComment();
                        break;
                    default:
                        this.incCursor();
                        break;
                }
            } else {
                if (char in firstChars) {
                    const rule = firstChars[char];
                    if (this.code.substring(this.cursor, this.cursor + rule.code.length) === rule.code) {
                        this.fakenessScore += rule.score;
                        this.cursor += rule.code.length;
                        this.ruleBreaks.push({ ruleId: rule.id!, line: this.line });
                    } else {
                        this.incCursor();
                    }
                } else {
                    this.incCursor();
                }
            }
        }
    }

    parseBlockComment() {
        while (this.cursor < this.code.length) {
            if (this.code.charAt(this.cursor) === '*' && this.code.charAt(this.cursor + 1) === '/') {
                this.cursor += 2;
                return;
            }
            this.incCursor();
        }
        console.error('Did not find end of block comment')
    }

    parseLineComment() {
        while (this.cursor < this.code.length) {
            if (this.code.charAt(this.cursor) === '\n') {
                this.incCursor();
                return;
            }
            this.incCursor();
        }
    }

    incCursor() {
        const char = this.code[this.cursor];
        if (char === '\n') {
            this.line++;
        }
        this.cursor++;
    }
}