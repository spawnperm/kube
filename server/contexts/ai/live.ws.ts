import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { config, geminiEnabled } from '../../config';
import { AGENT_SYSTEM_PROMPTS } from './knowledge';
import { logger } from '../../logger';

export const ROLE_DEFAULT_VOICES: Record<string, string> = {
  professor: 'Charon',
  engineer: 'Puck',
  biochem: 'Kore',
  registrar: 'Zephyr',
  kubik: 'Fenrir',
};

let activeWssInstance: WebSocketServer | null = null;

export function getActiveWsConnectionsCount(): number {
  if (!activeWssInstance) return 0;
  let count = 0;
  for (const client of activeWssInstance.clients) {
    if (client.readyState === WebSocket.OPEN) {
      count++;
    }
  }
  return count;
}

export function setupLiveWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  activeWssInstance = wss;

  server.on('upgrade', (req, socket, head) => {
    try {
      const host = req.headers.host || 'localhost';
      const url = new URL(req.url || '', `http://${host}`);
      if (url.pathname === '/api/live' || url.pathname === '/live') {
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req);
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error during WebSocket upgrade');
    }
  });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    logger.info(
      { remoteAddress: req.socket.remoteAddress },
      'Client connected to Live Voice WebSocket',
    );

    if (!geminiEnabled()) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error:
            'GEMINI_API_KEY не установлен на сервере. Проверьте настройки API ключа в панели Студии.',
        }),
      );
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: config.geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let liveSession: any = null;
    let isClosed = false;

    async function startSession(
      roleAgent = 'professor',
      voiceName?: string,
      teamContext?: { taskTitle?: string; projectName?: string; stage?: string },
    ) {
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          logger.warn({ err: e }, 'Error closing previous live session');
        }
        liveSession = null;
      }

      const selectedRole = AGENT_SYSTEM_PROMPTS[roleAgent] ? roleAgent : 'professor';
      const selectedVoice = voiceName || ROLE_DEFAULT_VOICES[selectedRole] || 'Zephyr';
      const basePrompt = AGENT_SYSTEM_PROMPTS[selectedRole];

      const voicePrompt = `${basePrompt}

[РЕЖИМ ГОЛОСОВОГО ДИАЛОГА GEMINI LIVE API]:
Ты ведешь живую аудиосвязь в реальном времени с экипажем кейс-чемпионата по космической физике «КОСМОПОРТ».
Контекст команды:
- Проект КубСата: «${teamContext?.projectName || 'Исследовательский CubeSat'}»
- Текущая задача: «${teamContext?.taskTitle || 'Физика космического полета'}»
- Этап: «${teamContext?.stage || 'Разработка 3-х слайдов'}»

ПРАВИЛА ГОЛОСОВОГО ОБЩЕНИЯ:
1. Отвечай кратко, емко, живо и доброжелательно (1-3 емких предложения на ответ), как бортовой искусственный интеллект корабля по рации.
2. Не используй формулы в формате LaTeX или markdown разметку — на слух формулы нечитаемы! Произноси формулы словами (например: «дельта вэ равна удельному импульсу, помноженному на ускорение свободного падения и логарифм отношения масс»).
3. Если участник задает вопрос по физике или конструкции спутника, объясняй физический смысл простыми словами.
4. Всегда поддерживай командный дух космонавтов!`;

      try {
        liveSession = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: selectedVoice,
                },
              },
            },
            systemInstruction: voicePrompt,
            outputAudioTranscription: {},
            inputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              logger.info(
                { role: selectedRole, voice: selectedVoice },
                'Gemini Live session connected',
              );
              if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'sessionReady',
                    role: selectedRole,
                    voice: selectedVoice,
                  }),
                );
              }
            },
            onmessage: (message: LiveServerMessage) => {
              if (isClosed || clientWs.readyState !== WebSocket.OPEN) return;

              try {
                // If model output was interrupted by user voice
                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // Audio chunks from model turn (24kHz PCM)
                const parts = message.serverContent?.modelTurn?.parts;
                if (parts && parts.length > 0) {
                  for (const part of parts) {
                    if (part.inlineData?.data) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          audio: part.inlineData.data,
                        }),
                      );
                    }
                    if (part.text) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'modelText',
                          text: part.text,
                        }),
                      );
                    }
                  }
                }

                // Output transcription (what model said)
                const outputTrans = message.serverContent?.outputTranscription;
                if (outputTrans?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'outputTranscription',
                      text: outputTrans.text,
                      finished: outputTrans.finished,
                    }),
                  );
                }

                // Input transcription (what user said)
                const inputTrans = message.serverContent?.inputTranscription;
                if (inputTrans?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'inputTranscription',
                      text: inputTrans.text,
                      interim: false,
                    }),
                  );
                }
                const interimInputTrans = message.serverContent?.interimInputTranscription;
                if (interimInputTrans?.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'inputTranscription',
                      text: interimInputTrans.text,
                      interim: true,
                    }),
                  );
                }

                if (message.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turnComplete' }));
                }
              } catch (err) {
                logger.error({ err }, 'Error handling LiveServerMessage in WebSocket bridge');
              }
            },
            onerror: (err) => {
              logger.error({ err }, 'Gemini Live session error');
              if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    error: 'Ошибка в потоке Gemini Live. Повторная попытка соединения...',
                  }),
                );
              }
            },
            onclose: () => {
              logger.info('Gemini Live session closed');
              if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
              }
            },
          },
        });
      } catch (err: any) {
        logger.error({ err: err?.message || err }, 'Failed to connect to Gemini Live API');
        if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: err?.message || 'Не удалось установить соединение с Gemini Live API',
            }),
          );
        }
      }
    }

    clientWs.on('message', async (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        if (payload.type === 'init') {
          await startSession(payload.roleAgent, payload.voiceName, payload.teamContext);
        } else if (payload.type === 'switchRole') {
          await startSession(payload.roleAgent, payload.voiceName, payload.teamContext);
        } else if (payload.type === 'audio' && payload.audio) {
          if (liveSession) {
            liveSession.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          }
        } else if (payload.type === 'endAudio') {
          if (liveSession) {
            liveSession.sendRealtimeInput({ audioStreamEnd: true });
          }
        } else if (payload.type === 'text' && payload.text) {
          if (liveSession) {
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: payload.text }] }],
              turnComplete: true,
            });
          }
        }
      } catch (err) {
        logger.warn({ err }, 'Invalid message payload in Live WebSocket');
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {
          logger.warn({ err: e }, 'Error closing live session on client disconnect');
        }
        liveSession = null;
      }
    });
  });

  return wss;
}
