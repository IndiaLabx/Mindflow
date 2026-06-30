
export interface PDFOptions {
    quizTitle: string;
    compilerName: string;
    includeAnswerKey: boolean;
    answerKeyLocation: 'end' | 'inline';
    fontMultiplier: number;
    pdfLanguage: 'bilingual' | 'english' | 'hindi';
}

export const generateBilingualPdf = async (
    questions: any[],
    options: PDFOptions,
    onProgress: (progress: number, message: string) => void
) => {
    onProgress(0, `🚀 Loading required libraries (jsPDF, html2canvas)...`);
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    onProgress(5, `🚀 Preparing your PDF with ${questions.length} questions...`);

    const subjectsSet = new Set<string>();
    const difficultiesSet = new Set<string>();
    const examNamesSet = new Set<string>();

    for (const q of questions) {
        const subject = q.subject ?? q.classification?.subject; if (subject) subjectsSet.add(subject);
        const difficulty = q.difficulty ?? q.properties?.difficulty; if (difficulty) difficultiesSet.add(difficulty);
        if (q.sourceInfo?.examName) examNamesSet.add(q.sourceInfo.examName);
    }

    const subjects = Array.from(subjectsSet);
    const difficulties = Array.from(difficultiesSet);
    const examNames = Array.from(examNamesSet);

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;
    let pageNum = 1;

    const hindiSnippet = document.getElementById('hindi-render-snippet');
    if (!hindiSnippet) throw new Error("Hindi rendering snippet element not found");

    const solidBlueBgRgb = [237, 247, 255];
    const solidBlueBgHex = '#EDF7FF';
    const solidGreenBgRgb = [217, 242, 217];
    const solidGreenBgHex = '#D9F2D9';

    const drawGradient = (startColor: number[], endColor: number[]) => {
        const steps = 100;
        const rectHeight = pageHeight / steps;
        for (let i = 0; i < steps; i++) {
            const r = startColor[0] + (endColor[0] - startColor[0]) * (i / steps);
            const g = startColor[1] + (endColor[1] - startColor[1]) * (i / steps);
            const b = startColor[2] + (endColor[2] - startColor[2]) * (i / steps);
            doc.setFillColor(r, g, b);
            doc.rect(0, i * rectHeight, pageWidth, rectHeight, 'F');
        }
    };

    const addPageBackground = (pageType: 'title' | 'question' | 'answer_key') => {
        if (pageType === 'question') {
            doc.setFillColor(solidBlueBgRgb[0], solidBlueBgRgb[1], solidBlueBgRgb[2]);
        } else if (pageType === 'answer_key') {
            doc.setFillColor(solidGreenBgRgb[0], solidGreenBgRgb[1], solidGreenBgRgb[2]);
        } else {
            drawGradient(solidGreenBgRgb, [255, 255, 255]);
            return;
        }
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    const addPageFrame = () => {
        const frameMargin = 25;
        doc.setLineWidth(1);
        doc.setDrawColor(180, 180, 180);
        doc.rect(frameMargin, frameMargin, pageWidth - (2 * frameMargin), pageHeight - (2 * frameMargin) - 15);
    };

    const addFooter = (currentPageNum: number) => {
        const footerY = pageHeight - 20;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(150);
        if (options.compilerName) {
            doc.text(options.compilerName, margin, footerY);
        }
        doc.text(`Page ${currentPageNum}`, pageWidth - margin, footerY, { align: 'right' });
        doc.setTextColor(0, 0, 255);
        doc.textWithLink('Attempt Quiz Online', pageWidth / 2, footerY, { url: 'https://cglhustle.free.nf/side_menu/quiz_lm/', align: 'center' });
    };

    const renderHindiAsImage = async (text: string, fontSize: number, customWidth: number, bgColorHex: string) => {
        if (!text) return { imgData: '', width: 0, height: 0 };

        hindiSnippet.style.width = `${customWidth}pt`;
        hindiSnippet.style.fontSize = `${fontSize}pt`;
        hindiSnippet.style.fontWeight = '700';
        hindiSnippet.innerHTML = text;
        hindiSnippet.style.backgroundColor = bgColorHex;

        // Small delay to allow DOM to render
        await new Promise(r => setTimeout(r, 10));

        try {
            const canvas = await html2canvas(hindiSnippet, { scale: 1.5, backgroundColor: bgColorHex });
            hindiSnippet.style.backgroundColor = 'white';
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            return {
                imgData,
                width: customWidth,
                height: customWidth * (canvas.height / canvas.width)
            };
        } catch (e) {
            console.error("Failed to render Hindi text to image", e);
            hindiSnippet.style.backgroundColor = 'white';
            return { imgData: '', width: 0, height: 0 };
        }
    };

    try {
        // --- Title Page ---
        addPageBackground('title');
        addPageFrame();

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(32 * options.fontMultiplier);
        doc.text(options.quizTitle, pageWidth / 2, pageHeight / 2 - (60 * options.fontMultiplier), { align: 'center' });

        let currentY = pageHeight / 2 - (20 * options.fontMultiplier);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(16 * options.fontMultiplier);
        doc.text(`A collection of ${questions.length} questions`, pageWidth / 2, currentY, { align: 'center' });

        currentY += (30 * options.fontMultiplier);
        if (subjects.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14 * options.fontMultiplier);
            const subjectLines = doc.splitTextToSize(`Subjects: ${subjects.join(', ')}`, contentWidth - 40);
            doc.text(subjectLines, pageWidth / 2, currentY, { align: 'center' });
            currentY += (subjectLines.length * (14 * options.fontMultiplier)) + (10 * options.fontMultiplier);
        }

        if (difficulties.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12 * options.fontMultiplier);
            const difficultyLines = doc.splitTextToSize(`Difficulty Levels: ${difficulties.join(', ')}`, contentWidth - 40);
            doc.text(difficultyLines, pageWidth / 2, currentY, { align: 'center' });
            currentY += (difficultyLines.length * (12 * options.fontMultiplier)) + (15 * options.fontMultiplier);
        }

        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });
        doc.setFontSize(10 * options.fontMultiplier);
        doc.setFont('helvetica', 'italic');
        doc.text(`Created on: ${timestamp} (IST)`, pageWidth / 2, currentY, { align: 'center' });

        addFooter(pageNum);

        // --- Question Pages ---
        doc.addPage();
        pageNum++;
        y = margin;
        addPageBackground('question');
        addPageFrame();
        addFooter(pageNum);

        for (let i = 0; i < questions.length; i++) {
            const item = questions[i];
            const questionNum = i + 1;
            const currentProgress = Math.round(((i + 1) / questions.length) * 100);

            onProgress(currentProgress, `Processing question ${questionNum} of ${questions.length}...`);
            await new Promise(resolve => setTimeout(resolve, 5)); // Allow UI to update

            const qFont = 12 * options.fontMultiplier;
            const optFont = 11 * options.fontMultiplier;
            const ansFont = 10 * options.fontMultiplier;

            let engQuestionLines: string[] = [];
            let engQuestionHeight = 0;
            let sourceInfoLines: string[] = [];
            let sourceInfoHeight = 0;
            let hinQuestionImg = { imgData: '', width: 0, height: 0 };
            let optionsHeight = 0;
            let optionEngLinesArray: string[][] = [];
            let optionImages: any[] = [];
            let inlineAnswerHeight = 0;
            let inlineAnswerLines: string[] = [];
            let inlineAnswerImg: any = null;

            // English Question
            if (options.pdfLanguage !== 'hindi') {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(qFont);
                engQuestionLines = doc.splitTextToSize(`Q.${questionNum}) ${item.question.replace(/^\d+[\)\.]\s*/, '').trim()}`, contentWidth);
                engQuestionHeight = engQuestionLines.length * qFont * 1.15;
            }

            // Source Info
            if (item.sourceInfo) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9 * options.fontMultiplier);
                sourceInfoLines = doc.splitTextToSize(`[Exam: ${item.sourceInfo.examName || ''}, ${item.sourceInfo.examYear || ''} | Shift: ${item.sourceInfo.examDateShift || ''}]`, contentWidth);
                sourceInfoHeight = sourceInfoLines.length * (9 * options.fontMultiplier) * 1.15 + 5;
            }

            // Hindi Question
            if (options.pdfLanguage !== 'english' && item.question_hi) {
                hinQuestionImg = await renderHindiAsImage(`Q.${questionNum}) (${item.question_hi})`, qFont, contentWidth, solidBlueBgHex);
            }

            // Options
            for (let j = 0; j < item.options.length; j++) {
                let engLines: string[] = [];
                let hinImg = { imgData: '', width: 0, height: 0 };
                let rowHeight = 0;

                if (options.pdfLanguage === 'bilingual') {
                    const colWidth = (contentWidth / 2) - 5;
                    hinImg = await renderHindiAsImage((item.options_hi && item.options_hi[j]) ? `(${item.options_hi[j]})` : '', optFont, colWidth, solidBlueBgHex);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(optFont);
                    engLines = doc.splitTextToSize(`${String.fromCharCode(65 + j)}) ${item.options[j]}`, colWidth - 15);
                    rowHeight = Math.max((engLines.length * optFont * 1.15), hinImg.height);
                } else if (options.pdfLanguage === 'english') {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(optFont);
                    engLines = doc.splitTextToSize(`${String.fromCharCode(65 + j)}) ${item.options[j]}`, contentWidth - 15);
                    rowHeight = engLines.length * optFont * 1.15;
                } else {
                    hinImg = await renderHindiAsImage(`${String.fromCharCode(65 + j)}) (${(item.options_hi && item.options_hi[j]) ? item.options_hi[j] : item.options[j]})`, optFont, contentWidth - 15, solidBlueBgHex);
                    rowHeight = hinImg.height;
                }

                optionEngLinesArray.push(engLines);
                optionImages.push(hinImg);
                optionsHeight += rowHeight + (8 * options.fontMultiplier);
            }

            // Inline Answer Key
            if (options.includeAnswerKey && options.answerKeyLocation === 'inline') {
                if (options.pdfLanguage === 'hindi') {
                    const correctIndex = item.options.indexOf(item.correct);
                    const answerText = (correctIndex !== -1 && item.options_hi && item.options_hi[correctIndex]) ? item.options_hi[correctIndex] : item.correct;
                    const text = `सही उत्तर: (${answerText})`;
                    inlineAnswerImg = await renderHindiAsImage(text, ansFont, contentWidth, solidBlueBgHex);
                    inlineAnswerHeight = inlineAnswerImg.height + (10 * options.fontMultiplier);
                } else {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(ansFont);
                    inlineAnswerLines = doc.splitTextToSize(`Correct Answer: ${item.correct}`, contentWidth);
                    inlineAnswerHeight = inlineAnswerLines.length * ansFont * 1.15 + (10 * options.fontMultiplier);
                }
            }

            const separatorHeight = 15 * options.fontMultiplier;
            const totalBlockHeight = engQuestionHeight + sourceInfoHeight + hinQuestionImg.height + (hinQuestionImg.height > 0 ? 15 : 0) + optionsHeight + inlineAnswerHeight + separatorHeight;

            // Page Break Check
            if (y + totalBlockHeight > pageHeight - (margin * 2)) {
                doc.addPage();
                pageNum++;
                addPageBackground('question');
                addPageFrame();
                addFooter(pageNum);
                y = margin;
            }

            // Draw Question Text
            doc.setTextColor(0, 0, 0);
            if (engQuestionHeight > 0) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(qFont);
                doc.text(engQuestionLines, margin, y);
                y += engQuestionHeight + 5;
            }
            if (sourceInfoHeight > 0) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9 * options.fontMultiplier);
                doc.setTextColor(100);
                doc.text(sourceInfoLines, margin, y);
                y += sourceInfoHeight;
            }
            if (hinQuestionImg.height > 0) {
                doc.addImage(hinQuestionImg.imgData, 'JPEG', margin, y, hinQuestionImg.width, hinQuestionImg.height);
                y += hinQuestionImg.height + 15;
            }

            // Draw Options
            for (let j = 0; j < item.options.length; j++) {
                doc.setTextColor(0, 0, 0);
                const engOptLines = optionEngLinesArray[j];
                const hinOptImg = optionImages[j];
                const rowHeight = Math.max((engOptLines.length * optFont * 1.15), hinOptImg.height);

                if (options.pdfLanguage === 'bilingual') {
                    const colWidth = (contentWidth / 2) - 5;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(optFont);
                    if (engOptLines.length > 0) {
                         doc.text(engOptLines, margin + 15, y + ((rowHeight - (engOptLines.length * optFont * 1.15)) / 2) + (optFont * 0.75));
                    }
                    if (hinOptImg.height > 0) {
                        doc.addImage(hinOptImg.imgData, 'JPEG', margin + colWidth + 10, y + ((rowHeight - hinOptImg.height) / 2), hinOptImg.width, hinOptImg.height);
                    }
                } else if (options.pdfLanguage === 'english') {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(optFont);
                    doc.text(engOptLines, margin + 15, y + (optFont * 0.75));
                } else {
                    if (hinOptImg.height > 0) {
                         doc.addImage(hinOptImg.imgData, 'JPEG', margin + 15, y, hinOptImg.width, hinOptImg.height);
                    }
                }
                y += rowHeight + (8 * options.fontMultiplier);
            }

            // Draw Inline Answer Key
            if (inlineAnswerHeight > 0) {
                y += 5;
                if (inlineAnswerImg) {
                    doc.addImage(inlineAnswerImg.imgData, 'JPEG', margin, y, inlineAnswerImg.width, inlineAnswerImg.height);
                } else {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(ansFont);
                    doc.setTextColor(0, 150, 0);
                    doc.text(inlineAnswerLines, margin, y);
                }
                y += inlineAnswerHeight - 10;
            }

            // Separator
            y += 10;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, y, pageWidth - margin, y);
            y += separatorHeight - 5;
        }

        // --- End Answer Key ---
        if (options.includeAnswerKey && options.answerKeyLocation === 'end') {
            doc.addPage();
            pageNum++;
            addPageBackground('answer_key');
            addPageFrame();
            addFooter(pageNum);
            y = margin;

            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20 * options.fontMultiplier);
            doc.text('Answer Key', pageWidth / 2, y, { align: 'center' });
            y += (30 * options.fontMultiplier);

            const ansKeyFont = 12 * options.fontMultiplier;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(ansKeyFont);

            const answerLineHeight = 18 * options.fontMultiplier;
            let col1Y = y;
            let col2Y = y;
            const colWidth = (contentWidth - 20) / 2;
            const col2X = margin + colWidth + 20;
            const pageBottom = pageHeight - (margin + 15);

            for (let i = 0; i < questions.length; i++) {
                const correctIndex = questions[i].options.indexOf(questions[i].correct);
                let text = `${i + 1}. ${String.fromCharCode(65 + correctIndex)}) ${questions[i].correct}`;
                let blockHeight = 0;
                let lines: string[] = [];
                let img: any = null;

                if (options.pdfLanguage === 'hindi' && correctIndex !== -1) {
                    const hindiAnswer = (questions[i].options_hi && questions[i].options_hi[correctIndex]) ? questions[i].options_hi[correctIndex] : questions[i].correct;
                    text = `${i + 1}. ${String.fromCharCode(65 + correctIndex)}) (${hindiAnswer})`;
                    img = await renderHindiAsImage(text, ansKeyFont, colWidth, solidGreenBgHex);
                    blockHeight = img.height + 4;
                } else {
                    lines = doc.splitTextToSize(text, colWidth);
                    blockHeight = lines.length * answerLineHeight;
                }

                const placeItem = (colX: number, colY: number) => {
                    if (img) {
                        doc.addImage(img.imgData, 'JPEG', colX, colY, img.width, img.height);
                    } else {
                        doc.text(lines, colX, colY);
                    }
                };

                if (col1Y + blockHeight <= pageBottom) {
                    placeItem(margin, col1Y);
                    col1Y += blockHeight;
                } else if (col2Y + blockHeight <= pageBottom) {
                    placeItem(col2X, col2Y);
                    col2Y += blockHeight;
                } else {
                    // New Page for Answer Key
                    doc.addPage();
                    pageNum++;
                    addPageBackground('answer_key');
                    addPageFrame();
                    addFooter(pageNum);
                    y = margin;

                    doc.setTextColor(0, 0, 0);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(ansKeyFont);
                    doc.text('Answer Key (continued)', pageWidth / 2, y, { align: 'center' });
                    y += (30 * options.fontMultiplier);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(ansKeyFont);
                    col1Y = y;
                    col2Y = y;
                    placeItem(margin, col1Y);
                    col1Y += blockHeight;
                }
            }
        }

        const filenameParts = [];
        if (subjects.length > 0) filenameParts.push(subjects.join('_'));
        if (examNames.length > 0) filenameParts.push(examNames.map(name => name.replace(/\s+/g, '-')).join('_'));
        if (questions.length > 0) filenameParts.push(`${questions.length}Q`);

        let finalFilename = (filenameParts.length > 0) ? `${filenameParts.join('_')}.pdf` : 'Bilingual-Quiz.pdf';
        finalFilename = finalFilename.replace(/[\/\\?%*:|"<>]/g, '_');

        doc.save(finalFilename);

        onProgress(100, "🎉 Flawless PDF Generated! Check your downloads.");
        return true;
    } catch (e: any) {
        console.error("PDF Generation Error", e);
        throw e;
    } finally {
        if (hindiSnippet) hindiSnippet.innerHTML = '';
    }
};
