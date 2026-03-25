import { parse } from 'csv-parse/sync';
import { AlternativeLabelType, GradingMode } from '../models';

/*
Simple CSV formats supported by this service:
- Answer key CSV: examNumber,labelType,q1,q2,q3,...
  Example row: 1001,LETTERS,AC,B,D
- Student responses CSV: studentName,cpf,studentId,examNumber,q1,q2,q3,...
  cpf and studentId are optional, but studentName and examNumber are required.

Grading modes are UI-selected (STRICT or LENIENT) and are not read from CSV.
*/

type ParsedCsvRow = Record<string, string>;

type AnswerKeyRow = {
  examNumber: string;
  labelType: AlternativeLabelType;
  answersByQuestion: Record<string, string>;
};

type StudentRow = {
  rowNumber: number;
  studentName: string;
  cpf: string;
  studentId: string;
  examNumber: string;
  answersByQuestion: Record<string, string>;
};

export type CorrectionError = {
  rowNumber?: number;
  studentName?: string;
  examNumber?: string;
  message: string;
};

export type PerQuestionCorrection = {
  questionKey: string;
  expectedAnswer: string;
  studentAnswer: string;
  score: number;
  maxScore: number;
};

export type StudentCorrectionResult = {
  rowNumber: number;
  studentName: string;
  cpf?: string;
  studentId?: string;
  examNumber: string;
  gradingMode: GradingMode;
  perQuestion: PerQuestionCorrection[];
  totalScore: number;
  totalPossibleScore: number;
  finalPercentage: number;
  hasErrors: boolean;
};

export type CorrectionSummary = {
  processedRows: number;
  validSubmissions: number;
  invalidSubmissions: number;
  gradedSubmissions: number;
};

export type CorrectionProcessResult = {
  summary: CorrectionSummary;
  results: StudentCorrectionResult[];
  errors: CorrectionError[];
  reportCsv: string;
  questionKeys: string[];
};

type SelectionParseResult = {
  selected: boolean[];
  normalizedAnswer: string;
  error?: string;
};

function parseCsvRows(csvText: string): { rows: ParsedCsvRow[]; error?: string } {
  try {
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as ParsedCsvRow[];

    const normalized = records.map((record) => {
      const next: ParsedCsvRow = {};
      Object.entries(record).forEach(([key, value]) => {
        next[key.trim()] = String(value ?? '').trim();
      });
      return next;
    });

    return { rows: normalized };
  } catch (err) {
    return { rows: [], error: 'Invalid CSV format' };
  }
}

function sortQuestionColumns(headers: string[]): string[] {
  return headers
    .map((header) => {
      const match = /^q(\d+)$/i.exec(header);
      if (!match) return null;
      return { header, index: Number(match[1]) };
    })
    .filter((entry): entry is { header: string; index: number } => Boolean(entry))
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.header);
}

function normalizeLetters(answer: string): { normalized: string; error?: string } {
  const cleaned = answer.toUpperCase().replace(/[\s,;]+/g, '');
  if (!cleaned) return { normalized: '' };
  if (!/^[A-Z]+$/.test(cleaned)) {
    return { normalized: '', error: 'Invalid letters answer format' };
  }
  const sortedUnique = Array.from(new Set(cleaned.split(''))).sort().join('');
  return { normalized: sortedUnique };
}

function highestLetterIndex(normalized: string): number {
  if (!normalized) return 0;
  let max = 0;
  normalized.split('').forEach((char) => {
    const value = char.charCodeAt(0) - 64;
    if (value > max) max = value;
  });
  return max;
}

function parseLettersSelection(answer: string, universeSize: number): SelectionParseResult {
  const normalized = normalizeLetters(answer);
  const selected = Array.from({ length: universeSize }, () => false);

  if (normalized.error) {
    return { selected, normalizedAnswer: '', error: normalized.error };
  }

  normalized.normalized.split('').forEach((char) => {
    const index = char.charCodeAt(0) - 65;
    if (index >= 0 && index < universeSize) {
      selected[index] = true;
    }
  });

  return { selected, normalizedAnswer: normalized.normalized };
}

