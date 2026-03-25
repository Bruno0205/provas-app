import PDFDocument from 'pdfkit';
import JSZip from 'jszip';
import { Alternative, AlternativeLabelType, Exam, Question } from '../models';
import { examsRepository, repository } from '../repository';

export type ExamWithQuestions = Exam & { questions: Question[] };

type GeneratedQuestion = {
  id: string;
  text: string;
  alternatives: Alternative[];
  answerKey: string;
};

type GeneratedExamVersion = {
  examNumber: number;
  questions: GeneratedQuestion[];
};

function toUniqueQuestionIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function validateLabelType(value: unknown): value is AlternativeLabelType {
  return value === 'LETTERS' || value === 'POWERS_OF_TWO';
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function getLabels(labelType: AlternativeLabelType, count: number): string[] {
  if (labelType === 'LETTERS') {
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  }
  return Array.from({ length: count }, (_, i) => String(2 ** i));
}

function calculateAnswerKey(alternatives: Alternative[], labelType: AlternativeLabelType): string {
  if (labelType === 'LETTERS') {
    const labels = getLabels(labelType, alternatives.length);
    return alternatives
      .map((alt, index) => (alt.correct ? labels[index] : ''))
      .filter(Boolean)
      .join('');
  }

  let sum = 0;
  alternatives.forEach((alt, index) => {
    if (alt.correct) {
      sum += 2 ** index;
    }
  });
  return String(sum);
}

function resolveQuestions(questionIds: string[]): Question[] {
  return questionIds
    .map((id) => repository.getById(id))
    .filter((question): question is Question => Boolean(question));
}

function ensureQuestionsValidity(questions: Question[]): string | null {
  if (questions.length === 0) {
    return 'Exam must contain at least one question';
  }

  const invalidQuestion = questions.find(
    (question) => !question.alternatives.some((alternative) => alternative.correct)
  );

  if (invalidQuestion) {
    return 'All selected questions must have at least one correct alternative';
  }

  return null;
}

function buildExamVersions(exam: ExamWithQuestions, numberOfExams: number): GeneratedExamVersion[] {
  const versions: GeneratedExamVersion[] = [];

  for (let examNumber = 1; examNumber <= numberOfExams; examNumber += 1) {
    const shuffledQuestions = shuffle(exam.questions);

    const generatedQuestions: GeneratedQuestion[] = shuffledQuestions.map((question) => {
      const shuffledAlternatives = shuffle(question.alternatives);
      return {
        id: question.id,
        text: question.text,
        alternatives: shuffledAlternatives,
        answerKey: calculateAnswerKey(shuffledAlternatives, exam.alternativeLabelType)
      };
    });

    versions.push({
      examNumber,
      questions: generatedQuestions
    });
  }

  return versions;
}

function buildAnswerKeyCsv(
  versions: GeneratedExamVersion[],
  labelType: AlternativeLabelType
): string {
  const maxQuestions = versions.reduce((max, version) => Math.max(max, version.questions.length), 0);
  const questionHeaders = Array.from({ length: maxQuestions }, (_, index) => `q${index + 1}`);
  const header = ['examNumber', 'labelType', ...questionHeaders];

  const rows = versions.map((version) => {
    const questionAnswers = version.questions.map((question) => question.answerKey);
    return [String(version.examNumber), labelType, ...questionAnswers];
  });

  const csvRows = [header, ...rows].map((columns) => columns.join(','));
  return `${csvRows.join('\n')}\n`;
}

function writeFooter(doc: PDFKit.PDFDocument, examNumber: number) {
  const footerText = `Exam #${examNumber}`;
  const y = doc.page.height - doc.page.margins.bottom + 12;
  doc.fontSize(10).fillColor('#444').text(footerText, doc.page.margins.left, y, {
    align: 'center',
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right
  });
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number, examNumber: number) {
  const limit = doc.page.height - doc.page.margins.bottom - 30;
  if (doc.y + neededHeight > limit) {
    doc.addPage();
    writeFooter(doc, examNumber);
  }
}

async function buildPdf(exam: ExamWithQuestions, versions: GeneratedExamVersion[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    versions.forEach((version, index) => {
      if (index > 0) {
        doc.addPage();
      }

      writeFooter(doc, version.examNumber);

      doc.fontSize(18).fillColor('#111').text(exam.title, { align: 'left' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#222');
      doc.text(`Subject: ${exam.subject}`);
      doc.text(`Teacher: ${exam.teacher}`);
      doc.text(`Date: ${exam.date}`);
      doc.text(`Exam #${version.examNumber}`);
      if (exam.instructions) {
        doc.moveDown(0.4);
        doc.fontSize(11).fillColor('#333').text(`Instructions: ${exam.instructions}`);
      }

      doc.moveDown(0.8);

      version.questions.forEach((question, questionIndex) => {
        ensureSpace(doc, 80, version.examNumber);

        doc.fontSize(12).fillColor('#111').text(`${questionIndex + 1}. ${question.text}`);
        doc.moveDown(0.35);

        const labels = getLabels(exam.alternativeLabelType, question.alternatives.length);
        question.alternatives.forEach((alternative, alternativeIndex) => {
          ensureSpace(doc, 24, version.examNumber);
          const label = labels[alternativeIndex];
          doc.fontSize(11).fillColor('#222').text(`${label}) ${alternative.text}`, {
            indent: 18
          });
        });

        ensureSpace(doc, 28, version.examNumber);
        const answerField =
          exam.alternativeLabelType === 'LETTERS'
            ? 'Answer: __________________'
            : 'Sum: __________________';
        doc.moveDown(0.2);
        doc.fontSize(11).fillColor('#111').text(answerField);
        doc.moveDown(0.7);
      });

      ensureSpace(doc, 80, version.examNumber);
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor('#111').text('Student Name: _____________________________________');
      doc.moveDown(0.5);
      doc.text('CPF: ______________________________________________');
    });

    doc.end();
  });
}

function sanitizeFilePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'exam';
}

export const examsService = {
  list(): Exam[] {
    return examsRepository.getAll();
  },

  get(id: string): ExamWithQuestions | undefined {
    const exam = examsRepository.getById(id);
    if (!exam) return undefined;

    const questions = resolveQuestions(exam.questionIds);
    return { ...exam, questions };
  },

  create(payload: Partial<Exam>): { exam?: Exam; error?: string } {
    if (
      !payload ||
      typeof payload.title !== 'string' ||
      typeof payload.subject !== 'string' ||
      typeof payload.teacher !== 'string' ||
      typeof payload.date !== 'string' ||
      !validateLabelType(payload.alternativeLabelType) ||
      !Array.isArray(payload.questionIds)
    ) {
      return { error: 'Invalid payload' };
    }

    const questionIds = toUniqueQuestionIds(payload.questionIds);
    const questions = resolveQuestions(questionIds);
    const validationError = ensureQuestionsValidity(questions);
    if (validationError) return { error: validationError };

    const exam: Exam = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 9),
      title: payload.title.trim(),
      subject: payload.subject.trim(),
      teacher: payload.teacher.trim(),
      date: payload.date.trim(),
      instructions: typeof payload.instructions === 'string' ? payload.instructions.trim() : undefined,
      alternativeLabelType: payload.alternativeLabelType,
      questionIds
    };

    return { exam: examsRepository.create(exam) };
  },

  update(id: string, payload: Partial<Exam>): { exam?: Exam; error?: string } {
    const current = examsRepository.getById(id);
    if (!current) return { error: 'Not found' };

    if (
      typeof payload.title !== 'string' ||
      typeof payload.subject !== 'string' ||
      typeof payload.teacher !== 'string' ||
      typeof payload.date !== 'string' ||
      !validateLabelType(payload.alternativeLabelType) ||
      !Array.isArray(payload.questionIds)
    ) {
      return { error: 'Invalid payload' };
    }

    const questionIds = toUniqueQuestionIds(payload.questionIds);
    const questions = resolveQuestions(questionIds);
    const validationError = ensureQuestionsValidity(questions);
    if (validationError) return { error: validationError };

    const updated = examsRepository.update(id, {
      title: payload.title.trim(),
      subject: payload.subject.trim(),
      teacher: payload.teacher.trim(),
      date: payload.date.trim(),
      instructions: typeof payload.instructions === 'string' ? payload.instructions.trim() : undefined,
      alternativeLabelType: payload.alternativeLabelType,
      questionIds
    });

    if (!updated) return { error: 'Not found' };

    return { exam: updated };
  },

  remove(id: string): boolean {
    return examsRepository.remove(id);
  },

  async generate(id: string, numberOfExams: number): Promise<{
    fileName?: string;
    zipBuffer?: Buffer;
    error?: string;
  }> {
    if (!Number.isInteger(numberOfExams) || numberOfExams < 1) {
      return { error: 'Number of exams must be at least 1' };
    }

    const exam = this.get(id);
    if (!exam) return { error: 'Not found' };

    const validationError = ensureQuestionsValidity(exam.questions);
    if (validationError) return { error: validationError };

    const versions = buildExamVersions(exam, numberOfExams);
    const pdfBuffer = await buildPdf(exam, versions);
    const csv = buildAnswerKeyCsv(versions, exam.alternativeLabelType);

    const zip = new JSZip();
    zip.file('exams.pdf', pdfBuffer);
    zip.file('answer-key.csv', csv);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const fileName = `${sanitizeFilePart(exam.title)}-generated.zip`;

    return { fileName, zipBuffer };
  }
};
