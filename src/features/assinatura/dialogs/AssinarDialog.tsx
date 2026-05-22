import { useRef, useState } from 'react';
import { useInject } from '../../../infra/hooks/inject';
import { ManuscritaCanvas, ManuscritaCanvasRef } from '../components/ManuscritaCanvas';
import { ConectadocTokenForm } from '../components/ConectadocTokenForm';
import { IniciarAssinaturaResponse } from '../models/assinatura.model';

interface Props {
  open: boolean;
  onClose: () => void;
  pecaCodigo: number;
  documentoCodigo: number;
  documentoNome: string;
  userEmail: string | null;
}

type FlowState = 'idle' | 'sending' | 'aguardando' | 'done' | 'error';
type TabKey = 'manuscrita' | 'conectadoc';

export function AssinarDialog({ open, onClose, pecaCodigo, documentoCodigo, documentoNome, userEmail }: Props) {
  const assinaturaService = useInject('AssinaturaService');
  const canvasRef = useRef<ManuscritaCanvasRef>(null);

  const [tab, setTab] = useState<TabKey>('manuscrita');
  const [state, setState] = useState<FlowState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErr, setValidationErr] = useState<string | null>(null);
  const [assinaturaId, setAssinaturaId] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  if (!open) return null;

  const pdfStorageKey = `documentos/${documentoCodigo}/pecas/${pecaCodigo}`;

  function resetState() {
    setState('idle');
    setErrorMsg(null);
    setValidationErr(null);
    setAssinaturaId(null);
    setExpiresAt(null);
  }

  function handleTabChange(t: TabKey) {
    setTab(t);
    resetState();
  }

  async function handleAssinarManuscrita() {
    const imagemBase64 = canvasRef.current?.getImageBase64() ?? null;
    if (!imagemBase64) {
      setValidationErr('Desenhe sua assinatura antes de confirmar.');
      return;
    }
    setValidationErr(null);
    setErrorMsg(null);
    setState('sending');
    try {
      const res: IniciarAssinaturaResponse = await assinaturaService.iniciar({
        codigoPeca: pecaCodigo,
        modalidade: 'MANUSCRITA',
        pdfStorageKey,
      });
      await assinaturaService.confirmar(res.assinaturaId, {
        imagemBase64,
        posicao: { page: 1, x: 50, y: 700, width: 200, height: 80 },
      });
      setState('done');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? 'Erro ao assinar o documento.');
      setState('error');
    }
  }

  async function handleEnviarCodigo() {
    setErrorMsg(null);
    setState('sending');
    try {
      const res: IniciarAssinaturaResponse = await assinaturaService.iniciar({
        codigoPeca: pecaCodigo,
        modalidade: 'CONECTADOC_TOKEN',
        pdfStorageKey,
        emailOverride: userEmail ?? '',
      });
      setAssinaturaId(res.assinaturaId);
      setExpiresAt(res.payload?.expiresAt ?? null);
      setState('aguardando');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? 'Erro ao enviar o código.');
      setState('error');
    }
  }

  async function handleConfirmarToken(code: string) {
    if (assinaturaId === null) return;
    setErrorMsg(null);
    setState('sending');
    try {
      await assinaturaService.confirmar(assinaturaId, { codigoEmail: code });
      setState('done');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? 'Código inválido ou expirado.');
      setState('aguardando');
    }
  }

  async function handleReenviar() {
    setErrorMsg(null);
    setState('sending');
    try {
      const res: IniciarAssinaturaResponse = await assinaturaService.iniciar({
        codigoPeca: pecaCodigo,
        modalidade: 'CONECTADOC_TOKEN',
        pdfStorageKey,
        emailOverride: userEmail ?? '',
      });
      setAssinaturaId(res.assinaturaId);
      setExpiresAt(res.payload?.expiresAt ?? null);
      setState('aguardando');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(e.response?.data?.message ?? e.message ?? 'Erro ao reenviar o código.');
      setState('error');
    }
  }

  const isSending = state === 'sending';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Dialog */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 61,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        pointerEvents: 'none',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,.18)',
          width: '100%',
          maxWidth: 560,
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px 14px',
            borderBottom: '1px solid var(--border, #e5e7eb)',
          }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-3, #6b7280)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Assinar documento
              </p>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #111)', margin: 0, lineHeight: 1.3 }}>
                {documentoNome}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 20, color: 'var(--text-3, #6b7280)', lineHeight: 1,
                padding: 4, borderRadius: 6,
              }}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>

          {/* Done state */}
          {state === 'done' ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: '#dcfce7', color: '#15803d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, margin: '0 auto 20px',
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text, #111)', margin: '0 0 8px' }}>
                Documento assinado com sucesso!
              </h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-3, #6b7280)', margin: '0 0 28px' }}>
                A assinatura eletrônica foi registrada e o documento está protegido.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                style={{ height: 40, padding: '0 28px', fontSize: 14 }}
                onClick={onClose}
              >
                Fechar
              </button>
            </div>
          ) : (
            <div style={{ padding: '0 0 24px' }}>
              {/* Error banner */}
              {(state === 'error' || errorMsg) && errorMsg && (
                <div style={{
                  margin: '0',
                  padding: '10px 24px',
                  background: '#fee2e2',
                  borderBottom: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Tabs */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border, #e5e7eb)',
                padding: '0 24px',
              }}>
                {(['manuscrita', 'conectadoc'] as TabKey[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTabChange(t)}
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: tab === t ? '2px solid var(--brand-600, #2563eb)' : '2px solid transparent',
                      color: tab === t ? 'var(--brand-600, #2563eb)' : 'var(--text-3, #6b7280)',
                      fontWeight: tab === t ? 600 : 400,
                      fontSize: 13.5,
                      padding: '12px 16px 10px',
                      cursor: 'pointer',
                      marginBottom: -1,
                      transition: 'color .15s, border-color .15s',
                    }}
                  >
                    {t === 'manuscrita' ? '✍ Manuscrita' : '🔑 ConectaDoc'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ padding: '20px 24px 0' }}>
                {tab === 'manuscrita' && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-2, #374151)', margin: '0 0 12px' }}>
                      Desenhe sua assinatura no campo abaixo. Ela será incorporada ao documento PDF.
                    </p>
                    <ManuscritaCanvas ref={canvasRef} />
                    {validationErr && (
                      <p style={{ fontSize: 12.5, color: '#b91c1c', margin: '8px 0 0' }}>
                        {validationErr}
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%', height: 42, fontSize: 14, marginTop: 16 }}
                      disabled={isSending}
                      onClick={handleAssinarManuscrita}
                    >
                      {isSending ? 'Assinando…' : '✍ Assinar documento'}
                    </button>
                  </div>
                )}

                {tab === 'conectadoc' && (
                  <div>
                    {state !== 'aguardando' ? (
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--text-2, #374151)', margin: '0 0 6px' }}>
                          Enviaremos um código de 6 dígitos para o seu e-mail para confirmar a assinatura.
                        </p>
                        {userEmail && (
                          <p style={{ fontSize: 12.5, color: 'var(--text-3, #6b7280)', margin: '0 0 20px' }}>
                            Código será enviado para: <strong>{userEmail}</strong>
                          </p>
                        )}
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', height: 42, fontSize: 14 }}
                          disabled={isSending}
                          onClick={handleEnviarCodigo}
                        >
                          {isSending ? 'Enviando…' : '📧 Enviar código por e-mail'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: 13, color: 'var(--text-2, #374151)', margin: '0 0 20px', textAlign: 'center' }}>
                          Digite o código de 6 dígitos enviado para o seu e-mail.
                        </p>
                        <ConectadocTokenForm
                          onConfirmar={handleConfirmarToken}
                          loading={isSending}
                          expiresAt={expiresAt}
                          onReenviar={handleReenviar}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