function parsePowerNumber(answer: string): { value?: bigint; error?: string } {
  const trimmed = answer.trim();
  if (!trimmed) return { value: 0n };
  if (!/^\d+$/.test(trimmed)) {
    return { error: 'Invalid numeric answer format' };
  }
  return { value: BigInt(trimmed) };
}

function bitLength(value: bigint): number {
  if (value <= 0n) return 1;
  let count = 0;
  let current = value;
  while (current > 0n) {
    count += 1;
    current >>= 1n;
  }
  return Math.max(1, count);
}

function parsePowerSelection(answer: string, universeSize: number): SelectionParseResult {
  const parsed = parsePowerNumber(answer);
  const selected = Array.from({ length: universeSize }, () => false);

  if (parsed.error || parsed.value === undefined) {
    return { selected, normalizedAnswer: '', error: parsed.error || 'Invalid numeric answer format' };
  }

  for (let index = 0; index < universeSize; index += 1) {
    const bit = 1n << BigInt(index);
    selected[index] = (parsed.value & bit) !== 0n;
  }

  return { selected, normalizedAnswer: parsed.value.toString() };
}

function inferLabelTypeFromAnswers(answers: string[]): AlternativeLabelType | null {
  const hasAnswers = answers.some((answer) => answer.trim().length > 0);
  if (!hasAnswers) return null;

  const allLetters = answers.every((answer) => !normalizeLetters(answer).error);
  if (allLetters) return 'LETTERS';

  const allNumbers = answers.every((answer) => !parsePowerNumber(answer).error);
  if (allNumbers) return 'POWERS_OF_TWO';

  return null;
}

function resolveUniverseSize(
  labelType: AlternativeLabelType,
  expectedAnswer: string,
  studentAnswer: string
): { size: number; error?: string } {
  if (labelType === 'LETTERS') {
    const expected = normalizeLetters(expectedAnswer);
    const student = normalizeLetters(studentAnswer);

    if (expected.error) return { size: 1, error: `Invalid official answer format: ${expected.error}` };
    if (student.error) return { size: 1, error: student.error };

    const size = Math.max(1, highestLetterIndex(expected.normalized), highestLetterIndex(student.normalized));
    return { size };
  }

  const expected = parsePowerNumber(expectedAnswer);
  const student = parsePowerNumber(studentAnswer);

  if (expected.error) return { size: 1, error: `Invalid official answer format: ${expected.error}` };
  if (student.error) return { size: 1, error: student.error };

  const size = Math.max(1, bitLength(expected.value || 0n), bitLength(student.value || 0n));
  return { size };
}

function parseSelection(
  labelType: AlternativeLabelType,
  answer: string,
  universeSize: number
): SelectionParseResult {
  if (labelType === 'LETTERS') {
    return parseLettersSelection(answer, universeSize);
  }
  return parsePowerSelection(answer, universeSize);
}

function countMatchingPositions(expected: boolean[], actual: boolean[]): number {
  let correct = 0;
  for (let index = 0; index < expected.length; index += 1) {
    if (expected[index] === actual[index]) {
      correct += 1;
    }
  }
  return correct;
}

