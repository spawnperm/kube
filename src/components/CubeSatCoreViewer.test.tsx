import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import { CubeSatCoreViewer } from './CubeSatCoreViewer';

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  class MockWebGLRenderer {
    domElement: HTMLCanvasElement;
    toneMapping = actual.NoToneMapping;
    toneMappingExposure = 1;
    constructor() {
      this.domElement = document.createElement('canvas');
    }
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

describe('CubeSatCoreViewer: анимация развертывания солнечных панелей (Three.js)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('начинает со сложенными панелями до этапа выполнения заданий и запускает AnimationMixer при переходе на tasks_execution', () => {
    const playSpy = vi.spyOn(THREE.AnimationAction.prototype, 'play');
    const resetSpy = vi.spyOn(THREE.AnimationAction.prototype, 'reset');

    const { rerender } = render(
      <CubeSatCoreViewer wingsDeployed={false} competitionStageId="start_event" />,
    );

    expect(
      screen.getByText(/Панели сложены \(транспортное положение\)/i),
    ).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    // Переход на этап "Выполнение заданий"
    rerender(
      <CubeSatCoreViewer
        wingsDeployed={true}
        competitionStageId="tasks_execution"
        deploymentTriggerKey={1}
      />,
    );

    expect(resetSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalled();
    expect(screen.getByText(/Этап заданий: развертывание СБ/i)).toBeInTheDocument();
  });

  it('позволяет повторно запустить анимацию развертывания кнопкой HUD', () => {
    const playSpy = vi.spyOn(THREE.AnimationAction.prototype, 'play');

    render(
      <CubeSatCoreViewer wingsDeployed={false} competitionStageId="start_event" />,
    );

    const replayBtn = screen.getByRole('button', { name: /Развернуть \(анимация\)/i });
    fireEvent.click(replayBtn);

    expect(playSpy).toHaveBeenCalled();
    expect(screen.getByText(/Ход механизма СБ/i)).toBeInTheDocument();
  });
});
