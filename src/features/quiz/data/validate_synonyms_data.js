import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const originalPath = path.join(__dirname, 'Synonym data.json');
const processedPath = path.join(__dirname, 'processed_synonyms.json');
const reportPath = path.join(__dirname, 'validation_report.json');

const originalRaw = fs.readFileSync(originalPath, 'utf8');
const processedRaw = fs.readFileSync(processedPath, 'utf8');

const originalData = JSON.parse(originalRaw);
const processedData = JSON.parse(processedRaw);

// Create a lookup map for processed data by word for faster checking
const processedMap = new Map();
for (const item of processedData) {
    // If there are duplicate main words, we might need to handle it. Let's assume unique or use array.
    if (!processedMap.has(item.word)) {
        processedMap.set(item.word, []);
    }
    processedMap.get(item.word).push(item);
}

const report = {
    summary: {
        totalOriginalWords: 0,
        totalMatchedWords: 0,
        totalMissingWords: 0,
        totalMismatchedDetails: 0
    },
    missingWords: [],
    mismatchedDetails: [] // For words that exist but have missing/mismatched synonyms, antonyms, meaning, etc.
};

function normalizeText(text) {
    if (text === null || text === undefined) return '';
    // Normalize spaces and casing for comparison
    return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

// Compare two arrays of objects (like synonyms or antonyms)
function compareArrays(origArray, procArray, wordName, arrayType) {
    if (!origArray && !procArray) return;
    if (origArray && !procArray) {
        report.mismatchedDetails.push({
            word: wordName,
            issue: `Processed data is missing ${arrayType} array completely.`
        });
        report.summary.totalMismatchedDetails++;
        return;
    }
    if (!origArray && procArray) return; // Processed has more, that's okay

    for (const origItem of origArray) {
        const match = procArray.find(procItem =>
            normalizeText(origItem.text) === normalizeText(procItem.text)
        );

        if (!match) {
            report.mismatchedDetails.push({
                word: wordName,
                issue: `Missing ${arrayType} item: '${origItem.text}'`
            });
            report.summary.totalMismatchedDetails++;
        } else {
            // Check meaning and hindiMeaning of the sub-item
            if (origItem.meaning && normalizeText(origItem.meaning) !== normalizeText(match.meaning)) {
                report.mismatchedDetails.push({
                    word: wordName,
                    issue: `Mismatched meaning in ${arrayType} item '${origItem.text}'. Orig: '${origItem.meaning}', Proc: '${match.meaning}'`
                });
                report.summary.totalMismatchedDetails++;
            }
            if (origItem.hindiMeaning && normalizeText(origItem.hindiMeaning) !== normalizeText(match.hindiMeaning)) {
                report.mismatchedDetails.push({
                    word: wordName,
                    issue: `Mismatched hindiMeaning in ${arrayType} item '${origItem.text}'. Orig: '${origItem.hindiMeaning}', Proc: '${match.hindiMeaning}'`
                });
                report.summary.totalMismatchedDetails++;
            }
        }
    }
}


for (const group of originalData) {
    for (const origWord of group.words) {
        report.summary.totalOriginalWords++;

        const procCandidates = processedMap.get(origWord.word);

        if (!procCandidates || procCandidates.length === 0) {
            report.missingWords.push({
                word: origWord.word,
                group: group.name
            });
            report.summary.totalMissingWords++;
            continue;
        }

        // Find the best matching candidate (in case of duplicate word names, match by theme)
        let procWord = procCandidates.find(p => normalizeText(p.theme) === normalizeText(group.name));
        if (!procWord) {
            // If theme doesn't match perfectly, just take the first one and log a warning if needed
            procWord = procCandidates[0];
            report.mismatchedDetails.push({
                word: origWord.word,
                issue: `Theme mismatch. Orig: '${group.name}', Proc: '${procWord.theme}'`
            });
            report.summary.totalMismatchedDetails++;
        }

        report.summary.totalMatchedWords++;

        // Check top-level properties
        if (origWord.meaning && normalizeText(origWord.meaning) !== normalizeText(procWord.meaning)) {
            report.mismatchedDetails.push({
                word: origWord.word,
                issue: `Mismatched main meaning. Orig: '${origWord.meaning}', Proc: '${procWord.meaning}'`
            });
            report.summary.totalMismatchedDetails++;
        }

        if (origWord.hindiMeaning && normalizeText(origWord.hindiMeaning) !== normalizeText(procWord.hindiMeaning)) {
            report.mismatchedDetails.push({
                word: origWord.word,
                issue: `Mismatched main hindiMeaning. Orig: '${origWord.hindiMeaning}', Proc: '${procWord.hindiMeaning}'`
            });
            report.summary.totalMismatchedDetails++;
        }

        // Check synonyms and antonyms (and idioms if they exist in original)
        compareArrays(origWord.synonyms, procWord.synonyms, origWord.word, 'synonyms');
        compareArrays(origWord.antonyms, procWord.antonyms, origWord.word, 'antonyms');
        compareArrays(origWord.idioms, procWord.idioms, origWord.word, 'idioms');

    }
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log("Validation complete.");
console.log("Summary:");
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Report saved to ${reportPath}`);