function escapeCsv(value: string | number): string {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildReportCsv(results: StudentCorrectionResult[], questionKeys: string[]): string {
  const header = [
    'studentName',
    'cpf',
    'studentId',
    'examNumber',
    'gradingMode',
    'totalScore',
    'totalPossibleScore',
    'finalPercentage',
    ...questionKeys.map((key) => `${key}Score`)
  ];

  const rows = results.map((result) => {
    const questionScores = questionKeys.map((questionKey) => {
      const question = result.perQuestion.find((item) => item.questionKey === questionKey);
      return question ? Number(question.score.toFixed(4)) : '';
    });

    return [
      result.studentName,
      result.cpf || '',
      result.studentId || '',
      result.examNumber,
      result.gradingMode,
      Number(result.totalScore.toFixed(4)),
      Number(result.totalPossibleScore.toFixed(4)),
      Number(result.finalPercentage.toFixed(2)),
      ...questionScores
    ];
  });

  const csvRows = [header, ...rows].map((row) => row.map((column) => escapeCsv(column)).join(','));
  return `${csvRows.join('\n')}\n`;
}

function parseAnswerKey(
  answerKeyRows: ParsedCsvRow[],
  errors: CorrectionError[]
): { keyMap: Map<string, AnswerKeyRow>; questionKeys: string[] } {
  if (answerKeyRows.length === 0) {
    errors.push({ message: 'Answer key CSV has no data rows' });
    return { keyMap: new Map(), questionKeys: [] };
  }

  const headers = Object.keys(answerKeyRows[0]);
  const questionKeys = sortQuestionColumns(headers);

  if (!headers.includes('examNumber')) {
    errors.push({ message: 'Answer key CSV must contain examNumber column' });
  }
  if (!headers.includes('labelType') && !headers.includes('alternativeLabelType')) {
    errors.push({ message: 'Answer key CSV must contain labelType column' });
  }
  if (questionKeys.length === 0) {
    errors.push({ message: 'Answer key CSV must contain question columns like q1, q2, q3' });
  }

  const keyMap = new Map<string, AnswerKeyRow>();

  answerKeyRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const examNumber = String(row.examNumber || '').trim();
    if (!examNumber) {
      errors.push({ rowNumber, message: 'Answer key row is missing examNumber' });
      return;
    }

    const answersByQuestion: Record<string, string> = {};
    questionKeys.forEach((questionKey) => {
      answersByQuestion[questionKey] = String(row[questionKey] || '').trim();
    });

    const rawLabelType = String(row.labelType || row.alternativeLabelType || '').trim().toUpperCase();
    let labelType: AlternativeLabelType | null = null;

    if (rawLabelType === 'LETTERS' || rawLabelType === 'POWERS_OF_TWO') {
      labelType = rawLabelType;
    } else {
      labelType = inferLabelTypeFromAnswers(Object.values(answersByQuestion));
    }

    if (!labelType) {
      errors.push({ rowNumber, examNumber, message: 'Invalid labelType in answer key row' });
      return;
    }

    const invalidQuestion = questionKeys.find((questionKey) => {
      const universe = resolveUniverseSize(labelType as AlternativeLabelType, answersByQuestion[questionKey], '');
      return Boolean(universe.error);
    });

    if (invalidQuestion) {
      errors.push({
        rowNumber,
        examNumber,
        message: `${invalidQuestion}: invalid official answer value for ${labelType}`
      });
      return;
    }

    keyMap.set(examNumber, {
      examNumber,
      labelType,
      answersByQuestion
    });
  });

  return { keyMap, questionKeys };
}

function parseStudentRows(
  rows: ParsedCsvRow[],
  questionKeys: string[],
  errors: CorrectionError[]
): StudentRow[] {
  if (rows.length === 0) {
    errors.push({ message: 'Student responses CSV has no data rows' });
    return [];
  }

  const headers = Object.keys(rows[0]);
  if (!headers.includes('studentName')) {
    errors.push({ message: 'Student responses CSV must contain studentName column' });
  }
  if (!headers.includes('examNumber')) {
    errors.push({ message: 'Student responses CSV must contain examNumber column' });
  }

  const missingQuestionColumns = questionKeys.filter((questionKey) => !headers.includes(questionKey));
  if (missingQuestionColumns.length > 0) {
    errors.push({
      message: `Student responses CSV is missing question columns: ${missingQuestionColumns.join(', ')}`
    });
  }

  const students: StudentRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const studentName = String(row.studentName || '').trim();
    const examNumber = String(row.examNumber || '').trim();

    if (!studentName) {
      errors.push({ rowNumber, examNumber, message: 'studentName is required' });
      return;
    }
    if (!examNumber) {
      errors.push({ rowNumber, studentName, message: 'examNumber is required' });
      return;
    }

    const answersByQuestion: Record<string, string> = {};
    questionKeys.forEach((questionKey) => {
      answersByQuestion[questionKey] = String(row[questionKey] || '').trim();
    });

    students.push({
      rowNumber,
      studentName,
      cpf: String(row.cpf || '').trim(),
      studentId: String(row.studentId || '').trim(),
      examNumber,
      answersByQuestion
    });
  });

  return students;
}

function roundScore(value: number): number {
  return Number(value.toFixed(4));
}

