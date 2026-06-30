import type { jsPDF } from 'jspdf';
import { Question, InitialFilters } from '../../../quiz/types';

// Helper for PDF text cleaning
function cleanQuestionText(text: string | undefined): string {
    return (text || "").replace(/^(Q\.\d+\)|प्रश्न \d+\))\s*/, '');
}

export const generatePDF = async (
    questions: Question[],
    filters: InitialFilters,
    onProgress: (progress: number, details: string) => void
): Promise<void> => {
    if (!questions || questions.length === 0) return;

    try {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });

        const MARGIN = 40;
        const PAGE_WIDTH = doc.internal.pageSize.getWidth();
        const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
        const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
        let y = MARGIN;

        const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(150);
            doc.text('Compiler: Aalok Kumar Sharma', MARGIN, PAGE_HEIGHT - 20);
            doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 20, { align: 'right' });
        };

        // --- Title Page ---
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(26);
        const titleText = 'Quiz LM Question Bank';
        const titleLines = doc.splitTextToSize(titleText, CONTENT_WIDTH);
        doc.text(titleLines, PAGE_WIDTH / 2, y + 20, { align: 'center' });
        y += (titleLines.length * 26) + 30;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(16);
        doc.text(`Generated with ${questions.length} questions.`, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 30;

        const indianTimestamp = new Date().toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
        doc.setFontSize(11);
        doc.setTextColor(120);
        doc.text(`Created on: ${indianTimestamp} (IST)`, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 40;

        const linkText = 'Attempt the quiz';
        const linkUrl = 'https://cglhustle.free.nf/side_menu/quiz_lm/';
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'normal');
        const textWidth = doc.getTextWidth(linkText);
        const xOffset = (PAGE_WIDTH - textWidth) / 2;

        doc.setTextColor(0, 0, 238);
        doc.textWithLink(linkText, xOffset, y, { url: linkUrl });
        doc.setDrawColor(0, 0, 238);
        doc.line(xOffset, y + 1, xOffset + textWidth, y + 1);
        y += 40;

        doc.setTextColor(40);

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
                if (y > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(48, 63, 159);
                doc.text(category, MARGIN, y);
                y += 18;

                filtersInCategory.forEach(filterText => {
                    if (y > PAGE_HEIGHT - MARGIN) { doc.addPage(); y = MARGIN; }
                    doc.setFont('Helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(40);
                    const filterLines = doc.splitTextToSize(`• ${filterText}`, CONTENT_WIDTH - 20);
                    doc.text(filterLines, MARGIN + 20, y);
                    y += (filterLines.length * 10 * 1.2);
                });
                y += 10;
            }
        }

        if (!hasFilters) {
            doc.setFontSize(12);
            doc.setTextColor(120);
            doc.text('No filters applied.', MARGIN, y);
        }

        const answers: string[] = [];

        // --- Questions Loop ---
        doc.addPage();
        let pageNum = 2;
        y = MARGIN;

        for (let i = 0; i < questions.length; i++) {
            const question_item = questions[i];
            const questionNum = i + 1;

            const progress = Math.round((i / questions.length) * 50);
            onProgress(progress, `Processing question ${questionNum} of ${questions.length}...`);

            let letteredCorrect = '?';
            let correctTextToPush = 'Answer not found';

            const summary = question_item.explanation?.summary || "";
            const summaryMatch = summary.match(/Correct Answer: ([A-D])\)/);
            const correctOptIndexFromText = question_item.options.indexOf(question_item.correct);

            if (summaryMatch) {
                letteredCorrect = summaryMatch[1];
                const correctIndexFromLetter = letteredCorrect.charCodeAt(0) - 65;
                if (question_item.options[correctIndexFromLetter]) {
                    correctTextToPush = question_item.options[correctIndexFromLetter];
                } else {
                    correctTextToPush = "Text mismatch in data";
                }
            } else if (correctOptIndexFromText !== -1) {
                letteredCorrect = String.fromCharCode(65 + correctOptIndexFromText);
                correctTextToPush = question_item.correct;
            }

            answers.push(`${questionNum}. ${letteredCorrect}) ${correctTextToPush}`);

            const cleanQ = cleanQuestionText(question_item.question);
            const questionText = `Q.${questionNum}) ${cleanQ}`;

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(40);
            const questionLines = doc.splitTextToSize(questionText, CONTENT_WIDTH);
            const questionHeight = (questionLines.length * 12 * 1.2) + 10;

            let optionsHeight = 0;
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            question_item.options.forEach((opt, idx) => {
                const optionText = `(${String.fromCharCode(65 + idx)}) ${opt}`;
                const optionLines = doc.splitTextToSize(optionText, CONTENT_WIDTH - 20);
                optionsHeight += (optionLines.length * 10 * 1.2) + 5;
            });

            const totalQuestionBlockHeight = questionHeight + optionsHeight + 20;

            if (y + totalQuestionBlockHeight > PAGE_HEIGHT - MARGIN) {
                doc.addPage();
                pageNum++;
                y = MARGIN;
            }

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(questionLines, MARGIN, y);
            y += (questionLines.length * 12 * 1.2) + 10;

            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(10);
            question_item.options.forEach((opt, idx) => {
                const optionText = `(${String.fromCharCode(65 + idx)}) ${opt}`;
                const optionLines = doc.splitTextToSize(optionText, CONTENT_WIDTH - 20);
                doc.text(optionLines, MARGIN + 20, y);
                y += (optionLines.length * 10 * 1.2) + 5;
            });

            y += 15;
            doc.setDrawColor(220);
            doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
            y += 20;

            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // --- Answer Key Page ---
        onProgress(50, `Generating Answer Key...`);
        doc.addPage();
        pageNum++;
        y = MARGIN;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Answer Key', PAGE_WIDTH / 2, y, { align: 'center' });
        y += 40;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(10);

        const answerKeyGutter = 30;
        const answerKeyColWidth = (CONTENT_WIDTH - answerKeyGutter) / 2;
        const col1X = MARGIN;
        const col2X = MARGIN + answerKeyColWidth + answerKeyGutter;
        let currentY = y;
        const midPoint = Math.ceil(answers.length / 2);

        for (let i = 0; i < midPoint; i++) {
            const progress = 50 + Math.round((i / midPoint) * 50);
            onProgress(progress, 'Finalizing & Downloading...');

            const text1 = answers[i];
            const lines1 = doc.splitTextToSize(text1, answerKeyColWidth);
            const height1 = doc.getTextDimensions(lines1 as any).h;

            const text2 = (i + midPoint < answers.length) ? answers[i + midPoint] : null;
            let lines2: string[] = [];
            let height2 = 0;
            if (text2) {
                lines2 = doc.splitTextToSize(text2, answerKeyColWidth);
                height2 = doc.getTextDimensions(lines2 as any).h;
            }

            const blockHeight = Math.max(height1, height2);


            if (currentY + blockHeight > PAGE_HEIGHT - MARGIN - 20) {
                doc.addPage();
                pageNum++;
                currentY = MARGIN;
            }

            doc.text(lines1 as any, col1X, currentY);
            if (text2) {
                doc.text(lines2 as any, col2X, currentY);
            }

            currentY += blockHeight + 5;

            if (i % 20 === 0) {
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        }

        const totalPages = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addFooter(doc, i, totalPages);
        }

        onProgress(100, 'Please wait, this may take a moment.');

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

        await doc.save(`${filename}.pdf`);

    } catch (error: any) {
        console.error("Error generating PDF:", error);
        throw new Error(`An unexpected error occurred while generating the PDF: ${error.message}`);
    }
}
