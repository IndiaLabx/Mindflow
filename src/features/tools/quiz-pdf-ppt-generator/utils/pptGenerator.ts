import { Question, InitialFilters } from "../../../quiz/types";

// Helper for PPT text cleaning
function cleanQuestionText(text: string | undefined): string {
    return (text || "").replace(/^(Q\.\d+\)|प्रश्न \d+\))\s*/, '');
}

// Helper for PPT markdown parsing
function parseMarkdownForPptx(markdown: string | undefined): any[] {
    if (!markdown) return [];

    const richTextArray: any[] = [];
    const lines = markdown.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?pre>/g, '').split('\n');

    lines.forEach((line, index) => {
        const processedLine = line.replace(/^[-*]\s*/, '• ');
        const parts = processedLine.split(/(\*\*.*?\*\*)/g).filter(Boolean);

        if (parts.length === 0 && line.trim() === '') {
            richTextArray.push({ text: '\n' });
            return;
        }

        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                richTextArray.push({
                    text: part.substring(2, part.length - 2),
                    options: { bold: true }
                });
            } else if (part) {
                richTextArray.push({ text: part });
            }
        });

        if (index < lines.length - 1) {
            richTextArray.push({ text: '\n' });
        }
    });
    return richTextArray;
}

export const generatePowerPoint = async (
    questions: Question[],
    filters: InitialFilters,
    onProgress: (progress: number, details: string) => void
): Promise<void> => {

    if (!questions || questions.length === 0) return;

    try {
        const pptxgen = (await import('pptxgenjs')).default;
        const pptx = new pptxgen();

        pptx.layout = 'LAYOUT_16x9';
        pptx.author = 'Quiz LM App';
        pptx.company = 'AI-Powered Learning';
        pptx.title = 'Customized Quiz Presentation';

        const TITLE_SLIDE_BG = 'F5F5F5';
        const QUESTION_SLIDE_BG = 'D6EAF8';
        const ANSWER_SLIDE_BG = 'E2F0D9';

        const TEXT_COLOR = '191919';
        const CORRECT_ANSWER_COLOR = '006400';
        const ENGLISH_FONT = 'Arial';
        const HINDI_FONT = 'Nirmala UI';

        // --- TITLE SLIDE (WITH DYNAMIC INFO) ---
        let titleSlide = pptx.addSlide();
        titleSlide.background = { color: TITLE_SLIDE_BG };

        titleSlide.addText("Quiz LM Presentation ✨", {
            x: 0.5, y: 0.8, w: '90%', h: 1,
            fontSize: 44, color: '303f9f', bold: true, align: 'center'
        });
        titleSlide.addText(`Generated with ${questions.length} questions.`, {
            x: 0, y: 2.0, w: '100%', align: 'center', color: TEXT_COLOR, fontSize: 18
        });

        const indianTimestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
        titleSlide.addText(`Created on: ${indianTimestamp} (IST)`, {
            x: 0, y: 2.4, w: '100%', align: 'center', color: '757575', fontSize: 11, italic: true
        });

        const filterTextForPPT: any[] = [];
        const filterHierarchy: Record<string, (keyof InitialFilters)[]> = {
            'Classification': ['subject', 'topic', 'subTopic'],
            'Properties': ['difficulty', 'questionType'],
            'Source': ['examName', 'examYear'],
            'Tags': ['tags']
        };

        let hasFilters = false;
        for (const category in filterHierarchy) {
            const filtersInCategory: string[] = [];
            filterHierarchy[category].forEach((filterKey: keyof InitialFilters) => {
                const selected = filters[filterKey];
                if (selected && selected.length > 0) {
                    hasFilters = true;
                    const displayName = filterKey.charAt(0).toUpperCase() + filterKey.slice(1).replace(/([A-Z])/g, ' $1').trim();
                    filtersInCategory.push(`${displayName}: ${selected.join(', ')}`);
                }
            });

            if (filtersInCategory.length > 0) {
                filterTextForPPT.push({ text: category, options: { bold: true, breakLine: true, fontSize: 12, color: '303f9f', align: 'left'} });
                filtersInCategory.forEach(filterText => {
                    filterTextForPPT.push({ text: `  • ${filterText}`, options: { breakLine: true, fontSize: 11, color: TEXT_COLOR, align: 'left' }});
                });
                filterTextForPPT.push({ text: '', options: { breakLine: true } });
            }
        }

        if (hasFilters) {
            titleSlide.addText(filterTextForPPT, {
                x: 1.0, y: 3.0, w: '80%', h: 2.5,
                lineSpacing: 22, valign: 'top'
            });
        }

        // --- ASYNCHRONOUS QUESTION & ANSWER SLIDE GENERATION ---
        const totalQuestions = questions.length;

        for (let i = 0; i < totalQuestions; i++) {
            const question_item = questions[i];
            const slide_question_number = i + 1;

            // Update Progress
            const progress = Math.round(((i + 1) / totalQuestions) * 100);
            onProgress(progress, `Processing question ${slide_question_number} of ${totalQuestions}...`);

            // SLIDE 1: QUESTION & OPTIONS
            let q_slide = pptx.addSlide();
            q_slide.background = { color: QUESTION_SLIDE_BG };
            let question_text = cleanQuestionText(question_item.question);
            const examInfoText = ` (${question_item.sourceInfo.examName}, ${question_item.sourceInfo.examDateShift})`;
            const englishQuestionArray = [
                ...parseMarkdownForPptx(`Q.${slide_question_number}) ${question_text}`),
                { text: examInfoText, options: { fontSize: 12, color: 'C62828', italic: true } }
            ];
            q_slide.addText(englishQuestionArray, { x: 0.5, y: 0.3, w: 9, h: 1.2, fontFace: ENGLISH_FONT, fontSize: 20, color: TEXT_COLOR, bold: true });

            const question_text_hi = cleanQuestionText(question_item.question_hi);
            q_slide.addText(parseMarkdownForPptx(question_text_hi || ''), { x: 0.5, y: 1.5, w: 9, h: 0.6, fontFace: HINDI_FONT, fontSize: 18, color: TEXT_COLOR, bold: true });

            let optionsY = 2.3;
            let optionsArray: any[] = [];
            (question_item.options || []).forEach((eng_option, index) => {
                const hin_option = (question_item.options_hi || [])[index] || '';
                const option_letter = String.fromCharCode(65 + index);
                const engParsed = parseMarkdownForPptx(`${option_letter}) ${eng_option}`);
                engParsed.forEach((p: any) => { p.options = {...p.options, fontFace: ENGLISH_FONT, fontSize: 16, color: TEXT_COLOR }});
                optionsArray.push(...engParsed);

                const hinParsed = parseMarkdownForPptx(`    ${hin_option}\n`);
                hinParsed.forEach((p: any) => { p.options = {...p.options, fontFace: HINDI_FONT, fontSize: 14, color: TEXT_COLOR }});
                optionsArray.push(...hinParsed);
            });
            q_slide.addText(optionsArray, { x: 0.6, y: optionsY, w: 9, h: 3.0, lineSpacing: 24 });

            // SLIDE 2 & 3: ANSWER & EXPLANATION
            const explanation = question_item.explanation || {};
            const slideParts = [
                { part: 1, title: `Answer & Explanation for Q.${slide_question_number} (Part 1)`, content: [ { text: `✅ Correct Answer: ${question_item.correct || 'N/A'}` }, explanation.analysis_correct, explanation.conclusion, ] },
                { part: 2, title: `Answer & Explanation for Q.${slide_question_number} (Part 2)`, content: [ explanation.analysis_incorrect, explanation.fact, ] }
            ];

            slideParts.forEach(partInfo => {
                const contentBlocks = partInfo.content.filter(Boolean);
                if (contentBlocks.length === 0) return;

                let aSlide = pptx.addSlide();
                aSlide.background = { color: ANSWER_SLIDE_BG };
                aSlide.addText(partInfo.title, { x: 0.5, y: 0.3, w: 9, h: 0.6, fontFace: ENGLISH_FONT, fontSize: 18, color: TEXT_COLOR, bold: true });

                let combinedExplanation: any[] = [];
                contentBlocks.forEach(block => {
                    if (typeof block === 'string') {
                        combinedExplanation.push(...parseMarkdownForPptx(block));
                        combinedExplanation.push({ text: '\n\n' });
                    } else if (typeof block === 'object' && block !== null && 'text' in block && typeof block.text === 'string' && block.text.includes('Correct Answer')) {
                        combinedExplanation.push({ text: block.text, options: { bold: true, color: CORRECT_ANSWER_COLOR } });
                        combinedExplanation.push({ text: '\n\n' });
                    }
                });

                if (combinedExplanation.length > 0) {
                    aSlide.addText(combinedExplanation, { x: 0.5, y: 1.1, w: 9, h: 4.2, fontFace: ENGLISH_FONT, fontSize: 14, color: TEXT_COLOR, lineSpacing: 22 });
                }
            });

            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        onProgress(100, 'Finalizing & Downloading...');

        let filenameParts: string[] = [];
        const { subject, examName } = filters;

        const subjects = [...subject].sort();
        const exams = [...examName].sort();

        const uniqueShifts = [...new Set(questions.map(q => q.sourceInfo?.examDateShift).filter(Boolean))];
        const shifts = uniqueShifts.sort();

        if (subjects.length > 0) filenameParts.push(subjects.join('_'));
        if (exams.length > 0) filenameParts.push(exams.join('_'));
        if (shifts.length > 0) filenameParts.push(shifts.join('_'));

        filenameParts.push(`${questions.length}Qs`);

        let filename = filenameParts.join('_');

        filename = filename.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_');
        if (!filename.trim() || filename.trim() === `${questions.length}Qs`) {
            filename = `Quiz_LM_${questions.length}Qs`;
        }

        await pptx.writeFile({ fileName: `${filename}.pptx` });

    } catch (error: any) {
        console.error("Error generating PPT:", error);
        throw new Error(`An unexpected error occurred while generating the presentation: ${error.message}`);
    }
}