export const correctionsService = {
  process(
    answerKeyCsv: string,
    responsesCsv: string,
    gradingMode: GradingMode
  ): { result?: CorrectionProcessResult; error?: string } {
    if (gradingMode !== 'STRICT' && gradingMode !== 'LENIENT') {
      return { error: 'Invalid grading mode' };
    }

    const errors: CorrectionError[] = [];

    const answerParse = parseCsvRows(answerKeyCsv);
    if (answerParse.error) {
      return { error: answerParse.error };
    }

    const responseParse = parseCsvRows(responsesCsv);
    if (responseParse.error) {
      return { error: responseParse.error };
    }

    const { keyMap, questionKeys } = parseAnswerKey(answerParse.rows, errors);
    const studentRows = parseStudentRows(responseParse.rows, questionKeys, errors);

    if (questionKeys.length === 0) {
      return { error: 'Could not identify question columns in answer key CSV' };
    }

    const results: StudentCorrectionResult[] = [];

    studentRows.forEach((student) => {
      const rowErrorsBefore = errors.length;
      const keyRow = keyMap.get(student.examNumber);

      if (!keyRow) {
        errors.push({
          rowNumber: student.rowNumber,
          studentName: student.studentName,
          examNumber: student.examNumber,
          message: 'examNumber does not exist in answer key CSV'
        });
        return;
      }

      const perQuestion: PerQuestionCorrection[] = [];
      let totalScore = 0;
      const totalPossibleScore = questionKeys.length;

      questionKeys.forEach((questionKey) => {
        const expectedAnswer = keyRow.answersByQuestion[questionKey] || '';
        const studentAnswerRaw = student.answersByQuestion[questionKey] || '';

        const universe = resolveUniverseSize(keyRow.labelType, expectedAnswer, studentAnswerRaw);
        const expectedSelection = parseSelection(keyRow.labelType, expectedAnswer, universe.size);
        const studentSelection = parseSelection(keyRow.labelType, studentAnswerRaw, universe.size);

        if (universe.error) {
          errors.push({
            rowNumber: student.rowNumber,
            studentName: student.studentName,
            examNumber: student.examNumber,
            message: `${questionKey}: ${universe.error}`
          });
        }

        if (studentSelection.error) {
          errors.push({
            rowNumber: student.rowNumber,
            studentName: student.studentName,
            examNumber: student.examNumber,
            message: `${questionKey}: ${studentSelection.error}`
          });
        }

        let score = 0;

        if (!universe.error && !expectedSelection.error) {
          if (gradingMode === 'STRICT') {
            const exact = expectedSelection.selected.every(
              (value, index) => value === studentSelection.selected[index]
            );
            score = exact && !studentSelection.error ? 1 : 0;
          } else {
            const correctPositions = countMatchingPositions(
              expectedSelection.selected,
              studentSelection.selected
            );
            score = studentSelection.error
              ? 0
              : correctPositions / Math.max(1, expectedSelection.selected.length);
          }
        }

        totalScore += score;

        perQuestion.push({
          questionKey,
          expectedAnswer: expectedSelection.normalizedAnswer,
          studentAnswer: studentAnswerRaw,
          score: roundScore(score),
          maxScore: 1
        });
      });

      const finalPercentage = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;
      const hasErrors = errors.length > rowErrorsBefore;

      results.push({
        rowNumber: student.rowNumber,
        studentName: student.studentName,
        cpf: student.cpf || undefined,
        studentId: student.studentId || undefined,
        examNumber: student.examNumber,
        gradingMode,
        perQuestion,
        totalScore: roundScore(totalScore),
        totalPossibleScore,
        finalPercentage: Number(finalPercentage.toFixed(2)),
        hasErrors
      });
    });

    const validSubmissions = results.filter((result) => !result.hasErrors).length;
    const summary: CorrectionSummary = {
      processedRows: studentRows.length,
      validSubmissions,
      invalidSubmissions: studentRows.length - validSubmissions,
      gradedSubmissions: results.length
    };

    const reportCsv = buildReportCsv(results, questionKeys);

    return {
      result: {
        summary,
        results,
        errors,
        reportCsv,
        questionKeys
      }
    };
  }
};
