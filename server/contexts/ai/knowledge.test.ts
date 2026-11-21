// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { fallbackFor, generateQuizForKnowledge, KNOWLEDGE_QUIZ_BANK } from './knowledge';

describe('fallbackFor (local knowledge base)', () => {
  it('answers Tsiolkovsky formula for rocket questions', () => {
    const reply = fallbackFor('Расскажи про формулу Циолковского', 'professor');
    expect(reply).toContain('Циолковского');
  });

  it('answers Kepler laws for orbit questions', () => {
    const reply = fallbackFor('Что такое законы Кеплера?', 'professor');
    expect(reply).toContain('Кеплера');
  });

  it('answers CubeSat standard questions', () => {
    const reply = fallbackFor('Какие размеры у кубсата 3U?', 'engineer');
    expect(reply).toContain('3U');
  });

  it('answers championship rules questions', () => {
    const reply = fallbackFor('Какие требования к слайдам?', 'registrar');
    expect(reply).toContain('слайд');
  });

  it('returns a generic greeting for unknown questions', () => {
    const reply = fallbackFor('как прошел день?', 'professor');
    expect(reply).toContain('КОСМОПОРТ');
  });
});

describe('generateQuizForKnowledge', () => {
  it('returns questions from the knowledge bank', () => {
    const questions = generateQuizForKnowledge({ count: 3 });
    expect(questions.length).toBe(3);
    expect(questions[0]).toHaveProperty('question');
    expect(questions[0].options.length).toBe(4);
    expect(questions[0].correctIndex).toBeGreaterThanOrEqual(0);
    expect(questions[0].correctIndex).toBeLessThan(4);
  });

  it('filters questions by article slug', () => {
    const questions = generateQuizForKnowledge({
      articleSlug: 'tsiolkovsky-rocket-equation',
      count: 2,
    });
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.articleSlug).toBe('tsiolkovsky-rocket-equation');
    }
  });

  it('filters questions by topic keyword', () => {
    const questions = generateQuizForKnowledge({
      topic: 'тяготения',
      count: 2,
    });
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].topicTitle).toContain('тяготения');
  });
});
