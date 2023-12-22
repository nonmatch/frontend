const fakenessScoringRules = [
    {
        'regex': /asm\(/g,
        'score': 5,
        'description': 'Direct asm() call'
    },
    {
        'regex': /FORCE_REGISTER/g,
        'score': 5,
        'description': 'ORCE_REGISTER to force register allocation'
    },
    {
        'regex': /MEMORY_BARRIER/g,
        'score': 3,
        'description': 'MEMORY_BARRIER to change register allocation'
    },
    {
        'regex': /NON_MATCHING/g,
        'score': 3,
        'description': 'Check for NON_MATCHING define'
    },
    {
        'regex': /goto/g,
        'score': 1,
        'description': 'goto'
    }
]

export const calculateFakenessScore = (code: string) => {
    let fakenessScore = 0
    for (const rule of fakenessScoringRules) {
        const matches = code.match(rule.regex);
        if (matches) {
            fakenessScore += rule.score * matches.length;
        }
    }
    return fakenessScore;
}